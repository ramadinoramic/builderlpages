"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface StatsChartProps {
  daily: Record<string, Record<string, { clicks: number; conversions: number; payout: number }>>;
  variants: Array<{ id: string; name: string }>;
}

const COLORS = ["#00ca6b", "#4dabf7", "#c471f5", "#ff6b35", "#ffd700"];

export default function StatsChart({ daily, variants }: StatsChartProps) {
  const chartData = useMemo(() => {
    const days = Object.keys(daily).sort();
    return days.map((day) => {
      const entry: Record<string, string | number> = { date: day };
      for (const v of variants) {
        const d = daily[day]?.[v.id];
        entry[`${v.name}_clicks`] = d?.clicks || 0;
        entry[`${v.name}_cr`] = d && d.clicks > 0
          ? Math.round((d.conversions / d.clicks) * 10000) / 100
          : 0;
      }
      return entry;
    });
  }, [daily, variants]);

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 32, color: "#666688" }}>
        No data yet
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Clicks Chart */}
      <div style={{ background: "#242438", borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>Clicks / Day</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#666688" }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "#666688" }} />
            <Tooltip
              contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a40", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#8888aa" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {variants.map((v, i) => (
              <Line
                key={v.id}
                type="monotone"
                dataKey={`${v.name}_clicks`}
                name={v.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CR Chart */}
      <div style={{ background: "#242438", borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>CR% / Day</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#666688" }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "#666688" }} unit="%" />
            <Tooltip
              contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a40", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#8888aa" }}
              formatter={(value) => `${value}%`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {variants.map((v, i) => (
              <Line
                key={v.id}
                type="monotone"
                dataKey={`${v.name}_cr`}
                name={`${v.name} CR`}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                strokeDasharray={i > 0 ? "5 5" : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
