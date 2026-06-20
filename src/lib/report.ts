// Teacher report generator for the VEX IQ Role Readiness Assessment.
//
// Turns a ScoreResult plus the answers into a structured, teacher-readable
// report. The two dimensions are reported separately:
//
//   - Competition Understanding (a level, NOT a "100% = ready" headline).
//   - Role Tendency: a suggested focus, a possible additional strength, a
//     normalized role table, the EVIDENCE (which choices suggested the focus),
//     and a recommended trial activity.
//
// All language is encouraging and clearly preliminary — this is a learning
// profile that needs hands-on observation, not a fixed or assigned role.

import { QUESTIONS_BY_ID, isKnowledgeQuestion } from "./questions";
import { ROLE_PROFILES, roleLabel, type RoleKey } from "./roles";
import { GROWTH_THRESHOLD, type RoleBreakdownItem, type ScoreResult } from "./scoring";

export interface AnswerReviewItem {
  questionId: string;
  kind: "knowledge" | "tendency";
  category: string;
  questionText: string;
  selectedChoiceText: string;
  /** Knowledge only. */
  isCorrect: boolean;
  /** Knowledge only; "" for tendency questions. */
  correctChoiceText: string;
  /** Knowledge only; "" for tendency questions. */
  feedback: string;
  /** Tendency only; "" for knowledge questions. */
  reflectsRoleLabel: string;
}

/** A tendency choice that supports the suggested focus (the "evidence"). */
export interface EvidenceItem {
  role: RoleKey;
  roleLabel: string;
  questionText: string;
  choiceText: string;
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
  /** Competition Understanding (knowledge) — kept separate from tendency. */
  understandingScore: number;
  understandingLevel: string;
  understandingSummary: string;
  /** Role tendency. */
  primaryRole: RoleKey;
  primaryRoleLabel: string;
  secondaryRole: RoleKey;
  secondaryRoleLabel: string;
  combinedStrengths: boolean;
  balancedLearner: boolean;
  /** Softly-worded suggested focus line. */
  suggestedFocus: string;
  strengthExplanation: string;
  /** The tendency choices that suggested the focus. */
  evidence: EvidenceItem[];
  roleBreakdown: RoleBreakdownRow[];
  normalizationNote: string;
  growthAreas: { role: RoleKey; label: string; note: string }[];
  /** Shown when there are no growth areas below threshold. */
  growthAreasNote: string;
  /** A single recommended next hands-on activity for the suggested focus. */
  recommendedTrialActivity: string;
  recommendedTrainingPlan: string[];
  answerReview: AnswerReviewItem[];
  riskFlags: RiskFlag[];
  caution: string;
}

const REMINDER =
  "Remember: this is a preliminary profile, not a fixed role. VEX IQ students can grow in every role.";
const CAUTION =
  "This is a preliminary learning profile that needs hands-on observation. It is not a fixed or assigned role.";
const NORMALIZATION_NOTE =
  "Role percentages compare how often the student chose each role on the thinking-style questions with how many times that role was offered. This keeps the comparison fair when roles appear a different number of times.";
const NO_GROWTH_NOTE =
  "No clear growth area stands out from this short assessment yet — hands-on observation will tell more.";

function interpretNormalized(normalized: number): string {
  if (normalized >= 0.8) return "Strong preference";
  if (normalized >= GROWTH_THRESHOLD) return "Some preference";
  return "Little preference shown";
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
    ? "Your answers show interest across many parts of a VEX IQ team. You could be helpful in several areas — a great quality for a teammate. Trying one area hands-on will help a clearer strength stand out."
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
    if (q && isKnowledgeQuestion(q)) {
      const correct = q.choices.find((c) => c.id === q.correctChoiceId);
      return {
        questionId: a.questionId,
        kind: "knowledge" as const,
        category: q.category,
        questionText: q.text,
        selectedChoiceText: selected?.text ?? "",
        isCorrect: a.isCorrect,
        correctChoiceText: correct?.text ?? "",
        feedback: q.feedback,
        reflectsRoleLabel: "",
      };
    }
    // Tendency question: no right/wrong — show which role the choice reflects.
    return {
      questionId: a.questionId,
      kind: "tendency" as const,
      category: q?.category ?? "",
      questionText: q?.text ?? "",
      selectedChoiceText: selected?.text ?? "",
      isCorrect: false,
      correctChoiceText: "",
      feedback: "",
      reflectsRoleLabel: a.role ? roleLabel(a.role) : "",
    };
  });
}

