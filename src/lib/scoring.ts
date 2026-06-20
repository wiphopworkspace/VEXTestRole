// Scoring engine for the VEX IQ Role Readiness Assessment.
//
// Pure functions only — no database or framework imports — so this is easy to
// test and reuse from API routes, seeds, and the report generator.
//
// Roles are compared by a NORMALIZED percentage (earned / max-possible for that
// role), not by raw point totals. Raw totals are biased toward roles that appear
// on more questions (e.g. Team Collaborator, Notebooker); normalizing removes
// that bias so any role can become a suggested focus, and so a role with few
// questions is not mistaken for a weakness.

import { QUESTIONS, QUESTIONS_BY_ID, type Question } from "./questions";
import { ROLE_KEYS, type RoleKey, type RoleScores, understandingLevel } from "./roles";

export interface SubmittedAnswer {
  questionId: string;
  selectedChoiceId: string;
}

export interface ScoredAnswer {
  questionId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
  roleWeights: Partial<Record<RoleKey, number>>;
}

export type { RoleScores };

/** Per-role earned vs. maximum-possible, with a 0..1 normalized percentage. */
export interface RoleBreakdownItem {
  role: RoleKey;
  raw: number;
  max: number;
  /** earned / max, clamped to 0..1. */
  normalized: number;
}

export interface ScoreResult {
  totalUnderstandingScore: number; // 0-100 percentage of correct answers
  understandingLevel: string;
  correctCount: number;
  answeredCount: number;
  /** Raw role point totals (kept for storage and risk-flag signals). */
  roleScores: RoleScores;
  /** Per-role normalized breakdown, sorted high -> low by normalized score. */
  roleBreakdown: RoleBreakdownItem[];
  primaryRole: RoleKey;
  secondaryRole: RoleKey;
  /** Top two normalized scores are within 10 percentage points. */
  combinedStrengths: boolean;
  /** Three or more roles are within 10 points of the top (balanced profile). */
  balancedLearner: boolean;
  /** Roles whose normalized score is below the growth threshold (up to 2). */
  growthAreas: RoleKey[];
  scoredAnswers: ScoredAnswer[];
}

/** Correct-answer bonus added to each of a question's role tags. */
const CORRECT_CATEGORY_BONUS = 1;

/** A role's normalized score below this is a "suggested growth area". */
export const GROWTH_THRESHOLD = 0.55;

/** Top roles within this many normalized points are treated as "close". */
const CLOSE_MARGIN = 0.1;

function emptyRoleScores(): RoleScores {
  return ROLE_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as RoleScores);
}

/**
 * The maximum role points obtainable for each role by answering every question
 * correctly. This is the denominator for normalization: a student who answers
 * everything correctly reaches 100% on every role (a balanced profile), and a
 * role that simply appears on fewer questions is not penalized.
 */
function computeRoleMaxScores(): RoleScores {
  const max = emptyRoleScores();
  for (const q of QUESTIONS) {
    const correct = q.choices.find((c) => c.id === q.correctChoiceId);
    if (!correct) continue;
    for (const role of ROLE_KEYS) {
      const w = correct.roleWeights[role] ?? 0;
      const bonus = q.roleTags.includes(role) ? CORRECT_CATEGORY_BONUS : 0;
      max[role] += w + bonus;
    }
  }
  return max;
}

export const ROLE_MAX_SCORES: RoleScores = computeRoleMaxScores();

/** Build the per-role normalized breakdown from raw role scores. */
export function buildRoleBreakdown(roleScores: RoleScores): RoleBreakdownItem[] {
  return ROLE_KEYS.map((role) => {
    const max = ROLE_MAX_SCORES[role];
    const raw = roleScores[role];
    const normalized = max > 0 ? Math.min(1, Math.max(0, raw / max)) : 0;
    return { role, raw, max, normalized };
  });
}

const ROLE_INDEX: Record<RoleKey, number> = ROLE_KEYS.reduce(
  (acc, role, i) => {
    acc[role] = i;
    return acc;
  },
  {} as Record<RoleKey, number>,
);

