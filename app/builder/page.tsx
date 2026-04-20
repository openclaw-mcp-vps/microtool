import type { Metadata } from "next";
import Script from "next/script";
import ConfigBuilder from "@/components/ConfigBuilder";

export const metadata: Metadata = {
  title: "Tool Builder",
  description:
    "Create and deploy single-purpose micro-tools from JSON/YAML configs with built-in checkout and access control."
};

export default function BuilderPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />

      <section className="mb-8">
        <p className="eyebrow">microtool Builder</p>
        <h1 className="mt-2 text-4xl font-semibold">Upload config, deploy, and monetize in one flow.</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-soft)]">
          Define inputs and formulas, launch a hosted URL, and gate execution behind Lemon Squeezy subscriptions.
        </p>
      </section>

      <ConfigBuilder />
    </main>
  );
}
