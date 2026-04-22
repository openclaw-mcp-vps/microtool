import type { Metadata } from "next";
import Link from "next/link";

import DashboardChart from "@/components/DashboardChart";
import { listTools } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track deployments, visits, and usage across your micro-tools."
};

function formatDate(input: string): string {
  return new Date(input).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const tools = await listTools();
  const sorted = [...tools].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  const chartData = sorted.map((tool) => ({
    date: formatDate(tool.createdAt),
    visits: tool.visits,
    runs: tool.runs
  }));

  const totalVisits = tools.reduce((sum, tool) => sum + tool.visits, 0);
  const totalRuns = tools.reduce((sum, tool) => sum + tool.runs, 0);
  const deployedCount = tools.filter((tool) => tool.deployStatus === "deployed").length;

  return (
    <main className="space-y-6 py-4 sm:py-8">
      <header className="surface rounded-2xl p-6">
        <p className="text-xs uppercase tracking-wide text-emerald-300">Analytics Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Measure What Ships and What Converts</h1>
        <p className="mt-2 text-sm text-slate-300">
          Track deployments, traffic, and execution volume so you can focus on tools with real pull.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="surface rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Deployed Tools</p>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{deployedCount}</p>
        </article>
        <article className="surface rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Visits</p>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{totalVisits}</p>
        </article>
        <article className="surface rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Runs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{totalRuns}</p>
        </article>
      </section>

      <DashboardChart data={chartData} />

      <section className="surface rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Your Tools</h2>
          <Link
            href="/builder"
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-500"
          >
            Create New Tool
          </Link>
        </div>

        {tools.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Tool</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Subdomain</th>
                  <th className="py-2 pr-4">Visits</th>
                  <th className="py-2 pr-4">Runs</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id} className="border-b border-slate-900/70 text-slate-200">
                    <td className="py-2 pr-4">{tool.name}</td>
                    <td className="py-2 pr-4 capitalize">{tool.deployStatus}</td>
                    <td className="py-2 pr-4">
                      <Link href={`/${tool.subdomain}`} className="text-blue-300 underline">
                        /{tool.subdomain}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{tool.visits}</td>
                    <td className="py-2 pr-4">{tool.runs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No tools deployed yet. Start in the builder and publish your first micro-tool.
          </p>
        )}
      </section>
    </main>
  );
}
