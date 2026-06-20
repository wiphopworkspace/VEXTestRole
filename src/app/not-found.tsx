import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-5xl font-extrabold text-slate-900">404</h1>
      <p className="mt-3 text-slate-600">
        We couldn&apos;t find that page or result. The link may be incorrect or the result may not
        exist.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Back to home
      </Link>
    </div>
  );
}
