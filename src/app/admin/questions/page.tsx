import Link from "next/link";
import { QUESTIONS } from "@/lib/questions";
import { ROLE_KEYS, roleLabel, type RoleKey } from "@/lib/roles";

export const metadata = {
  title: "Question bank · VEX IQ Role Readiness",
};

function formatWeights(weights: Partial<Record<RoleKey, number>>): string {
  const parts = ROLE_KEYS.filter((k) => typeof weights[k] === "number" && weights[k] !== 0).map(
    (k) => `${roleLabel(k)} ${weights[k]! > 0 ? "+" : ""}${weights[k]}`,
  );
  return parts.length ? parts.join(", ") : "—";
}

export default function QuestionBankPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Question bank</h1>
          <p className="text-slate-500">
            Read-only reference for the {QUESTIONS.length}-question assessment. Concepts are
            paraphrased in original wording for educational use.
          </p>
        </div>
        <Link href="/teacher/dashboard" className="btn-secondary text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q, idx) => (
          <div key={q.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
                Q{idx + 1}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {q.category}
              </span>
              <span className="text-xs text-slate-400">
                Role tags: {q.roleTags.map(roleLabel).join(", ")}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-900">{q.text}</h2>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Choice</th>
                    <th className="py-2 pr-3">Correct</th>
                    <th className="py-2 pr-3">Role weights</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {q.choices.map((c, ci) => {
                    const isCorrect = c.id === q.correctChoiceId;
                    return (
                      <tr key={c.id} className={isCorrect ? "bg-emerald-50" : ""}>
                        <td className="py-2 pr-3 font-semibold text-slate-500">
                          {String.fromCharCode(65 + ci)}
                        </td>
                        <td className="py-2 pr-3 text-slate-700">{c.text}</td>
                        <td className="py-2 pr-3">
                          {isCorrect ? (
                            <span className="font-bold text-emerald-700">✓ ({c.correctnessScore})</span>
                          ) : (
                            <span className="text-slate-400">{c.correctnessScore}</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-slate-500">{formatWeights(c.roleWeights)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <strong>Feedback:</strong> {q.feedback}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
