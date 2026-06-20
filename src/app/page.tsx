import Link from "next/link";
import { ROLE_PROFILES, ROLE_KEYS } from "@/lib/roles";
import { QUESTION_COUNT } from "@/lib/questions";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-700">
          Preliminary learning profile · {QUESTION_COUNT} questions · English
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Discover your VEX IQ role tendencies
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Answer questions about building, coding, driving, the engineering notebook, strategy,
          and teamwork. You&apos;ll get a friendly profile showing where you may be strongest right
          now — and what to practice next.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/assessment" className="btn-primary text-lg">
            Start the assessment
          </Link>
          <Link href="/teacher/login" className="btn-secondary text-lg">
            Teacher login
          </Link>
        </div>
      </section>

      <section className="card">
        <h2 className="text-2xl font-bold text-slate-900">What this assessment is for</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <p className="text-slate-600">
            This assessment helps you and your teacher understand your <strong>learning
            strengths</strong> across the main parts of a VEX IQ Robotics Competition team. It
            looks at how well you understand team roles, competition responsibilities, game
            strategy, student-centered work, and basic role-fit tendencies.
          </p>
          <p className="text-slate-600">
            Your result is a <strong>preliminary learning profile</strong> — a starting point, not
            a final decision. It suggests a <strong>role tendency</strong> and a{" "}
            <strong>recommended next practice</strong>. Every student can grow in every role with
            practice.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">The six areas we explore</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_KEYS.map((key) => {
            const role = ROLE_PROFILES[key];
            return (
              <div key={key} className="card">
                <h3 className="text-lg font-bold text-slate-900">{role.label}</h3>
                <p className="text-sm font-medium text-brand-600">{role.tagline}</p>
                <p className="mt-2 text-sm text-slate-600">{role.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card border-amber-200 bg-amber-50">
        <h2 className="text-xl font-bold text-amber-900">Privacy notice</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900/90">
          <li>We collect only your name or nickname, your school name, and (optionally) your team name.</li>
          <li>We do not collect any other personal or sensitive information.</li>
          <li>You will be asked to confirm consent before the quiz begins.</li>
          <li>Results are available only to authorized teachers through the teacher dashboard.</li>
          <li>
            This is a preliminary learning profile for educational guidance only. It is not an
            official certification and does not assign final team roles.
          </li>
        </ul>
      </section>
    </div>
  );
}
