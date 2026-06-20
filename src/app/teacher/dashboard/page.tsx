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
  className?: string;
  gradeLevel?: string;
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
    where.studentName = { contains: sp.q.trim() };
  }
  if (sp.className?.trim()) {
    where.className = sp.className.trim();
  }
  if (sp.gradeLevel?.trim()) {
    where.gradeLevel = sp.gradeLevel.trim();
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
      select: { className: true, gradeLevel: true },
    }),
  ]);

  const classes = [...new Set(allForFilters.map((s) => s.className))].sort();
  const grades = [...new Set(allForFilters.map((s) => s.gradeLevel))].sort();

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
          <p className="text-sm font-semibold text-slate-500">Primary role spread</p>
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
            Search name
          </label>
          <input id="q" name="q" className="input" defaultValue={sp.q ?? ""} placeholder="Student name" />
        </div>
        <div>
          <label className="label" htmlFor="className">
            Class
          </label>
          <select id="className" name="className" className="input" defaultValue={sp.className ?? ""}>
            <option value="">All</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="gradeLevel">
            Grade
          </label>
          <select id="gradeLevel" name="gradeLevel" className="input" defaultValue={sp.gradeLevel ?? ""}>
            <option value="">All</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="role">
            Primary role
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
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="btn-primary">
            Apply filters
          </button>
          <Link href="/teacher/dashboard" className="btn-secondary">
            Reset
          </Link>
          <a href={`/api/teacher/export${exportQuery ? `?${exportQuery}` : ""}`} className="btn-secondary ml-auto">
            ⬇ Export CSV
          </a>
        </div>
      </form>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Grade / Class</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Primary</th>
              <th className="px-4 py-3">Secondary</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No submissions match these filters yet.
                </td>
              </tr>
            )}
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
                  {s.gradeLevel} · {s.className}
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
    </div>
  );
}
