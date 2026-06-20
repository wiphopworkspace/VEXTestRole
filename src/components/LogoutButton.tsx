"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/teacher/logout", { method: "POST" });
    router.push("/teacher/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} className="btn-secondary text-sm" disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
