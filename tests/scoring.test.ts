// Lightweight, dependency-free tests for the scoring + report logic.
// Run with: npm test   (uses tsx, no test framework required).
//
// Focus: the redesign's two goals —
//   1. Knowledge (Competition Understanding) is SEPARATE from Role Tendency.
//   2. The assessment resists test-taking strategies: always picking the
//      longest answer, or always picking the same letter, must NOT produce a
//      high score or a single fixed role. Different role patterns must produce
//      different suggested foci.

import {
  QUESTIONS,
  KNOWLEDGE_COUNT,
  TENDENCY_COUNT,
  isKnowledgeQuestion,
  isTendencyQuestion,
  type Question,
} from "../src/lib/questions";
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

const KNOWLEDGE = QUESTIONS.filter(isKnowledgeQuestion);
const TENDENCY = QUESTIONS.filter(isTendencyQuestion);

/** Knowledge: all correct. Tendency: first option (arbitrary). */
function allKnowledgeCorrect(): SubmittedAnswer[] {
  return QUESTIONS.map((q) =>
    isKnowledgeQuestion(q)
      ? { questionId: q.id, selectedChoiceId: q.correctChoiceId }
      : { questionId: q.id, selectedChoiceId: q.choices[0].id },
  );
}

/** Knowledge: all wrong. Tendency: first option. */
function allKnowledgeWrong(): SubmittedAnswer[] {
  return QUESTIONS.map((q) => {
    if (isKnowledgeQuestion(q)) {
      const wrong = q.choices.find((c) => c.id !== q.correctChoiceId)!;
      return { questionId: q.id, selectedChoiceId: wrong.id };
    }
    return { questionId: q.id, selectedChoiceId: q.choices[0].id };
  });
}

/** Always pick the longest-text option (the "test-wise" giveaway strategy). */
function longestAnswerStrategy(): SubmittedAnswer[] {
  return QUESTIONS.map((q) => {
    const longest = q.choices.reduce((a, b) => (b.text.length > a.text.length ? b : a));
    return { questionId: q.id, selectedChoiceId: longest.id };
  });
}

/** Always pick the option at a fixed position (0=A, 1=B, 2=C, 3=D). */
function alwaysPosition(pos: number): SubmittedAnswer[] {
  return QUESTIONS.map((q) => {
    const choice = q.choices[Math.min(pos, q.choices.length - 1)];
    return { questionId: q.id, selectedChoiceId: choice.id };
  });
}

/** Tendency: always pick the given role when offered. Knowledge: first option. */
function rolePattern(role: RoleKey): SubmittedAnswer[] {
  return QUESTIONS.map((q) => {
    if (isTendencyQuestion(q)) {
      const match = q.choices.find((c) => c.role === role);
      return { questionId: q.id, selectedChoiceId: (match ?? q.choices[0]).id };
    }
    return { questionId: q.id, selectedChoiceId: q.choices[0].id };
  });
}

console.log("Scoring engine tests\n");

// 1. Knowledge dimension: separate band labels, computed only from knowledge.
{
  const r = scoreSubmission(allKnowledgeCorrect());
  check("all knowledge correct => understanding 100%", r.totalUnderstandingScore === 100, `got ${r.totalUnderstandingScore}`);
  check("top understanding band is 'Strong Understanding'", r.understandingLevel === "Strong Understanding", r.understandingLevel);
  check("knowledgeCount equals number of knowledge questions", r.knowledgeCount === KNOWLEDGE_COUNT, `got ${r.knowledgeCount}`);
  check("answeredCount equals total questions", r.answeredCount === QUESTIONS.length);

  const w = scoreSubmission(allKnowledgeWrong());
  check("all knowledge wrong => understanding 0%", w.totalUnderstandingScore === 0, `got ${w.totalUnderstandingScore}`);
  check("0% understanding band is 'Developing'", w.understandingLevel === "Developing", w.understandingLevel);
}

// 2. Knowledge correctness does NOT decide role tendency.
{
  // All knowledge correct, but tendency answers all point to Programmer.
  const answers = QUESTIONS.map((q) => {
    if (isTendencyQuestion(q)) {
      const prog = q.choices.find((c) => c.role === "Programmer");
      return { questionId: q.id, selectedChoiceId: (prog ?? q.choices[0]).id };
    }
    return { questionId: q.id, selectedChoiceId: q.correctChoiceId };
  });
  const r = scoreSubmission(answers);
  check("knowledge-correct + Programmer tendency => focus is Programmer", r.primaryRole === "Programmer", r.primaryRole);
  check("Team Collaborator does not win from good knowledge answers", r.primaryRole !== "TeamCollaborator", r.primaryRole);
  // Roles a student never picked on tendency questions stay at 0 raw.
  check("a role never chosen on tendency questions has raw 0", r.roleScores.Driver === 0 || r.roleScores.Builder === 0, JSON.stringify(r.roleScores));
}

