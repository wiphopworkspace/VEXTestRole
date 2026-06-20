// Lightweight, dependency-free tests for the scoring + report logic.
// Run with: npm test   (uses tsx, no test framework required).
//
// Focus: scoring FAIRNESS. Roles are compared by normalized percentage, so any
// role can become the suggested focus, a perfect student is "balanced" (not
// auto-Team-Collaborator), and a role at 100% is never a growth area.

import { QUESTIONS, type Question } from "../src/lib/questions";
import {
  scoreSubmission,
  buildRoleBreakdown,
  ROLE_MAX_SCORES,
  GROWTH_THRESHOLD,
  type SubmittedAnswer,
} from "../src/lib/scoring";
import { buildStudentResult, buildTeacherReport } from "../src/lib/report";
import { ROLE_KEYS, type RoleKey } from "../src/lib/roles";

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

/** Contribution a choice makes to a role (weight + correct-tag bonus). */
function contribution(q: Question, choiceId: string, role: RoleKey): number {
  const c = q.choices.find((x) => x.id === choiceId)!;
  const w = c.roleWeights[role] ?? 0;
  const bonus = choiceId === q.correctChoiceId && q.roleTags.includes(role) ? 1 : 0;
  return w + bonus;
}

/** An answer pattern that maximizes a single role -> that role reaches 100%. */
function focusPattern(role: RoleKey): SubmittedAnswer[] {
  return QUESTIONS.map((q) => {
    let best = q.choices[0];
    let bestVal = contribution(q, best.id, role);
    for (const c of q.choices) {
      const v = contribution(q, c.id, role);
      if (v > bestVal) {
        best = c;
        bestVal = v;
      }
    }
    return { questionId: q.id, selectedChoiceId: best.id };
  });
}

console.log("Scoring engine tests\n");

// 1. Total understanding score + renamed top band.
{
  const r = scoreSubmission(allCorrect());
  check("all-correct gives 100%", r.totalUnderstandingScore === 100, `got ${r.totalUnderstandingScore}`);
  check("top band is 'Ready for Pilot Practice'", r.understandingLevel === "Ready for Pilot Practice", r.understandingLevel);
  check("answeredCount equals question count", r.answeredCount === QUESTIONS.length);

  const w = scoreSubmission(allWrong());
  check("all-wrong gives 0%", w.totalUnderstandingScore === 0, `got ${w.totalUnderstandingScore}`);
  check("all-wrong level is Needs Foundation", w.understandingLevel === "Needs Foundation", w.understandingLevel);
}

// 2. A perfect student is BALANCED and Team Collaborator does NOT auto-win.
{
  const r = scoreSubmission(allCorrect());
  check("all-correct: every role normalized = 100%", r.roleBreakdown.every((b) => b.normalized === 1), JSON.stringify(r.roleBreakdown.map((b) => b.normalized)));
  check("all-correct is a balanced profile", r.balancedLearner === true);
  check("Team Collaborator does NOT win a perfect score", r.primaryRole !== "TeamCollaborator", r.primaryRole);
  check("all-correct has NO growth areas (100% never a weakness)", r.growthAreas.length === 0, JSON.stringify(r.growthAreas));
}

// 3. Each role can become the suggested focus with a role-focused pattern.
{
  for (const role of ["Builder", "Programmer", "Driver", "Notebooker"] as RoleKey[]) {
    const r = scoreSubmission(focusPattern(role));
    const target = r.roleBreakdown.find((b) => b.role === role)!;
    check(`${role}-focused pattern reaches 100% for ${role}`, target.normalized === 1, `got ${target.normalized}`);
    check(`${role}-focused pattern makes ${role} the suggested focus`, r.primaryRole === role, `got ${r.primaryRole}`);
  }
}

// 4. Team Collaborator does not win just from broad good-behavior weight: even a
//    TeamCollaborator-focused pattern is legitimately TC, but it must not exceed
//    a dedicated role's own focus pattern (no free boost beyond 100%).
{
  const tc = scoreSubmission(focusPattern("TeamCollaborator"));
  const tcItem = tc.roleBreakdown.find((b) => b.role === "TeamCollaborator")!;
  check("TeamCollaborator normalized never exceeds 100%", tcItem.normalized <= 1);
}

