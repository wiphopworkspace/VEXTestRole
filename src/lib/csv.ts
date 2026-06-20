// CSV export helper for the teacher dashboard.

import type { RoleKey, RoleScores } from "./roles";

export interface CsvRow {
  createdAt: string;
  studentName: string;
  nickname: string;
  schoolName: string;
  teamName: string;
  totalUnderstandingScore: number;
  understandingLevel: string;
  primaryRole: string;
  secondaryRole: string;
  roleScores: RoleScores;
  growthAreas: RoleKey[] | string[];
}

const HEADERS = [
  "createdAt",
  "studentName",
  "nickname",
  "schoolName",
  "teamName",
  "totalUnderstandingScore",
  "understandingLevel",
  "primaryRole",
  "secondaryRole",
  "Builder",
  "Programmer",
  "Driver",
  "Notebooker",
  "Strategist",
  "TeamCollaborator",
  "growthAreas",
];

function escapeCsv(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(rows: CsvRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const row of rows) {
    const cells = [
      row.createdAt,
      row.studentName,
      row.nickname,
      row.schoolName,
      row.teamName,
      row.totalUnderstandingScore,
      row.understandingLevel,
      row.primaryRole,
      row.secondaryRole,
      row.roleScores.Builder,
      row.roleScores.Programmer,
      row.roleScores.Driver,
      row.roleScores.Notebooker,
      row.roleScores.Strategist,
      row.roleScores.TeamCollaborator,
      (row.growthAreas as string[]).join(" | "),
    ];
    lines.push(cells.map(escapeCsv).join(","));
  }
  return lines.join("\r\n");
}
