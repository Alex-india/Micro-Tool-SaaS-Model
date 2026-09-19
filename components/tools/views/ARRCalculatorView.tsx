"use client";
import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Input } from "@/components/ui/Input";
import {
  calculateARR, fmtARR, ARR_PRESETS, ARRInput, ARRResult,
} from "@/tools/business/arrChurnEngine";
import { TrendingUp, BarChart3, Zap, DollarSign, RefreshCw, TrendingDown } from "lucide-react";

const CURRENCIES = ["USD", "INR", "EUR", "GBP"] as const;
type Currency = typeof CURRENCIES[number];

const FIELD_LABELS: { field: keyof ARRInput; label: string; hint: string; positive: boolean }[] = [
  { field: "mrrBase",        label: "Starting MRR",      hint: "MRR at start of period",          positive: true  },
  { field: "newMRR",         label: "New Business MRR",  hint: "MRR from newly closed deals",     positive: true  },
  { field: "expansionMRR",   label: "Expansion MRR",     hint: "Upsell / seat expansion revenue", positive: true  },
  { field: "reactivationMRR",label: "Reactivation MRR",  hint: "Churned customers who returned",  positive: true  },
  { field: "contractionMRR", label: "Contraction MRR",   hint: "Downgrade or seat reduction",     positive: false },
  { field: "churnedMRR",     label: "Churned MRR",       hint: "Lost MRR from cancellations",     positive: false },
];

const QR_COLOR = (qr: number) =>
  qr >= 4 ? "text-emerald-400" : qr >= 2 ? "text-blue-400" : qr >= 1 ? "text-yellow-400" : "text-red-400";

