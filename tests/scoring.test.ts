// Lightweight, dependency-free tests for the scoring + report logic.
// Run with: npm test   (uses tsx, no test framework required).

import { QUESTIONS } from "../src/lib/questions";
import { scoreSubmission, type SubmittedAnswer } from "../src/lib/scoring";
import { buildStudentResult, buildTeacherReport } from "../src/lib/report";
import { ROLE_KEYS } from "../src/lib/roles";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function allCorrect(): SubmittedAnswer[] {
  return QUESTIONS.map((q) => ({ questionId: q.id, selectedChoiceId: q.correctChoiceId }));
}

function allWrong(): SubmittedAnswer[] {
  return QUESTIONS.map((q) => {
    const wrong = q.choices.find((c) => c.id !== q.correctChoiceId)!;
    return { questionId: q.id, selectedChoiceId: wrong.id };
  });
}

console.log("Scoring engine tests\n");

// 1. All-correct => 100%, Competition Ready.
{
  const r = scoreSubmission(allCorrect());
  check("all-correct gives 100%", r.totalUnderstandingScore === 100, `got ${r.totalUnderstandingScore}`);
  check("all-correct level is Competition Ready", r.understandingLevel === "Competition Ready", r.understandingLevel);
  check("answeredCount equals question count", r.answeredCount === QUESTIONS.length);
}

// 2. All-wrong => 0%, Needs Foundation.
{
  const r = scoreSubmission(allWrong());
  check("all-wrong gives 0%", r.totalUnderstandingScore === 0, `got ${r.totalUnderstandingScore}`);
  check("all-wrong level is Needs Foundation", r.understandingLevel === "Needs Foundation", r.understandingLevel);
}

// 3. Understanding-level bands.
{
  // 12/24 correct => 50% => Developing
  const half: SubmittedAnswer[] = QUESTIONS.map((q, i) => {
    if (i < 12) return { questionId: q.id, selectedChoiceId: q.correctChoiceId };
    const wrong = q.choices.find((c) => c.id !== q.correctChoiceId)!;
    return { questionId: q.id, selectedChoiceId: wrong.id };
  });
  const r = scoreSubmission(half);
  check("50% maps to Developing", r.totalUnderstandingScore === 50 && r.understandingLevel === "Developing", `${r.totalUnderstandingScore}% ${r.understandingLevel}`);
}

// 4. Primary/secondary are distinct ranked roles; ranking is sorted desc.
{
  const r = scoreSubmission(allCorrect());
  const sortedDesc = r.rankedRoles.every((x, i, a) => i === 0 || a[i - 1].score >= x.score);
  check("rankedRoles sorted descending", sortedDesc);
  check("primary != secondary", r.primaryRole !== r.secondaryRole, `${r.primaryRole}/${r.secondaryRole}`);
  check("primary is top ranked role", r.primaryRole === r.rankedRoles[0].role);
  check("growthAreas has 1-2 entries", r.growthAreas.length >= 1 && r.growthAreas.length <= 2);
  check("roleScores has all six roles", ROLE_KEYS.every((k) => typeof r.roleScores[k] === "number"));
}

// 5. Report generation is consistent with the score.
{
  const r = scoreSubmission(allCorrect());
  const report = buildTeacherReport(r);
  check("teacher report primary matches score", report.primaryRole === r.primaryRole);
  check("answer review covers every question", report.answerReview.length === QUESTIONS.length);
  check("caution note present", report.caution.toLowerCase().includes("preliminary"));
  check("training plan is non-empty", report.recommendedTrainingPlan.length > 0);

  const student = buildStudentResult({
    primaryRole: r.primaryRole,
    secondaryRole: r.secondaryRole,
    combinedStrengths: r.combinedStrengths,
    balancedLearner: r.balancedLearner,
  });
  check("student result has reminder", student.reminder.includes("not a fixed role"));
  check("student headline is non-empty", student.headline.length > 0);
}

// 6. Risk flags fire when collaboration answers are all wrong.
{
  const r = scoreSubmission(allWrong());
  const report = buildTeacherReport(r);
  const hasCollab = report.riskFlags.some((f) => f.key === "low_collaboration");
  check("all-wrong raises low_collaboration flag", hasCollab, JSON.stringify(report.riskFlags.map((f) => f.key)));
}

// 7. Question bank integrity.
{
  check("at least 24 questions", QUESTIONS.length >= 24, `got ${QUESTIONS.length}`);
  const everyHasCorrect = QUESTIONS.every((q) => {
    const correct = q.choices.find((c) => c.id === q.correctChoiceId);
    return correct && correct.correctnessScore === 1;
  });
  check("every question has a valid correct choice with score 1", everyHasCorrect);
  const ids = QUESTIONS.map((q) => q.id);
  check("question ids are unique", new Set(ids).size === ids.length);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