// 3. ANTI-PATTERN A: longest-answer strategy performs near chance, not 90-100%.
{
  const r = scoreSubmission(longestAnswerStrategy());
  check("longest-answer strategy does NOT reach 90-100% understanding", r.totalUnderstandingScore < 60, `got ${r.totalUnderstandingScore}`);
  check("longest-answer strategy is not a perfect single role", r.roleBreakdown[0].normalized < 1, `top=${r.roleBreakdown[0].normalized}`);
}

// 4. ANTI-PATTERN D: correct answers are not systematically the longest.
{
  let longestStrategyCorrect = 0;
  let correctLen = 0, correctN = 0, wrongLen = 0, wrongN = 0;
  for (const q of KNOWLEDGE) {
    const longest = q.choices.reduce((a, b) => (b.text.length > a.text.length ? b : a));
    if (longest.id === q.correctChoiceId) longestStrategyCorrect++;
    for (const c of q.choices) {
      if (c.id === q.correctChoiceId) { correctLen += c.text.length; correctN++; }
      else { wrongLen += c.text.length; wrongN++; }
    }
  }
  const longestPct = longestStrategyCorrect / KNOWLEDGE.length;
  const lengthRatio = (correctLen / correctN) / (wrongLen / wrongN);
  check("picking the longest answer scores below 50% on knowledge", longestPct < 0.5, `${Math.round(longestPct * 100)}%`);
  check("correct answers are not much longer than distractors (ratio < 1.25)", lengthRatio < 1.25, `ratio ${lengthRatio.toFixed(3)}`);
}

// 5. ANTI-PATTERN B: always-same-letter is not perfect and not one fixed role.
{
  const primaries: RoleKey[] = [];
  for (let pos = 0; pos < 4; pos++) {
    const r = scoreSubmission(alwaysPosition(pos));
    check(`always-position-${pos} is not a perfect understanding score`, r.totalUnderstandingScore < 100, `got ${r.totalUnderstandingScore}`);
    check(`always-position-${pos} is not a perfect single role`, r.roleBreakdown[0].normalized < 1, `top=${r.roleBreakdown[0].normalized}`);
    primaries.push(r.primaryRole);
  }
  const distinct = new Set(primaries).size;
  check("always-A/B/C/D do not all map to the same role", distinct >= 3, `primaries=${primaries.join(",")} distinct=${distinct}`);
}

// 6. ANTI-PATTERN C: different role patterns => different suggested foci.
{
  const coreRoles: RoleKey[] = ["Builder", "Programmer", "Driver", "Notebooker"];
  const foci: RoleKey[] = [];
  for (const role of coreRoles) {
    const r = scoreSubmission(rolePattern(role));
    const target = r.roleBreakdown.find((b) => b.role === role)!;
    check(`${role} pattern reaches 100% normalized for ${role}`, target.normalized === 1, `got ${target.normalized}`);
    check(`${role} pattern makes ${role} the suggested focus`, r.primaryRole === role, `got ${r.primaryRole}`);
    foci.push(r.primaryRole);
  }
  check("the four role patterns produce four different foci", new Set(foci).size === 4, foci.join(","));
}

// 7. Normalized breakdown shape + max scores derived from the tendency bank.
{
  const r = scoreSubmission(rolePattern("Builder"));
  check("roleBreakdown has all six roles", r.roleBreakdown.length === ROLE_KEYS.length);
  const sortedDesc = r.roleBreakdown.every((b, i, a) => i === 0 || a[i - 1].normalized >= b.normalized);
  check("roleBreakdown sorted by normalized desc", sortedDesc);
  check("every role has raw/max/normalized in range", r.roleBreakdown.every((b) => b.max > 0 && b.normalized >= 0 && b.normalized <= 1));
  check("ROLE_MAX_SCORES positive for every role (each role appears in tendency)", ROLE_KEYS.every((k) => ROLE_MAX_SCORES[k] > 0), JSON.stringify(ROLE_MAX_SCORES));
  const zero = buildRoleBreakdown(ROLE_KEYS.reduce((a, k) => ((a[k] = 0), a), {} as Record<RoleKey, number>));
  check("zero raw scores -> 0 normalized", zero.every((b) => b.normalized === 0));
}

// 8. Growth areas are by normalized %, not raw rank; a 100% role is never one.
{
  const r = scoreSubmission(rolePattern("Builder"));
  check("Builder at 100% is not flagged as a growth area", !r.growthAreas.includes("Builder"), JSON.stringify(r.growthAreas));
  const prog = r.roleBreakdown.find((b) => b.role === "Programmer")!;
  check("a low-normalized role falls below the growth threshold", prog.normalized < GROWTH_THRESHOLD, `prog=${prog.normalized}`);
}

