// Teacher report generator for the VEX IQ Role Readiness Assessment.
//
// Turns a ScoreResult plus the raw answers into a structured, teacher-readable
// report: role tendencies, strengths, growth areas, a training plan, an answer
// review, and risk flags. All language is encouraging and clearly preliminary.

import { QUESTIONS_BY_ID } from "./questions";
import { ROLE_PROFILES, roleLabel, type RoleKey } from "./roles";
import type { ScoreResult } from "./scoring";

export interface AnswerReviewItem {
  questionId: string;
  category: string;
  questionText: string;
  selectedChoiceText: string;
  correctChoiceText: string;
  isCorrect: boolean;
  feedback: string;
}

export interface RiskFlag {
  key: string;
  label: string;
  note: string;
}

export interface StudentResult {
  primaryRole: RoleKey;
  primaryRoleLabel: string;
  secondaryRole: RoleKey;
  secondaryRoleLabel: string;
  combinedStrengths: boolean;
  balancedLearner: boolean;
  headline: string;
  whatThisMeans: string;
  recommendedPractice: string;
  reminder: string;
}

export interface TeacherReport {
  primaryRole: RoleKey;
  primaryRoleLabel: string;
  secondaryRole: RoleKey;
  secondaryRoleLabel: string;
  combinedStrengths: boolean;
  balancedLearner: boolean;
  suggestedTeamRole: string;
  strengthExplanation: string;
  growthAreas: { role: RoleKey; label: string; note: string }[];
  recommendedTrainingPlan: string[];
  answerReview: AnswerReviewItem[];
  riskFlags: RiskFlag[];
  caution: string;
}

const REMINDER =
  "Remember: this is not a fixed role. VEX IQ students can grow in every role.";
const CAUTION = "This is a preliminary profile, not a fixed role assignment.";

interface StudentResultInput {
  primaryRole: RoleKey;
  secondaryRole: RoleKey;
  combinedStrengths: boolean;
  balancedLearner: boolean;
}

/** Build the encouraging, student-facing result. */
export function buildStudentResult(score: StudentResultInput): StudentResult {
  const primary = ROLE_PROFILES[score.primaryRole];
  const secondary = ROLE_PROFILES[score.secondaryRole];

  let headline: string;
  if (score.balancedLearner) {
    headline = "Your tendency right now is: Balanced Team Learner";
  } else if (score.combinedStrengths) {
    headline = `Your strongest role tendencies are: ${primary.label} + ${secondary.label} (combined strengths)`;
  } else {
    headline = `Your strongest role tendency is: ${primary.label}`;
  }

  const whatThisMeans = score.balancedLearner
    ? "Your answers show steady understanding across many parts of a VEX IQ team. You can be helpful in several roles — a great quality for a teammate. With a little more practice in one area, a clear strength will start to stand out."
    : primary.studentMeaning;

  return {
    primaryRole: score.primaryRole,
    primaryRoleLabel: primary.label,
    secondaryRole: score.secondaryRole,
    secondaryRoleLabel: secondary.label,
    combinedStrengths: score.combinedStrengths,
    balancedLearner: score.balancedLearner,
    headline,
    whatThisMeans,
    recommendedPractice: primary.recommendedPractice,
    reminder: REMINDER,
  };
}

function buildAnswerReview(score: ScoreResult): AnswerReviewItem[] {
  return score.scoredAnswers.map((a) => {
    const q = QUESTIONS_BY_ID[a.questionId];
    const selected = q?.choices.find((c) => c.id === a.selectedChoiceId);
    const correct = q?.choices.find((c) => c.id === q.correctChoiceId);
    return {
      questionId: a.questionId,
      category: q?.category ?? "",
      questionText: q?.text ?? "",
      selectedChoiceText: selected?.text ?? "",
      correctChoiceText: correct?.text ?? "",
      isCorrect: a.isCorrect,
      feedback: q?.feedback ?? "",
    };
  });
}

/** Compute the suggested team role string. */
function suggestedTeamRole(score: ScoreResult): string {
  if (score.balancedLearner) {
    return "Balanced Team Learner — could rotate through roles to discover a best fit.";
  }
  const primary = roleLabel(score.primaryRole);
  if (score.combinedStrengths) {
    return `${primary} with ${roleLabel(score.secondaryRole)} support (combined strengths).`;
  }
  return `${primary} (with ${roleLabel(score.secondaryRole)} as a secondary area to develop).`;
}

/**
 * Risk flags help teachers notice areas that may need attention. These are
 * supportive prompts, not judgments.
 */
function buildRiskFlags(score: ScoreResult): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Helper: did the student answer the rules / student-centered items correctly?
  const wrongInCategory = (matcher: (category: string) => boolean): boolean => {
    const relevant = score.scoredAnswers.filter((a) => {
      const q = QUESTIONS_BY_ID[a.questionId];
      return q ? matcher(q.category.toLowerCase()) : false;
    });
    if (relevant.length === 0) return false;
    const wrong = relevant.filter((a) => !a.isCorrect).length;
    return wrong / relevant.length >= 0.5;
  };

  if (wrongInCategory((c) => c.includes("rule"))) {
    flags.push({
      key: "low_rules_awareness",
      label: "Low rules awareness",
      note: "Several rules-related questions were missed. Practice using the current game manual together.",
    });
  }

  if (wrongInCategory((c) => c.includes("student-centered"))) {
    flags.push({
      key: "low_student_centered",
      label: "Low student-centered understanding",
      note: "Review why students (not adults) should lead the building, coding, and notebook work.",
    });
  }

  if (score.roleScores.TeamCollaborator <= 0) {
    flags.push({
      key: "low_collaboration",
      label: "Low collaboration signal",
      note: "Collaboration answers were low or negative. Encourage respectful teamwork and communication activities.",
    });
  }

  if (score.balancedLearner && score.totalUnderstandingScore < 50) {
    flags.push({
      key: "low_role_clarity",
      label: "Low role clarity",
      note: "No clear role strength yet and overall understanding is still developing. Rotating roles with guided practice can help.",
    });
  }

  return flags;
}

/** Build the full teacher report. */
export function buildTeacherReport(score: ScoreResult): TeacherReport {
  const primary = ROLE_PROFILES[score.primaryRole];
  const secondary = ROLE_PROFILES[score.secondaryRole];

  const strengthExplanation = score.balancedLearner
    ? "This student shows balanced understanding across multiple team areas. They are flexible and can contribute in several roles. Targeted practice in one area will help a clear strength emerge."
    : `This student shows the strongest tendency toward ${primary.label}. ${primary.description} Their secondary tendency is ${secondary.label}.`;

  const trainingPlan: string[] = [...primary.trainingPlan];
  if (!score.balancedLearner && score.secondaryRole !== score.primaryRole) {
    trainingPlan.push(
      `Optional cross-training (${secondary.label}): ${secondary.trainingPlan[0]}`,
    );
  }

  const growthAreas = score.growthAreas.map((role) => ({
    role,
    label: ROLE_PROFILES[role].label,
    note: ROLE_PROFILES[role].recommendedPractice,
  }));

  return {
    primaryRole: score.primaryRole,
    primaryRoleLabel: primary.label,
    secondaryRole: score.secondaryRole,
    secondaryRoleLabel: secondary.label,
    combinedStrengths: score.combinedStrengths,
    balancedLearner: score.balancedLearner,
    suggestedTeamRole: suggestedTeamRole(score),
    strengthExplanation,
    growthAreas,
    recommendedTrainingPlan: trainingPlan,
    answerReview: buildAnswerReview(score),
    riskFlags: buildRiskFlags(score),
    caution: CAUTION,
  };
}
