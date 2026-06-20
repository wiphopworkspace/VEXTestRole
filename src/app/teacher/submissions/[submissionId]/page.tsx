import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreSubmission, type SubmittedAnswer } from "@/lib/scoring";
import { buildTeacherReport } from "@/lib/report";

export const dynamic = "force-dynamic";

const DISCLAIMER =
  "This result is a preliminary learning profile based on responses to a short assessment. It should be used together with teacher observation, hands-on practice, and student reflection. It should not be used as a fixed role assignment.";

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
    include: { answers: true },
  });
  if (!submission) notFound();

  // Re-score from the stored answers so the fair, normalized logic applies to
  // every submission (including older rows) without re-writing the database.
  const answers: SubmittedAnswer[] = submission.answers.map((a) => ({
    questionId: a.questionId,
    selectedChoiceId: a.selectedChoiceId,
  }));
  const score = scoreSubmission(answers);
  const report = buildTeacherReport(score);

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

      {/* Preliminary-profile disclaimer (calm notice, not an error) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-700">ℹ Preliminary learning profile.</span>{" "}
        {DISCLAIMER}
      </div>

      {/* Student info */}
      <div className="card">
        <h1 className="break-words text-2xl font-extrabold text-slate-900">
          {submission.studentName}
          {submission.nickname ? (
            <span className="text-slate-400"> ({submission.nickname})</span>
          ) : null}
        </h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span><strong>School:</strong> {submission.schoolName ?? "—"}</span>
          {submission.teamName ? <span><strong>Team:</strong> {submission.teamName}</span> : null}
          {/* Legacy fields — only shown for older submissions that still have them. */}
          {submission.gradeLevel ? <span><strong>Grade:</strong> {submission.gradeLevel}</span> : null}
          {submission.className ? <span><strong>Class:</strong> {submission.className}</span> : null}
          {submission.teacherEmail ? <span><strong>Teacher email:</strong> {submission.teacherEmail}</span> : null}
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

      {/* Scores */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Total understanding score</p>
          <p className="mt-1 text-4xl font-extrabold text-slate-900">
            {score.totalUnderstandingScore}%
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-600">
            Preliminary level: {score.understandingLevel}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Preliminary role tendency</p>
          {report.balancedLearner ? (
            <p className="mt-1 text-lg font-semibold text-brand-700">Balanced preliminary profile</p>
          ) : (
            <>
              <p className="mt-1 text-lg">
                <strong>Suggested focus:</strong> {report.primaryRoleLabel}
              </p>
              <p className="text-lg">
                <strong>Additional strength area:</strong> {report.secondaryRoleLabel}
              </p>
              {report.combinedStrengths && (
                <p className="mt-1 text-sm text-brand-600">Close preliminary strengths (top two are within 10%)</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Normalized role breakdown */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Role score breakdown (normalized)</h2>
        <p className="mt-1 text-sm text-slate-500">{report.normalizationNote}</p>

        {/* Desktop table */}
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Raw</th>
                <th className="py-2 pr-3">Max</th>
                <th className="py-2 pr-3">Percentage</th>
                <th className="py-2 pr-3">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.roleBreakdown.map((r) => (
                <tr key={r.role}>
                  <td className="py-2 pr-3 font-semibold text-slate-700">{r.label}</td>
                  <td className="py-2 pr-3 text-slate-500">{r.raw}</td>
                  <td className="py-2 pr-3 text-slate-500">{r.max}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.percent}%` }} />
                      </div>
                      <span className="font-semibold text-slate-700">{r.percent}%</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{r.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked list */}
        <div className="mt-4 space-y-3 sm:hidden">
          {report.roleBreakdown.map((r) => (
            <div key={r.role}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{r.label}</span>
                <span className="font-semibold text-slate-700">{r.percent}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.percent}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {r.raw} / {r.max} points · {r.interpretation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested focus + strength */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Suggested focus</h2>
        <p className="mt-2 text-slate-700">{report.suggestedFocus}</p>
        <h3 className="mt-4 font-bold text-slate-900">Strength explanation</h3>
        <p className="mt-1 break-words text-slate-700">{report.strengthExplanation}</p>
      </div>

      {/* Growth areas */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Suggested growth areas (area for guided practice)</h2>
        {report.growthAreas.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700">{report.growthAreasNote}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {report.growthAreas.map((g) => (
              <li key={g.role} className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">{g.label}</p>
                <p className="break-words text-sm text-slate-600">{g.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Training plan */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Recommended practice direction</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
          {report.recommendedTrainingPlan.map((step, i) => (
            <li key={i} className="break-words">{step}</li>
          ))}
        </ol>
      </div>

      {/* Supportive flags */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">Areas needing more observation</h2>
        {report.riskFlags.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700">
            No flags. This student shows solid awareness of rules, student-centered work, and
            collaboration.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.riskFlags.map((f) => (
              <li key={f.key} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-800">{f.label}</p>
                <p className="break-words text-sm text-amber-700">{f.note}</p>
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
                <p className="break-words font-semibold text-slate-800">
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
              <p className="mt-2 break-words text-sm text-slate-600">
                <strong>Chose:</strong> {a.selectedChoiceText}
              </p>
              {!a.isCorrect && (
                <p className="break-words text-sm text-emerald-700">
                  <strong>Stronger answer:</strong> {a.correctChoiceText}
                </p>
              )}
              <p className="mt-1 break-words text-sm italic text-slate-500">{a.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
