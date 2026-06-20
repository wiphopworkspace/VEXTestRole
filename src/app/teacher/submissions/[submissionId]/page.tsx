import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_KEYS, ROLE_PROFILES, type RoleKey, type RoleScores } from "@/lib/roles";
import type { TeacherReport } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  if (!(await isTeacherAuthenticated())) {
    redirect("/teacher/login");
  }

  const { submissionId } = await params;
  const submission = await prisma.studentSubmission.findUnique({
    where: { id: submissionId },
  });
  if (!submission) notFound();

  const report = JSON.parse(submission.teacherReportJson) as TeacherReport;
  const roleScores = JSON.parse(submission.roleScoresJson) as RoleScores;
  const maxRoleScore = Math.max(1, ...ROLE_KEYS.map((r) => roleScores[r]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/teacher/dashboard" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          ← Back to dashboard
        </Link>
        <span className="text-sm text-slate-500">
          {new Date(submission.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Student info */}
      <div className="card">
        <h1 className="text-2xl font-extrabold text-slate-900">
          {submission.studentName}
          {submission.nickname ? (
            <span className="text-slate-400"> ({submission.nickname})</span>
          ) : null}
        </h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span><strong>Grade:</strong> {submission.gradeLevel}</span>
          <span><strong>Class:</strong> {submission.className}</span>
          {submission.teamName ? <span><strong>Team:</strong> {submission.teamName}</span> : null}
          <span><strong>Teacher email:</strong> {submission.teacherEmail}</span>
        </div>
        <div className="mt-3 text-xs">
          {submission.emailStatus === "sent" && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
              Report emailed to teacher
            </span>
          )}
          {submission.emailStatus === "failed" && (
            <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-700">
              Email send failed — report stored
            </span>
          )}
          {submission.emailStatus === "not_configured" && (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              Email delivery is not configured — result stored successfully
            </span>
          )}
        </div>
      </div>

      {/* Caution */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
        ⚠ {report.caution}
      </div>

      {/* Scores */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Total understanding score</p>
          <p className="mt-1 text-4xl font-extrabold text-slate-900">
            {submission.totalUnderstandingScore}%
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-600">
            Level: {submission.understandingLevel}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Role tendency</p>
          <p className="mt-1 text-lg">
            <strong>Primary:</strong> {report.primaryRoleLabel}
          </p>
          <p className="text-lg">
            <strong>Secondary:</strong> {report.secondaryRoleLabel}
          </p>
          {report.combinedStrengths && !report.balancedLearner && (
            <p className="mt-1 text-sm text-brand-600">Combined strengths (top two are close)</p>
          )}
          {report.balancedLearner && (
            <p className="mt-1 text-sm text-brand-600">Balanced Team Learner</p>
          )}
        </div>
      </div>

      {/* Role score breakdown */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Role score breakdown</h2>
        <div className="mt-4 space-y-3">
          {ROLE_KEYS.map((r) => {
            const score = roleScores[r];
            const pct = Math.max(0, Math.round((score / maxRoleScore) * 100));
            return (
              <div key={r}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{ROLE_PROFILES[r].label}</span>
                  <span className="text-slate-500">{score}</span>
                </div>
                <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${score <= 0 ? 0 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested role + strength */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Suggested team role</h2>
        <p className="mt-2 text-slate-700">{report.suggestedTeamRole}</p>
        <h3 className="mt-4 font-bold text-slate-900">Strength explanation</h3>
        <p className="mt-1 text-slate-700">{report.strengthExplanation}</p>
      </div>

      {/* Growth areas */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Growth areas (more practice recommended)</h2>
        <ul className="mt-3 space-y-3">
          {report.growthAreas.map((g) => (
            <li key={g.role} className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-800">{g.label}</p>
              <p className="text-sm text-slate-600">{g.note}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Training plan */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Recommended training plan</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
          {report.recommendedTrainingPlan.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Risk flags */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Risk flags</h2>
        {report.riskFlags.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700">
            No risk flags. This student shows solid awareness of rules, student-centered work, and
            collaboration.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.riskFlags.map((f) => (
              <li key={f.key} className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="font-semibold text-rose-800">{f.label}</p>
                <p className="text-sm text-rose-700">{f.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Answer review */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Answer review (evidence)</h2>
        <div className="mt-4 space-y-4">
          {report.answerReview.map((a, idx) => (
            <div key={a.questionId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-800">
                  {idx + 1}. {a.questionText}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                    a.isCorrect
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {a.isCorrect ? "Correct" : "Review"}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{a.category}</p>
              <p className="mt-2 text-sm text-slate-600">
                <strong>Chose:</strong> {a.selectedChoiceText}
              </p>
              {!a.isCorrect && (
                <p className="text-sm text-emerald-700">
                  <strong>Stronger answer:</strong> {a.correctChoiceText}
                </p>
              )}
              <p className="mt-1 text-sm italic text-slate-500">{a.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
