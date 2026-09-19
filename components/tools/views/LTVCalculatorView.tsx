"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  SUPPORTED_CURRENCIES,
  formatLtvCurrency,
  SaasLtvInput,
  calculateSaasLtv,
  EcommerceLtvInput,
  calculateEcommerceLtv,
  CustomerTier,
  calculateTierSegmentation,
  calculateCohortDecay,
  calculateSensitivityAnalysis,
  LTV_PRESETS,
  LtvPreset,
} from "@/tools/business/ltvEngine";
import {
  HeartHandshake,
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
  ShoppingBag,
  Sliders,
  Users,
  Plus,
  Trash2,
} from "lucide-react";

export interface LTVCalculatorViewProps {
  tool: ToolMeta;
}

export const LTVCalculatorView: React.FC<LTVCalculatorViewProps> = ({ tool }) => {
  // Mode selection: "saas" | "ecommerce" | "tiers" | "sensitivity"
  const [activeTab, setActiveTab] = useState<"saas" | "ecommerce" | "tiers" | "sensitivity">("saas");
  const [currency, setCurrency] = useState<string>("USD");
  const [copied, setCopied] = useState<boolean>(false);

  // 1. SaaS Inputs
  const [saasInput, setSaasInput] = useState<SaasLtvInput>({
    arpuMonthly: 150,
    grossMarginPercent: 80,
    monthlyChurnPercent: 2.2,
    monthlyExpansionPercent: 0.8,
    annualDiscountRatePercent: 10,
    estimatedCac: 800,
  });

  // 2. E-Commerce Inputs
  const [ecomInput, setEcomInput] = useState<EcommerceLtvInput>({
    averageOrderValue: 85,
    purchaseFrequencyPerYear: 3.5,
    customerLifespanYears: 3,
    grossMarginPercent: 60,
    repeatPurchaseRatePercent: 45,
  });

  // 3. Tiers Inputs
  const [tiers, setTiers] = useState<CustomerTier[]>([
    { id: "t-1", tierName: "Enterprise Tier", customerCount: 30, arpuMonthly: 3500, monthlyChurnPercent: 0.8, grossMarginPercent: 85 },
    { id: "t-2", tierName: "Mid-Market Growth", customerCount: 120, arpuMonthly: 850, monthlyChurnPercent: 1.8, grossMarginPercent: 82 },
    { id: "t-3", tierName: "Self-Serve SMB", customerCount: 450, arpuMonthly: 150, monthlyChurnPercent: 3.2, grossMarginPercent: 78 },
  ]);

  // Calculations
  const saasResult = useMemo(() => calculateSaasLtv(saasInput), [saasInput]);
  const ecomResult = useMemo(() => calculateEcommerceLtv(ecomInput), [ecomInput]);
  const tierResult = useMemo(() => calculateTierSegmentation(tiers), [tiers]);
  const cohortMilestones = useMemo(
    () => calculateCohortDecay(saasInput.arpuMonthly, saasInput.grossMarginPercent, saasInput.monthlyChurnPercent),
    [saasInput.arpuMonthly, saasInput.grossMarginPercent, saasInput.monthlyChurnPercent]
  );
  const sensitivityResult = useMemo(
    () => calculateSensitivityAnalysis(saasInput.arpuMonthly, saasInput.grossMarginPercent, saasInput.monthlyChurnPercent),
    [saasInput.arpuMonthly, saasInput.grossMarginPercent, saasInput.monthlyChurnPercent]
  );

  // Preset Loader
  const handleLoadPreset = (preset: LtvPreset) => {
    setCurrency(preset.currency);
    setSaasInput(preset.saasInput);
    setEcomInput(preset.ecommerceInput);
    setTiers(preset.tiers);
  };

  // Add / Remove Tier
  const handleAddTier = () => {
    const newTier: CustomerTier = {
      id: `t-${Date.now()}`,
      tierName: "New Customer Segment",
      customerCount: 50,
      arpuMonthly: 250,
      monthlyChurnPercent: 2.5,
      grossMarginPercent: 80,
    };
    setTiers((prev) => [...prev, newTier]);
  };

  const handleRemoveTier = (id: string) => {
    if (tiers.length <= 1) {
      alert("At least one customer tier is required.");
      return;
    }
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTierChange = (id: string, field: keyof CustomerTier, val: any) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: val } : t))
    );
  };

  // Copy Summary
  const handleCopySummary = () => {
    let summary = "";
    if (activeTab === "saas") {
      summary = `SAAS CUSTOMER LIFETIME VALUE (LTV) REPORT (${currency})\n` +
        `----------------------------------------\n` +
        `Monthly ARPU: ${formatLtvCurrency(saasResult.arpuMonthly, currency)}\n` +
        `Gross Margin: ${saasResult.grossMarginPercent}%\n` +
        `Monthly Churn: ${saasResult.monthlyChurnPercent}% (${saasResult.annualizedChurnPercent}% Annualized)\n` +
        `Net Revenue Retention (NRR): ${saasResult.netRevenueRetentionPercent}%\n` +
        `Average Lifespan: ${saasResult.customerLifespanMonths.toFixed(1)} Months\n` +
        `Undiscounted LTV: ${formatLtvCurrency(saasResult.undiscountedLtv, currency)}\n` +
        `Discounted NPV LTV: ${formatLtvCurrency(saasResult.discountedNpvLtv, currency)}\n` +
        `LTV:CAC Ratio: ${saasResult.ltvToCacRatio.toFixed(1)}x\n` +
        `CAC Payback: ${saasResult.paybackMonths.toFixed(1)} Months\n` +
        `Diagnosis: ${saasResult.diagnostic.headline}`;
    } else if (activeTab === "ecommerce") {
      summary = `E-COMMERCE TRANSACTIONAL LTV REPORT (${currency})\n` +
        `----------------------------------------\n` +
        `Average Order Value (AOV): ${formatLtvCurrency(ecomResult.averageOrderValue, currency)}\n` +
        `Purchase Frequency: ${ecomResult.purchaseFrequencyPerYear} orders/year\n` +
        `Customer Lifespan: ${ecomResult.customerLifespanYears} years\n` +
        `Lifetime Orders: ${ecomResult.totalLifetimeOrders}\n` +
        `Lifetime Revenue: ${formatLtvCurrency(ecomResult.lifetimeRevenue, currency)}\n` +
        `Customer LTV (Gross Profit): ${formatLtvCurrency(ecomResult.ltv, currency)}\n` +
        `Max Allowable Acquisition CAC: ${formatLtvCurrency(ecomResult.maxAllowableCac, currency)}`;
    } else if (activeTab === "tiers") {
      summary = `CUSTOMER TIER SEGMENTATION & EQUITY (${currency})\n` +
        `----------------------------------------\n` +
        `Total Active Customers: ${tierResult.totalCustomers.toLocaleString()}\n` +
        `Total Customer Base Equity: ${formatLtvCurrency(tierResult.totalCustomerEquity, currency)}\n` +
        `Blended Customer LTV: ${formatLtvCurrency(tierResult.blendedLtv, currency)}\n\n` +
        tierResult.tiers
          .map((t) => `${t.tierName}: ${t.customerCount} users (${t.customerSharePercent}%), LTV ${formatLtvCurrency(t.tierLtv, currency)}, Equity ${formatLtvCurrency(t.tierAggregateEquity, currency)} (${t.equitySharePercent}%)`)
          .join("\n");
    } else {
      summary = `LTV SENSITIVITY & WHAT-IF ANALYSIS (${currency})\n` +
        `----------------------------------------\n` +
        `Base Customer LTV: ${formatLtvCurrency(sensitivityResult.baseLtv, currency)}\n` +
        `Churn -1% Impact: ${formatLtvCurrency(sensitivityResult.churnReduced1Percent.ltv, currency)} (+${sensitivityResult.churnReduced1Percent.percentageGain}%)\n` +
        `Churn -2% Impact: ${formatLtvCurrency(sensitivityResult.churnReduced2Percent.ltv, currency)} (+${sensitivityResult.churnReduced2Percent.percentageGain}%)\n` +
        `ARPU +10% Impact: ${formatLtvCurrency(sensitivityResult.arpuIncreased10Percent.ltv, currency)} (+${sensitivityResult.arpuIncreased10Percent.percentageGain}%)\n` +
        `ARPU +20% Impact: ${formatLtvCurrency(sensitivityResult.arpuIncreased20Percent.ltv, currency)} (+${sensitivityResult.arpuIncreased20Percent.percentageGain}%)\n` +
        `Margin +5% Impact: ${formatLtvCurrency(sensitivityResult.marginIncreased5Percent.ltv, currency)} (+${sensitivityResult.marginIncreased5Percent.percentageGain}%)`;
    }

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download CSV
  const handleDownloadCSV = () => {
    let csv = "";
    if (activeTab === "saas") {
      csv = "Metric,Value\n" +
        `"Monthly ARPU",${saasResult.arpuMonthly}\n` +
        `"Gross Margin %",${saasResult.grossMarginPercent}%\n` +
        `"Monthly Churn %",${saasResult.monthlyChurnPercent}%\n` +
        `"Net Revenue Retention (NRR)",${saasResult.netRevenueRetentionPercent}%\n` +
        `"Lifespan (Months)",${saasResult.customerLifespanMonths}\n` +
        `"Undiscounted LTV",${saasResult.undiscountedLtv}\n` +
        `"Discounted NPV LTV",${saasResult.discountedNpvLtv}\n` +
        `"LTV:CAC Ratio",${saasResult.ltvToCacRatio}x\n` +
        `"Payback (Months)",${saasResult.paybackMonths}\n`;
    } else if (activeTab === "ecommerce") {
      csv = "Metric,Value\n" +
        `"Average Order Value (AOV)",${ecomResult.averageOrderValue}\n` +
        `"Purchase Frequency (Orders/Year)",${ecomResult.purchaseFrequencyPerYear}\n` +
        `"Customer Lifespan (Years)",${ecomResult.customerLifespanYears}\n` +
        `"Lifetime Revenue",${ecomResult.lifetimeRevenue}\n` +
        `"Customer LTV",${ecomResult.ltv}\n` +
        `"Max Allowable CAC",${ecomResult.maxAllowableCac}\n`;
    } else if (activeTab === "tiers") {
      csv = "Tier,Customer Count,Share of Customers %,Monthly ARPU,Churn %,LTV,Total Equity,Equity Share %\n" +
        tierResult.tiers
          .map((t) => `"${t.tierName}",${t.customerCount},${t.customerSharePercent}%,${t.arpuMonthly},${t.monthlyChurnPercent}%,${t.tierLtv},${t.tierAggregateEquity},${t.equitySharePercent}%`)
          .join("\n");
    } else {
      csv = "Scenario,New LTV,Percentage Gain\n" +
        `"Base LTV",${sensitivityResult.baseLtv},0%\n` +
        `"Churn -1%",${sensitivityResult.churnReduced1Percent.ltv},+${sensitivityResult.churnReduced1Percent.percentageGain}%\n` +
        `"Churn -2%",${sensitivityResult.churnReduced2Percent.ltv},+${sensitivityResult.churnReduced2Percent.percentageGain}%\n` +
        `"ARPU +10%",${sensitivityResult.arpuIncreased10Percent.ltv},+${sensitivityResult.arpuIncreased10Percent.percentageGain}%\n` +
        `"ARPU +20%",${sensitivityResult.arpuIncreased20Percent.ltv},+${sensitivityResult.arpuIncreased20Percent.percentageGain}%\n` +
        `"Gross Margin +5%",${sensitivityResult.marginIncreased5Percent.ltv},+${sensitivityResult.marginIncreased5Percent.percentageGain}%\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ltv_${activeTab}_analysis.csv`;
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
          {LTV_PRESETS.map((preset) => (
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
          onClick={() => setActiveTab("saas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "saas"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>SaaS Recurring LTV</span>
        </button>

        <button
          onClick={() => setActiveTab("ecommerce")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "ecommerce"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>E-Commerce Transactional LTV</span>
        </button>

        <button
          onClick={() => setActiveTab("tiers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "tiers"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Tiers & Cohorts</span>
        </button>

        <button
          onClick={() => setActiveTab("sensitivity")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "sensitivity"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>What-If Sensitivity Modeler</span>
        </button>
      </div>

      {/* TAB 1: SAAS RECURRING LTV */}
      {activeTab === "saas" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Inputs */}
          <div className="xl:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Subscription Unit Parameters
              </span>
              <button
                onClick={() =>
                  setSaasInput({
                    arpuMonthly: 150,
                    grossMarginPercent: 80,
                    monthlyChurnPercent: 2.2,
                    monthlyExpansionPercent: 0.8,
                    annualDiscountRatePercent: 10,
                    estimatedCac: 800,
                  })
                }
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">
                  Average Monthly Revenue per User (ARPU) ({SUPPORTED_CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={saasInput.arpuMonthly}
                  onChange={(e) => setSaasInput((prev) => ({ ...prev, arpuMonthly: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">Gross Margin (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={saasInput.grossMarginPercent}
                    onChange={(e) =>
                      setSaasInput((prev) => ({ ...prev, grossMarginPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">Monthly Churn (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={saasInput.monthlyChurnPercent}
                    onChange={(e) =>
                      setSaasInput((prev) => ({ ...prev, monthlyChurnPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">Monthly Expansion / Upsell (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={saasInput.monthlyExpansionPercent}
                    onChange={(e) =>
                      setSaasInput((prev) => ({ ...prev, monthlyExpansionPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                    placeholder="0.8"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">Annual WACC Discount (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={saasInput.annualDiscountRatePercent}
                    onChange={(e) =>
                      setSaasInput((prev) => ({ ...prev, annualDiscountRatePercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">
                  Estimated Customer Acquisition Cost (CAC) ({SUPPORTED_CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={saasInput.estimatedCac ?? ""}
                  onChange={(e) =>
                    setSaasInput((prev) => ({ ...prev, estimatedCac: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                  placeholder="Optional for LTV:CAC comparison..."
                />
              </div>
            </div>
          </div>

          {/* Right Outputs */}
          <div className="xl:col-span-7 flex flex-col gap-6 sticky top-20">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Customer LTV</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {formatLtvCurrency(saasResult.undiscountedLtv, currency)}
                </span>
                <span className="text-[10px] text-text-muted">
                  NPV: {formatLtvCurrency(saasResult.discountedNpvLtv, currency)}
                </span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Customer Lifespan</span>
                <span className="text-xl font-black font-mono text-primary">
                  {saasResult.customerLifespanMonths.toFixed(1)} Mos
                </span>
                <span className="text-[10px] text-text-muted">
                  {(saasResult.customerLifespanMonths / 12).toFixed(1)} Years
                </span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Net Retention (NRR)</span>
                <span
                  className={`text-xl font-black font-mono ${
                    saasResult.netRevenueRetentionPercent >= 100 ? "text-blue-400" : "text-amber-400"
                  }`}
                >
                  {saasResult.netRevenueRetentionPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-text-muted">Annual Compound</span>
              </div>

              <div
                className={`border p-3.5 rounded-xl shadow-card flex flex-col gap-1 ${
                  saasResult.ltvToCacRatio >= 3.0
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : saasResult.ltvToCacRatio >= 1.0
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "bg-surface border-border"
                }`}
              >
                <span className="text-[11px] text-text-muted">LTV:CAC Ratio</span>
                <span
                  className={`text-xl font-black font-mono ${
                    saasResult.ltvToCacRatio >= 3.0
                      ? "text-emerald-400"
                      : saasResult.ltvToCacRatio >= 1.0
                      ? "text-amber-400"
                      : "text-text-primary"
                  }`}
                >
                  {saasResult.ltvToCacRatio > 0 ? `${saasResult.ltvToCacRatio.toFixed(1)}x` : "—"}
                </span>
                <span className="text-[10px] text-text-muted">
                  {saasResult.paybackMonths > 0 ? `${saasResult.paybackMonths.toFixed(1)} Mo Payback` : "Target: 3x+"}
                </span>
              </div>
            </div>

            {/* Diagnostic Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
                saasResult.diagnostic.status === "exceptional" || saasResult.diagnostic.status === "healthy"
                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                  : saasResult.diagnostic.status === "suboptimal"
                  ? "bg-amber-950/20 border-amber-500/40 text-amber-300"
                  : "bg-red-950/20 border-red-500/40 text-red-300"
              }`}
            >
              {saasResult.diagnostic.status === "critical" ? (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-bold text-sm">{saasResult.diagnostic.headline}</span>
                <p className="text-text-secondary leading-relaxed">{saasResult.diagnostic.description}</p>
              </div>
            </div>

            {/* Metric Breakdown Card */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Financial Value Breakdown
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/40 text-text-secondary">
                  <span>Monthly Gross Profit / User</span>
                  <span className="font-mono font-bold text-text-primary">
                    {formatLtvCurrency(saasResult.monthlyGrossProfitPerUser, currency)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-border/40 text-text-secondary">
                  <span>Annualized Logo Churn</span>
                  <span className="font-mono font-bold text-text-primary">
                    {saasResult.annualizedChurnPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-border/40 text-text-secondary">
                  <span>Lifetime Gross Revenue</span>
                  <span className="font-mono font-bold text-text-primary">
                    {formatLtvCurrency(saasResult.undiscountedLifetimeRevenue, currency)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-border/40 text-text-secondary">
                  <span>Discounted NPV (10% WACC)</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatLtvCurrency(saasResult.discountedNpvLtv, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: E-COMMERCE TRANSACTIONAL LTV */}
      {activeTab === "ecommerce" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Inputs */}
          <div className="xl:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 shadow-card">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              DTC / Retail Order Parameters
            </span>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">
                  Average Order Value (AOV) ({SUPPORTED_CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={ecomInput.averageOrderValue}
                  onChange={(e) =>
                    setEcomInput((prev) => ({ ...prev, averageOrderValue: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">Orders Per Year</label>
                  <input
                    type="number"
                    step="any"
                    value={ecomInput.purchaseFrequencyPerYear}
                    onChange={(e) =>
                      setEcomInput((prev) => ({
                        ...prev,
                        purchaseFrequencyPerYear: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">Customer Lifespan (Yrs)</label>
                  <input
                    type="number"
                    step="any"
                    value={ecomInput.customerLifespanYears}
                    onChange={(e) =>
                      setEcomInput((prev) => ({ ...prev, customerLifespanYears: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">Gross Margin (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={ecomInput.grossMarginPercent}
                    onChange={(e) =>
                      setEcomInput((prev) => ({ ...prev, grossMarginPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">Repeat Purchase Rate (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={ecomInput.repeatPurchaseRatePercent ?? ""}
                    onChange={(e) =>
                      setEcomInput((prev) => ({
                        ...prev,
                        repeatPurchaseRatePercent: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                    placeholder="e.g. 40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Outputs */}
          <div className="xl:col-span-7 flex flex-col gap-6 sticky top-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Customer LTV</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatLtvCurrency(ecomResult.ltv, currency)}
                </span>
                <span className="text-[10px] text-text-muted">Gross Profit Over Lifespan</span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Max Allowable CAC</span>
                <span className="text-2xl font-black font-mono text-primary">
                  {formatLtvCurrency(ecomResult.maxAllowableCac, currency)}
                </span>
                <span className="text-[10px] text-text-muted">Based on 3.0x Target Ratio</span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Lifetime Orders</span>
                <span className="text-2xl font-black font-mono text-blue-400">
                  {ecomResult.totalLifetimeOrders} Orders
                </span>
                <span className="text-[10px] text-text-muted">
                  {ecomResult.purchaseFrequencyPerYear} Orders / Year
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                E-Commerce Revenue & Margin Progression
              </span>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/40 text-text-secondary">
                  <span>Gross Profit per Single Order</span>
                  <span className="font-mono font-bold text-text-primary">
                    {formatLtvCurrency(ecomResult.grossProfitPerOrder, currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40 text-text-secondary">
                  <span>Annual Revenue per Customer</span>
                  <span className="font-mono font-bold text-text-primary">
                    {formatLtvCurrency(ecomResult.annualRevenuePerCustomer, currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40 text-text-secondary">
                  <span>Lifetime Top-Line Revenue</span>
                  <span className="font-mono font-bold text-text-primary">
                    {formatLtvCurrency(ecomResult.lifetimeRevenue, currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold text-text-primary">
                  <span>Cumulative Customer LTV</span>
                  <span className="font-mono text-emerald-400 font-black">
                    {formatLtvCurrency(ecomResult.ltv, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER TIERS & COHORT DECAY */}
      {activeTab === "tiers" && (
        <div className="flex flex-col gap-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-border p-4 rounded-xl shadow-card flex flex-col gap-1">
              <span className="text-xs text-text-muted">Total Customer Base</span>
              <span className="text-2xl font-black font-mono text-text-primary">
                {tierResult.totalCustomers.toLocaleString()} Accounts
              </span>
            </div>

            <div className="bg-surface border border-border p-4 rounded-xl shadow-card flex flex-col gap-1">
              <span className="text-xs text-text-muted">Total Customer Base Equity ($)</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formatLtvCurrency(tierResult.totalCustomerEquity, currency)}
              </span>
            </div>

            <div className="bg-surface border border-border p-4 rounded-xl shadow-card flex flex-col gap-1">
              <span className="text-xs text-text-muted">Blended Average LTV</span>
              <span className="text-2xl font-black font-mono text-primary">
                {formatLtvCurrency(tierResult.blendedLtv, currency)}
              </span>
            </div>
          </div>

          {/* Customer Tier Segmentation Table */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                  Customer Tier Segmentation Matrix
                </span>
                <span className="text-[11px] text-text-muted">
                  Segment your users by pricing plan to uncover equity concentration.
                </span>
              </div>

              <button
                onClick={handleAddTier}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tier
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-[11px]">
                    <th className="py-2.5 px-3">Tier Name</th>
                    <th className="py-2.5 px-3">Customers</th>
                    <th className="py-2.5 px-3">Monthly ARPU</th>
                    <th className="py-2.5 px-3">Churn %</th>
                    <th className="py-2.5 px-3 text-right">Tier LTV</th>
                    <th className="py-2.5 px-3 text-right">Total Equity</th>
                    <th className="py-2.5 px-3 text-right">Equity Share</th>
                    <th className="py-2.5 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {tierResult.tiers.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-raised">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={t.tierName}
                          onChange={(e) => handleTierChange(t.id, "tierName", e.target.value)}
                          className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-semibold text-text-primary"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="1"
                          value={t.customerCount}
                          onChange={(e) => handleTierChange(t.id, "customerCount", parseInt(e.target.value) || 0)}
                          className="w-24 bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text-primary"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="any"
                          value={t.arpuMonthly}
                          onChange={(e) => handleTierChange(t.id, "arpuMonthly", parseFloat(e.target.value) || 0)}
                          className="w-24 bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text-primary"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="any"
                          value={t.monthlyChurnPercent}
                          onChange={(e) =>
                            handleTierChange(t.id, "monthlyChurnPercent", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text-primary text-center"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary">
                        {formatLtvCurrency(t.tierLtv, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatLtvCurrency(t.tierAggregateEquity, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-primary font-bold">
                        {t.equitySharePercent}%
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleRemoveTier(t.id)}
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

          {/* Cohort Decay Table */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Cohort Retention Decay & Cumulative Value Milestones
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-[11px]">
                    <th className="py-2 px-3">Milestone</th>
                    <th className="py-2 px-3 text-center">Cohort Survival Rate</th>
                    <th className="py-2 px-3 text-right">Cumulative Revenue / User</th>
                    <th className="py-2 px-3 text-right">Cumulative Gross Profit / User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {cohortMilestones.map((m) => (
                    <tr key={m.month} className="hover:bg-surface-raised">
                      <td className="py-2.5 px-3 font-bold text-text-primary">
                        Month {m.month} {m.month >= 12 ? `(${m.month / 12} Yrs)` : ""}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-blue-400 font-semibold">
                        {m.activeCustomerRatePercent.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                        {formatLtvCurrency(m.cumulativeRevenuePerUser, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatLtvCurrency(m.cumulativeGrossProfitPerUser, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WHAT-IF SENSITIVITY MODELER */}
      {activeTab === "sensitivity" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-6 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 shadow-card">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              LTV Sensitivity Drivers
            </span>

            <p className="text-xs text-text-secondary leading-relaxed">
              Customer Lifetime Value is mathematically governed by 3 levers: <strong>Churn</strong>,{" "}
              <strong>ARPU</strong>, and <strong>Gross Margin</strong>. Small optimizations in churn or pricing compound
              dramatically on long-term equity.
            </p>

            <div className="p-4 bg-surface-raised border border-border rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">Current Baseline LTV:</span>
              <span className="text-xl font-black font-mono text-text-primary">
                {formatLtvCurrency(sensitivityResult.baseLtv, currency)}
              </span>
            </div>
          </div>

          <div className="xl:col-span-6 flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 shadow-card">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              What-If Optimization Scenarios
            </span>

            <div className="flex flex-col gap-3">
              {/* Churn -1% */}
              <div className="p-3.5 bg-surface-raised border border-border rounded-xl flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary">Reduce Monthly Churn by 1.0%</span>
                  <span className="text-[11px] text-text-muted">Improves retention & customer lifespan</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black font-mono text-emerald-400">
                    {formatLtvCurrency(sensitivityResult.churnReduced1Percent.ltv, currency)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">
                    +{sensitivityResult.churnReduced1Percent.percentageGain}% LTV Gain
                  </span>
                </div>
              </div>

              {/* Churn -2% */}
              <div className="p-3.5 bg-surface-raised border border-border rounded-xl flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary">Reduce Monthly Churn by 2.0%</span>
                  <span className="text-[11px] text-text-muted">Targeted onboarding & CSM programs</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black font-mono text-emerald-400">
                    {formatLtvCurrency(sensitivityResult.churnReduced2Percent.ltv, currency)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">
                    +{sensitivityResult.churnReduced2Percent.percentageGain}% LTV Gain
                  </span>
                </div>
              </div>

              {/* ARPU +10% */}
              <div className="p-3.5 bg-surface-raised border border-border rounded-xl flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary">Increase ARPU by 10%</span>
                  <span className="text-[11px] text-text-muted">Value metric expansion or price adjustment</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black font-mono text-blue-400">
                    {formatLtvCurrency(sensitivityResult.arpuIncreased10Percent.ltv, currency)}
                  </span>
                  <span className="text-[10px] font-bold text-blue-500">
                    +{sensitivityResult.arpuIncreased10Percent.percentageGain}% LTV Gain
                  </span>
                </div>
              </div>

              {/* ARPU +20% */}
              <div className="p-3.5 bg-surface-raised border border-border rounded-xl flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary">Increase ARPU by 20%</span>
                  <span className="text-[11px] text-text-muted">Feature tiering and enterprise add-ons</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black font-mono text-blue-400">
                    {formatLtvCurrency(sensitivityResult.arpuIncreased20Percent.ltv, currency)}
                  </span>
                  <span className="text-[10px] font-bold text-blue-500">
                    +{sensitivityResult.arpuIncreased20Percent.percentageGain}% LTV Gain
                  </span>
                </div>
              </div>

              {/* Gross Margin +5% */}
              <div className="p-3.5 bg-surface-raised border border-border rounded-xl flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary">Expand Gross Margin by 5%</span>
                  <span className="text-[11px] text-text-muted">Cloud hosting & support infrastructure optimization</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black font-mono text-primary">
                    {formatLtvCurrency(sensitivityResult.marginIncreased5Percent.ltv, currency)}
                  </span>
                  <span className="text-[10px] font-bold text-primary">
                    +{sensitivityResult.marginIncreased5Percent.percentageGain}% LTV Gain
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