export const ARRCalculatorView: React.FC<{ tool: ToolMeta }> = ({ tool }) => {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [input, setInput] = useState<ARRInput>({ ...ARR_PRESETS[0].input });

  const result: ARRResult = useMemo(() => calculateARR(input), [input]);

  const set = (field: keyof ARRInput, val: string) =>
    setInput(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));

  const loadPreset = (idx: number) => setInput({ ...ARR_PRESETS[idx].input });

  const fmt = (v: number) => fmtARR(v, currency);
  const qrPercent = Math.min(100, (result.quickRatio / 5) * 100);

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Top metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Annual Recurring Revenue", val: fmt(result.arr),  sub: `MRR: ${fmt(result.mrr)}`, icon: <TrendingUp className="w-4 h-4" />, color: "text-accent" },
          { label: "Net New MRR",              val: fmt(result.netNewMRR), sub: result.netNewMRR >= 0 ? "Growing" : "Shrinking", icon: <BarChart3 className="w-4 h-4" />, color: result.netNewMRR >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Daily Run Rate",           val: fmt(result.dailyRunRate), sub: `Weekly: ${fmt(result.weeklyRunRate)}`, icon: <Zap className="w-4 h-4" />, color: "text-purple-400" },
          { label: "Quarterly Revenue",        val: fmt(result.quarterlyRunRate), sub: "Based on current MRR", icon: <DollarSign className="w-4 h-4" />, color: "text-blue-400" },
        ].map((m, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-card">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${m.color}`}>{m.icon}{m.label}</div>
            <div className={`text-xl font-bold ${m.color}`}>{m.val}</div>
            <div className="text-xs text-text-tertiary">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">MRR Inputs</h3>
            <div className="flex items-center gap-2">
              <select value={currency} onChange={e => setCurrency(e.target.value as Currency)}
                className="text-xs bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {ARR_PRESETS.map((p, idx) => (
              <button key={idx} onClick={() => loadPreset(idx)}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface-raised border border-border text-text-secondary hover:text-accent hover:border-accent transition-all">
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {FIELD_LABELS.map(({ field, label, hint, positive }) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary font-medium flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${positive ? "bg-emerald-400" : "bg-red-400"}`} />
                  {label}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary font-mono">
                    {currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"}
                  </span>
                  <input
                    type="number"
                    value={input[field] || ""}
                    onChange={e => set(field, e.target.value)}
                    placeholder="0"
                    title={hint}
                    className="w-full pl-7 pr-3 py-2 bg-surface-raised border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent transition-colors"
                  />
                </div>
                <p className="text-xs text-text-tertiary">{hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Quick Ratio Gauge */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">SaaS Quick Ratio</h3>
              <span className={`text-2xl font-bold ${QR_COLOR(result.quickRatio)}`}>{result.quickRatio}x</span>
            </div>
            <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${result.quickRatio >= 4 ? "bg-emerald-400" : result.quickRatio >= 2 ? "bg-blue-400" : result.quickRatio >= 1 ? "bg-yellow-400" : "bg-red-400"}`}
                style={{ width: `${qrPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-tertiary mb-3">
              <span>0x (Critical)</span><span>2x (Healthy)</span><span>4x+ (Exceptional)</span>
            </div>
            <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs">
              <span className={`font-bold ${QR_COLOR(result.quickRatio)}`}>{result.growthEfficiency}</span>
              <span className="text-text-secondary ml-2">— Positive MRR: {fmt(input.newMRR + input.expansionMRR + input.reactivationMRR)} vs Negative: {fmt(input.contractionMRR + input.churnedMRR)}</span>
            </div>
          </div>

          {/* MRR Waterfall */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">MRR Waterfall</h3>
            <div className="flex flex-col gap-2">
              {/* Starting */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border/50">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-text-secondary" />
                  Starting MRR
                </div>
                <span className="text-xs font-mono font-semibold text-text-primary">{fmt(input.mrrBase)}</span>
              </div>
              {/* Positive drivers */}
              {result.mrrGrowthDrivers.filter(d => d.type === "positive").map(d => (
                <div key={d.label} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {d.label}
                    <span className="text-text-tertiary">({d.percentOfMRR}% of MRR)</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400">+{fmt(d.value)}</span>
                </div>
              ))}
              {/* Negative drivers */}
              {result.mrrGrowthDrivers.filter(d => d.type === "negative").map(d => (
                <div key={d.label} className="flex items-center justify-between p-2.5 rounded-lg bg-red-400/5 border border-red-400/20">
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    {d.label}
                    <span className="text-text-tertiary">({d.percentOfMRR}% of MRR)</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-red-400">{fmt(d.value)}</span>
                </div>
              ))}
              {/* Ending */}
              <div className="flex items-center justify-between p-3 rounded-lg border-2 border-accent/40 bg-accent/5">
                <div className="flex items-center gap-2 text-xs font-bold text-accent">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Ending MRR → ARR
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-accent">{fmt(result.mrr)} / mo</div>
                  <div className="text-xs font-mono font-bold text-accent">{fmt(result.arr)} / yr</div>
                </div>
              </div>
            </div>
          </div>

          {/* Run Rates Table */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Revenue Run Rates</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-tertiary border-b border-border">
                    {["Period", "Run Rate", "% of ARR"].map(h => (
                      <th key={h} className="text-left py-2 pr-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { period: "Daily",     val: result.dailyRunRate,     pct: result.arr > 0 ? ((result.dailyRunRate * 365) / result.arr * 100).toFixed(0) : "—" },
                    { period: "Weekly",    val: result.weeklyRunRate,     pct: result.arr > 0 ? ((result.weeklyRunRate * 52)  / result.arr * 100).toFixed(0) : "—" },
                    { period: "Monthly",   val: result.mrr,              pct: result.arr > 0 ? ((result.mrr * 12)           / result.arr * 100).toFixed(0) : "—" },
                    { period: "Quarterly", val: result.quarterlyRunRate,  pct: result.arr > 0 ? ((result.quarterlyRunRate * 4) / result.arr * 100).toFixed(0) : "—" },
                    { period: "Annual (ARR)", val: result.arr,           pct: "100" },
                  ].map(row => (
                    <tr key={row.period} className="border-b border-border/30 hover:bg-surface-raised transition-colors">
                      <td className="py-2 pr-4 text-text-primary font-medium">{row.period}</td>
                      <td className="py-2 pr-4 font-mono font-bold text-accent">{fmt(row.val)}</td>
                      <td className="py-2 pr-4 text-text-tertiary">{row.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};