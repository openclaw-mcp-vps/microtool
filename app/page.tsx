import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Rocket, ShieldCheck } from "lucide-react";

const faq = [
  {
    q: "Who is microtool for?",
    a: "microtool is built for solo developers, indie founders, and tiny teams that want to test a focused tool idea quickly without rebuilding auth, billing, and analytics every time."
  },
  {
    q: "How fast can I launch?",
    a: "Most teams ship their first live tool the same day. Upload a JSON config, preview behavior, and deploy to a hosted subdomain in minutes."
  },
  {
    q: "What does the paid plan include?",
    a: "The $15/mo plan includes hosted deployment, Stripe checkout integration, cookie-based paid access control, tool analytics, and builder access for unlimited internal experiments."
  },
  {
    q: "Can I update tools after launch?",
    a: "Yes. Re-upload and redeploy your JSON config to iterate quickly. This makes it easy to adjust pricing calculators, estimators, onboarding helpers, and internal utilities as customer feedback comes in."
  }
];

export default function HomePage() {
  return (
    <main className="space-y-16 py-4 sm:py-8">
      <section className="surface rounded-3xl border border-slate-800/80 p-6 sm:p-10">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-950/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
            <Rocket className="h-3.5 w-3.5" />
            Launch Micro-SaaS Faster
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-slate-50 sm:text-5xl">
            microtool helps you ship monetized single-purpose tools in minutes.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Build the logic that makes your idea unique, skip the boilerplate that drains momentum. Upload
            a config and get a hosted tool with access control, checkout, and analytics included.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK!}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Start for $15/mo
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/builder"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
            >
              Open Builder Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <article className="surface rounded-2xl p-5">
          <Clock3 className="h-5 w-5 text-amber-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-100">The Problem</h2>
          <p className="mt-2 text-sm text-slate-300">
            Developers lose weeks rebuilding login, billing flows, and hosting plumbing for every small tool
            idea. By the time the scaffold is done, the idea is stale or abandoned.
          </p>
        </article>

        <article className="surface rounded-2xl p-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-100">The Solution</h2>
          <p className="mt-2 text-sm text-slate-300">
            microtool gives you a deployment-ready shell: upload config, get a hosted tool, track usage, and
            monetize with Stripe hosted checkout. You focus on value, not repetitive setup.
          </p>
        </article>

        <article className="surface rounded-2xl p-5">
          <ShieldCheck className="h-5 w-5 text-blue-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-100">Why It Wins</h2>
          <p className="mt-2 text-sm text-slate-300">
            Micro-SaaS rewards speed and learning loops. Launch quickly, measure actual usage, then double
            down on what converts instead of polishing untested ideas for months.
          </p>
        </article>
      </section>

      <section className="surface rounded-3xl p-6 sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Pricing</h2>
        <p className="mt-2 text-slate-300">One clear plan for builders validating real demand quickly.</p>

        <div className="mt-6 grid gap-4 sm:max-w-lg">
          <article className="rounded-2xl border border-blue-500/40 bg-blue-950/20 p-5">
            <p className="text-xs uppercase tracking-wide text-blue-300">microtool Pro</p>
            <p className="mt-2 text-3xl font-semibold text-slate-50">
              $15
              <span className="text-base font-medium text-slate-300">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>Hosted subdomain deployment for each tool</li>
              <li>Stripe payment-link paywall integration</li>
              <li>Cookie-based paid access controls</li>
              <li>Usage analytics dashboard</li>
              <li>JSON-config builder with instant preview</li>
            </ul>
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK!}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Buy microtool Pro
            </a>
          </article>
        </div>
      </section>

      <section className="surface rounded-3xl p-6 sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">FAQ</h2>
        <div className="mt-6 space-y-4">
          {faq.map((item) => (
            <article key={item.q} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-base font-semibold text-slate-100">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
