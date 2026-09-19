"use client";
import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Button } from "@/components/ui/Button";
import {
  calculateTeamSummary, fmtComm, DEFAULT_TIERS, COMMISSION_PRESETS,
  CommissionTier, SalesRep, TeamSummary,
} from "@/tools/business/commissionEngine";
import { Plus, Trash2, Trophy, TrendingUp, Users, DollarSign, Star } from "lucide-react";

const BADGE_COLOR: Record<string, string> = {
  "Presidents Club": "text-yellow-300 bg-yellow-300/10 border-yellow-300/30",
  "Overachiever":    "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "On Target":       "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Below Target":    "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "Off Track":       "text-red-400 bg-red-400/10 border-red-400/30",
};

let rSeq = 50;
const ruid = () => `r${++rSeq}`;

export const CommissionCalculatorView: React.FC<{ tool: ToolMeta }> = ({ tool }) => {
  const [preset, setPreset] = useState(0);
  const [tiers, setTiers] = useState<CommissionTier[]>(COMMISSION_PRESETS[0].tiers.map(t => ({ ...t })));
  const [reps, setReps] = useState<SalesRep[]>(COMMISSION_PRESETS[0].reps.map(r => ({ ...r })));
  const [currency, setCurrency] = useState("USD");
  const [targetRate, setTargetRate] = useState(8);
  const [activeTab, setActiveTab] = useState<"team" | "tiers">("team");

  const summary: TeamSummary = useMemo(() =>
    calculateTeamSummary(reps, tiers, targetRate),
    [reps, tiers, targetRate]
  );

  const fmt = (v: number) => fmtComm(v, currency);

  const loadPreset = (idx: number) => {
    setPreset(idx);
    setTiers(COMMISSION_PRESETS[idx].tiers.map(t => ({ ...t })));
    setReps(COMMISSION_PRESETS[idx].reps.map(r => ({ ...r })));
    setCurrency(COMMISSION_PRESETS[idx].reps[0]?.currency ?? "USD");
  };

  const updateRep = (id: string, field: keyof SalesRep, val: string) =>
    setReps(prev => prev.map(r => r.id === id ? { ...r, [field]: typeof r[field] === "number" ? parseFloat(val) || 0 : val } : r));

  const addRep = () => setReps(prev => [...prev, {
    id: ruid(), name: "New Rep", quota: 500000, actualSales: 0, baseSalary: 60000, currency,
  }]);
  const removeRep = (id: string) => setReps(prev => prev.filter(r => r.id !== id));

  const updateTier = (id: string, field: keyof CommissionTier, val: string) =>
    setTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: field === "label" ? val : (field === "maxQuotaPercent" && val === "Inf") ? Infinity : parseFloat(val) || 0 } : t));

  const attainmentBar = (pct: number) => {
    const w = Math.min(100, pct);
    const color = pct >= 120 ? "bg-yellow-400" : pct >= 100 ? "bg-emerald-400" : pct >= 80 ? "bg-blue-400" : "bg-red-400";
    return (
      <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${w}%` }} />
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Team Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Team Commission", val: fmt(summary.totalCommission), sub: `${summary.repsAboveQuota}/${summary.reps.length} above quota`, icon: <Trophy className="w-4 h-4" />, color: "text-yellow-400" },
          { label: "Total Team Comp",       val: fmt(summary.totalComp),       sub: `Base: ${fmt(summary.totalBaseSalary)}`, icon: <DollarSign className="w-4 h-4" />, color: "text-emerald-400" },
          { label: "Avg Quota Attainment",  val: `${summary.avgAttainment}%`,  sub: summary.avgAttainment >= 100 ? "✅ All on track" : `${summary.repsBelowQuota} reps below`, icon: <TrendingUp className="w-4 h-4" />, color: summary.avgAttainment >= 100 ? "text-emerald-400" : "text-orange-400" },
          { label: "Commission:Sales Ratio",val: `${summary.commissionToSalesRatio}%`, sub: `Avg OTE: ${fmt(summary.avgOTE)}`, icon: <Star className="w-4 h-4" />, color: "text-accent" },
        ].map((m, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-card">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${m.color}`}>{m.icon}{m.label}</div>
            <div className={`text-xl font-bold ${m.color}`}>{m.val}</div>
            <div className="text-xs text-text-tertiary">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(["team", "tiers"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === t ? "bg-accent text-white" : "bg-surface-raised text-text-secondary border border-border hover:text-text-primary"}`}>
              {t === "team" ? "👥 Team Leaderboard" : "🏷️ Commission Tiers"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {COMMISSION_PRESETS.map((p, idx) => (
            <button key={idx} onClick={() => loadPreset(idx)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${preset === idx ? "border-accent text-accent bg-accent/5" : "border-border text-text-secondary hover:text-text-primary bg-surface-raised"}`}>
              {p.name}
            </button>
          ))}
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-text-primary outline-none">
            {["USD","INR","EUR","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {activeTab === "team" && (
        <div className="flex flex-col gap-4">
          {/* Leaderboard */}
          {[...summary.reps]
            .sort((a, b) => b.attainmentPercent - a.attainmentPercent)
            .map((r, rank) => (
            <div key={r.repId} className="bg-surface border border-border rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rank === 0 ? "bg-yellow-400/20 text-yellow-400" : rank === 1 ? "bg-slate-400/20 text-slate-400" : "bg-border text-text-tertiary"}`}>
                    #{rank + 1}
                  </div>
                  <div>
                    <input value={reps.find(x => x.id === r.repId)?.name ?? r.repName}
                      onChange={e => updateRep(r.repId, "name", e.target.value)}
                      className="bg-transparent text-sm font-bold text-text-primary outline-none border-b border-transparent focus:border-accent" />
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${BADGE_COLOR[r.performanceBadge] ?? ""}`}>{r.performanceBadge}</span>
                  {r.acceleratorApplied && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">⚡ Accelerator Active</span>}
                </div>
                <button onClick={() => removeRep(r.repId)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>

              {/* Rep Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {[
                  { label: "Annual Quota", field: "quota" as keyof SalesRep },
                  { label: "Actual Sales", field: "actualSales" as keyof SalesRep },
                  { label: "Base Salary", field: "baseSalary" as keyof SalesRep },
                ].map(({ label, field }) => (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-xs text-text-tertiary">{label}</label>
                    <input type="number" value={reps.find(x => x.id === r.repId)?.[field] as number || ""}
                      onChange={e => updateRep(r.repId, field, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-surface-raised border border-border rounded text-xs text-text-primary outline-none focus:border-accent" />
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-tertiary">Attainment</label>
                  <div className="px-2.5 py-1.5 bg-surface-raised border border-border rounded text-xs font-bold text-accent">{r.attainmentPercent}%</div>
                </div>
              </div>

              {attainmentBar(r.attainmentPercent)}

              {/* Commission Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/30 text-xs">
                {[
                  { l: "Total Commission", v: fmt(r.totalCommission), c: "text-emerald-400" },
                  { l: "Total Comp",       v: fmt(r.totalComp),       c: "text-accent" },
                  { l: "OTE",             v: fmt(r.ote),              c: "text-blue-400" },
                  { l: "Bonus vs OTE",    v: fmt(r.bonusEarned),      c: r.bonusEarned > 0 ? "text-yellow-400" : "text-text-tertiary" },
                ].map(({ l, v, c }) => (
                  <div key={l} className="p-2 rounded bg-surface-raised border border-border/50">
                    <div className="text-text-tertiary">{l}</div>
                    <div className={`font-bold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Tier Breakdown */}
              {r.tierBreakdown.filter(t => t.salesInTier > 0).length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-xs text-text-tertiary mb-2 font-semibold uppercase tracking-wide">Tier Breakdown</p>
                  <div className="flex flex-wrap gap-2">
                    {r.tierBreakdown.filter(t => t.salesInTier > 0).map(t => (
                      <div key={t.tierLabel} className="px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs">
                        <span className="text-text-secondary">{t.tierLabel}</span>
                        <span className="mx-2 text-text-tertiary">@</span>
                        <span className="text-accent font-bold">{t.ratePercent}%{t.accelerator > 1 ? `×${t.accelerator}` : ""}</span>
                        <span className="mx-2 text-text-tertiary">→</span>
                        <span className="text-emerald-400 font-bold">{fmt(t.commission)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={addRep} leftIcon={<Plus className="w-4 h-4" />} className="self-start">
              Add Rep
            </Button>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <label>Target Commission Rate (%):</label>
              <input type="number" value={targetRate} onChange={e => setTargetRate(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-surface-raised border border-border rounded text-text-primary outline-none focus:border-accent" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "tiers" && (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">Commission Tier Configuration</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-tertiary border-b border-border">
                  {["Tier Label", "From (% Quota)", "To (% Quota)", "Rate (%)", "Accelerator", "Effective Rate"].map(h => (
                    <th key={h} className="text-left py-2 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiers.map(t => (
                  <tr key={t.id} className="border-b border-border/30">
                    <td className="py-2 pr-4">
                      <input value={t.label} onChange={e => updateTier(t.id, "label", e.target.value)}
                        className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none focus:border-accent w-40" />
                    </td>
                    <td className="py-2 pr-4">
                      <input type="number" value={t.minQuotaPercent} onChange={e => updateTier(t.id, "minQuotaPercent", e.target.value)}
                        className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none focus:border-accent w-20" />
                    </td>
                    <td className="py-2 pr-4">
                      <input type="text" value={t.maxQuotaPercent === Infinity ? "∞" : t.maxQuotaPercent}
                        onChange={e => updateTier(t.id, "maxQuotaPercent", e.target.value === "∞" ? "Inf" : e.target.value)}
                        className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none focus:border-accent w-20" />
                    </td>
                    <td className="py-2 pr-4">
                      <input type="number" value={t.ratePercent} onChange={e => updateTier(t.id, "ratePercent", e.target.value)}
                        className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none focus:border-accent w-20" />
                    </td>
                    <td className="py-2 pr-4">
                      <input type="number" step="0.05" value={t.accelerator} onChange={e => updateTier(t.id, "accelerator", e.target.value)}
                        className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none focus:border-accent w-20" />
                    </td>
                    <td className="py-2 pr-4 font-bold text-emerald-400">
                      {(t.ratePercent * t.accelerator).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-tertiary">💡 Set "To" to ∞ for the top tier. Effective Rate = Rate × Accelerator.</p>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};