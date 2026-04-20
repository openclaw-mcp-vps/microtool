"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AnalyticsDataPoint = {
  name: string;
  views: number;
  runs: number;
};

type AnalyticsChartProps = {
  data: AnalyticsDataPoint[];
};

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2cb67d" stopOpacity={0.55} />
              <stop offset="95%" stopColor="#2cb67d" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="runsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ea1ff" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#4ea1ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a3448" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#8ea1b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#8ea1b8" tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "#0f1623",
              border: "1px solid #2a3448",
              borderRadius: "10px",
              color: "#dce7f3"
            }}
          />
          <Area type="monotone" dataKey="views" stroke="#2cb67d" fill="url(#viewsGradient)" />
          <Area type="monotone" dataKey="runs" stroke="#4ea1ff" fill="url(#runsGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
