// Scoring engine for the VEX IQ Role Readiness Assessment.
//
// Pure functions only — no database or framework imports — so this is easy to
// test and reuse from API routes, seeds, and the report generator.

import { QUESTIONS_BY_ID, type Question } from "./questions";
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

export interface ScoreResult {
  totalUnderstandingScore: number; // 0-100 percentage of correct answers
  understandingLevel: string;
  correctCount: number;
  answeredCount: number;
  roleScores: RoleScores;
  /** Roles sorted high -> low. */
  rankedRoles: { role: RoleKey; score: number }[];
  primaryRole: RoleKey;
  secondaryRole: RoleKey;
  /** Primary + secondary are within 10% of each other. */
  combinedStrengths: boolean;
  /** All role scores are clustered closely together. */
  balancedLearner: boolean;
  /** The 1-2 lowest-scoring roles. */
  growthAreas: RoleKey[];
  scoredAnswers: ScoredAnswer[];
}

/** Correct-answer bonus added to each of a question's role tags. */
const CORRECT_CATEGORY_BONUS = 1;

function emptyRoleScores(): RoleScores {
  return ROLE_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as RoleScores);
}

/**
 * Score a set of submitted answers.
 *
 * 1. totalUnderstandingScore = percentage of correct answers.
 * 2. roleScores = sum of roleWeights from selected choices + a category bonus
 *    added to each role tag when the answer is correct.
 * 3/4. primary / secondary = the two highest role scores.
 * 5. If the top two are within 10%, they are flagged as "combined strengths".
 * 6. If all role scores are clustered closely, flagged as a "Balanced Team Learner".
 * 7. growthAreas = the lowest 1-2 role scores.
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

  const rankedRoles = ROLE_KEYS.map((role) => ({ role, score: roleScores[role] })).sort(
    (a, b) => b.score - a.score,
  );

  const primaryRole = rankedRoles[0].role;
  const secondaryRole = rankedRoles[1].role;

  const top = rankedRoles[0].score;
  const second = rankedRoles[1].score;
  const lowest = rankedRoles[rankedRoles.length - 1].score;

  // "Within 10%" is measured relative to the top score's magnitude.
  const denom = Math.max(Math.abs(top), 1);
  const combinedStrengths = (top - second) / denom <= 0.1;

  // Balanced learner: the whole spread of role scores is small.
  const spread = top - lowest;
  const balancedLearner = spread <= Math.max(2, denom * 0.15);

  // Growth areas: lowest 1-2 roles (skip duplicates of the top role).
  const ascending = [...rankedRoles].reverse();
  const growthAreas = ascending.slice(0, 2).map((r) => r.role);

  return {
    totalUnderstandingScore,
    understandingLevel: understandingLevel(totalUnderstandingScore),
    correctCount,
    answeredCount,
    roleScores,
    rankedRoles,
    primaryRole,
    secondaryRole,
    combinedStrengths,
    balancedLearner,
    growthAreas,
    scoredAnswers,
  };
}
