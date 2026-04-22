import type { Metadata } from "next";

import ToolBuilder from "@/components/ToolBuilder";

export const metadata: Metadata = {
  title: "Tool Builder",
  description:
    "Upload, validate, preview, and deploy JSON-powered micro-tools with hosted payments and analytics."
};

export default function BuilderPage() {
  return (
    <main className="space-y-6 py-4 sm:py-8">
      <header className="surface rounded-2xl p-6">
        <p className="text-xs uppercase tracking-wide text-blue-300">Builder</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Create and Deploy a Micro-Tool</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          Build a useful tool with one JSON config. microtool validates your schema, lets you test behavior,
          and deploys to a hosted subdomain without writing deployment scripts or billing glue code.
        </p>
      </header>

      <ToolBuilder />
    </main>
  );
}
