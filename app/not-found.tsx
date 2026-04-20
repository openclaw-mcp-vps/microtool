import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-16 sm:px-6">
      <div className="surface w-full p-8">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Tool not found</h1>
        <p className="mt-3 text-sm text-[var(--text-soft)]">
          This tool has not been deployed yet, or the URL is incorrect.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg border border-[var(--line)] px-3 py-2 text-sm transition hover:border-[var(--brand)]"
        >
          Back to microtool home
        </Link>
      </div>
    </main>
  );
}
