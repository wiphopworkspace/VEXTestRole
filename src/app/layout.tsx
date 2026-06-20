import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "VEX IQ Role Readiness Assessment",
  description:
    "A preliminary learning profile that helps students and teachers explore VEX IQ team role tendencies. For educational guidance only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
                  IQ
                </span>
                <span className="text-lg leading-tight">
                  VEX IQ Role Readiness
                  <span className="block text-xs font-medium text-slate-400">
                    Preliminary learning profile
                  </span>
                </span>
              </Link>
              <nav className="flex items-center gap-3 text-sm font-semibold">
                <Link href="/assessment" className="text-slate-600 hover:text-brand-700">
                  Start assessment
                </Link>
                <Link href="/teacher/login" className="text-slate-600 hover:text-brand-700">
                  Teacher login
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-400">
              This tool provides a preliminary learning profile for educational guidance and
              team placement only. It does not certify students or assign final team roles, and
              it is not affiliated with or endorsed by VEX Robotics.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
