"use client";
import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  calculateBlendedROAS, calculateROASGoal, fmtROAS,
  PLATFORM_BENCHMARKS, ROAS_PRESETS, AdCampaign, AdPlatform,
} from "@/tools/business/roasEngine";
import { Plus, Trash2, Target, TrendingUp, BarChart3, Zap, Award } from "lucide-react";

const PLATFORM_LABELS: Record<AdPlatform, string> = {
  google: "Google Ads", meta: "Meta (FB/IG)", tiktok: "TikTok", linkedin: "LinkedIn",
  twitter: "Twitter/X", amazon: "Amazon", snapchat: "Snapchat", other: "Other",
};
const GRADE_COLORS: Record<string, string> = {
  Exceptional: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Good: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Average: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Poor: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  Critical: "text-red-400 bg-red-400/10 border-red-400/30",
};

let idSeq = 10;
const uid = () => `c${++idSeq}`;

export const ROASCalculatorView: React.FC<{ tool: ToolMeta }> = ({ tool }) => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(
    ROAS_PRESETS.map(p => ({ ...p }))
  );
  const [targetROAS, setTargetROAS] = useState("4");
  const [avgOrderValue, setAvgOrderValue] = useState("150");
  const [currency, setCurrency] = useState("USD");
  const [tab, setTab] = useState<"campaigns" | "goal">("campaigns");

  const blended = useMemo(() => calculateBlendedROAS(campaigns), [campaigns]);
  const goalResult = useMemo(() => {
    const primary = campaigns[0];
    if (!primary) return null;
    return calculateROASGoal(
      parseFloat(targetROAS) || 4,
      primary.adSpend, primary.adRevenue,
      parseFloat(avgOrderValue) || 150
    );
  }, [campaigns, targetROAS, avgOrderValue]);

  const addCampaign = () => setCampaigns(prev => [...prev, {
    id: uid(), name: "New Campaign", platform: "google", adSpend: 0, adRevenue: 0, impressions: 0, clicks: 0, conversions: 0,
  }]);
  const removeCampaign = (id: string) => setCampaigns(prev => prev.filter(c => c.id !== id));
  const updateCampaign = (id: string, field: keyof AdCampaign, value: string | number) =>
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, [field]: typeof c[field] === "number" ? parseFloat(value as string) || 0 : value } : c));

  const loadPreset = () => setCampaigns(ROAS_PRESETS.map(p => ({ ...p })));

  const statusColor = (status: string) => ({
    achieved: "text-emerald-400", close: "text-blue-400", needs_work: "text-yellow-400", far_off: "text-red-400",
  }[status] ?? "text-text-secondary");

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Blended Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Blended ROAS", value: `${blended.blendedROAS}x`, sub: `${blended.blendedROASPercent}%`, icon: <TrendingUp className="w-4 h-4" />, color: "text-blue-400" },
          { label: "Total Ad Revenue", value: fmtROAS(blended.totalAdRevenue, currency), sub: `${blended.totalConversions} conversions`, icon: <BarChart3 className="w-4 h-4" />, color: "text-emerald-400" },
          { label: "Net Ad Profit", value: fmtROAS(blended.totalNetProfit, currency), sub: `ROI: ${blended.totalROI}%`, icon: <Award className="w-4 h-4" />, color: blended.totalNetProfit >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Blended CPA", value: fmtROAS(blended.blendedCPA, currency), sub: `CPC: ${fmtROAS(blended.blendedCPC, currency)}`, icon: <Zap className="w-4 h-4" />, color: "text-purple-400" },
        ].map((m, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-card">
            <div className={`flex items-center gap-1.5 ${m.color} text-xs font-semibold`}>{m.icon}{m.label}</div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-xs text-text-tertiary">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["campaigns", "goal"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t ? "bg-accent text-white" : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border"}`}>
            {t === "campaigns" ? "📊 Campaign Manager" : "🎯 ROAS Goal Tracker"}
          </button>
        ))}
        <button onClick={loadPreset} className="ml-auto px-3 py-1.5 text-xs font-semibold bg-surface-raised border border-border rounded-lg text-text-secondary hover:text-text-primary transition-all">
          Load Sample
        </button>
        <select value={currency} onChange={e => setCurrency(e.target.value)} className="px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-text-primary outline-none">
          {["USD","INR","EUR","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {tab === "campaigns" && (
        <div className="flex flex-col gap-4">
          {/* Campaign Rows */}
          {blended.campaigns.map((r, idx) => {
            const camp = campaigns.find(c => c.id === r.id)!;
            return (
              <div key={r.id} className="bg-surface border border-border rounded-xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${GRADE_COLORS[r.performanceGrade] ?? ""}`}>{r.performanceGrade}</span>
                    <input value={camp.name} onChange={e => updateCampaign(camp.id, "name", e.target.value)}
                      className="bg-transparent text-sm font-bold text-text-primary outline-none border-b border-transparent focus:border-accent w-48" />
                    <select value={camp.platform} onChange={e => updateCampaign(camp.id, "platform", e.target.value)}
                      className="bg-surface-raised border border-border rounded px-2 py-1 text-xs text-text-secondary outline-none">
                      {Object.entries(PLATFORM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-accent">{r.roas}x</span>
                    <span className="text-xs text-text-tertiary">{r.benchmarkComparison}</span>
                    {idx > 0 && <button onClick={() => removeCampaign(camp.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: "Ad Spend", field: "adSpend" as keyof AdCampaign },
                    { label: "Ad Revenue", field: "adRevenue" as keyof AdCampaign },
                    { label: "Impressions", field: "impressions" as keyof AdCampaign },
                    { label: "Clicks", field: "clicks" as keyof AdCampaign },
                    { label: "Conversions", field: "conversions" as keyof AdCampaign },
                  ].map(({ label, field }) => (
                    <div key={field} className="flex flex-col gap-1">
                      <label className="text-xs text-text-tertiary">{label}</label>
                      <input type="number" value={camp[field] as number || ""} onChange={e => updateCampaign(camp.id, field, e.target.value)}
                        className="bg-surface-raised border border-border rounded px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/50 text-xs">
                  {[
                    { l: "Net Profit", v: fmtROAS(r.netProfit, currency), c: r.netProfit >= 0 ? "text-emerald-400" : "text-red-400" },
                    { l: "CPM", v: fmtROAS(r.cpm, currency), c: "text-text-secondary" },
                    { l: "CPC", v: fmtROAS(r.cpc, currency), c: "text-text-secondary" },
                    { l: "Conv. Rate", v: `${r.conversionRate}%`, c: "text-text-secondary" },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="flex flex-col gap-0.5">
                      <span className="text-text-tertiary">{l}</span>
                      <span className={`font-semibold ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <Button variant="secondary" onClick={addCampaign} leftIcon={<Plus className="w-4 h-4" />} className="self-start">
            Add Campaign
          </Button>

          {/* Platform Breakdown */}
          {blended.platformBreakdown.length > 1 && (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Platform Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-text-tertiary border-b border-border">
                    {["Platform","Spend","Revenue","ROAS","Share of Spend","Share of Revenue"].map(h => (
                      <th key={h} className="text-left py-2 pr-4 font-semibold">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{blended.platformBreakdown.map(pb => (
                    <tr key={pb.platform} className="border-b border-border/30 hover:bg-surface-raised transition-colors">
                      <td className="py-2 pr-4 font-semibold text-text-primary">{PLATFORM_LABELS[pb.platform]}</td>
                      <td className="py-2 pr-4 text-text-secondary">{fmtROAS(pb.totalSpend, currency)}</td>
                      <td className="py-2 pr-4 text-emerald-400">{fmtROAS(pb.totalRevenue, currency)}</td>
                      <td className="py-2 pr-4 font-bold text-accent">{pb.roas}x</td>
                      <td className="py-2 pr-4 text-text-secondary">{pb.shareOfSpend}%</td>
                      <td className="py-2 pr-4 text-text-secondary">{pb.shareOfRevenue}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Industry Benchmarks */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Industry ROAS Benchmarks</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(PLATFORM_BENCHMARKS).map(([p, b]) => (
                <div key={p} className="p-3 rounded-lg bg-surface-raised border border-border flex flex-col gap-1">
                  <span className="text-xs font-semibold text-text-primary">{b.label}</span>
                  <span className="text-xs text-text-tertiary">Avg: <span className="font-bold text-yellow-400">{b.avgROAS}x</span></span>
                  <span className="text-xs text-text-tertiary">Good: <span className="font-bold text-emerald-400">{b.goodROAS}x</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "goal" && goalResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">ROAS Goal Parameters</h3>
            <Input label="Target ROAS (x)" type="number" value={targetROAS} onChange={e => setTargetROAS(e.target.value)} placeholder="4.0" helperText="Your desired ROAS multiplier" />
            <Input label="Average Order Value" type="number" value={avgOrderValue} onChange={e => setAvgOrderValue(e.target.value)} prefixSymbol={currency === "INR" ? "₹" : "$"} placeholder="150" />
            <div className="p-3 bg-surface-raised border border-border rounded-lg text-xs text-text-secondary">
              Based on: <strong className="text-text-primary">{campaigns[0]?.name ?? "First Campaign"}</strong> — Ad Spend: {fmtROAS(campaigns[0]?.adSpend ?? 0, currency)}, Revenue: {fmtROAS(campaigns[0]?.adRevenue ?? 0, currency)}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Goal Analysis</h3>
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${statusColor(goalResult.status)} bg-current/10`}>{goalResult.status.replace("_", " ")}</span>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeDasharray={`${Math.min(100, goalResult.achievementPercent)} 100`}
                    className={goalResult.achievementPercent >= 100 ? "text-emerald-400" : "text-accent"} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-text-primary">{goalResult.achievementPercent}%</span>
                  <span className="text-xs text-text-tertiary">of goal</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { l: "Current ROAS", v: `${goalResult.currentROAS}x`, c: "text-text-primary" },
                { l: "Target ROAS", v: `${goalResult.targetROAS}x`, c: "text-accent" },
                { l: "Required Revenue", v: fmtROAS(goalResult.requiredRevenue, currency), c: "text-text-secondary" },
                { l: "Revenue Gap", v: fmtROAS(goalResult.revenueGap, currency), c: goalResult.revenueGap > 0 ? "text-red-400" : "text-emerald-400" },
                { l: "Required Conversions", v: goalResult.requiredConversions.toLocaleString(), c: "text-text-secondary" },
                { l: "Conversions Gap", v: goalResult.conversionsGap.toLocaleString(), c: goalResult.conversionsGap > 0 ? "text-orange-400" : "text-emerald-400" },
              ].map(({ l, v, c }) => (
                <div key={l} className="p-2.5 bg-surface-raised border border-border rounded-lg">
                  <div className="text-text-tertiary mb-0.5">{l}</div>
                  <div className={`font-bold ${c}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};