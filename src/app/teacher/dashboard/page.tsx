import Link from "next/link";
import { redirect } from "next/navigation";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { ROLE_KEYS, ROLE_PROFILES, roleLabel, type RoleKey } from "@/lib/roles";
import LogoutButton from "@/components/LogoutButton";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  school?: string;
  role?: string;
  date?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isTeacherAuthenticated())) {
    redirect("/teacher/login");
  }

  const sp = await searchParams;
  const where: Prisma.StudentSubmissionWhereInput = {};

  if (sp.q?.trim()) {
    const q = sp.q.trim();
    where.OR = [
      { studentName: { contains: q, mode: "insensitive" } },
      { nickname: { contains: q, mode: "insensitive" } },
      { schoolName: { contains: q, mode: "insensitive" } },
      { teamName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (sp.school?.trim()) {
    where.schoolName = sp.school.trim();
  }
  if (sp.role?.trim()) {
    where.primaryRole = sp.role.trim();
  }
  if (sp.date?.trim()) {
    const start = new Date(`${sp.date}T00:00:00`);
    const end = new Date(`${sp.date}T23:59:59.999`);
    if (!Number.isNaN(start.getTime())) {
      where.createdAt = { gte: start, lte: end };
    }
  }

  const [submissions, allForFilters] = await Promise.all([
    prisma.studentSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.studentSubmission.findMany({
      select: { schoolName: true },
    }),
  ]);

  const schools = [
    ...new Set(allForFilters.map((s) => s.schoolName).filter((v): v is string => Boolean(v))),
  ].sort();

  const count = submissions.length;
  const avgScore =
    count > 0
      ? Math.round(submissions.reduce((sum, s) => sum + s.totalUnderstandingScore, 0) / count)
      : 0;

  const roleCounts = ROLE_KEYS.reduce(
    (acc, r) => {
      acc[r] = submissions.filter((s) => s.primaryRole === r).length;
      return acc;
    },
    {} as Record<RoleKey, number>,
  );

  const exportQuery = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => Boolean(v)) as [string, string][],
  ).toString();

  const emailConfigured = isEmailConfigured();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Teacher dashboard</h1>
          <p className="text-slate-500">Preliminary learning profiles for your students.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/questions" className="btn-secondary text-sm">
            Question bank
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Preliminary-profile disclaimer (calm notice, not an error) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-700">ℹ Preliminary learning profile.</span>{" "}
        This result is a preliminary learning profile based on responses to a short assessment. It
        should be used together with teacher observation, hands-on practice, and student reflection.
        It should not be used as a fixed role assignment.
      </div>

      {!emailConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Email delivery is not configured. Results are stored successfully and viewable here.
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Submissions</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{count}</p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Average understanding</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{avgScore}%</p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Suggested focus spread</p>
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            {ROLE_KEYS.map((r) => (
              <span key={r} className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">
                {ROLE_PROFILES[r].label.split(" ")[0]}: {roleCounts[r]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="label" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            name="q"
            className="input"
            defaultValue={sp.q ?? ""}
            placeholder="Name, nickname, school, or team"
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label" htmlFor="school">
            School
          </label>
          <select id="school" name="school" className="input" defaultValue={sp.school ?? ""}>
            <option value="">All</option>
            {schools.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="role">
            Suggested focus
          </label>
          <select id="role" name="role" className="input" defaultValue={sp.role ?? ""}>
            <option value="">All</option>
            {ROLE_KEYS.map((r) => (
              <option key={r} value={r}>
                {ROLE_PROFILES[r].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input id="date" name="date" type="date" className="input" defaultValue={sp.date ?? ""} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-end lg:col-span-6">
          <button type="submit" className="btn-primary w-full sm:w-auto">
            Apply filters
          </button>
          <Link href="/teacher/dashboard" className="btn-secondary w-full sm:w-auto">
            Reset
          </Link>
          <a
            href={`/api/teacher/export${exportQuery ? `?${exportQuery}` : ""}`}
            className="btn-secondary w-full sm:ml-auto sm:w-auto"
          >
            ⬇ Export CSV
          </a>
        </div>
      </form>

      {submissions.length === 0 && (
        <div className="card text-center text-slate-400">
          No submissions match these filters yet.
        </div>
      )}

      {/* Desktop: table */}
      {submissions.length > 0 && (
        <div className="card hidden overflow-x-auto p-0 md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Understanding</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Suggested focus</th>
                <th className="px-4 py-3">Additional strength</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {s.studentName}
                    {s.nickname ? <span className="text-slate-400"> ({s.nickname})</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.schoolName ?? <span className="text-slate-300">—</span>}
                    {s.teamName ? <span className="text-slate-400"> · {s.teamName}</span> : null}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{s.totalUnderstandingScore}%</td>
                  <td className="px-4 py-3 text-slate-600">{s.understandingLevel}</td>
                  <td className="px-4 py-3 text-slate-600">{roleLabel(s.primaryRole)}</td>
                  <td className="px-4 py-3 text-slate-600">{roleLabel(s.secondaryRole)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/teacher/submissions/${s.id}`}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      View report →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile / tablet: stacked cards */}
      {submissions.length > 0 && (
        <div className="space-y-3 md:hidden">
          {submissions.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-bold text-slate-900">
                    {s.studentName}
                    {s.nickname ? <span className="font-normal text-slate-400"> ({s.nickname})</span> : null}
                  </p>
                  <p className="break-words text-sm text-slate-600">
                    {s.schoolName ?? "—"}
                    {s.teamName ? <span className="text-slate-400"> · {s.teamName}</span> : null}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-brand-50 px-2 py-1 text-sm font-bold text-brand-700">
                  {s.totalUnderstandingScore}%
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-slate-400">Level</dt>
                <dd className="text-right text-slate-700">{s.understandingLevel}</dd>
                <dt className="text-slate-400">Suggested focus</dt>
                <dd className="text-right text-slate-700">{roleLabel(s.primaryRole)}</dd>
                <dt className="text-slate-400">Additional strength</dt>
                <dd className="text-right text-slate-700">{roleLabel(s.secondaryRole)}</dd>
                <dt className="text-slate-400">Date</dt>
                <dd className="text-right text-slate-700">{new Date(s.createdAt).toLocaleDateString()}</dd>
              </dl>
              <Link
                href={`/teacher/submissions/${s.id}`}
                className="btn-secondary mt-4 w-full text-sm"
              >
                View report →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
