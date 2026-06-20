// Optional email integration via Resend.
//
// If both RESEND_API_KEY and FROM_EMAIL are set, a report summary email is sent
// to the teacher after a submission. Otherwise the report is stored only and the
// teacher dashboard shows "Email delivery is not configured."

import { Resend } from "resend";
import { roleLabel } from "./roles";

export type EmailStatus = "sent" | "failed" | "not_configured";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.FROM_EMAIL?.trim());
}

interface ReportEmailInput {
  teacherEmail: string;
  studentName: string;
  gradeLevel: string;
  className: string;
  totalUnderstandingScore: number;
  understandingLevel: string;
  primaryRole: string;
  secondaryRole: string;
  submissionId: string;
}

export async function sendReportEmail(input: ReportEmailInput): Promise<EmailStatus> {
  if (!isEmailConfigured()) return "not_configured";

  const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
  const reportUrl = `${appUrl}/teacher/submissions/${input.submissionId}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!.trim());
    const primary = roleLabel(input.primaryRole);
    const secondary = roleLabel(input.secondaryRole);

    await resend.emails.send({
      from: process.env.FROM_EMAIL!.trim(),
      to: input.teacherEmail,
      subject: `VEX IQ Assessment Result - ${input.studentName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1f2937;">
          <h2 style="color:#1f5ceb;">VEX IQ Role Readiness Assessment</h2>
          <p>A new preliminary learning profile is ready.</p>
          <table style="border-collapse: collapse;">
            <tr><td style="padding:4px 12px 4px 0;"><strong>Student</strong></td><td>${escapeHtml(input.studentName)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;"><strong>Grade / Class</strong></td><td>${escapeHtml(input.gradeLevel)} / ${escapeHtml(input.className)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;"><strong>Total understanding</strong></td><td>${input.totalUnderstandingScore}% (${escapeHtml(input.understandingLevel)})</td></tr>
            <tr><td style="padding:4px 12px 4px 0;"><strong>Primary role tendency</strong></td><td>${escapeHtml(primary)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;"><strong>Secondary role tendency</strong></td><td>${escapeHtml(secondary)}</td></tr>
          </table>
          <p style="margin-top:16px;">
            <a href="${reportUrl}" style="background:#1f5ceb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">View full report</a>
          </p>
          <p style="color:#6b7280;font-size:13px;margin-top:16px;">
            This is a preliminary learning profile for educational guidance and team placement only. It is not a fixed role assignment or an official certification.
          </p>
        </div>
      `,
    });
    return "sent";
  } catch (err) {
    console.error("Failed to send report email:", err);
    return "failed";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
