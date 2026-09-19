"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  calculateRevenue,
  buildRevenueWaterfall,
  calculateRevenueProjection,
  scoreRevenueHealth,
  calculateRevenueGoal,
  formatRevenueCurrency,
  REVENUE_CURRENCIES,
  REVENUE_PRESETS,
  SEASONALITY_PROFILES,
  PricingTier,
  RevenueModel,
} from "@/tools/business/revenueEngine";
import {
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle2,
  ArrowRight,
  Package,
  Activity,
} from "lucide-react";

export interface RevenueCalculatorViewProps {
  tool: ToolMeta;
}

const MODEL_LABELS: Record<RevenueModel, string> = {
  unit_sales: "Unit Sales",
  subscription: "Subscription (SaaS)",
  usage_based: "Usage-Based",
  marketplace: "Marketplace / GMV",
  project_based: "Project-Based",
};

const UNIT_LABELS: Record<RevenueModel, string> = {
  unit_sales: "Units Sold",
  subscription: "Subscribers",
  usage_based: "Usage Units",
  marketplace: "GMV Items",
  project_based: "Projects",
};

function newTier(): PricingTier {
  return { id: `tier-${Date.now()}`, name: "New Tier", unitPrice: 0, units: 0, discountPercent: 0 };
}

function MetricCard({ label, value, sub, colorClass, icon: Icon }: { label: string; value: string; sub?: string; colorClass: string; icon: React.ElementType }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs text-text-secondary font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold text-text-primary font-mono">{value}</div>
      {sub && <div className="text-xs text-text-secondary">{sub}</div>}
    </div>
  );
}

