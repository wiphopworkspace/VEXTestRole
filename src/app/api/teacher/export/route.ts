import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCsv, type CsvRow } from "@/lib/csv";
import type { RoleScores } from "@/lib/roles";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isTeacherAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const where: Prisma.StudentSubmissionWhereInput = {};

  const q = searchParams.get("q")?.trim();
  const school = searchParams.get("school")?.trim();
  const role = searchParams.get("role")?.trim();
  const date = searchParams.get("date")?.trim();

  if (q) {
    where.OR = [
      { studentName: { contains: q, mode: "insensitive" } },
      { nickname: { contains: q, mode: "insensitive" } },
      { schoolName: { contains: q, mode: "insensitive" } },
      { teamName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (school) where.schoolName = school;
  if (role) where.primaryRole = role;
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    if (!Number.isNaN(start.getTime())) where.createdAt = { gte: start, lte: end };
  }

  const submissions = await prisma.studentSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const rows: CsvRow[] = submissions.map((s) => ({
    createdAt: new Date(s.createdAt).toISOString(),
    studentName: s.studentName,
    nickname: s.nickname ?? "",
    schoolName: s.schoolName ?? "",
    teamName: s.teamName ?? "",
    totalUnderstandingScore: s.totalUnderstandingScore,
    understandingLevel: s.understandingLevel,
    primaryRole: s.primaryRole,
    secondaryRole: s.secondaryRole,
    roleScores: JSON.parse(s.roleScoresJson) as RoleScores,
    growthAreas: JSON.parse(s.growthAreasJson) as string[],
  }));

  const csv = buildCsv(rows);
  const filename = `vex-iq-assessments-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
