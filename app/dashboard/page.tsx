import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsChart from "@/components/AnalyticsChart";
import { getSessionFromCookiesStore } from "@/lib/auth";
import { getTotalPaidUsers, listToolsByOwner } from "@/lib/database";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track your deployed micro-tools, paid subscribers, and usage analytics."
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionFromCookiesStore();

  if (!session) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="surface p-8">
          <p className="eyebrow">Dashboard Access</p>
          <h1 className="mt-2 text-3xl font-semibold">Set your account email in the builder first.</h1>
          <p className="mt-3 text-sm text-[var(--text-soft)]">
            microtool uses a signed session cookie. Open the builder, enter your email, and create a tool to
            initialize your workspace.
          </p>
          <Link
            href="/builder"
            className="mt-6 inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-[#04150f]"
          >
            Open Builder
          </Link>
        </div>
      </main>
    );
  }

  const tools = await listToolsByOwner(session.email);
  const paidUsersPerTool = await Promise.all(tools.map((tool) => getTotalPaidUsers(tool.id)));

  const totals = tools.reduce(
    (accumulator, tool, index) => {
      const paidUsers = paidUsersPerTool[index] ?? 0;
      return {
        views: accumulator.views + tool.analytics.views,
        runs: accumulator.runs + tool.analytics.runs,
        paidUsers: accumulator.paidUsers + paidUsers,
        mrr: accumulator.mrr + paidUsers * tool.monthlyPriceUsd
      };
    },
    {
      views: 0,
      runs: 0,
      paidUsers: 0,
      mrr: 0
    }
  );

  const chartData = tools.map((tool) => ({
    name: tool.name.length > 18 ? `${tool.name.slice(0, 16)}...` : tool.name,
    views: tool.analytics.views,
    runs: tool.analytics.runs
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <section className="mb-8">
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-2 text-4xl font-semibold">Performance overview for {session.email}</h1>
        <p className="mt-3 text-sm text-[var(--text-soft)]">
          Monitor traffic, tool usage, and active paid users across all deployed micro-tools.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">Deployed tools</p>
          <p className="mt-2 text-3xl font-semibold">{tools.filter((tool) => tool.status === "deployed").length}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">Total views</p>
          <p className="mt-2 text-3xl font-semibold">{totals.views}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">Tool runs</p>
          <p className="mt-2 text-3xl font-semibold">{totals.runs}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">Estimated MRR</p>
          <p className="mt-2 text-3xl font-semibold">${totals.mrr}</p>
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-xl font-semibold">Usage Analytics</h2>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Views vs tool executions for each project in your account.
        </p>
        <div className="mt-4">{chartData.length > 0 ? <AnalyticsChart data={chartData} /> : <p className="text-sm text-[var(--text-soft)]">No tools yet. Build your first tool to populate analytics.</p>}</div>
      </section>

      <section className="mt-6 space-y-4">
        {tools.length === 0 ? (
          <div className="surface p-6">
            <h3 className="text-xl font-semibold">No tools created yet</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Open the builder to create your first monetizable micro-tool.
            </p>
            <Link
              href="/builder"
              className="mt-4 inline-flex rounded-lg border border-[var(--line)] px-3 py-2 text-sm transition hover:border-[var(--brand)]"
            >
              Go to Builder
            </Link>
          </div>
        ) : (
          tools.map((tool, index) => {
            const paidUsers = paidUsersPerTool[index] ?? 0;
            return (
              <article key={tool.id} className="surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold">{tool.name}</h3>
                    <p className="mt-2 text-sm text-[var(--text-soft)]">{tool.description}</p>
                  </div>
                  <span className="rounded-full border border-[var(--line)] bg-[#0b1018] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">
                    {tool.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-3 text-sm">
                    <p className="text-[var(--text-soft)]">Views</p>
                    <p className="mt-1 text-xl font-semibold">{tool.analytics.views}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-3 text-sm">
                    <p className="text-[var(--text-soft)]">Runs</p>
                    <p className="mt-1 text-xl font-semibold">{tool.analytics.runs}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-3 text-sm">
                    <p className="text-[var(--text-soft)]">Paid users</p>
                    <p className="mt-1 text-xl font-semibold">{paidUsers}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-[#0b1018] p-3 text-sm">
                    <p className="text-[var(--text-soft)]">MRR</p>
                    <p className="mt-1 text-xl font-semibold">${paidUsers * tool.monthlyPriceUsd}</p>
                  </div>
                </div>

                <a
                  href={tool.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block rounded-md border border-[var(--line)] bg-[#0b1018] px-3 py-2 font-mono text-xs text-[var(--text-soft)]"
                >
                  {tool.deploymentUrl}
                </a>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
