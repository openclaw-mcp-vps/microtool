"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type DashboardChartPoint = {
  date: string;
  visits: number;
  runs: number;
};

export default function DashboardChart({ data }: { data: DashboardChartPoint[] }) {
  if (!data.length) {
    return (
      <div className="surface flex h-[280px] items-center justify-center rounded-2xl text-sm text-slate-400">
        No analytics data yet. Deploy your first tool to start collecting usage.
      </div>
    );
  }

  return (
    <div className="surface h-[280px] rounded-2xl p-3 sm:p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 12
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="visits" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="runs" stroke="#34d399" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
