import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Clock3, Rocket, ShieldCheck, WandSparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <header className="mb-10 flex items-center justify-between rounded-xl border border-[var(--line)] bg-[#0f1623]/80 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          microtool
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--text-soft)]">
          <a href="#problem" className="transition hover:text-[var(--text)]">
            Problem
          </a>
          <a href="#pricing" className="transition hover:text-[var(--text)]">
            Pricing
          </a>
          <Link href="/dashboard" className="transition hover:text-[var(--text)]">
            Dashboard
          </Link>
          <Link
            href="/builder"
            className="rounded-md bg-[var(--brand)] px-3 py-1.5 font-semibold text-[#04150f]"
          >
            Build Now
          </Link>
        </nav>
      </header>

      <section className="surface relative overflow-hidden p-8 sm:p-12">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--brand)]/10 blur-3xl" />
        <p className="eyebrow">Ship Tools Fast</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Launch paid micro-tools in minutes, not weeks.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-soft)]">
          Upload a JSON or YAML config, deploy instantly to a hosted URL, and monetize with built-in
          checkout, access control, and usage analytics.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-semibold text-[#04150f] transition hover:brightness-110"
          >
            Build Your First Tool
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[var(--line)] px-4 py-2.5 transition hover:border-[var(--brand)]"
          >
            View Dashboard
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-4">
            <p className="text-sm text-[var(--text-soft)]">Typical setup time</p>
            <p className="mt-1 text-2xl font-semibold">12 minutes</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-4">
            <p className="text-sm text-[var(--text-soft)]">Monthly cost</p>
            <p className="mt-1 text-2xl font-semibold">$15 / tool</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-4">
            <p className="text-sm text-[var(--text-soft)]">Ideal customer</p>
            <p className="mt-1 text-2xl font-semibold">Solo dev teams</p>
          </div>
        </div>
      </section>

      <section id="problem" className="mt-14">
        <p className="eyebrow">Problem</p>
        <h2 className="mt-2 text-3xl font-semibold">Boilerplate kills promising micro-SaaS ideas.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="surface p-5">
            <Clock3 className="text-[var(--brand)]" size={20} />
            <h3 className="mt-3 text-lg font-semibold">You rebuild foundations every time</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Auth, billing, deployment, and dashboards consume the first week before you validate demand.
            </p>
          </article>
          <article className="surface p-5">
            <ShieldCheck className="text-[var(--brand)]" size={20} />
            <h3 className="mt-3 text-lg font-semibold">Shipping friction blocks momentum</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Most small tools stall in private repos because infrastructure tasks feel heavier than the core
              feature.
            </p>
          </article>
          <article className="surface p-5">
            <BadgeDollarSign className="text-[var(--brand)]" size={20} />
            <h3 className="mt-3 text-lg font-semibold">Revenue arrives too late</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Delayed monetization means weak feedback loops and fewer chances to iterate before interest fades.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-14">
        <p className="eyebrow">Solution</p>
        <h2 className="mt-2 text-3xl font-semibold">microtool gives you a ready-to-sell runtime.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="surface p-5">
            <WandSparkles className="text-[#4ea1ff]" size={20} />
            <h3 className="mt-3 text-lg font-semibold">Config-first builder</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Use JSON/YAML to define fields and formulas. No frontend scaffolding, no route wiring, no
              repetitive form code.
            </p>
          </article>
          <article className="surface p-5">
            <Rocket className="text-[#4ea1ff]" size={20} />
            <h3 className="mt-3 text-lg font-semibold">Hosted deploy per tool</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Each tool gets its own deployment URL/subdomain and can be shared the moment you click deploy.
            </p>
          </article>
          <article className="surface p-5">
            <BadgeDollarSign className="text-[#4ea1ff]" size={20} />
            <h3 className="mt-3 text-lg font-semibold">Monetization and access control</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Lemon Squeezy checkout, webhook-driven entitlement updates, and cookie-based gated usage are
              built in.
            </p>
          </article>
        </div>
      </section>

      <section id="pricing" className="mt-14 surface p-8">
        <p className="eyebrow">Pricing</p>
        <h2 className="mt-2 text-3xl font-semibold">One plan. Ship as many ideas as you can test.</h2>
        <div className="mt-6 max-w-xl rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] p-6">
          <p className="text-sm uppercase tracking-[0.16em] text-[#9ce8c8]">Builder Plan</p>
          <p className="mt-2 text-4xl font-semibold text-[#ddffe8]">
            $15<span className="text-lg font-medium text-[#bfeed7]">/month</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#c9f4de]">
            <li>Visual config builder + JSON/YAML import</li>
            <li>Hosted deployment links for each micro-tool</li>
            <li>Lemon Squeezy checkout integration</li>
            <li>Cookie paywall + entitlement claiming</li>
            <li>Usage and run analytics dashboard</li>
          </ul>
          <Link
            href="/builder"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#defde9] px-4 py-2 font-semibold text-[#093220]"
          >
            Start Building
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-14">
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-2 text-3xl font-semibold">Common questions from technical founders</h2>
        <div className="mt-6 grid gap-4">
          <article className="surface p-5">
            <h3 className="text-lg font-semibold">Can I build tools without writing frontend code?</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Yes. The config schema defines inputs, formulas, and output formatting. microtool renders the
              complete UI and execution flow automatically.
            </p>
          </article>
          <article className="surface p-5">
            <h3 className="text-lg font-semibold">How does access get unlocked after payment?</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Lemon Squeezy webhooks mark the purchase in the backend. The user confirms their checkout email,
              and a signed access cookie unlocks the tool.
            </p>
          </article>
          <article className="surface p-5">
            <h3 className="text-lg font-semibold">Who is this built for?</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Solo developers and small teams validating narrow SaaS ideas fast, where launch velocity matters
              more than polishing internal scaffolding.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
