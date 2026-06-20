// Tests for the school-name form change: validation, CSV export, and that
// legacy submissions (no schoolName) still process without crashing.
// Run via: npm test (uses tsx, no test framework).

import { studentInfoSchema, submissionSchema } from "../src/lib/validation";
import { QUESTIONS } from "../src/lib/questions";
import { buildCsv, type CsvRow } from "../src/lib/csv";
import { buildStudentResult } from "../src/lib/report";
import { ROLE_KEYS, type RoleScores } from "../src/lib/roles";

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

const validStudent = {
  studentName: "Mina Park",
  nickname: "",
  schoolName: "Bangkok Robotics School",
  teamName: "",
  consent: true as const,
};

const fullAnswers = QUESTIONS.map((q) => ({
  questionId: q.id,
  selectedChoiceId: q.correctChoiceId,
}));

function roleScores(): RoleScores {
  return ROLE_KEYS.reduce((acc, k) => {
    acc[k] = 3;
    return acc;
  }, {} as RoleScores);
}

console.log("School-name form tests\n");

// 1. Valid student info (name + school + consent) succeeds.
{
  const r = studentInfoSchema.safeParse(validStudent);
  check("studentName + schoolName + consent is valid", r.success, JSON.stringify(r.success ? null : r.error.errors));
}

// 2. A full submission (student + every answer) succeeds.
{
  const r = submissionSchema.safeParse({ student: validStudent, answers: fullAnswers });
  check("full submission with schoolName + answers succeeds", r.success, JSON.stringify(r.success ? null : r.error.errors[0]));
}

// 3. Missing schoolName fails.
{
  const r = studentInfoSchema.safeParse({ ...validStudent, schoolName: "" });
  check("submission without schoolName fails", !r.success);
}

// 4. Old fields are no longer required: a student WITHOUT gradeLevel/className/
//    teacherEmail still validates, and extra legacy keys are ignored (not errors).
{
  const noLegacy = studentInfoSchema.safeParse(validStudent);
  check("no gradeLevel/className/teacherEmail still succeeds", noLegacy.success);

  const withLegacyExtras = studentInfoSchema.safeParse({
    ...validStudent,
    gradeLevel: "Grade 6",
    className: "6A",
    teacherEmail: "teacher@example.com",
  });
  const stripped =
    withLegacyExtras.success &&
    !("gradeLevel" in withLegacyExtras.data) &&
    !("teacherEmail" in withLegacyExtras.data);
  check("legacy fields are accepted but stripped from parsed data", stripped);
}

// 5. CSV export includes schoolName + teamName and drops the old columns.
{
  const rows: CsvRow[] = [
    {
      createdAt: "2026-06-20T00:00:00.000Z",
      studentName: "Mina Park",
      nickname: "",
      schoolName: "Bangkok Robotics School",
      teamName: "Gear Goblins",
      totalUnderstandingScore: 80,
      understandingLevel: "Competition Ready",
      primaryRole: "Builder",
      secondaryRole: "Driver",
      roleScores: roleScores(),
      growthAreas: ["Strategist"],
    },
  ];
  const csv = buildCsv(rows);
  const header = csv.split("\r\n")[0];
  check("CSV header includes schoolName", header.includes("schoolName"));
  check("CSV header includes teamName", header.includes("teamName"));
  check("CSV header drops gradeLevel/className/teacherEmail",
    !header.includes("gradeLevel") && !header.includes("className") && !header.includes("teacherEmail"));
  check("CSV row contains the school value", csv.includes("Bangkok Robotics School"));
}

// 6. Legacy submission (empty schoolName/teamName) does not crash the CSV or the
//    student-result builder.
{
  const legacyRow: CsvRow = {
    createdAt: "2025-01-01T00:00:00.000Z",
    studentName: "Old Student",
    nickname: "",
    schoolName: "", // legacy row had no school
    teamName: "",
    totalUnderstandingScore: 50,
    understandingLevel: "Developing",
    primaryRole: "Notebooker",
    secondaryRole: "Builder",
    roleScores: roleScores(),
    growthAreas: ["Driver"],
  };
  let csvOk = true;
  try {
    buildCsv([legacyRow]);
  } catch {
    csvOk = false;
  }
  check("legacy submission without schoolName does not crash CSV", csvOk);

  let resultOk = true;
  try {
    buildStudentResult({
      primaryRole: "Notebooker",
      secondaryRole: "Builder",
      combinedStrengths: false,
      balancedLearner: false,
    });
  } catch {
    resultOk = false;
  }
  check("legacy submission still builds a student result", resultOk);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