export interface DerivedProfile {
  roleBreakdown: RoleBreakdownItem[];
  primaryRole: RoleKey;
  secondaryRole: RoleKey;
  combinedStrengths: boolean;
  balancedLearner: boolean;
  growthAreas: RoleKey[];
}

/**
 * Derive the role profile (ranking, focus, growth areas) from raw role scores
 * using normalized percentages. Shared by the scorer, the teacher report, and
 * the dashboard so old and new submissions display consistently.
 */
export function deriveProfile(roleScores: RoleScores): DerivedProfile {
  const breakdown = buildRoleBreakdown(roleScores);

  // Rank by normalized score; ties break by role order (Builder first, Team
  // Collaborator last) so a high-weight role never wins a tie by raw total.
  const ranked = [...breakdown].sort(
    (a, b) => b.normalized - a.normalized || ROLE_INDEX[a.role] - ROLE_INDEX[b.role],
  );

  const top = ranked[0].normalized;
  const combinedStrengths = top - ranked[1].normalized <= CLOSE_MARGIN;
  const closeCount = ranked.filter((r) => top - r.normalized <= CLOSE_MARGIN).length;
  const balancedLearner = closeCount >= 3;

  const growthAreas = ranked
    .filter((r) => r.normalized < GROWTH_THRESHOLD)
    .sort((a, b) => a.normalized - b.normalized || ROLE_INDEX[a.role] - ROLE_INDEX[b.role])
    .slice(0, 2)
    .map((r) => r.role);

  return {
    roleBreakdown: ranked,
    primaryRole: ranked[0].role,
    secondaryRole: ranked[1].role,
    combinedStrengths,
    balancedLearner,
    growthAreas,
  };
}

/**
 * Score a set of submitted answers.
 *
 * 1. totalUnderstandingScore = percentage of correct answers.
 * 2. roleScores (raw) = sum of roleWeights from selected choices + a category
 *    bonus added to each role tag when the answer is correct.
 * 3. Each role is normalized by its maximum-possible score.
 * 4. Suggested focus / additional strength = the two highest NORMALIZED roles.
 * 5. combinedStrengths / balancedLearner describe how close the top roles are.
 * 6. growthAreas = roles below the normalized growth threshold (not raw rank).
 */
export function scoreSubmission(answers: SubmittedAnswer[]): ScoreResult {
  const roleScores = emptyRoleScores();
  const scoredAnswers: ScoredAnswer[] = [];
  let correctCount = 0;

  for (const answer of answers) {
    const question: Question | undefined = QUESTIONS_BY_ID[answer.questionId];
    if (!question) continue;
    const choice = question.choices.find((c) => c.id === answer.selectedChoiceId);
    if (!choice) continue;

    const isCorrect = choice.id === question.correctChoiceId;
    if (isCorrect) correctCount += 1;

    // Sum role weights from the selected choice.
    for (const key of ROLE_KEYS) {
      const w = choice.roleWeights[key];
      if (typeof w === "number") roleScores[key] += w;
    }

    // Category bonus: reward correct answers on the question's tagged roles.
    if (isCorrect) {
      for (const tag of question.roleTags) {
        roleScores[tag] += CORRECT_CATEGORY_BONUS;
      }
    }

    scoredAnswers.push({
      questionId: answer.questionId,
      selectedChoiceId: answer.selectedChoiceId,
      isCorrect,
      roleWeights: choice.roleWeights,
    });
  }

  const answeredCount = scoredAnswers.length;
  const totalUnderstandingScore =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const profile = deriveProfile(roleScores);

  return {
    totalUnderstandingScore,
    understandingLevel: understandingLevel(totalUnderstandingScore),
    correctCount,
    answeredCount,
    roleScores,
    roleBreakdown: profile.roleBreakdown,
    primaryRole: profile.primaryRole,
    secondaryRole: profile.secondaryRole,
    combinedStrengths: profile.combinedStrengths,
    balancedLearner: profile.balancedLearner,
    growthAreas: profile.growthAreas,
    scoredAnswers,
  };
}
