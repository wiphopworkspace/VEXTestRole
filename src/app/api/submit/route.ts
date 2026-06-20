import { NextResponse } from "next/server";
import { submissionSchema } from "@/lib/validation";
import { scoreSubmission } from "@/lib/scoring";
import { buildTeacherReport } from "@/lib/report";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendReportEmail, type EmailStatus } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? "Invalid submission.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { student, answers } = parsed.data;

  // Score and build the report on the server (the answer key never leaves it).
  const score = scoreSubmission(answers);
  const report = buildTeacherReport(score);

  const emailStatus: EmailStatus = isEmailConfigured() ? "failed" : "not_configured";

  let submission;
  try {
    submission = await prisma.studentSubmission.create({
      data: {
        studentName: student.studentName,
        nickname: student.nickname || null,
        gradeLevel: student.gradeLevel,
        className: student.className,
        teacherEmail: student.teacherEmail,
        teamName: student.teamName || null,
        totalUnderstandingScore: score.totalUnderstandingScore,
        understandingLevel: score.understandingLevel,
        primaryRole: score.primaryRole,
        secondaryRole: score.secondaryRole,
        roleScoresJson: JSON.stringify(score.roleScores),
        strengthsJson: JSON.stringify(report.strengthExplanation),
        growthAreasJson: JSON.stringify(score.growthAreas),
        teacherReportJson: JSON.stringify(report),
        emailStatus,
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
  } catch (err) {
    console.error("Failed to save submission:", err);
    return NextResponse.json(
      { error: "Could not save your submission. Please try again." },
      { status: 500 },
    );
  }

  // Optional email (best-effort, does not block the result).
  if (isEmailConfigured()) {
    const status = await sendReportEmail({
      teacherEmail: student.teacherEmail,
      studentName: student.studentName,
      gradeLevel: student.gradeLevel,
      className: student.className,
      totalUnderstandingScore: score.totalUnderstandingScore,
      understandingLevel: score.understandingLevel,
      primaryRole: score.primaryRole,
      secondaryRole: score.secondaryRole,
      submissionId: submission.id,
    });
    if (status !== submission.emailStatus) {
      await prisma.studentSubmission.update({
        where: { id: submission.id },
        data: { emailStatus: status },
      });
    }
  }

  return NextResponse.json({ submissionId: submission.id });
}
