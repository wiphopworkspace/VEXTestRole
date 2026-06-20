"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicQuestion } from "@/lib/questions";

interface StudentInfo {
  studentName: string;
  nickname: string;
  gradeLevel: string;
  className: string;
  teacherEmail: string;
  teamName: string;
  consent: boolean;
}

const EMPTY_INFO: StudentInfo = {
  studentName: "",
  nickname: "",
  gradeLevel: "",
  className: "",
  teacherEmail: "",
  teamName: "",
  consent: false,
};

const GRADE_OPTIONS = [
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Other",
];

export default function AssessmentClient({ questions }: { questions: PublicQuestion[] }) {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "quiz">("info");
  const [info, setInfo] = useState<StudentInfo>(EMPTY_INFO);
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const total = questions.length;
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]).length,
    [answers, questions],
  );
  const allAnswered = answeredCount === total;
  const question = questions[current];

  function validateInfo(): boolean {
    const errs: Record<string, string> = {};
    if (!info.studentName.trim()) errs.studentName = "Please enter your name.";
    if (!info.gradeLevel.trim()) errs.gradeLevel = "Please select a grade level.";
    if (!info.className.trim()) errs.className = "Please enter your class.";
    if (!info.teacherEmail.trim()) {
      errs.teacherEmail = "Please enter your teacher's email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.teacherEmail.trim())) {
      errs.teacherEmail = "Please enter a valid email address.";
    }
    if (!info.consent) errs.consent = "Please check the consent box to continue.";
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function startQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (validateInfo()) {
      setStep("quiz");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function selectChoice(choiceId: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: choiceId }));
  }

  function goNext() {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goPrev() {
    if (current > 0) {
      setCurrent((c) => c - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submit() {
    if (!allAnswered) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        student: {
          studentName: info.studentName.trim(),
          nickname: info.nickname.trim(),
          gradeLevel: info.gradeLevel.trim(),
          className: info.className.trim(),
          teacherEmail: info.teacherEmail.trim(),
          teamName: info.teamName.trim(),
          consent: info.consent,
        },
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedChoiceId: answers[q.id],
        })),
      };
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      router.push(`/assessment/result/${data.submissionId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  if (step === "info") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Before we start</h1>
        <p className="mt-2 text-slate-600">
          Tell us a little about you. We only collect what your teacher needs to understand your
          learning strengths.
        </p>

        <form onSubmit={startQuiz} className="card mt-6 space-y-5" noValidate>
          <div>
            <label className="label" htmlFor="studentName">
              Your name <span className="text-rose-500">*</span>
            </label>
            <input
              id="studentName"
              className="input"
              value={info.studentName}
              onChange={(e) => setInfo({ ...info, studentName: e.target.value })}
              autoComplete="off"
            />
            {infoErrors.studentName && (
              <p className="mt-1 text-sm text-rose-600">{infoErrors.studentName}</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="nickname">
              Nickname <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="nickname"
              className="input"
              value={info.nickname}
              onChange={(e) => setInfo({ ...info, nickname: e.target.value })}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="gradeLevel">
                Grade level <span className="text-rose-500">*</span>
              </label>
              <select
                id="gradeLevel"
                className="input"
                value={info.gradeLevel}
                onChange={(e) => setInfo({ ...info, gradeLevel: e.target.value })}
              >
                <option value="">Select…</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {infoErrors.gradeLevel && (
                <p className="mt-1 text-sm text-rose-600">{infoErrors.gradeLevel}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="className">
                Class <span className="text-rose-500">*</span>
              </label>
              <input
                id="className"
                className="input"
                value={info.className}
                onChange={(e) => setInfo({ ...info, className: e.target.value })}
                placeholder="e.g. 5B or Robotics Club"
                autoComplete="off"
              />
              {infoErrors.className && (
                <p className="mt-1 text-sm text-rose-600">{infoErrors.className}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="teacherEmail">
                Teacher&apos;s email <span className="text-rose-500">*</span>
              </label>
              <input
                id="teacherEmail"
                type="email"
                className="input"
                value={info.teacherEmail}
                onChange={(e) => setInfo({ ...info, teacherEmail: e.target.value })}
                autoComplete="off"
              />
              {infoErrors.teacherEmail && (
                <p className="mt-1 text-sm text-rose-600">{infoErrors.teacherEmail}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="teamName">
                Team name <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="teamName"
                className="input"
                value={info.teamName}
                onChange={(e) => setInfo({ ...info, teamName: e.target.value })}
                autoComplete="off"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-slate-300"
              checked={info.consent}
              onChange={(e) => setInfo({ ...info, consent: e.target.checked })}
            />
            <span className="text-sm text-slate-700">
              I understand this assessment is used to help my teacher understand my learning
              strengths.
            </span>
          </label>
          {infoErrors.consent && (
            <p className="-mt-2 text-sm text-rose-600">{infoErrors.consent}</p>
          )}

          <button type="submit" className="btn-primary w-full text-lg">
            Start the {total}-question assessment
          </button>
        </form>
      </div>
    );
  }

  // Quiz step
  const progress = Math.round(((current + 1) / total) * 100);
  const selected = answers[question.id];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>
            Question {current + 1} of {total}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={current + 1}
            aria-valuemin={1}
            aria-valuemax={total}
          />
        </div>
      </div>

      <div className="card">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          {question.category}
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-snug text-slate-900">{question.text}</h2>

        <div className="mt-6 space-y-3">
          {question.choices.map((choice, idx) => {
            const isSelected = selected === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => selectChoice(choice.id)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left text-lg transition ${
                  isSelected
                    ? "border-brand-600 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50"
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    isSelected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="pt-1 text-slate-800">{choice.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={goPrev}
          disabled={current === 0}
        >
          ← Back
        </button>

        {current < total - 1 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={goNext}
            disabled={!selected}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? "Submitting…" : "Finish & see my profile"}
          </button>
        )}
      </div>

      {current === total - 1 && !allAnswered && (
        <p className="mt-4 text-center text-sm text-amber-600">
          Please answer all {total} questions before finishing. You still have{" "}
          {total - answeredCount} to go.
        </p>
      )}
      {submitError && (
        <p className="mt-4 text-center text-sm text-rose-600">{submitError}</p>
      )}

      {/* Quick question navigator */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {questions.map((q, idx) => {
          const done = Boolean(answers[q.id]);
          const isCurrent = idx === current;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                isCurrent
                  ? "bg-brand-600 text-white"
                  : done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
              aria-label={`Go to question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
