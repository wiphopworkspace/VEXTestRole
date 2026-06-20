// Database seed for the VEX IQ Role Readiness Assessment.
//
// The question bank itself lives in TypeScript (src/lib/questions.ts) and does
// not need to be stored in the database. This seed creates a couple of demo
// submissions so the teacher dashboard has data to explore on first run.
//
// Run with: npm run db:seed   (uses tsx). Imports use relative paths so tsx can
// resolve them without the Next.js "@/..." path alias.

import { PrismaClient } from "@prisma/client";
import { QUESTIONS, isKnowledgeQuestion, type Question } from "../src/lib/questions";
import { scoreSubmission, type SubmittedAnswer } from "../src/lib/scoring";
import { buildTeacherReport } from "../src/lib/report";
import type { RoleKey } from "../src/lib/roles";

const prisma = new PrismaClient();

interface DemoStudent {
  studentName: string;
  nickname?: string;
  schoolName: string;
  teamName?: string;
  /** Bias knowledge answers toward correct by preferring the correct option. */
  correctRatio: number;
  /** Bias tendency answers toward this role when it is offered. */
  preferredRole: RoleKey;
  seed: number;
}

const DEMO_STUDENTS: DemoStudent[] = [
  {
    studentName: "Alex Rivera",
    nickname: "Lex",
    schoolName: "Bangkok Robotics School",
    teamName: "Gear Goblins",
    correctRatio: 0.85,
    preferredRole: "Builder",
    seed: 7,
  },
  {
    studentName: "Priya Sharma",
    schoolName: "Riverside STEM Academy",
    teamName: "Circuit Sparks",
    correctRatio: 0.6,
    preferredRole: "Programmer",
    seed: 23,
  },
];

// Tiny deterministic PRNG so seeds are reproducible.
function makeRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildAnswers(student: DemoStudent): SubmittedAnswer[] {
  const rng = makeRng(student.seed);
  return QUESTIONS.map((q: Question) => {
    if (isKnowledgeQuestion(q)) {
      const pickCorrect = rng() < student.correctRatio;
      if (pickCorrect) {
        return { questionId: q.id, selectedChoiceId: q.correctChoiceId };
      }
      const wrong = q.choices.filter((c) => c.id !== q.correctChoiceId);
      const choice = wrong[Math.floor(rng() * wrong.length)] ?? q.choices[0];
      return { questionId: q.id, selectedChoiceId: choice.id };
    }
    // Tendency question: usually pick the student's preferred role when offered.
    const preferred = q.choices.find((c) => c.role === student.preferredRole);
    if (preferred && rng() < 0.75) {
      return { questionId: q.id, selectedChoiceId: preferred.id };
    }
    const choice = q.choices[Math.floor(rng() * q.choices.length)];
    return { questionId: q.id, selectedChoiceId: choice.id };
  });
}

async function main() {
  console.log("Seeding demo submissions…");

  // Clear existing demo data for repeatable seeding.
  await prisma.submissionAnswer.deleteMany();
  await prisma.studentSubmission.deleteMany();

  for (const student of DEMO_STUDENTS) {
    const answers = buildAnswers(student);
    const score = scoreSubmission(answers);
    const report = buildTeacherReport(score);

    await prisma.studentSubmission.create({
      data: {
        studentName: student.studentName,
        nickname: student.nickname ?? null,
        schoolName: student.schoolName,
        teamName: student.teamName ?? null,
        totalUnderstandingScore: score.totalUnderstandingScore,
        understandingLevel: score.understandingLevel,
        primaryRole: score.primaryRole,
        secondaryRole: score.secondaryRole,
        roleScoresJson: JSON.stringify(score.roleScores),
        strengthsJson: JSON.stringify(report.strengthExplanation),
        growthAreasJson: JSON.stringify(score.growthAreas),
        teacherReportJson: JSON.stringify(report),
        emailStatus: "not_configured",
        answers: {
          create: score.scoredAnswers.map((a) => ({
            questionId: a.questionId,
            selectedChoiceId: a.selectedChoiceId,
            isCorrect: a.isCorrect,
            roleWeightsJson: JSON.stringify(a.roleWeights),
          })),
        },
      },
    });
    console.log(
      `  ✓ ${student.studentName} — ${score.totalUnderstandingScore}% (${score.primaryRole})`,
    );
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
