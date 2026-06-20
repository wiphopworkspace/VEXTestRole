import { redirect } from "next/navigation";
import { isTeacherAuthenticated } from "@/lib/auth";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function TeacherLoginPage() {
  if (await isTeacherAuthenticated()) {
    redirect("/teacher/dashboard");
  }
  return <LoginClient />;
}
