import { cookies } from "next/headers";
import { createHash } from "crypto";

// Simple password-based teacher auth for the MVP.
//
// The TEACHER_PASSWORD env var holds the password. In development, if it is not
// set, we fall back to "teacher1234". In production a password must be set.
// The password itself is never stored in a cookie or exposed in the UI — we
// store a salted hash as an httpOnly session cookie.

const COOKIE_NAME = "vexiq_teacher_session";
const DEV_FALLBACK_PASSWORD = "teacher1234";

export function getTeacherPassword(): string {
  const fromEnv = process.env.TEACHER_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_PASSWORD;
  // No password configured in production: deny access by using an
  // unguessable random value so login always fails until configured.
  return createHash("sha256").update(`unset-${Date.now()}-${Math.random()}`).digest("hex");
}

function sessionToken(): string {
  // Derived from the password so changing the password invalidates sessions.
  return createHash("sha256")
    .update(`vexiq-teacher::${getTeacherPassword()}`)
    .digest("hex");
}

export function verifyPassword(input: string): boolean {
  return input === getTeacherPassword();
}

export async function createTeacherSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function destroyTeacherSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isTeacherAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return Boolean(value) && value === sessionToken();
}
