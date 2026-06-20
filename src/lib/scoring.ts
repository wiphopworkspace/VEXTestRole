// Scoring engine for the VEX IQ Role Readiness Assessment.
//
// Pure functions only — no database or framework imports — so this is easy to
// test and reuse from API routes, seeds, and the report generator.
//
// TWO SEPARATE DIMENSIONS (this separation is the whole point of the redesign):
//
//   1. Competition Understanding (knowledge) — the percentage of KNOWLEDGE
//      questions answered correctly. Knowledge questions never touch role scores,
//      so "knowing the right answer" can never decide a student's suggested role
//      and a broad role can never win just because the student behaves well.
//
//   2. Role Tendency — built ONLY from the forced-choice TENDENCY questions, each
//      of which has no wrong answer. Picking a role's option adds one point to
//      that role. Roles are compared by a NORMALIZED percentage:
//
//        normalizedRoleScore = earnedRoleScore / maxPossibleRoleScoreForThatRole
//
//      where the max is how many tendency questions offered that role. This keeps
//      a role that appears on fewer questions from looking like a weakness, and
//      lets ANY role become the suggested focus.

import { QUESTIONS, QUESTIONS_BY_ID, isKnowledgeQuestion, isTendencyQuestion } from "./questions";
import { ROLE_KEYS, type RoleKey, type RoleScores, understandingLevel } from "./roles";

export interface SubmittedAnswer {
  questionId: string;
  selectedChoiceId: string;
}

export interface ScoredAnswer {
  questionId: string;
  selectedChoiceId: string;
  kind: "knowledge" | "tendency";
  /** Knowledge questions only; always false for tendency questions. */
  isCorrect: boolean;
  /** Tendency questions only; null for knowledge questions. */
  role: RoleKey | null;
  /** Persisted for the answer record; { role: 1 } for tendency, {} for knowledge. */
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
  /** Competition Understanding: 0-100 percentage of correct KNOWLEDGE answers. */
  totalUnderstandingScore: number;
  understandingLevel: string;
  /** Number of knowledge questions answered correctly. */
  correctCount: number;
  /** Number of knowledge questions answered. */
  knowledgeCount: number;
  /** Total questions answered (knowledge + tendency). */
  answeredCount: number;
  /** Raw role tendency point totals (kept for storage). */
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

/** A role's normalized tendency below this is a "suggested growth area". */
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
 * The maximum tendency points obtainable for each role: how many tendency
 * questions offer that role as an option. This is the denominator for
 * normalization, so a student who always picks one role reaches 100% for it,
 * and a role offered on fewer questions is not mistaken for a weakness.
 */
function computeRoleMaxScores(): RoleScores {
  const max = emptyRoleScores();
  for (const q of QUESTIONS) {
    if (!isTendencyQuestion(q)) continue;
    for (const choice of q.choices) {
      max[choice.role] += 1;
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
  // Collaborator last) so a high-max role never wins a tie by appearing more.
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
 * Score a set of submitted answers across the two dimensions.
 *
 * 1. Knowledge: totalUnderstandingScore = % of KNOWLEDGE questions answered
 *    correctly. Knowledge questions add nothing to role scores.
 * 2. Tendency: each tendency pick adds one point to the chosen role.
 * 3. Each role is normalized by its maximum-possible tendency points.
 * 4. Suggested focus / additional strength = the two highest NORMALIZED roles.
 * 5. combinedStrengths / balancedLearner describe how close the top roles are.
 * 6. growthAreas = roles below the normalized growth threshold (not raw rank).
 */
export function scoreSubmission(answers: SubmittedAnswer[]): ScoreResult {
  const roleScores = emptyRoleScores();
  const scoredAnswers: ScoredAnswer[] = [];
  let correctCount = 0;
  let knowledgeCount = 0;

  for (const answer of answers) {
    const question = QUESTIONS_BY_ID[answer.questionId];
    if (!question) continue;
    const choice = question.choices.find((c) => c.id === answer.selectedChoiceId);
    if (!choice) continue;

    if (isKnowledgeQuestion(question)) {
      knowledgeCount += 1;
      const isCorrect = choice.id === question.correctChoiceId;
      if (isCorrect) correctCount += 1;
      scoredAnswers.push({
        questionId: answer.questionId,
        selectedChoiceId: answer.selectedChoiceId,
        kind: "knowledge",
        isCorrect,
        role: null,
        roleWeights: {},
      });
    } else {
      // Tendency question: every option is reasonable; add a point to its role.
      const tendencyChoice = (question.choices as { id: string; role: RoleKey }[]).find(
        (c) => c.id === answer.selectedChoiceId,
      )!;
      const role = tendencyChoice.role;
      roleScores[role] += 1;
      scoredAnswers.push({
        questionId: answer.questionId,
        selectedChoiceId: answer.selectedChoiceId,
        kind: "tendency",
        isCorrect: false,
        role,
        roleWeights: { [role]: 1 },
      });
    }
  }

  const answeredCount = scoredAnswers.length;
  const totalUnderstandingScore =
    knowledgeCount > 0 ? Math.round((correctCount / knowledgeCount) * 100) : 0;

  const profile = deriveProfile(roleScores);

  return {
    totalUnderstandingScore,
    understandingLevel: understandingLevel(totalUnderstandingScore),
    correctCount,
    knowledgeCount,
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