export const RevenueCalculatorView: React.FC<RevenueCalculatorViewProps> = ({ tool }) => {
  const [model, setModel] = useState<RevenueModel>("subscription");
  const [currency, setCurrency] = useState("USD");
  const [tiers, setTiers] = useState<PricingTier[]>([
    { id: "tier-1", name: "Starter Plan", unitPrice: 29, units: 200, discountPercent: 0 },
    { id: "tier-2", name: "Pro Plan", unitPrice: 79, units: 80, discountPercent: 5 },
  ]);
  const [refundRate, setRefundRate] = useState(2);
  const [returnRate, setReturnRate] = useState(0);
  const [commissionRate, setCommissionRate] = useState(5);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(7);
  const [seasonalityProfile, setSeasonalityProfile] = useState("flat");
  const [targetRevenue, setTargetRevenue] = useState(50000);
  const [activeTab, setActiveTab] = useState<"tiers" | "adjustments" | "projection" | "goal">("tiers");
  const [expandedWaterfall, setExpandedWaterfall] = useState(true);

  const seasonalityFactors = SEASONALITY_PROFILES[seasonalityProfile]?.factors ?? new Array(12).fill(1.0);

  const calc = useMemo(
    () => calculateRevenue({ model, currency, tiers, refundRate, returnRate, commissionRate, seasonalityFactors, monthlyGrowthRate, projectionMonths: 12 }),
    [model, currency, tiers, refundRate, returnRate, commissionRate, seasonalityFactors, monthlyGrowthRate]
  );

  const waterfall = useMemo(() => buildRevenueWaterfall(calc), [calc]);
  const projection = useMemo(() => calculateRevenueProjection(calc.adjustedRevenue, monthlyGrowthRate, seasonalityFactors, 12), [calc.adjustedRevenue, monthlyGrowthRate, seasonalityFactors]);
  const health = useMemo(() => scoreRevenueHealth(calc, monthlyGrowthRate), [calc, monthlyGrowthRate]);
  const goal = useMemo(() => calculateRevenueGoal(targetRevenue, calc.adjustedRevenue, monthlyGrowthRate), [targetRevenue, calc.adjustedRevenue, monthlyGrowthRate]);

  const fmt = (n: number) => formatRevenueCurrency(n, currency);

  const handleAddTier = () => setTiers((prev) => [...prev, newTier()]);
  const handleRemoveTier = (id: string) => { if (tiers.length <= 1) return; setTiers((prev) => prev.filter((t) => t.id !== id)); };
  const handleTierChange = (id: string, field: keyof PricingTier, value: any) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: field === "name" ? value : (Number(value) || 0) } : t)));
  };
  const handlePreset = (presetId: string) => {
    const preset = REVENUE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setModel(preset.model); setCurrency(preset.currency); setTiers(preset.tiers.map((t) => ({ ...t })));
    setRefundRate(preset.refundRate); setReturnRate(preset.returnRate); setCommissionRate(preset.commissionRate); setMonthlyGrowthRate(preset.monthlyGrowthRate);
  };

  const gradeColor = { "A+": "text-emerald-400", A: "text-green-400", B: "text-blue-400", C: "text-yellow-400", D: "text-orange-400", F: "text-red-400" }[health.grade] ?? "text-text-primary";
  const statusColors = { achieved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", on_track: "bg-blue-500/20 text-blue-400 border-blue-500/30", at_risk: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", off_track: "bg-red-500/20 text-red-400 border-red-500/30" };
  const maxProjectedRev = Math.max(...projection.months.map((m) => m.adjustedForSeasonality), 1);

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Presets Strip */}
      <div className="flex flex-wrap items-center gap-2 bg-surface border border-border p-3 rounded-xl">
        <span className="text-xs font-semibold text-text-secondary mr-1">Load Preset:</span>
        {REVENUE_PRESETS.map((p) => (
          <button key={p.id} onClick={() => handlePreset(p.id)} className="px-3 py-1.5 text-xs rounded-lg bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all">
            {p.name}
          </button>
        ))}
      </div>

      {/* Global Config Strip */}
      <div className="flex flex-wrap items-center gap-4 bg-surface border border-border p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary">Model:</label>
          <select value={model} onChange={(e) => setModel(e.target.value as RevenueModel)} className="bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary">
            {(Object.keys(MODEL_LABELS) as RevenueModel[]).map((m) => (<option key={m} value={m}>{MODEL_LABELS[m]}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary">Currency:</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary">
            {Object.entries(REVENUE_CURRENCIES).map(([code, cfg]) => (<option key={code} value={code}>{code} - {cfg.name}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary">Monthly Growth:</label>
          <input type="number" step="0.1" value={monthlyGrowthRate} onChange={(e) => setMonthlyGrowthRate(parseFloat(e.target.value) || 0)} className="w-20 bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
          <span className="text-xs text-text-secondary">%</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: Editor */}
        <div className="xl:col-span-5 flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 shadow-card">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-border pb-2 overflow-x-auto text-xs font-semibold">
            {[
              { id: "tiers", label: "Pricing Tiers", icon: Layers },
              { id: "adjustments", label: "Deductions", icon: TrendingDown },
              { id: "projection", label: "Projection", icon: BarChart3 },
              { id: "goal", label: "Revenue Goal", icon: Target },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB: Pricing Tiers */}
          {activeTab === "tiers" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{UNIT_LABELS[model]} &amp; Pricing</span>
                <button onClick={handleAddTier} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Tier
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {tiers.map((tier, idx) => (
                  <div key={tier.id} className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-secondary text-[11px]">#{idx + 1}</span>
                      <button onClick={() => handleRemoveTier(tier.id)} disabled={tiers.length <= 1} className="p-1 text-red-400 hover:text-red-500 rounded disabled:opacity-30">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted mb-0.5 block">Tier / Product Name</label>
                      <input type="text" value={tier.name} onChange={(e) => handleTierChange(tier.id, "name", e.target.value)} className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Starter Plan" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-text-muted mb-0.5 block">Price / Unit</label>
                        <input type="number" step="any" value={tier.unitPrice || ""} onChange={(e) => handleTierChange(tier.id, "unitPrice", e.target.value)} className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-mono text-right focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted mb-0.5 block">{UNIT_LABELS[model]}</label>
                        <input type="number" step="any" value={tier.units || ""} onChange={(e) => handleTierChange(tier.id, "units", e.target.value)} className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-mono text-right focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted mb-0.5 block">Discount %</label>
                        <input type="number" step="any" value={tier.discountPercent || ""} onChange={(e) => handleTierChange(tier.id, "discountPercent", e.target.value)} className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
                      </div>
                    </div>
                    {calc.tiers[idx] && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                        <span className="text-[10px] text-text-muted">Net Revenue</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">{fmt(calc.tiers[idx].netRevenue)} <span className="text-text-secondary font-normal">({calc.tiers[idx].percentage}%)</span></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Deductions */}
          {activeTab === "adjustments" && (
            <div className="flex flex-col gap-4 p-4 bg-surface-raised border border-border rounded-xl">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Revenue Deductions</span>
              {[
                { label: "Refund Rate", value: refundRate, set: setRefundRate, desc: "% of net revenue lost to refunds" },
                { label: "Return Rate", value: returnRate, set: setReturnRate, desc: "% of net revenue lost to product returns" },
                { label: "Commission / Fees", value: commissionRate, set: setCommissionRate, desc: "% paid to sales channels or platforms" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-text-secondary">{item.label}</label>
                    <span className="text-xs font-mono font-bold text-text-primary">{item.value}%</span>
                  </div>
                  <input type="range" min={0} max={50} step={0.5} value={item.value} onChange={(e) => item.set(parseFloat(e.target.value))} className="w-full accent-primary" />
                  <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                </div>
              ))}
              <div className="p-3 bg-surface border border-border/50 rounded-xl">
                <div className="text-xs text-text-secondary mb-2 font-semibold">Deductions Summary</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs"><span className="text-text-secondary">Net Revenue:</span><span className="font-mono font-bold text-text-primary">{fmt(calc.netRevenue)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-text-secondary">Refunds:</span><span className="font-mono text-red-400">- {fmt(calc.refundAmount)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-text-secondary">Returns:</span><span className="font-mono text-red-400">- {fmt(calc.returnAmount)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-text-secondary">Commission:</span><span className="font-mono text-red-400">- {fmt(calc.commissionAmount)}</span></div>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-border font-bold"><span className="text-emerald-400">Adjusted Revenue:</span><span className="font-mono text-emerald-400">{fmt(calc.adjustedRevenue)}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Projection */}
          {activeTab === "projection" && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-2">
                <label className="text-xs font-bold text-text-primary">Seasonality Profile</label>
                <select value={seasonalityProfile} onChange={(e) => setSeasonalityProfile(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  {Object.entries(SEASONALITY_PROFILES).map(([key, val]) => (<option key={key} value={key}>{val.name}</option>))}
                </select>
                <p className="text-[10px] text-text-muted">Applies monthly multipliers to simulate seasonal demand fluctuations.</p>
              </div>
              <div className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-text-primary">12-Month Projection</span>
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                  {projection.months.map((m) => {
                    const barWidth = maxProjectedRev > 0 ? (m.adjustedForSeasonality / maxProjectedRev) * 100 : 0;
                    return (
                      <div key={m.month} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-text-secondary text-[10px] font-mono">{m.monthLabel}</span>
                        <div className="flex-1 bg-surface rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                        </div>
                        <span className="w-20 text-right font-mono font-bold text-text-primary text-[10px]">{fmt(m.adjustedForSeasonality)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-text-secondary">Total 12M: </span><span className="font-mono font-bold text-emerald-400">{fmt(projection.totalProjected)}</span></div>
                  <div><span className="text-text-secondary">Avg/Mo: </span><span className="font-mono font-bold text-text-primary">{fmt(projection.averageMonthly)}</span></div>
                  <div><span className="text-text-secondary">Peak: </span><span className="font-mono text-text-primary">{projection.peakMonth.label}</span></div>
                  <div><span className="text-text-secondary">Trough: </span><span className="font-mono text-text-primary">{projection.troughMonth.label}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Goal */}
          {activeTab === "goal" && (
            <div className="flex flex-col gap-4 p-4 bg-surface-raised border border-border rounded-xl">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Monthly Revenue Goal</span>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Target Monthly Revenue</label>
                <input type="number" step="any" value={targetRevenue || ""} onChange={(e) => setTargetRevenue(parseFloat(e.target.value) || 0)} className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. 50000" />
              </div>
              <div className={`p-3 border rounded-xl ${statusColors[goal.status]}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">Goal Status</span>
                  <span className="text-xs font-bold uppercase tracking-wider">{goal.status.replace("_", " ")}</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2.5 mb-3">
                  <div className="h-full rounded-full bg-current transition-all" style={{ width: `${Math.min(100, goal.achievementPercent)}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="opacity-70">Current: </span><span className="font-mono font-bold">{fmt(goal.currentRevenue)}</span></div>
                  <div><span className="opacity-70">Target: </span><span className="font-mono font-bold">{fmt(goal.targetRevenue)}</span></div>
                  <div><span className="opacity-70">Achievement: </span><span className="font-mono font-bold">{goal.achievementPercent}%</span></div>
                  <div><span className="opacity-70">Gap: </span><span className="font-mono font-bold">{goal.gap <= 0 ? `+${fmt(Math.abs(goal.gap))} exceeded` : fmt(goal.gap)}</span></div>
                  {goal.monthsToTarget > 0 && goal.monthsToTarget < 999 && (
                    <div className="col-span-2"><span className="opacity-70">ETA at current growth: </span><span className="font-mono font-bold">{goal.monthsToTarget} months</span></div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Metrics & Analysis */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Gross Revenue" value={fmt(calc.grossRevenue)} sub={`${calc.totalUnits.toLocaleString()} ${UNIT_LABELS[model]}`} colorClass="bg-indigo-500" icon={DollarSign} />
            <MetricCard label="Net Revenue" value={fmt(calc.netRevenue)} sub={`Disc: ${fmt(calc.totalDiscounts)}`} colorClass="bg-primary" icon={BarChart3} />
            <MetricCard label="Adjusted Revenue" value={fmt(calc.adjustedRevenue)} sub={`${calc.netMarginAfterDeductions}% of gross`} colorClass="bg-emerald-500" icon={CheckCircle2} />
            <MetricCard label="Annual Run Rate" value={fmt(calc.annualAdjusted)} sub={`Net ARR: ${fmt(calc.annualRunRate)}`} colorClass="bg-violet-500" icon={Activity} />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <div className="text-[10px] text-text-secondary mb-1">Eff. Discount Rate</div>
              <div className="text-lg font-bold font-mono text-amber-400">{calc.effectiveDiscountRate}%</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <div className="text-[10px] text-text-secondary mb-1">Revenue / Unit</div>
              <div className="text-lg font-bold font-mono text-text-primary">{fmt(calc.revenuePerUnit)}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <div className="text-[10px] text-text-secondary mb-1">Net Margin</div>
              <div className="text-lg font-bold font-mono text-emerald-400">{calc.netMarginAfterDeductions}%</div>
            </div>
          </div>

          {/* Revenue Health Score */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-text-primary">Revenue Health Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${gradeColor}`}>{health.grade}</span>
                <span className="text-xs text-text-secondary">({health.label})</span>
              </div>
            </div>
            <div className="w-full bg-surface-raised rounded-full h-2.5 mb-3">
              <div className={`h-full rounded-full transition-all ${health.score >= 80 ? "bg-emerald-500" : health.score >= 65 ? "bg-blue-500" : health.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${health.score}%` }} />
            </div>
            <div className="flex flex-col gap-1.5">
              {health.insights.map((insight, i) => (<p key={i} className="text-xs text-text-secondary leading-relaxed">{insight}</p>))}
            </div>
          </div>

          {/* Revenue Waterfall */}
          <div className="bg-surface border border-border rounded-xl">
            <button onClick={() => setExpandedWaterfall((v) => !v)} className="w-full flex items-center justify-between p-4 text-sm font-bold text-text-primary">
              <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Revenue Waterfall</div>
              {expandedWaterfall ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
            </button>
            {expandedWaterfall && (
              <div className="px-4 pb-4 flex flex-col gap-2">
                {waterfall.map((step, i) => (
                  <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${step.type === "positive" ? "bg-emerald-500/10 border border-emerald-500/20" : step.type === "negative" ? "bg-red-500/10 border border-red-500/20" : "bg-blue-500/10 border border-blue-500/20"}`}>
                    <span className="text-text-secondary font-medium">{step.label}</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold ${step.type === "positive" ? "text-emerald-400" : step.type === "negative" ? "text-red-400" : "text-blue-400"}`}>
                        {step.value < 0 ? "-" : step.type !== "neutral" ? "+" : ""}{fmt(Math.abs(step.value))}
                      </span>
                      <ArrowRight className="w-3 h-3 text-text-secondary" />
                      <span className="font-mono text-text-primary font-bold w-24 text-right">{fmt(step.running)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tier Breakdown Table */}
          {calc.tiers.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-text-primary">Tier Revenue Breakdown</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-raised border-b border-border">
                      <th className="px-4 py-2.5 text-left text-text-secondary font-semibold">Tier</th>
                      <th className="px-3 py-2.5 text-right text-text-secondary font-semibold">Units</th>
                      <th className="px-3 py-2.5 text-right text-text-secondary font-semibold">Price</th>
                      <th className="px-3 py-2.5 text-right text-text-secondary font-semibold">Gross</th>
                      <th className="px-3 py-2.5 text-right text-text-secondary font-semibold">Disc</th>
                      <th className="px-3 py-2.5 text-right text-text-secondary font-semibold">Net</th>
                      <th className="px-3 py-2.5 text-right text-text-secondary font-semibold">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.tiers.map((tier) => (
                      <tr key={tier.id} className="border-b border-border/50 hover:bg-surface-raised transition-colors">
                        <td className="px-4 py-2.5 font-medium text-text-primary">{tier.name}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{tier.units.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{fmt(tier.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-text-primary">{fmt(tier.grossRevenue)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-red-400">{tier.discountAmount > 0 ? `-${fmt(tier.discountAmount)}` : "-"}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">{fmt(tier.netRevenue)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{tier.percentage}%</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-raised font-bold">
                      <td className="px-4 py-2.5 text-text-primary">TOTAL</td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-primary">{calc.totalUnits.toLocaleString()}</td>
                      <td className="px-3 py-2.5"></td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-primary">{fmt(calc.grossRevenue)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-red-400">-{fmt(calc.totalDiscounts)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-400">{fmt(calc.netRevenue)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-secondary">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools tool={tool} />
    </div>
  );
};