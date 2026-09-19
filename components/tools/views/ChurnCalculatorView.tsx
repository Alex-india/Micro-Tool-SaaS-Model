"use client";
import React, { useState, useMemo, useId } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Button } from "@/components/ui/Button";
import {
  calculateChurn, fmtARR, CHURN_BENCHMARKS, CustomerSegment,
  ChurnCohort,
} from "@/tools/business/arrChurnEngine";
import { Plus, Trash2, ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, Users, BarChart3 } from "lucide-react";

const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  smb: "SMB (<$5K ACV)", midMarket: "Mid-Market ($5K–$50K)", enterprise: "Enterprise ($50K+)",
};

const GRADE_ICON = {
  Excellent: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
  Good:      <ShieldCheck className="w-4 h-4 text-blue-400" />,
  Average:   <ShieldAlert className="w-4 h-4 text-yellow-400" />,
  Poor:      <AlertTriangle className="w-4 h-4 text-orange-400" />,
  Critical:  <AlertTriangle className="w-4 h-4 text-red-400" />,
};
const GRADE_COLOR = {
  Excellent: "border-emerald-400/40 bg-emerald-400/5 text-emerald-400",
  Good:      "border-blue-400/40 bg-blue-400/5 text-blue-400",
  Average:   "border-yellow-400/40 bg-yellow-400/5 text-yellow-400",
  Poor:      "border-orange-400/40 bg-orange-400/5 text-orange-400",
  Critical:  "border-red-400/40 bg-red-400/5 text-red-400",
};

const SAMPLE_COHORTS: ChurnCohort[] = [
  { id: "c1", name: "Jan Cohort", period: "Jan 2025", startingCustomers: 120, churnedCustomers: 3,  startingMRR: 240000, churnedMRR: 6000,  expansionMRR: 18000 },
  { id: "c2", name: "Feb Cohort", period: "Feb 2025", startingCustomers: 135, churnedCustomers: 6,  startingMRR: 280000, churnedMRR: 15000, expansionMRR: 12000 },
  { id: "c3", name: "Mar Cohort", period: "Mar 2025", startingCustomers: 150, churnedCustomers: 12, startingMRR: 310000, churnedMRR: 28000, expansionMRR: 8000  },
];

let cSeq = 100;
const uid = () => `ch${++cSeq}`;

