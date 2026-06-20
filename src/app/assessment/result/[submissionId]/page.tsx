import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildStudentResult } from "@/lib/report";
import { ROLE_PROFILES, type RoleKey } from "@/lib/roles";
import type { TeacherReport } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;

  const submission = await prisma.studentSubmission.findUnique({
    where: { id: submissionId },
  });
  if (!submission) notFound();

  const report = JSON.parse(submission.teacherReportJson) as TeacherReport;
  const result = buildStudentResult({
    primaryRole: submission.primaryRole as RoleKey,
    secondaryRole: submission.secondaryRole as RoleKey,
    combinedStrengths: report.combinedStrengths,
    balancedLearner: report.balancedLearner,
  });

  const primaryProfile = ROLE_PROFILES[result.primaryRole];
  const displayName = submission.nickname || submission.studentName;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
          🎉 Great work, {displayName}!
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Your learning profile</h1>
        <p className="mt-1 text-slate-500">This is a preliminary profile — a starting point, not a final role.</p>
      </div>

      <div className="card border-brand-200 bg-brand-50 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          {result.balancedLearner
            ? "Balanced Team Learner"
            : result.combinedStrengths
              ? "Combined strengths"
              : "Strongest role tendency"}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-brand-800">{result.headline}</h2>
        {!result.balancedLearner && (
          <p className="mt-3 text-lg text-slate-700">
            You may also be strong in: <strong>{result.secondaryRoleLabel}</strong>
          </p>
        )}
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-slate-900">What this means</h3>
        <p className="mt-2 text-slate-700">{result.whatThisMeans}</p>
        <p className="mt-3 text-sm font-medium text-brand-700">{primaryProfile.tagline}</p>
      </div>

      <div className="card border-amber-200 bg-amber-50">
        <h3 className="text-xl font-bold text-amber-900">⭐ Recommended next practice</h3>
        <p className="mt-2 text-amber-900/90">{result.recommendedPractice}</p>
      </div>

      <div className="card text-center">
        <p className="text-lg font-semibold text-slate-800">{result.reminder}</p>
        <p className="mt-2 text-sm text-slate-500">
          Your teacher has received a more detailed report to help support your learning.
        </p>
      </div>

      <div className="flex justify-center">
        <Link href="/" className="btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
