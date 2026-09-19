"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  CurrencyCode,
  CURRENCIES,
  MrrWaterfallInputs,
  calculateMrrWaterfall,
  RetentionInputs,
  calculateRetentionMetrics,
  SubscriptionTier,
  calculateTierBreakdown,
  calculate12MonthProjections,
  formatMrrCurrency,
  MRR_PRESETS,
  MrrPreset,
} from "@/tools/business/mrrEngine";
import {
  Repeat,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Users,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Zap,
} from "lucide-react";

export interface MRRCalculatorViewProps {
  tool: ToolMeta;
}

export const MRRCalculatorView: React.FC<MRRCalculatorViewProps> = ({ tool }) => {
  // Mode selection: "waterfall" | "retention" | "tiers" | "projections"
  const [activeTab, setActiveTab] = useState<"waterfall" | "retention" | "tiers" | "projections">("waterfall");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Waterfall Inputs
  const [waterfallInputs, setWaterfallInputs] = useState<MrrWaterfallInputs>({
    startingMrr: 15000,
    newMrr: 3200,
    expansionMrr: 1400,
    reactivationMrr: 300,
    contractionMrr: 400,
    churnedMrr: 900,
  });

  // 2. Retention Inputs
  const [retentionInputs, setRetentionInputs] = useState<RetentionInputs>({
    startingMrr: 15000,
    expansionMrr: 1400,
    contractionMrr: 400,
    churnedMrr: 900,
    startingCustomers: 120,
    churnedCustomers: 4,
  });

  // 3. Subscription Tiers
  const [tiers, setTiers] = useState<SubscriptionTier[]>([
    { id: "starter", name: "Starter", monthlyPrice: 49, annualPrice: 490, monthlySubscribers: 60, annualSubscribers: 25 },
    { id: "pro", name: "Professional", monthlyPrice: 149, annualPrice: 1490, monthlySubscribers: 30, annualSubscribers: 15 },
    { id: "agency", name: "Agency / Team", monthlyPrice: 399, annualPrice: 3990, monthlySubscribers: 8, annualSubscribers: 5 },
  ]);

  // 4. Projection Settings
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState<number>(7.5);

  // Synchronize starting/expansion/churn values from waterfall to retention
  const updateWaterfall = (field: keyof MrrWaterfallInputs, val: number) => {
    const updated = { ...waterfallInputs, [field]: val };
    setWaterfallInputs(updated);
    if (field === "startingMrr" || field === "expansionMrr" || field === "contractionMrr" || field === "churnedMrr") {
      setRetentionInputs((prev) => ({ ...prev, [field]: val }));
    }
  };

  // Calculations
  const waterfallResult = useMemo(() => calculateMrrWaterfall(waterfallInputs), [waterfallInputs]);
  const retentionResult = useMemo(() => calculateRetentionMetrics(retentionInputs), [retentionInputs]);
  const tierResult = useMemo(() => calculateTierBreakdown(tiers), [tiers]);
  const projectionResult = useMemo(
    () => calculate12MonthProjections(waterfallResult.endingMrr, monthlyGrowthRate, retentionInputs.startingCustomers),
    [waterfallResult.endingMrr, monthlyGrowthRate, retentionInputs.startingCustomers]
  );

  // Tier Management
  const updateTier = (index: number, field: keyof SubscriptionTier, value: string | number) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: typeof value === "string" ? value : Math.max(0, value) };
    setTiers(newTiers);
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        id: `tier-${Date.now()}`,
        name: `Custom Tier ${tiers.length + 1}`,
        monthlyPrice: 99,
        annualPrice: 990,
        monthlySubscribers: 10,
        annualSubscribers: 5,
      },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  // Preset Loader
  const loadPreset = (preset: MrrPreset) => {
    setWaterfallInputs(preset.waterfall);
    setRetentionInputs({
      startingMrr: preset.waterfall.startingMrr,
      expansionMrr: preset.waterfall.expansionMrr,
      contractionMrr: preset.waterfall.contractionMrr,
      churnedMrr: preset.waterfall.churnedMrr,
      startingCustomers: preset.startingCustomers,
      churnedCustomers: preset.churnedCustomers,
    });
    setTiers(preset.tiers);
    setMonthlyGrowthRate(preset.monthlyGrowthRate);
  };

  // Reset to default
  const handleReset = () => {
    loadPreset(MRR_PRESETS[0]);
  };

  // Copy Summary
  const handleCopySummary = () => {
    const summary = `=== ToolVerse SaaS MRR & ARR Analysis ===
Starting MRR: ${formatMrrCurrency(waterfallResult.startingMrr, currency)}
Ending MRR: ${formatMrrCurrency(waterfallResult.endingMrr, currency)}
Annual Run-Rate (ARR): ${formatMrrCurrency(waterfallResult.arr, currency)}
Net New MRR: ${formatMrrCurrency(waterfallResult.netNewMrr, currency)} (${waterfallResult.netGrowthRate > 0 ? "+" : ""}${waterfallResult.netGrowthRate}% MoM)
Gross Additions: +${formatMrrCurrency(waterfallResult.grossAdditions, currency)}
Gross Losses: -${formatMrrCurrency(waterfallResult.grossLosses, currency)}
SaaS Quick Ratio: ${waterfallResult.quickRatio}x (${waterfallResult.quickRatioLabel})

--- Retention & Unit Economics ---
Net Revenue Retention (NRR): ${retentionResult.nrr}% (${retentionResult.nrrStatus.toUpperCase()})
Gross Revenue Retention (GRR): ${retentionResult.grr}%
Logo Churn Rate: ${retentionResult.logoChurnRate}%
Net Revenue Churn Rate: ${retentionResult.netRevenueChurnRate}%

--- SaaS Enterprise Valuation Multiples ---
Conservative (4x ARR): ${formatMrrCurrency(retentionResult.valuation.conservative, currency)}
Median Multiple (7x ARR): ${formatMrrCurrency(retentionResult.valuation.median, currency)}
High-Growth Decile (12x ARR): ${formatMrrCurrency(retentionResult.valuation.premium, currency)}

--- Subscription Tier Breakdown ---
Total Active Subscribers: ${tierResult.totalSubscribers.toLocaleString()}
Blended ARPU: ${formatMrrCurrency(tierResult.blendedArpu, currency)}/mo
${tierResult.tiers.map((t) => `• ${t.name}: ${t.totalSubscribers} subs | ${formatMrrCurrency(t.mrrContribution, currency)} MRR (${t.mrrPercentage}%)`).join("\n")}

Generated on ToolVerse: ${window.location.href}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    let csv = "Category,Metric,Value\n";
    csv += `MRR Waterfall,Starting MRR,${waterfallResult.startingMrr}\n`;
    csv += `MRR Waterfall,New MRR,${waterfallResult.newMrr}\n`;
    csv += `MRR Waterfall,Expansion MRR,${waterfallResult.expansionMrr}\n`;
    csv += `MRR Waterfall,Reactivation MRR,${waterfallResult.reactivationMrr}\n`;
    csv += `MRR Waterfall,Contraction MRR,${waterfallResult.contractionMrr}\n`;
    csv += `MRR Waterfall,Churned MRR,${waterfallResult.churnedMrr}\n`;
    csv += `MRR Waterfall,Net New MRR,${waterfallResult.netNewMrr}\n`;
    csv += `MRR Waterfall,Ending MRR,${waterfallResult.endingMrr}\n`;
    csv += `MRR Waterfall,ARR Run-Rate,${waterfallResult.arr}\n`;
    csv += `MRR Waterfall,SaaS Quick Ratio,${waterfallResult.quickRatio}\n`;
    csv += `Retention,NRR (%),${retentionResult.nrr}\n`;
    csv += `Retention,GRR (%),${retentionResult.grr}\n`;
    csv += `Retention,Logo Churn (%),${retentionResult.logoChurnRate}\n`;
    csv += `Valuation,Conservative 4x ARR,${retentionResult.valuation.conservative}\n`;
    csv += `Valuation,Median 7x ARR,${retentionResult.valuation.median}\n`;
    csv += `Valuation,Premium 12x ARR,${retentionResult.valuation.premium}\n\n`;

    csv += "Tier Name,Monthly Price,Annual Price,Monthly Subs,Annual Subs,Total Subs,MRR Contribution,ARR Contribution,Share (%)\n";
    tierResult.tiers.forEach((t) => {
      csv += `"${t.name}",${t.monthlyPrice},${t.annualPrice},${t.monthlySubscribers},${t.annualSubscribers},${t.totalSubscribers},${t.mrrContribution},${t.arrContribution},${t.mrrPercentage}%\n`;
    });

    csv += "\nProjection Month,MRR,ARR,Net New MRR,Subscribers,Milestones\n";
    projectionResult.months.forEach((m) => {
      csv += `"${m.monthName}",${m.mrr},${m.arr},${m.netNewMrr},${m.subscribers},"${m.milestones.join("; ")}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mrr_analysis_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <ToolHeader tool={tool} />

      {/* Top Toolbar: Presets, Currency, Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {MRR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700/60"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Currency Dropdown */}
          <div className="flex items-center gap-1.5 bg-neutral-800/90 border border-neutral-700/80 rounded-xl px-2.5 py-1 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-neutral-200 outline-none cursor-pointer"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code} className="bg-neutral-900 text-neutral-200">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-neutral-700"
            title="Reset to Default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Copy Summary */}
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors border border-neutral-700/80"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
            {copied ? "Copied" : "Copy Summary"}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 transition-colors border border-teal-500/30"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 gap-2 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("waterfall")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "waterfall"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          }`}
        >
          <Repeat className="w-4 h-4" />
          MRR Waterfall & Dynamics
        </button>

        <button
          onClick={() => setActiveTab("retention")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "retention"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          }`}
        >
          <Percent className="w-4 h-4" />
          Retention & Unit Economics
        </button>

        <button
          onClick={() => setActiveTab("tiers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "tiers"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          }`}
        >
          <Layers className="w-4 h-4" />
          Subscription Plans & Tiers
        </button>

        <button
          onClick={() => setActiveTab("projections")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "projections"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          }`}
        >
          <Calendar className="w-4 h-4" />
          12-Month Projections
        </button>
      </div>

      {/* TAB 1: MRR WATERFALL & DYNAMICS */}
      {activeTab === "waterfall" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
              <h3 className="text-base font-semibold text-neutral-100 mb-1 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-teal-400" />
                MRR Movement Inputs
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Track revenue inflow and outflow across standard SaaS movement categories over the month.
              </p>

              <div className="space-y-4">
                {/* Starting MRR */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Starting MRR (Beginning of Month)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                      {CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={waterfallInputs.startingMrr}
                      onChange={(e) => updateWaterfall("startingMrr", parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* New MRR */}
                  <div>
                    <label className="block text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" /> New MRR
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                        {CURRENCIES[currency].symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={waterfallInputs.newMrr}
                        onChange={(e) => updateWaterfall("newMrr", parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-950/80 border border-emerald-900/40 rounded-xl pl-7 pr-2 py-2 text-sm text-neutral-100 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Expansion MRR */}
                  <div>
                    <label className="block text-xs font-medium text-teal-400 mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Expansion
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                        {CURRENCIES[currency].symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={waterfallInputs.expansionMrr}
                        onChange={(e) => updateWaterfall("expansionMrr", parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-950/80 border border-teal-900/40 rounded-xl pl-7 pr-2 py-2 text-sm text-neutral-100 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Reactivation MRR */}
                  <div>
                    <label className="block text-xs font-medium text-cyan-400 mb-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Reactivation
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                        {CURRENCIES[currency].symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={waterfallInputs.reactivationMrr}
                        onChange={(e) => updateWaterfall("reactivationMrr", parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-950/80 border border-cyan-900/40 rounded-xl pl-7 pr-2 py-2 text-sm text-neutral-100 focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Contraction MRR */}
                  <div>
                    <label className="block text-xs font-medium text-amber-400 mb-1 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Contraction (Downgrades)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                        {CURRENCIES[currency].symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={waterfallInputs.contractionMrr}
                        onChange={(e) => updateWaterfall("contractionMrr", parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-950/80 border border-amber-900/40 rounded-xl pl-7 pr-2 py-2 text-sm text-neutral-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Churned MRR */}
                  <div>
                    <label className="block text-xs font-medium text-rose-400 mb-1 flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" /> Churned (Cancellations)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                        {CURRENCIES[currency].symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={waterfallInputs.churnedMrr}
                        onChange={(e) => updateWaterfall("churnedMrr", parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-950/80 border border-rose-900/40 rounded-xl pl-7 pr-2 py-2 text-sm text-neutral-100 focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inflow vs Outflow Visual Balance */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-emerald-400 font-medium">
                  Gross Additions: +{formatMrrCurrency(waterfallResult.grossAdditions, currency)}
                </span>
                <span className="text-rose-400 font-medium">
                  Gross Losses: -{formatMrrCurrency(waterfallResult.grossLosses, currency)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${
                      waterfallResult.grossAdditions + waterfallResult.grossLosses > 0
                        ? (waterfallResult.grossAdditions / (waterfallResult.grossAdditions + waterfallResult.grossLosses)) * 100
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{
                    width: `${
                      waterfallResult.grossAdditions + waterfallResult.grossLosses > 0
                        ? (waterfallResult.grossLosses / (waterfallResult.grossAdditions + waterfallResult.grossLosses)) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {/* Ending MRR */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-teal-500/30">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-teal-400" /> Ending MRR
                </div>
                <div className="text-2xl font-bold text-neutral-100">
                  {formatMrrCurrency(waterfallResult.endingMrr, currency)}
                </div>
                <div className="text-[11px] text-teal-400/90 mt-1">
                  MoM Net Gain: {formatMrrCurrency(waterfallResult.netNewMrr, currency)}
                </div>
              </div>

              {/* Annual Run-Rate ARR */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Annual Run-Rate (ARR)
                </div>
                <div className="text-2xl font-bold text-neutral-100">
                  {formatMrrCurrency(waterfallResult.arr, currency)}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  MRR × 12 annualized velocity
                </div>
              </div>

              {/* Net New MRR */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Net New MRR
                </div>
                <div className={`text-2xl font-bold ${waterfallResult.netNewMrr >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {waterfallResult.netNewMrr >= 0 ? "+" : ""}
                  {formatMrrCurrency(waterfallResult.netNewMrr, currency)}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {waterfallResult.netGrowthRate > 0 ? "+" : ""}{waterfallResult.netGrowthRate}% Monthly Growth
                </div>
              </div>

              {/* SaaS Quick Ratio */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-400" /> SaaS Quick Ratio
                </div>
                <div className="text-2xl font-bold text-neutral-100">
                  {waterfallResult.quickRatio}x
                </div>
                <div className="text-[11px] font-semibold mt-1">
                  {waterfallResult.quickRatioStatus === "exceptional" && <span className="text-emerald-400">Hyper-Growth</span>}
                  {waterfallResult.quickRatioStatus === "healthy" && <span className="text-teal-400">Healthy SaaS</span>}
                  {waterfallResult.quickRatioStatus === "sluggish" && <span className="text-amber-400">Sluggish Growth</span>}
                  {waterfallResult.quickRatioStatus === "critical" && <span className="text-rose-400">Leaky Bucket</span>}
                </div>
              </div>
            </div>

            {/* Quick Ratio Health Diagnostic Card */}
            <div
              className={`p-5 rounded-2xl border ${
                waterfallResult.quickRatioStatus === "exceptional"
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : waterfallResult.quickRatioStatus === "healthy"
                  ? "bg-teal-950/20 border-teal-500/30"
                  : waterfallResult.quickRatioStatus === "sluggish"
                  ? "bg-amber-950/20 border-amber-500/30"
                  : "bg-rose-950/20 border-rose-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                {waterfallResult.quickRatioStatus === "exceptional" || waterfallResult.quickRatioStatus === "healthy" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-100 mb-1">
                    {waterfallResult.quickRatioLabel} (Quick Ratio: {waterfallResult.quickRatio}x)
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                    {waterfallResult.quickRatioDescription}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-300 pt-2 border-t border-neutral-800/80">
                    <div>
                      <span className="text-neutral-400 block">&gt; 4.0x:</span> Hyper-Growth
                    </div>
                    <div>
                      <span className="text-neutral-400 block">2.0x - 4.0x:</span> Healthy
                    </div>
                    <div>
                      <span className="text-neutral-400 block">1.0x - 2.0x:</span> Sluggish
                    </div>
                    <div>
                      <span className="text-neutral-400 block">&lt; 1.0x:</span> Contracting
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Waterfall Breakdown Table */}
            <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-900/80 border-b border-neutral-800 text-xs font-semibold text-neutral-300">
                Monthly Waterfall Arithmetic
              </div>
              <div className="p-3 divide-y divide-neutral-800/60 text-xs">
                <div className="flex justify-between py-1.5 text-neutral-300">
                  <span>Starting MRR</span>
                  <span className="font-semibold">{formatMrrCurrency(waterfallResult.startingMrr, currency)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-emerald-400">
                  <span>+ New Customers MRR</span>
                  <span className="font-semibold">+{formatMrrCurrency(waterfallResult.newMrr, currency)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-teal-400">
                  <span>+ Expansion (Upsells / Seats)</span>
                  <span className="font-semibold">+{formatMrrCurrency(waterfallResult.expansionMrr, currency)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-cyan-400">
                  <span>+ Reactivation (Win-Backs)</span>
                  <span className="font-semibold">+{formatMrrCurrency(waterfallResult.reactivationMrr, currency)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-amber-400">
                  <span>- Contraction (Downgrades)</span>
                  <span className="font-semibold">-{formatMrrCurrency(waterfallResult.contractionMrr, currency)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-rose-400">
                  <span>- Churned MRR (Cancellations)</span>
                  <span className="font-semibold">-{formatMrrCurrency(waterfallResult.churnedMrr, currency)}</span>
                </div>
                <div className="flex justify-between py-2 text-neutral-100 font-bold text-sm bg-neutral-800/40 px-2 rounded-lg mt-1">
                  <span>= Ending MRR</span>
                  <span>{formatMrrCurrency(waterfallResult.endingMrr, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETENTION & UNIT ECONOMICS */}
      {activeTab === "retention" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
              <h3 className="text-base font-semibold text-neutral-100 mb-1 flex items-center gap-2">
                <Percent className="w-4 h-4 text-teal-400" />
                Retention & Churn Parameters
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Measure cohort stability, logo churn, and net revenue retention (NRR) excluding new top-of-funnel acquisitions.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Starting Customer Count (Accounts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={retentionInputs.startingCustomers}
                    onChange={(e) =>
                      setRetentionInputs({ ...retentionInputs, startingCustomers: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Churned Customer Count (Lost Accounts)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={retentionInputs.churnedCustomers}
                    onChange={(e) =>
                      setRetentionInputs({ ...retentionInputs, churnedCustomers: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Starting Cohort MRR
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                      {CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={retentionInputs.startingMrr}
                      onChange={(e) =>
                        setRetentionInputs({ ...retentionInputs, startingMrr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-teal-400 mb-1">
                      Expansion MRR
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={retentionInputs.expansionMrr}
                      onChange={(e) =>
                        setRetentionInputs({ ...retentionInputs, expansionMrr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl px-2.5 py-1.5 text-xs text-neutral-100 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-400 mb-1">
                      Contraction MRR
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={retentionInputs.contractionMrr}
                      onChange={(e) =>
                        setRetentionInputs({ ...retentionInputs, contractionMrr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl px-2.5 py-1.5 text-xs text-neutral-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-rose-400 mb-1">
                      Churned MRR
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={retentionInputs.churnedMrr}
                      onChange={(e) =>
                        setRetentionInputs({ ...retentionInputs, churnedMrr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl px-2.5 py-1.5 text-xs text-neutral-100 focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Retention Hero Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* NRR Card */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-teal-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-teal-400" /> Net Revenue Retention (NRR)
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      retentionResult.nrrStatus === "world-class"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : retentionResult.nrrStatus === "strong"
                        ? "bg-teal-500/20 text-teal-400"
                        : retentionResult.nrrStatus === "healthy"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {retentionResult.nrrStatus}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-neutral-100">
                  {retentionResult.nrr}%
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {retentionResult.nrrDescription}
                </p>
              </div>

              {/* GRR Card */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-blue-400" /> Gross Revenue Retention (GRR)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-neutral-800 text-neutral-300">
                    Max 100%
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-neutral-100">
                  {retentionResult.grr}%
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Measures base recurring revenue preserved without counting any expansion or upsells.
                </p>
              </div>
            </div>

            {/* Churn Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1">Logo Churn Rate</div>
                <div className="text-xl font-bold text-neutral-100">
                  {retentionResult.logoChurnRate}%
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Accounts cancelled / Starting accounts</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1">Net Revenue Churn</div>
                <div className={`text-xl font-bold ${retentionResult.netRevenueChurnRate <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {retentionResult.netRevenueChurnRate}%
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {retentionResult.netRevenueChurnRate <= 0 ? "Negative churn (Net Expansion!)" : "Net revenue loss from cohort"}
                </div>
              </div>
            </div>

            {/* SaaS Enterprise Valuation Estimator */}
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-semibold text-neutral-100">
                  SaaS Valuation Multiples (Based on Current ARR)
                </h4>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                Estimated private market valuation based on current Annual Recurring Revenue ({formatMrrCurrency(waterfallResult.arr, currency)} ARR).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <div className="text-xs text-neutral-400">Conservative (4x ARR)</div>
                  <div className="text-base font-bold text-neutral-200 mt-1">
                    {formatMrrCurrency(retentionResult.valuation.conservative, currency)}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Modest growth (&lt;20% YoY)</div>
                </div>

                <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-500/30">
                  <div className="text-xs text-teal-300 font-medium">Median Multiple (7x ARR)</div>
                  <div className="text-base font-bold text-teal-400 mt-1">
                    {formatMrrCurrency(retentionResult.valuation.median, currency)}
                  </div>
                  <div className="text-[10px] text-teal-400/80 mt-0.5">Healthy SaaS (30-50% YoY)</div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <div className="text-xs text-purple-300">Top Decile (12x ARR)</div>
                  <div className="text-base font-bold text-purple-400 mt-1">
                    {formatMrrCurrency(retentionResult.valuation.premium, currency)}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Hyper-growth (&gt;75% YoY)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION PLANS & TIERS */}
      {activeTab === "tiers" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
            <div>
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                Multi-Plan Subscription Normalizer
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Automatically normalizes monthly and annual billing cycles into standardized Monthly Recurring Revenue.
              </p>
            </div>
            <button
              onClick={addTier}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-neutral-950 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subscription Tier
            </button>
          </div>

          {/* Tiers Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400">
                  <th className="py-3 px-3 font-semibold">Tier Name</th>
                  <th className="py-3 px-3 font-semibold">Monthly Price</th>
                  <th className="py-3 px-3 font-semibold">Annual Price</th>
                  <th className="py-3 px-3 font-semibold">Monthly Subs</th>
                  <th className="py-3 px-3 font-semibold">Annual Subs</th>
                  <th className="py-3 px-3 font-semibold">Total Subs</th>
                  <th className="py-3 px-3 font-semibold">Normalized MRR</th>
                  <th className="py-3 px-3 font-semibold">% Share</th>
                  <th className="py-3 px-2 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {tierResult.tiers.map((tier, index) => (
                  <tr key={tier.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Name */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(index, "name", e.target.value)}
                        className="bg-neutral-950/80 border border-neutral-700/60 rounded-lg px-2.5 py-1 text-neutral-100 font-medium w-36 outline-none focus:border-teal-500"
                      />
                    </td>

                    {/* Monthly Price */}
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px]">
                          {CURRENCIES[currency].symbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={tier.monthlyPrice}
                          onChange={(e) => updateTier(index, "monthlyPrice", parseFloat(e.target.value) || 0)}
                          className="bg-neutral-950/80 border border-neutral-700/60 rounded-lg pl-5 pr-2 py-1 text-neutral-100 w-24 outline-none focus:border-teal-500"
                        />
                      </div>
                    </td>

                    {/* Annual Price */}
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px]">
                          {CURRENCIES[currency].symbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={tier.annualPrice}
                          onChange={(e) => updateTier(index, "annualPrice", parseFloat(e.target.value) || 0)}
                          className="bg-neutral-950/80 border border-neutral-700/60 rounded-lg pl-5 pr-2 py-1 text-neutral-100 w-24 outline-none focus:border-teal-500"
                        />
                      </div>
                    </td>

                    {/* Monthly Subs */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        value={tier.monthlySubscribers}
                        onChange={(e) => updateTier(index, "monthlySubscribers", parseInt(e.target.value) || 0)}
                        className="bg-neutral-950/80 border border-neutral-700/60 rounded-lg px-2.5 py-1 text-neutral-100 w-20 outline-none focus:border-teal-500"
                      />
                    </td>

                    {/* Annual Subs */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        value={tier.annualSubscribers}
                        onChange={(e) => updateTier(index, "annualSubscribers", parseInt(e.target.value) || 0)}
                        className="bg-neutral-950/80 border border-neutral-700/60 rounded-lg px-2.5 py-1 text-neutral-100 w-20 outline-none focus:border-teal-500"
                      />
                    </td>

                    {/* Total Subs */}
                    <td className="py-2.5 px-3 font-semibold text-neutral-200">
                      {tier.totalSubscribers.toLocaleString()}
                    </td>

                    {/* MRR Contribution */}
                    <td className="py-2.5 px-3 font-bold text-teal-400">
                      {formatMrrCurrency(tier.mrrContribution, currency)}
                    </td>

                    {/* Share */}
                    <td className="py-2.5 px-3 text-neutral-300">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-xs font-semibold">
                        {tier.mrrPercentage}%
                      </span>
                    </td>

                    {/* Delete */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => removeTier(index)}
                        disabled={tierResult.tiers.length <= 1}
                        className="p-1 text-neutral-400 hover:text-rose-400 disabled:opacity-30 transition-colors"
                        title="Delete Tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tier Aggregates Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-xs text-neutral-400 mb-1">Total Active Subscribers</div>
              <div className="text-2xl font-bold text-neutral-100">
                {tierResult.totalSubscribers.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-teal-500/30">
              <div className="text-xs text-neutral-400 mb-1">Total Normalized MRR</div>
              <div className="text-2xl font-bold text-teal-400">
                {formatMrrCurrency(tierResult.totalMrr, currency)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-xs text-neutral-400 mb-1">Annualized Plan Run-Rate (ARR)</div>
              <div className="text-2xl font-bold text-neutral-100">
                {formatMrrCurrency(tierResult.totalArr, currency)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-xs text-neutral-400 mb-1">Blended ARPU / Account</div>
              <div className="text-2xl font-bold text-neutral-100">
                {formatMrrCurrency(tierResult.blendedArpu, currency)}
                <span className="text-xs text-neutral-400 font-normal"> / mo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 12-MONTH PROJECTIONS */}
      {activeTab === "projections" && (
        <div className="flex flex-col gap-5">
          {/* Controls & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
              <h3 className="text-base font-semibold text-neutral-100 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Growth Modeler Settings
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Simulate compounded forward growth starting from current Ending MRR ({formatMrrCurrency(waterfallResult.endingMrr, currency)}).
              </p>

              <div>
                <div className="flex justify-between items-center text-xs font-medium text-neutral-300 mb-1.5">
                  <span>Target Net Monthly Growth Rate (%):</span>
                  <span className="font-bold text-teal-400">{monthlyGrowthRate}% / mo</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="25"
                  step="0.5"
                  value={monthlyGrowthRate}
                  onChange={(e) => setMonthlyGrowthRate(parseFloat(e.target.value) || 0)}
                  className="w-full accent-teal-500 cursor-pointer mb-3"
                />
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>-5% (Decline)</span>
                  <span>0% (Flat)</span>
                  <span>10% (Strong)</span>
                  <span>25% (Rocket)</span>
                </div>
              </div>
            </div>

            {/* 12-Month Headline Milestones */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-center">
                <div className="text-xs text-neutral-400 mb-1">Month 12 Projected MRR</div>
                <div className="text-2xl font-bold text-teal-400">
                  {formatMrrCurrency(projectionResult.endMrr, currency)}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  +{projectionResult.totalGrowthPercent}% Annual Compound Gain
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-center">
                <div className="text-xs text-neutral-400 mb-1">Month 12 Projected ARR</div>
                <div className="text-2xl font-bold text-neutral-100">
                  {formatMrrCurrency(projectionResult.endArr, currency)}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  +{formatMrrCurrency(projectionResult.annualNetGain * 12, currency)} ARR Expansion
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-center">
                <div className="text-xs text-neutral-400 mb-1">Month 12 Subscribers</div>
                <div className="text-2xl font-bold text-neutral-100">
                  {projectionResult.months[11].subscribers.toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  From {retentionInputs.startingCustomers.toLocaleString()} accounts
                </div>
              </div>
            </div>
          </div>

          {/* Projection Trajectory Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400">
                  <th className="py-3 px-4 font-semibold">Period</th>
                  <th className="py-3 px-4 font-semibold">Projected MRR</th>
                  <th className="py-3 px-4 font-semibold">Projected ARR</th>
                  <th className="py-3 px-4 font-semibold">Monthly Net Gain</th>
                  <th className="py-3 px-4 font-semibold">Subscribers</th>
                  <th className="py-3 px-4 font-semibold">ARR Milestone Indicators</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {projectionResult.months.map((m) => (
                  <tr key={m.month} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-neutral-300">{m.monthName}</td>
                    <td className="py-2.5 px-4 font-bold text-teal-400">
                      {formatMrrCurrency(m.mrr, currency)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-neutral-200">
                      {formatMrrCurrency(m.arr, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-400 font-medium">
                      +{formatMrrCurrency(m.netNewMrr, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300">
                      {m.subscribers.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      {m.milestones.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.milestones.map((ms, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            >
                              ★ {ms}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEO & Methodological Explanation */}
      <SEOContent tool={tool} />

      {/* Related Tools Navigation */}
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
