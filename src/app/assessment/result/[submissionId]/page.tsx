import Link from "next/link";

// Student-facing post-submission page.
//
// Intentionally a simple confirmation only. Students must NOT see their score,
// role tendencies, strengths, growth areas, or any analysis — that is available
// to authorized teachers only, in the teacher dashboard. This page does not query
// the submission, so older/bookmarked result links also reveal nothing.

export const metadata = {
  title: "Submission received · VEX IQ Role Readiness",
};

export default function SubmissionReceivedPage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="card text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Submission received
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Thank you. Your answers have been submitted successfully.
        </p>
        <p className="mt-2 text-base text-slate-600">
          Your teacher can review the assessment summary from the teacher dashboard.
        </p>

        <div className="mt-6">
          <Link href="/" className="btn-primary w-full sm:w-auto">
            Back to home
          </Link>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          This assessment is used to help teachers understand learning strengths. Results are not
          shown publicly.
        </p>
      </div>
    </div>
  );
}
