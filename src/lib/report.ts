// Teacher report generator for the VEX IQ Role Readiness Assessment.
//
// Turns a ScoreResult plus the raw answers into a structured, teacher-readable
// report: a suggested focus, additional strength area, a normalized role
// breakdown, suggested growth areas, a practice direction, an answer review, and
// supportive flags. All language is encouraging and clearly preliminary — this
// is a learning profile, not a fixed role assignment.

import { QUESTIONS_BY_ID } from "./questions";
import { ROLE_PROFILES, roleLabel, type RoleKey } from "./roles";
import { GROWTH_THRESHOLD, type RoleBreakdownItem, type ScoreResult } from "./scoring";

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

/** One row of the normalized role table shown to teachers. */
export interface RoleBreakdownRow {
  role: RoleKey;
  label: string;
  raw: number;
  max: number;
  /** 0..1 */
  normalized: number;
  /** rounded percentage for display */
  percent: number;
  interpretation: string;
}

export interface TeacherReport {
  primaryRole: RoleKey;
  primaryRoleLabel: string;
  secondaryRole: RoleKey;
  secondaryRoleLabel: string;
  combinedStrengths: boolean;
  balancedLearner: boolean;
  /** Softly-worded suggested focus line. */
  suggestedFocus: string;
  strengthExplanation: string;
  roleBreakdown: RoleBreakdownRow[];
  normalizationNote: string;
  growthAreas: { role: RoleKey; label: string; note: string }[];
  /** Shown when there are no growth areas below threshold. */
  growthAreasNote: string;
  recommendedTrainingPlan: string[];
  answerReview: AnswerReviewItem[];
  riskFlags: RiskFlag[];
  caution: string;
}

const REMINDER =
  "Remember: this is not a fixed role. VEX IQ students can grow in every role.";
const CAUTION = "This is a preliminary learning profile, not a fixed role assignment.";
const NORMALIZATION_NOTE =
  "Role percentages compare the student's earned points with the maximum possible points for that role in this assessment. This helps reduce bias when different roles appear a different number of times.";
const NO_GROWTH_NOTE =
  "No urgent growth area identified from this short assessment.";

function interpretNormalized(normalized: number): string {
  if (normalized >= 0.8) return "Strong understanding";
  if (normalized >= GROWTH_THRESHOLD) return "Developing";
  return "Needs more observation";
}

interface StudentResultInput {
  primaryRole: RoleKey;
  secondaryRole: RoleKey;
  combinedStrengths: boolean;
  balancedLearner: boolean;
}

/** Build the encouraging, student-facing result (used internally / in tests). */
export function buildStudentResult(score: StudentResultInput): StudentResult {
  const primary = ROLE_PROFILES[score.primaryRole];
  const secondary = ROLE_PROFILES[score.secondaryRole];

  let headline: string;
  if (score.balancedLearner) {
    headline = "Your preliminary profile right now is: Balanced Team Learner";
  } else if (score.combinedStrengths) {
    headline = `Your strongest preliminary tendencies are: ${primary.label} + ${secondary.label} (close strengths)`;
  } else {
    headline = `Your strongest preliminary tendency is: ${primary.label}`;
  }

  const whatThisMeans = score.balancedLearner
    ? "Your answers show steady understanding across many parts of a VEX IQ team. You can be helpful in several areas — a great quality for a teammate. With a little more practice in one area, a clearer strength will start to stand out."
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

/** Softly-worded suggested focus line. */
function suggestedFocus(score: ScoreResult): string {
  if (score.balancedLearner) {
    return "Balanced preliminary profile — the student shows close strengths across several areas. Rotating through focus areas can help a clearer direction emerge.";
  }
  const primary = roleLabel(score.primaryRole);
  const secondary = roleLabel(score.secondaryRole);
  if (score.combinedStrengths) {
    return `Suggested focus: ${primary} with ${secondary} (close preliminary strengths).`;
  }
  return `Suggested focus: ${primary} (with ${secondary} as an additional area to develop).`;
}

function toRoleBreakdownRows(items: RoleBreakdownItem[]): RoleBreakdownRow[] {
  return items.map((it) => ({
    role: it.role,
    label: ROLE_PROFILES[it.role].label,
    raw: it.raw,
    max: it.max,
    normalized: it.normalized,
    percent: Math.round(it.normalized * 100),
    interpretation: interpretNormalized(it.normalized),
  }));
}

/**
 * Risk flags help teachers notice areas that may need attention. These are
 * supportive prompts, not judgments.
 */
function buildRiskFlags(score: ScoreResult): RiskFlag[] {
  const flags: RiskFlag[] = [];

  const wrongInCategory = (matcher: (category: string) => boolean): boolean => {
    const relevant = score.scoredAnswers.filter((a) => {
      const q = QUESTIONS_BY_ID[a.questionId];
      return q ? matcher(q.category.toLowerCase()) : false;
    });
    if (relevant.length === 0) return false;
    const wrong = relevant.filter((a) => !a.isCorrect).length;
    return wrong / relevant.length >= 0.5;
  };

  if (wrongInCategory((c) => c.includes("rule") || c.includes("safety"))) {
    flags.push({
      key: "low_rules_awareness",
      label: "Rules/safety: needs more observation",
      note: "Several rules/safety questions were missed. Practice using the current game manual together.",
    });
  }

  if (wrongInCategory((c) => c.includes("student-centered"))) {
    flags.push({
      key: "low_student_centered",
      label: "Student-centered work: needs more observation",
      note: "Review why students (not adults) should lead the building, coding, and notebook work.",
    });
  }

  if (score.roleScores.TeamCollaborator <= 0) {
    flags.push({
      key: "low_collaboration",
      label: "Collaboration: needs more observation",
      note: "Collaboration answers were low or negative. Encourage respectful teamwork and communication activities.",
    });
  }

  if (score.balancedLearner && score.totalUnderstandingScore < 50) {
    flags.push({
      key: "low_role_clarity",
      label: "Role direction still emerging",
      note: "No clear focus area yet and overall understanding is still developing. Rotating roles with guided practice can help.",
    });
  }

  return flags;
}

/** Build the full teacher report. */
export function buildTeacherReport(score: ScoreResult): TeacherReport {
  const primary = ROLE_PROFILES[score.primaryRole];
  const secondary = ROLE_PROFILES[score.secondaryRole];

  const strengthExplanation = score.balancedLearner
    ? "This student shows a balanced preliminary profile across several team areas. They can contribute flexibly; guided practice in one area will help a clearer strength emerge."
    : `This student's strongest preliminary tendency is toward ${primary.label}. ${primary.description} Their additional strength area is ${secondary.label}.`;

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
    suggestedFocus: suggestedFocus(score),
    strengthExplanation,
    roleBreakdown: toRoleBreakdownRows(score.roleBreakdown),
    normalizationNote: NORMALIZATION_NOTE,
    growthAreas,
    growthAreasNote: growthAreas.length === 0 ? NO_GROWTH_NOTE : "",
    recommendedTrainingPlan: trainingPlan,
    answerReview: buildAnswerReview(score),
    riskFlags: buildRiskFlags(score),
    caution: CAUTION,
  };
}