/** Tendency choices that point at the suggested focus role(s). */
function buildEvidence(score: ScoreResult): EvidenceItem[] {
  const focusRoles = score.balancedLearner
    ? [score.primaryRole, score.secondaryRole]
    : score.combinedStrengths
      ? [score.primaryRole, score.secondaryRole]
      : [score.primaryRole];

  const items: EvidenceItem[] = [];
  for (const a of score.scoredAnswers) {
    if (a.kind !== "tendency" || !a.role) continue;
    if (!focusRoles.includes(a.role)) continue;
    const q = QUESTIONS_BY_ID[a.questionId];
    const choice = q?.choices.find((c) => c.id === a.selectedChoiceId);
    items.push({
      role: a.role,
      roleLabel: roleLabel(a.role),
      questionText: q?.text ?? "",
      choiceText: choice?.text ?? "",
    });
  }
  return items;
}

/** Softly-worded suggested focus line. */
function suggestedFocus(score: ScoreResult): string {
  if (score.balancedLearner) {
    return "Balanced preliminary profile — the student shows close interest across several areas. Rotating through hands-on trials can help a clearer direction emerge.";
  }
  const primary = roleLabel(score.primaryRole);
  const secondary = roleLabel(score.secondaryRole);
  if (score.combinedStrengths) {
    return `Suggested focus: ${primary} with ${secondary} (close preliminary strengths).`;
  }
  return `Suggested focus: ${primary} (with ${secondary} as a possible additional strength area).`;
}

function buildUnderstandingSummary(score: ScoreResult): string {
  if (score.knowledgeCount === 0) {
    return "No competition-understanding questions were recorded for this submission.";
  }
  return `Answered ${score.correctCount} of ${score.knowledgeCount} competition-understanding questions correctly (${score.totalUnderstandingScore}%): ${score.understandingLevel}. This describes knowledge only and is reported separately from role tendency.`;
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
 * supportive prompts, not judgments, and they come from KNOWLEDGE questions
 * only (tendency questions have no wrong answer to flag).
 */
function buildRiskFlags(score: ScoreResult): RiskFlag[] {
  const flags: RiskFlag[] = [];

  const wrongInCategory = (matcher: (category: string) => boolean): boolean => {
    const relevant = score.scoredAnswers.filter((a) => {
      if (a.kind !== "knowledge") return false;
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

  if (wrongInCategory((c) => c.includes("teamwork"))) {
    flags.push({
      key: "low_teamwork",
      label: "Teamwork: needs more observation",
      note: "Encourage respectful, evidence-based ways to settle team disagreements.",
    });
  }

  if (score.balancedLearner && score.totalUnderstandingScore < 50) {
    flags.push({
      key: "low_role_clarity",
      label: "Role direction still emerging",
      note: "No clear focus area yet and understanding is still developing. Rotating roles with guided practice can help.",
    });
  }

  return flags;
}

/** Build the full teacher report. */
export function buildTeacherReport(score: ScoreResult): TeacherReport {
  const primary = ROLE_PROFILES[score.primaryRole];
  const secondary = ROLE_PROFILES[score.secondaryRole];

  const strengthExplanation = score.balancedLearner
    ? "This student shows a balanced preliminary profile across several team areas. They can contribute flexibly; a hands-on trial in one area will help a clearer strength emerge."
    : `This student's strongest preliminary tendency points toward ${primary.label}. ${primary.description} A possible additional strength area is ${secondary.label}.`;

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
    understandingScore: score.totalUnderstandingScore,
    understandingLevel: score.understandingLevel,
    understandingSummary: buildUnderstandingSummary(score),
    primaryRole: score.primaryRole,
    primaryRoleLabel: primary.label,
    secondaryRole: score.secondaryRole,
    secondaryRoleLabel: secondary.label,
    combinedStrengths: score.combinedStrengths,
    balancedLearner: score.balancedLearner,
    suggestedFocus: suggestedFocus(score),
    strengthExplanation,
    evidence: buildEvidence(score),
    roleBreakdown: toRoleBreakdownRows(score.roleBreakdown),
    normalizationNote: NORMALIZATION_NOTE,
    growthAreas,
    growthAreasNote: growthAreas.length === 0 ? NO_GROWTH_NOTE : "",
    recommendedTrialActivity: score.balancedLearner
      ? "Rotate the student through two short hands-on trials (for example a build task and a driving drill) and compare which one they engage with most."
      : primary.recommendedPractice,
    recommendedTrainingPlan: trainingPlan,
    answerReview: buildAnswerReview(score),
    riskFlags: buildRiskFlags(score),
    caution: CAUTION,
  };
}