// 9. Teacher report: two SEPARATE dimensions + evidence + trial activity.
{
  const r = scoreSubmission(rolePattern("Driver"));
  const report = buildTeacherReport(r);
  check("report exposes understanding level separately", report.understandingLevel.length > 0);
  check("understanding summary mentions it is separate from tendency", report.understandingSummary.toLowerCase().includes("separately"));
  check("report exposes a 6-role normalized breakdown", report.roleBreakdown.length === ROLE_KEYS.length);
  check("report rows carry raw/max/percent/interpretation", report.roleBreakdown.every((row) => typeof row.percent === "number" && row.interpretation.length > 0));
  check("report includes the normalization note", report.normalizationNote.toLowerCase().includes("offered"));
  check("report has evidence for the suggested focus", report.evidence.length > 0 && report.evidence.every((e) => e.role === "Driver"), JSON.stringify(report.evidence.map((e) => e.role)));
  check("report has a recommended trial activity", report.recommendedTrialActivity.length > 0);
  check("answer review covers every question", report.answerReview.length === QUESTIONS.length);
  const knowledgeItems = report.answerReview.filter((a) => a.kind === "knowledge");
  const tendencyItems = report.answerReview.filter((a) => a.kind === "tendency");
  check("answer review splits knowledge vs tendency correctly", knowledgeItems.length === KNOWLEDGE_COUNT && tendencyItems.length === TENDENCY_COUNT);
  check("tendency answer-review items name the reflected role", tendencyItems.every((a) => a.reflectsRoleLabel.length > 0));
  check("report caution says preliminary", report.caution.toLowerCase().includes("preliminary"));
  check("report caution avoids 'assigned role' as a recommendation", report.caution.toLowerCase().includes("not a fixed or assigned role"));

  const student = buildStudentResult({
    primaryRole: r.primaryRole,
    secondaryRole: r.secondaryRole,
    combinedStrengths: r.combinedStrengths,
    balancedLearner: r.balancedLearner,
  });
  check("student result reminder says not a fixed role", student.reminder.includes("not a fixed role"));
}

// 10. Risk flags come from KNOWLEDGE only and fire when those answers are wrong.
{
  const r = scoreSubmission(allKnowledgeWrong());
  const report = buildTeacherReport(r);
  check("all knowledge wrong raises a rules/safety flag", report.riskFlags.some((f) => f.key === "low_rules_awareness"), JSON.stringify(report.riskFlags.map((f) => f.key)));
  check("all knowledge wrong raises a student-centered flag", report.riskFlags.some((f) => f.key === "low_student_centered"));
}

// 11. Terminology: no banned phrases anywhere in a generated report.
{
  const r = scoreSubmission(rolePattern("Notebooker"));
  const report = buildTeacherReport(r);
  const haystack = JSON.stringify(report).toLowerCase();
  // Note: "assigned role" is intentionally allowed only inside the caution's
  // negation ("not a fixed or assigned role"), asserted separately above.
  const banned = ["competition ready", "best role", "definite role", "100% means ready"];
  for (const phrase of banned) {
    check(`report avoids the phrase "${phrase}"`, !haystack.includes(phrase));
  }
}

// 12. Question-bank integrity for both kinds.
{
  check("at least 8 thinking-style (tendency) questions", TENDENCY.length >= 8, `got ${TENDENCY.length}`);
  check("knowledge questions exist", KNOWLEDGE.length >= 12, `got ${KNOWLEDGE.length}`);

  const knowledgeOk = KNOWLEDGE.every((q) => {
    const correct = q.choices.find((c) => c.id === q.correctChoiceId);
    return correct && correct.correctnessScore === 1 && q.choices.filter((c) => c.correctnessScore === 1).length === 1;
  });
  check("every knowledge question has exactly one valid correct choice", knowledgeOk);

  const tendencyOk = TENDENCY.every((q) => q.choices.every((c) => ROLE_KEYS.includes(c.role)) && q.choices.length >= 3);
  check("every tendency choice maps to a real role", tendencyOk);

  const ids = QUESTIONS.map((q: Question) => q.id);
  check("question ids are unique", new Set(ids).size === ids.length);

  // Position balance: the correct knowledge answer is spread across letters,
  // not stuck on one position (another test-wise giveaway).
  const posCount: Record<number, number> = {};
  for (const q of KNOWLEDGE) {
    const idx = q.choices.findIndex((c) => c.id === q.correctChoiceId);
    posCount[idx] = (posCount[idx] ?? 0) + 1;
  }
  const maxPos = Math.max(...Object.values(posCount));
  check("no single answer position holds the majority of correct answers", maxPos <= Math.ceil(KNOWLEDGE.length / 2), JSON.stringify(posCount));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