export const ChurnCalculatorView: React.FC<{ tool: ToolMeta }> = ({ tool }) => {
  const [cohorts, setCohorts] = useState<ChurnCohort[]>(SAMPLE_COHORTS.map(c => ({ ...c })));
  const [segment, setSegment] = useState<CustomerSegment>("smb");
  const [currency, setCurrency] = useState("USD");

  const results = useMemo(() => cohorts.map(c => calculateChurn(c, segment)), [cohorts, segment]);

  const avgNRR         = results.length ? results.reduce((s, r) => s + r.netRevenueRetention, 0) / results.length : 0;
  const avgGRR         = results.length ? results.reduce((s, r) => s + r.grossRevenueRetention, 0) / results.length : 0;
  const avgLogoChurn   = results.length ? results.reduce((s, r) => s + r.logoChurnRate, 0) / results.length : 0;
  const avgLTV         = results.length ? results.reduce((s, r) => s + r.ltv, 0) / results.length : 0;

  const fmt = (v: number) => fmtARR(v, currency);

  const update = (id: string, field: keyof ChurnCohort, val: string) =>
    setCohorts(prev => prev.map(c => c.id === id ? { ...c, [field]: typeof c[field] === "number" ? parseFloat(val) || 0 : val } : c));

  const addCohort = () => setCohorts(prev => [...prev, {
    id: uid(), name: "New Cohort", period: "Q1 2025", startingCustomers: 100, churnedCustomers: 5, startingMRR: 200000, churnedMRR: 10000, expansionMRR: 5000,
  }]);
  const removeCohort = (id: string) => setCohorts(prev => prev.filter(c => c.id !== id));
  const loadSample = () => setCohorts(SAMPLE_COHORTS.map(c => ({ ...c })));

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Summary Headline Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Avg Net Revenue Retention", val: `${avgNRR.toFixed(1)}%`, sub: avgNRR >= 100 ? "🟢 Negative net churn" : "🔴 Below 100%", color: avgNRR >= 100 ? "text-emerald-400" : "text-red-400", icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Avg Gross Revenue Retention", val: `${avgGRR.toFixed(1)}%`, sub: avgGRR >= 90 ? "Healthy" : "Needs improvement", color: avgGRR >= 90 ? "text-blue-400" : "text-orange-400", icon: <BarChart3 className="w-4 h-4" /> },
          { label: "Avg Logo Churn Rate", val: `${avgLogoChurn.toFixed(2)}%/mo`, sub: `~${(avgLogoChurn * 12).toFixed(1)}% annualized`, color: avgLogoChurn <= 2 ? "text-emerald-400" : avgLogoChurn <= 5 ? "text-yellow-400" : "text-red-400", icon: <Users className="w-4 h-4" /> },
          { label: "Avg Customer LTV", val: fmt(avgLTV), sub: "Based on ARPC × lifespan", color: "text-purple-400", icon: <ShieldCheck className="w-4 h-4" /> },
        ].map((m, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-card">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${m.color}`}>{m.icon}{m.label}</div>
            <div className={`text-xl font-bold ${m.color}`}>{m.val}</div>
            <div className="text-xs text-text-tertiary">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-surface border border-border rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary">Customer Segment:</span>
          <select value={segment} onChange={e => setSegment(e.target.value as CustomerSegment)}
            className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent">
            {(Object.keys(SEGMENT_LABELS) as CustomerSegment[]).map(s => (
              <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none">
          {["USD","INR","EUR","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={loadSample} className="ml-auto px-3 py-1.5 text-xs font-semibold bg-surface-raised border border-border rounded-lg text-text-secondary hover:text-accent hover:border-accent transition-all">
          Load Sample Cohorts
        </button>
      </div>

      {/* Cohort Cards */}
      <div className="flex flex-col gap-4">
        {results.map((r, idx) => {
          const cohort = cohorts.find(c => c.id === r.id)!;
          return (
            <div key={r.id} className={`bg-surface border rounded-xl p-5 shadow-card ${GRADE_COLOR[r.churnHealthGrade]} border`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {GRADE_ICON[r.churnHealthGrade]}
                  <input value={cohort.name} onChange={e => update(cohort.id, "name", e.target.value)}
                    className="bg-transparent text-sm font-bold text-text-primary outline-none border-b border-transparent focus:border-accent w-40" />
                  <input value={cohort.period} onChange={e => update(cohort.id, "period", e.target.value)}
                    className="bg-transparent text-xs text-text-tertiary outline-none w-24" />
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${GRADE_COLOR[r.churnHealthGrade]}`}>{r.churnHealthGrade}</span>
                  {idx > 0 && <button onClick={() => removeCohort(cohort.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {[
                  { label: "Starting Customers", field: "startingCustomers" as keyof ChurnCohort, sym: "" },
                  { label: "Churned Customers",  field: "churnedCustomers"  as keyof ChurnCohort, sym: "" },
                  { label: "Starting MRR",       field: "startingMRR"       as keyof ChurnCohort, sym: currency === "INR" ? "₹" : "$" },
                  { label: "Churned MRR",        field: "churnedMRR"        as keyof ChurnCohort, sym: currency === "INR" ? "₹" : "$" },
                  { label: "Expansion MRR",      field: "expansionMRR"      as keyof ChurnCohort, sym: currency === "INR" ? "₹" : "$" },
                ].map(({ label, field, sym }) => (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-xs text-text-tertiary">{label}</label>
                    <div className="relative">
                      {sym && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">{sym}</span>}
                      <input type="number" value={cohort[field] as number || ""}
                        onChange={e => update(cohort.id, field, e.target.value)}
                        className={`w-full ${sym ? "pl-5" : "pl-2.5"} pr-2 py-1.5 bg-surface-raised border border-border rounded text-xs text-text-primary outline-none focus:border-accent`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 border-t border-border/30 text-xs">
                {[
                  { l: "Logo Churn", v: `${r.logoChurnRate}%`, c: r.logoChurnRate <= 2 ? "text-emerald-400" : r.logoChurnRate <= 5 ? "text-yellow-400" : "text-red-400" },
                  { l: "Logo Retention", v: `${r.logoRetentionRate}%`, c: "text-text-secondary" },
                  { l: "NRR", v: `${r.netRevenueRetention}%`, c: r.netRevenueRetention >= 100 ? "text-emerald-400" : "text-orange-400" },
                  { l: "GRR", v: `${r.grossRevenueRetention}%`, c: r.grossRevenueRetention >= 90 ? "text-blue-400" : "text-orange-400" },
                  { l: "Rev Churn", v: `${r.revenueChurnRate}%`, c: r.revenueChurnRate <= 2 ? "text-emerald-400" : "text-red-400" },
                  { l: "Lifespan", v: `${r.impliedCustomerLifespanMonths}mo`, c: "text-purple-400" },
                  { l: "LTV", v: fmt(r.ltv), c: "text-accent" },
                ].map(({ l, v, c }) => (
                  <div key={l} className="flex flex-col gap-0.5 p-2 rounded bg-surface-raised border border-border/50">
                    <span className="text-text-tertiary">{l}</span>
                    <span className={`font-bold ${c}`}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Health Insight */}
              <div className="mt-3 p-3 rounded-lg bg-surface-raised border border-border/50 text-xs text-text-secondary">
                💡 {r.churnHealthInsight}
              </div>
            </div>
          );
        })}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={addCohort} leftIcon={<Plus className="w-4 h-4" />} className="self-start">
            Add Cohort
          </Button>
        </div>
      </div>

      {/* Segment Benchmarks */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Churn Benchmarks by Segment</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-tertiary border-b border-border">
                {["Segment", "Good Monthly Churn", "Avg Monthly Churn", "Your Avg", "Status"].map(h => (
                  <th key={h} className="text-left py-2 pr-6 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.entries(CHURN_BENCHMARKS) as [CustomerSegment, { good: number; avg: number }][]).map(([seg, b]) => {
                const isCurrent = seg === segment;
                return (
                  <tr key={seg} className={`border-b border-border/30 transition-colors ${isCurrent ? "bg-accent/5" : "hover:bg-surface-raised"}`}>
                    <td className="py-2 pr-6 font-semibold text-text-primary">{SEGMENT_LABELS[seg]}</td>
                    <td className="py-2 pr-6 text-emerald-400 font-mono">≤ {b.good}%</td>
                    <td className="py-2 pr-6 text-yellow-400 font-mono">≤ {b.avg}%</td>
                    <td className="py-2 pr-6 font-mono font-bold text-accent">{isCurrent ? `${avgLogoChurn.toFixed(2)}%` : "—"}</td>
                    <td className="py-2 pr-6">
                      {isCurrent ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${avgLogoChurn <= b.good ? "text-emerald-400 bg-emerald-400/10" : avgLogoChurn <= b.avg ? "text-yellow-400 bg-yellow-400/10" : "text-red-400 bg-red-400/10"}`}>
                          {avgLogoChurn <= b.good ? "Good" : avgLogoChurn <= b.avg ? "Average" : "Critical"}
                        </span>
                      ) : <span className="text-text-tertiary">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};