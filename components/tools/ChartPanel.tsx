"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export interface ChartPanelProps {
  title?: string;
  type: "area" | "bar" | "pie";
  data: any[];
  xKey?: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({
  title,
  type,
  data,
  xKey = "name",
  series,
}) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
      {title && (
        <h4 className="text-sm font-bold text-text-primary tracking-tight">
          {title}
        </h4>
      )}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#22222E" />
              <XAxis dataKey={xKey} stroke="#8888AA" fontSize={11} />
              <YAxis stroke="#8888AA" fontSize={11} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181F",
                  borderColor: "#33334A",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F0F0FF",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  fillOpacity={1}
                  fill={`url(#grad-${s.key})`}
                />
              ))}
            </AreaChart>
          ) : type === "bar" ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#22222E" />
              <XAxis dataKey={xKey} stroke="#8888AA" fontSize={11} />
              <YAxis stroke="#8888AA" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181F",
                  borderColor: "#33334A",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F0F0FF",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : (
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181F",
                  borderColor: "#33334A",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F0F0FF",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey={series[0]?.key || "value"}
                nameKey={xKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={series[index % series.length]?.color || "#6C63FF"} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