// 5. Growth areas are by normalized %, not raw rank; a 100% role is never one.
{
  const r = scoreSubmission(focusPattern("Builder"));
  const builder = r.roleBreakdown.find((b) => b.role === "Builder")!;
  check("Builder at 100% is not flagged as a growth area", !r.growthAreas.includes("Builder"), JSON.stringify(r.growthAreas));
  check("Builder is 100% even if its raw max differs from other roles", builder.normalized === 1);
  // Programmer should be a growth area in a Builder-only pattern (low normalized).
  const prog = r.roleBreakdown.find((b) => b.role === "Programmer")!;
  check("a low-normalized role falls below the growth threshold", prog.normalized < GROWTH_THRESHOLD, `prog=${prog.normalized}`);
}

// 6. Breakdown shape + sorting + max scores derived from the bank.
{
  const r = scoreSubmission(allCorrect());
  check("roleBreakdown has all six roles", r.roleBreakdown.length === ROLE_KEYS.length);
  const sortedDesc = r.roleBreakdown.every((b, i, a) => i === 0 || a[i - 1].normalized >= b.normalized);
  check("roleBreakdown sorted by normalized desc", sortedDesc);
  check("every role has raw/max/normalized in range", r.roleBreakdown.every((b) => b.max > 0 && b.normalized >= 0 && b.normalized <= 1));
  check("ROLE_MAX_SCORES positive for every role", ROLE_KEYS.every((k) => ROLE_MAX_SCORES[k] > 0));
  // buildRoleBreakdown of an empty (all-zero) profile -> all 0 normalized.
  const zero = buildRoleBreakdown(ROLE_KEYS.reduce((a, k) => ((a[k] = 0), a), {} as Record<RoleKey, number>));
  check("zero raw scores -> 0 normalized", zero.every((b) => b.normalized === 0));
}

// 7. Combined strengths: close top two -> true; clearly separated -> false.
{
  const allC = scoreSubmission(allCorrect());
  check("perfect score flags combined/close strengths", allC.combinedStrengths === true);
  const focused = scoreSubmission(focusPattern("Builder"));
  const top = focused.roleBreakdown[0].normalized;
  const second = focused.roleBreakdown[1].normalized;
  check("a clearly dominant role is not 'combined' with the rest", focused.combinedStrengths === (top - second <= 0.1));
}

// 8. Q24 alone must not make Team Collaborator the suggested focus.
{
  // Answer ONLY q24 correctly; everything else wrong.
  const answers: SubmittedAnswer[] = QUESTIONS.map((q) => {
    if (q.id === "q24") return { questionId: q.id, selectedChoiceId: q.correctChoiceId };
    const wrong = q.choices.find((c) => c.id !== q.correctChoiceId)!;
    return { questionId: q.id, selectedChoiceId: wrong.id };
  });
  const r = scoreSubmission(answers);
  const tc = r.roleBreakdown.find((b) => b.role === "TeamCollaborator")!;
  check("q24-only does not push Team Collaborator to a strong focus", tc.normalized < GROWTH_THRESHOLD, `tc=${tc.normalized}`);
}

// 9. Teacher report still exposes the full analysis (teacher-only).
{
  const r = scoreSubmission(allCorrect());
  const report = buildTeacherReport(r);
  check("report exposes a 6-role normalized breakdown", report.roleBreakdown.length === ROLE_KEYS.length);
  check("report rows carry raw/max/percent/interpretation", report.roleBreakdown.every((row) => typeof row.percent === "number" && row.interpretation.length > 0));
  check("report includes the normalization note", report.normalizationNote.includes("maximum possible points"));
  check("report shows a no-growth note when none are below threshold", report.growthAreas.length === 0 && report.growthAreasNote.length > 0);
  check("report answer review covers every question", report.answerReview.length === QUESTIONS.length);
  check("report caution says preliminary", report.caution.toLowerCase().includes("preliminary"));
  check("report suggested focus mentions balanced for a perfect score", report.suggestedFocus.toLowerCase().includes("balanced"));

  const student = buildStudentResult({
    primaryRole: r.primaryRole,
    secondaryRole: r.secondaryRole,
    combinedStrengths: r.combinedStrengths,
    balancedLearner: r.balancedLearner,
  });
  check("student result reminder says not a fixed role", student.reminder.includes("not a fixed role"));
}

// 10. Risk flag fires when collaboration answers are all wrong.
{
  const r = scoreSubmission(allWrong());
  const report = buildTeacherReport(r);
  check("all-wrong raises low_collaboration flag", report.riskFlags.some((f) => f.key === "low_collaboration"), JSON.stringify(report.riskFlags.map((f) => f.key)));
}

// 11. Question-bank integrity.
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
