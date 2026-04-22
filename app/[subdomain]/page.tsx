import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ToolRenderer from "@/components/ToolRenderer";
import { ACCESS_COOKIE_NAME, hasPaidAccessCookie } from "@/lib/auth";
import { getToolBySubdomain, incrementToolVisit } from "@/lib/data-store";

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const tool = await getToolBySubdomain(subdomain);

  if (!tool) {
    return {
      title: "Tool Not Found"
    };
  }

  return {
    title: tool.name,
    description: tool.tagline,
    openGraph: {
      title: `${tool.name} | microtool`,
      description: tool.tagline,
      type: "website"
    }
  };
}

export default async function HostedToolPage({
  params
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tool = await getToolBySubdomain(subdomain);

  if (!tool || tool.deployStatus !== "deployed") {
    notFound();
  }

  await incrementToolVisit(subdomain);

  const cookieStore = await cookies();
  const hasAccess = hasPaidAccessCookie(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  return (
    <main className="space-y-6 py-4 sm:py-8">
      <header className="surface rounded-2xl p-6">
        <p className="text-xs uppercase tracking-wide text-blue-300">Hosted Tool</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">{tool.name}</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">{tool.description}</p>
      </header>

      {hasAccess ? (
        <ToolRenderer tool={tool} trackingSubdomain={subdomain} />
      ) : (
        <section className="surface rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-slate-50">Unlock this micro-tool</h2>
          <p className="mt-2 text-sm text-slate-300">
            This feature is behind a paid access wall. Complete checkout, then unlock with the same purchase
            email to set your access cookie.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4">
              <p className="text-sm text-slate-200">Step 1: Complete purchase</p>
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK!}
                className="mt-3 inline-flex rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Buy Access ($15/mo)
              </a>
            </article>

            <article className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <p className="text-sm text-slate-200">Step 2: Unlock this browser</p>
              <form action="/api/access" method="POST" className="mt-3 space-y-3">
                <input type="hidden" name="redirectTo" value={`/${subdomain}`} />
                <label className="block text-xs text-slate-300" htmlFor="email">
                  Purchase Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  placeholder="you@company.com"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Verify and Unlock
                </button>
              </form>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
