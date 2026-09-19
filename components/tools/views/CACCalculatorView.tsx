"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  SUPPORTED_CURRENCIES,
  formatCacCurrency,
  CacInput,
  calculateCacMetrics,
  ChannelData,
  calculateChannelBreakdown,
  MagicNumberInput,
  calculateMagicNumber,
  CAC_PRESETS,
  CacPreset,
} from "@/tools/business/cacEngine";
import {
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";

export interface CACCalculatorViewProps {
  tool: ToolMeta;
}

export const CACCalculatorView: React.FC<CACCalculatorViewProps> = ({ tool }) => {
  // Mode selection: "economics" | "channels" | "efficiency"
  const [activeTab, setActiveTab] = useState<"economics" | "channels" | "efficiency">(() => {
    if (tool.slug.includes("ltv")) return "economics";
    if (tool.slug.includes("channel")) return "channels";
    return "economics";
  });

  const [currency, setCurrency] = useState<string>("USD");
  const [copied, setCopied] = useState<boolean>(false);

  // 1. CAC & LTV Inputs
  const [cacInput, setCacInput] = useState<CacInput>({
    paidAdSpend: 20000,
    marketingSalaries: 15000,
    salesCommissions: 5000,
    softwareTools: 3000,
    agencyFees: 4000,
    paidCustomersAcquired: 80,
    organicCustomersAcquired: 40,
    arpuMonthly: 150,
    grossMarginPercent: 80,
    monthlyChurnPercent: 2.5,
  });

  // 2. Channels Input
  const [channels, setChannels] = useState<ChannelData[]>([
    { id: "ch-1", name: "Google Search Ads", spend: 10000, conversions: 45 },
    { id: "ch-2", name: "LinkedIn Ads", spend: 6000, conversions: 18 },
    { id: "ch-3", name: "Meta / Instagram Ads", spend: 4000, conversions: 17 },
    { id: "ch-4", name: "Organic SEO & Content", spend: 0, conversions: 28 },
    { id: "ch-5", name: "Customer Referrals", spend: 0, conversions: 12 },
  ]);

  // 3. Magic Number Inputs
  const [magicInput, setMagicInput] = useState<MagicNumberInput>({
    quarterlyNetNewArr: 180000,
    quarterlySalesMarketingSpend: 140000,
  });

  // Calculations
  const cacResult = useMemo(() => calculateCacMetrics(cacInput), [cacInput]);
  const channelResult = useMemo(() => calculateChannelBreakdown(channels), [channels]);
  const magicResult = useMemo(() => calculateMagicNumber(magicInput), [magicInput]);

  // Preset Loader
  const handleLoadPreset = (preset: CacPreset) => {
    setCurrency(preset.currency);
    setCacInput(preset.input);
    setChannels(preset.channels);
  };

  // Add / Remove Channel
  const handleAddChannel = () => {
    const newCh: ChannelData = {
      id: `ch-${Date.now()}`,
      name: "New Marketing Channel",
      spend: 2000,
      conversions: 10,
    };
    setChannels((prev) => [...prev, newCh]);
  };

  const handleRemoveChannel = (id: string) => {
    if (channels.length <= 1) {
      alert("At least one acquisition channel is required.");
      return;
    }
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  const handleChannelChange = (id: string, field: "name" | "spend" | "conversions", val: any) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  // Copy Summary
  const handleCopySummary = () => {
    let summary = "";
    if (activeTab === "economics") {
      summary = `CAC & LTV UNIT ECONOMICS REPORT (${currency})\n` +
        `----------------------------------------\n` +
        `Fully-Loaded CAC: ${formatCacCurrency(cacResult.fullyLoadedCac, currency)}\n` +
        `Blended CAC: ${formatCacCurrency(cacResult.blendedCac, currency)}\n` +
        `Paid CAC (Direct Ads): ${formatCacCurrency(cacResult.paidCac, currency)}\n` +
        `Customer Lifetime Value (LTV): ${formatCacCurrency(cacResult.ltv, currency)}\n` +
        `LTV:CAC Ratio: ${cacResult.ltvToCacRatio.toFixed(1)}x\n` +
        `CAC Payback Period: ${cacResult.cacPaybackMonths.toFixed(1)} Months (${cacResult.cacPaybackDays} Days)\n` +
        `Cash Breakeven Month: Month ${cacResult.breakevenMonth || "N/A"}\n` +
        `Diagnosis: ${cacResult.diagnostic.headline}`;
    } else if (activeTab === "channels") {
      summary = `ACQUISITION CHANNELS CAC BREAKDOWN (${currency})\n` +
        `----------------------------------------\n` +
        `Total Spend: ${formatCacCurrency(channelResult.totalSpend, currency)}\n` +
        `Total Conversions: ${channelResult.totalConversions}\n` +
        `Blended Channel CAC: ${formatCacCurrency(channelResult.overallChannelCac, currency)}\n\n` +
        channelResult.channels
          .map((ch) => `${ch.name}: Spend ${formatCacCurrency(ch.spend, currency)}, Conv ${ch.conversions}, CAC ${formatCacCurrency(ch.channelCac, currency)} (${ch.efficiencyRating})`)
          .join("\n");
    } else {
      summary = `SAAS SALES EFFICIENCY & MAGIC NUMBER\n` +
        `----------------------------------------\n` +
        `Quarterly Net New ARR: ${formatCacCurrency(magicInput.quarterlyNetNewArr, currency)}\n` +
        `Quarterly S&M Spend: ${formatCacCurrency(magicInput.quarterlySalesMarketingSpend, currency)}\n` +
        `SaaS Magic Number: ${magicResult.magicNumber.toFixed(2)}\n` +
        `Efficiency Score: ${magicResult.efficiencyScore.toUpperCase()}\n` +
        `Guidance: ${magicResult.guidance}`;
    }

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download CSV
  const handleDownloadCSV = () => {
    let csv = "";
    if (activeTab === "economics") {
      csv = "Month,Cumulative Gross Margin,Net Cashflow,Breakeven Status\n" +
        cacResult.cashRecoveryTimeline
          .map((p) => `${p.month},${p.cumulativeGrossMargin},${p.netCashFlow},${p.isBreakeven ? "YES" : "NO"}`)
          .join("\n");
    } else if (activeTab === "channels") {
      csv = "Channel,Spend,Conversions,Channel CAC,Share of Conversions %,Efficiency Rating\n" +
        channelResult.channels
          .map((ch) => `"${ch.name}",${ch.spend},${ch.conversions},${ch.channelCac},${ch.shareOfConversionsPercent}%,${ch.efficiencyRating}`)
          .join("\n");
    } else {
      csv = "Metric,Value\n" +
        `"Quarterly Net New ARR",${magicInput.quarterlyNetNewArr}\n` +
        `"Quarterly S&M Spend",${magicInput.quarterlySalesMarketingSpend}\n` +
        `"Magic Number",${magicResult.magicNumber}\n` +
        `"Efficiency Score",${magicResult.efficiencyScore}\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cac_${activeTab}_report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Preset & Settings Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border p-4 rounded-xl shadow-sm">
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Presets:
          </span>
          {CAC_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary transition-all"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Currency & Export Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-surface-raised border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-raised border border-border hover:bg-surface-border text-text-secondary transition-all"
            title="Copy Analysis Summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-raised border border-border hover:bg-surface-border text-text-secondary transition-all"
            title="Download CSV Statement"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("economics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "economics"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>CAC & LTV Unit Economics</span>
        </button>

        <button
          onClick={() => setActiveTab("channels")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "channels"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Multi-Channel Acquisition</span>
        </button>

        <button
          onClick={() => setActiveTab("efficiency")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "efficiency"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>SaaS Capital Efficiency</span>
        </button>
      </div>

      {/* TAB 1: CAC & LTV UNIT ECONOMICS */}
      {activeTab === "economics" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cost & Revenue Inputs */}
          <div className="xl:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Acquisition & Retention Inputs
              </span>
              <button
                onClick={() =>
                  setCacInput({
                    paidAdSpend: 20000,
                    marketingSalaries: 15000,
                    salesCommissions: 5000,
                    softwareTools: 3000,
                    agencyFees: 4000,
                    paidCustomersAcquired: 80,
                    organicCustomersAcquired: 40,
                    arpuMonthly: 150,
                    grossMarginPercent: 80,
                    monthlyChurnPercent: 2.5,
                  })
                }
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Sales & Marketing Cost Breakdown */}
            <div className="flex flex-col gap-3 p-4 bg-surface-raised border border-border rounded-xl">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-xs font-bold text-text-primary uppercase">Sales & Marketing Spend</span>
                <span className="text-xs font-mono font-bold text-text-primary">
                  Total: {formatCacCurrency(cacResult.totalSpend, currency)}
                </span>
              </div>

              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">Paid Advertising Media Spend</label>
                <input
                  type="number"
                  step="any"
                  value={cacInput.paidAdSpend}
                  onChange={(e) =>
                    setCacInput((prev) => ({ ...prev, paidAdSpend: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  placeholder="Google, Meta, LinkedIn ads..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">S&M Team Salaries</label>
                  <input
                    type="number"
                    step="any"
                    value={cacInput.marketingSalaries}
                    onChange={(e) =>
                      setCacInput((prev) => ({ ...prev, marketingSalaries: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">Sales Commissions</label>
                  <input
                    type="number"
                    step="any"
                    value={cacInput.salesCommissions}
                    onChange={(e) =>
                      setCacInput((prev) => ({ ...prev, salesCommissions: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">Software & Tools (MarTech)</label>
                  <input
                    type="number"
                    step="any"
                    value={cacInput.softwareTools}
                    onChange={(e) =>
                      setCacInput((prev) => ({ ...prev, softwareTools: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                    placeholder="HubSpot, CRM, tracking..."
                  />
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">Agency & Creative Fees</label>
                  <input
                    type="number"
                    step="any"
                    value={cacInput.agencyFees}
                    onChange={(e) =>
                      setCacInput((prev) => ({ ...prev, agencyFees: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Customers Acquired */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Paid Customers Acquired</label>
                <input
                  type="number"
                  step="1"
                  value={cacInput.paidCustomersAcquired}
                  onChange={(e) =>
                    setCacInput((prev) => ({
                      ...prev,
                      paidCustomersAcquired: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Organic Customers Acquired</label>
                <input
                  type="number"
                  step="1"
                  value={cacInput.organicCustomersAcquired}
                  onChange={(e) =>
                    setCacInput((prev) => ({
                      ...prev,
                      organicCustomersAcquired: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                />
              </div>
            </div>

            {/* Unit Revenue & Retention */}
            <div className="flex flex-col gap-3 p-4 bg-surface-raised border border-border rounded-xl">
              <span className="text-xs font-bold text-text-primary uppercase">Revenue & Retention Rates</span>

              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">
                  Average Revenue Per User (Monthly ARPU)
                </label>
                <input
                  type="number"
                  step="any"
                  value={cacInput.arpuMonthly}
                  onChange={(e) =>
                    setCacInput((prev) => ({ ...prev, arpuMonthly: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">Gross Margin (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={cacInput.grossMarginPercent}
                    onChange={(e) =>
                      setCacInput((prev) => ({ ...prev, grossMarginPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">Monthly Logo Churn (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={cacInput.monthlyChurnPercent}
                    onChange={(e) =>
                      setCacInput((prev) => ({ ...prev, monthlyChurnPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Metrics & Cash Recovery Timeline */}
          <div className="xl:col-span-7 flex flex-col gap-6 sticky top-20">
            {/* Primary Unit Economics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Fully-Loaded CAC</span>
                <span className="text-lg font-black font-mono text-primary">
                  {formatCacCurrency(cacResult.fullyLoadedCac, currency)}
                </span>
                <span className="text-[10px] text-text-muted">
                  Blended: {formatCacCurrency(cacResult.blendedCac, currency)}
                </span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Customer LTV</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {formatCacCurrency(cacResult.ltv, currency)}
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold">
                  {cacResult.customerLifespanMonths.toFixed(1)} Mos Lifespan
                </span>
              </div>

              <div
                className={`border p-3.5 rounded-xl shadow-card flex flex-col gap-1 ${
                  cacResult.ltvToCacRatio >= 3.0
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : cacResult.ltvToCacRatio >= 1.0
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "bg-red-950/20 border-red-500/30"
                }`}
              >
                <span className="text-[11px] text-text-muted">LTV:CAC Ratio</span>
                <span
                  className={`text-lg font-black font-mono ${
                    cacResult.ltvToCacRatio >= 3.0
                      ? "text-emerald-400"
                      : cacResult.ltvToCacRatio >= 1.0
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {cacResult.ltvToCacRatio.toFixed(1)}x
                </span>
                <span className="text-[10px] text-text-muted">Target: 3.0x – 5.0x</span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">CAC Payback</span>
                <span className="text-lg font-black font-mono text-blue-400">
                  {cacResult.cacPaybackMonths.toFixed(1)} Mos
                </span>
                <span className="text-[10px] text-blue-500 font-semibold">
                  {cacResult.cacPaybackDays} Calendar Days
                </span>
              </div>
            </div>

            {/* Diagnostic Health Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
                cacResult.diagnostic.status === "healthy" || cacResult.diagnostic.status === "exceptional"
                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                  : cacResult.diagnostic.status === "underinvesting"
                  ? "bg-blue-950/20 border-blue-500/40 text-blue-300"
                  : cacResult.diagnostic.status === "suboptimal"
                  ? "bg-amber-950/20 border-amber-500/40 text-amber-300"
                  : "bg-red-950/20 border-red-500/40 text-red-300"
              }`}
            >
              {cacResult.diagnostic.status === "dangerous" || cacResult.diagnostic.status === "suboptimal" ? (
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-bold text-sm">{cacResult.diagnostic.headline}</span>
                <p className="text-text-secondary leading-relaxed">{cacResult.diagnostic.ratioDescription}</p>
                <p className="text-text-secondary leading-relaxed font-medium">{cacResult.diagnostic.paybackAssessment}</p>
                {cacResult.diagnostic.recommendations.map((rec, i) => (
                  <p key={i} className="text-text-primary flex items-center gap-1.5 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                    <span>{rec}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* 24-Month Cash Recovery Timeline */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  24-Month Cumulative Cash Recovery Trajectory
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Breakeven: Month {cacResult.breakevenMonth || "> 24"}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-text-muted px-2">
                  <span className="col-span-2">Month</span>
                  <span className="col-span-4 text-right">Cumulative GM</span>
                  <span className="col-span-4 text-right">Net Cashflow</span>
                  <span className="col-span-2 text-center">Status</span>
                </div>

                <div className="max-h-[280px] overflow-y-auto flex flex-col gap-1 pr-1">
                  {cacResult.cashRecoveryTimeline.map((pt) => (
                    <div
                      key={pt.month}
                      className={`grid grid-cols-12 gap-2 text-xs py-1.5 px-2 rounded-lg border items-center ${
                        pt.isBreakeven
                          ? "bg-emerald-950/20 border-emerald-500/30 text-text-primary"
                          : "bg-surface-raised border-border/40 text-text-secondary"
                      }`}
                    >
                      <span className="col-span-2 font-mono font-bold">Month {pt.month}</span>
                      <span className="col-span-4 text-right font-mono">
                        {formatCacCurrency(pt.cumulativeGrossMargin, currency)}
                      </span>
                      <span
                        className={`col-span-4 text-right font-mono font-semibold ${
                          pt.netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {formatCacCurrency(pt.netCashFlow, currency)}
                      </span>
                      <span className="col-span-2 text-center">
                        {pt.isBreakeven ? (
                          <span className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                            Profit
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[9px] rounded bg-red-500/10 text-red-400 font-medium uppercase">
                            Paying Off
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-CHANNEL ACQUISITION MATRIX */}
      {activeTab === "channels" && (
        <div className="flex flex-col gap-6">
          {/* Channel Summary Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-border p-4 rounded-xl shadow-card flex flex-col gap-1">
              <span className="text-xs text-text-muted">Total Multi-Channel Spend</span>
              <span className="text-xl font-black font-mono text-text-primary">
                {formatCacCurrency(channelResult.totalSpend, currency)}
              </span>
            </div>

            <div className="bg-surface border border-border p-4 rounded-xl shadow-card flex flex-col gap-1">
              <span className="text-xs text-text-muted">Total Customer Conversions</span>
              <span className="text-xl font-black font-mono text-text-primary">
                {channelResult.totalConversions.toLocaleString()} Customers
              </span>
            </div>

            <div className="bg-surface border border-border p-4 rounded-xl shadow-card flex flex-col gap-1">
              <span className="text-xs text-text-muted">Blended Acquisition CAC</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {formatCacCurrency(channelResult.overallChannelCac, currency)}
              </span>
            </div>
          </div>

          {/* Interactive Channel Table */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                  Acquisition Channel Performance Table
                </span>
                <span className="text-[11px] text-text-muted">
                  Compare marketing channels by spend, new customers, and cost efficiency.
                </span>
              </div>

              <button
                onClick={handleAddChannel}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Channel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-[11px]">
                    <th className="py-2.5 px-3">Marketing Channel</th>
                    <th className="py-2.5 px-3">Ad / Campaign Spend</th>
                    <th className="py-2.5 px-3">Conversions</th>
                    <th className="py-2.5 px-3 text-right">Channel CAC</th>
                    <th className="py-2.5 px-3 text-right">Share of Conv.</th>
                    <th className="py-2.5 px-3 text-center">Efficiency Rating</th>
                    <th className="py-2.5 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {channelResult.channels.map((ch) => (
                    <tr key={ch.id} className="hover:bg-surface-raised">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={ch.name}
                          onChange={(e) => handleChannelChange(ch.id, "name", e.target.value)}
                          className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-semibold text-text-primary"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="any"
                          value={ch.spend}
                          onChange={(e) => handleChannelChange(ch.id, "spend", parseFloat(e.target.value) || 0)}
                          className="w-28 bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text-primary"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="1"
                          value={ch.conversions}
                          onChange={(e) =>
                            handleChannelChange(ch.id, "conversions", parseInt(e.target.value) || 0)
                          }
                          className="w-24 bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text-primary text-center"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary">
                        {formatCacCurrency(ch.channelCac, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                        {ch.shareOfConversionsPercent}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {ch.efficiencyRating === "top_performer" ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400">
                            Top Performer
                          </span>
                        ) : ch.efficiencyRating === "average" ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400">
                            Average
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400">
                            High Cost / Burn
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleRemoveChannel(ch.id)}
                          className="p-1 text-red-400 hover:text-red-500 rounded hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAAS CAPITAL EFFICIENCY & BENCHMARKS */}
      {activeTab === "efficiency" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Magic Number Calculator */}
          <div className="xl:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 shadow-card">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              SaaS Magic Number & Capital Efficiency
            </span>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">
                  Quarterly Net New ARR Generated
                </label>
                <input
                  type="number"
                  step="any"
                  value={magicInput.quarterlyNetNewArr}
                  onChange={(e) =>
                    setMagicInput((prev) => ({
                      ...prev,
                      quarterlyNetNewArr: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono"
                  placeholder="e.g. 150000"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">
                  Quarterly Sales & Marketing Spend
                </label>
                <input
                  type="number"
                  step="any"
                  value={magicInput.quarterlySalesMarketingSpend}
                  onChange={(e) =>
                    setMagicInput((prev) => ({
                      ...prev,
                      quarterlySalesMarketingSpend: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono"
                  placeholder="e.g. 100000"
                />
              </div>
            </div>

            {/* Score Output Card */}
            <div className="p-4 bg-surface-raised border border-border rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary">SaaS Magic Number</span>
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    magicResult.efficiencyScore === "exceptional"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : magicResult.efficiencyScore === "healthy"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {magicResult.efficiencyScore.toUpperCase()}
                </span>
              </div>

              <span className="text-3xl font-black font-mono text-primary">
                {magicResult.magicNumber.toFixed(2)}
              </span>

              <p className="text-xs text-text-secondary leading-relaxed">{magicResult.guidance}</p>
            </div>
          </div>

          {/* Right Column: Industry Benchmark Matrix */}
          <div className="xl:col-span-7 flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 shadow-card">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Industry CAC & LTV Benchmarks
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-[11px]">
                    <th className="py-2.5 px-3">Business Model</th>
                    <th className="py-2.5 px-3">Target LTV:CAC</th>
                    <th className="py-2.5 px-3">Typical Payback</th>
                    <th className="py-2.5 px-3">Monthly Churn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-text-secondary">
                  <tr className="hover:bg-surface-raised">
                    <td className="py-2.5 px-3 font-bold text-text-primary">B2B Enterprise SaaS</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">4.0x – 6.0x</td>
                    <td className="py-2.5 px-3 font-mono">12 – 18 Months</td>
                    <td className="py-2.5 px-3 font-mono">0.5% – 1.0%</td>
                  </tr>
                  <tr className="hover:bg-surface-raised">
                    <td className="py-2.5 px-3 font-bold text-text-primary">B2B Mid-Market / SMB</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">3.0x – 5.0x</td>
                    <td className="py-2.5 px-3 font-mono">8 – 12 Months</td>
                    <td className="py-2.5 px-3 font-mono">2.0% – 3.5%</td>
                  </tr>
                  <tr className="hover:bg-surface-raised">
                    <td className="py-2.5 px-3 font-bold text-text-primary">B2C Mobile Subscription</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">2.5x – 4.0x</td>
                    <td className="py-2.5 px-3 font-mono">3 – 6 Months</td>
                    <td className="py-2.5 px-3 font-mono">4.0% – 7.0%</td>
                  </tr>
                  <tr className="hover:bg-surface-raised">
                    <td className="py-2.5 px-3 font-bold text-text-primary">E-Commerce DTC Brands</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">2.0x – 3.5x</td>
                    <td className="py-2.5 px-3 font-mono">1 – 3 Months (1st Order)</td>
                    <td className="py-2.5 px-3 font-mono">30% – 50% Repeat</td>
                  </tr>
                  <tr className="hover:bg-surface-raised">
                    <td className="py-2.5 px-3 font-bold text-text-primary">Fintech & Marketplaces</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">4.0x – 7.0x</td>
                    <td className="py-2.5 px-3 font-mono">6 – 12 Months</td>
                    <td className="py-2.5 px-3 font-mono">1.0% – 2.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
