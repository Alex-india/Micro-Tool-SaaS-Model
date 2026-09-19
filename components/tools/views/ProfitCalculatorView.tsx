"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  SUPPORTED_CURRENCIES,
  formatProfitCurrency,
  ProfitWaterfallInput,
  calculateProfitWaterfall,
  UnitEconomicsInput,
  calculateUnitEconomics,
  EcommerceOrderInput,
  calculateEcommerceOrderProfit,
  PROFIT_PRESETS,
  ProfitPreset,
} from "@/tools/business/profitEngine";
import {
  TrendingUp,
  DollarSign,
  Layers,
  ShoppingBag,
  Percent,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  HelpCircle,
} from "lucide-react";

export interface ProfitCalculatorViewProps {
  tool: ToolMeta;
}

export const ProfitCalculatorView: React.FC<ProfitCalculatorViewProps> = ({ tool }) => {
  // Mode selection: "waterfall" | "unit" | "ecommerce"
  const [activeTab, setActiveTab] = useState<"waterfall" | "unit" | "ecommerce">(() => {
    if (tool.slug.includes("markup")) return "unit";
    if (tool.slug.includes("ecommerce")) return "ecommerce";
    return "waterfall";
  });

  const [currency, setCurrency] = useState<string>("USD");
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Waterfall Inputs State
  const [waterfallInput, setWaterfallInput] = useState<ProfitWaterfallInput>({
    revenue: 1000000,
    cogs: 350000,
    operatingExpenses: {
      salesMarketing: 200000,
      researchDev: 120000,
      generalAdmin: 80000,
      rentUtilities: 30000,
      otherOpex: 20000,
    },
    depreciationAmortization: 25000,
    interestExpense: 15000,
    taxRatePercent: 21,
  });

  // 2. Unit Economics Inputs State
  const [unitInput, setUnitInput] = useState<UnitEconomicsInput>({
    mode: "forward",
    costPrice: 40,
    sellingPrice: 100,
    targetMarginPercent: 60,
    targetMarkupPercent: 150,
  });

  // 3. E-Commerce DTC Inputs State
  const [ecommerceInput, setEcommerceInput] = useState<EcommerceOrderInput>({
    retailPrice: 75,
    cogs: 22,
    paymentGatewayFeePercent: 2.9,
    paymentGatewayFixedFee: 0.3,
    platformCommissionPercent: 0,
    shippingCost: 7.5,
    fulfillmentCost: 2.5,
    adSpendPerOrder: 18,
    returnRatePercent: 4,
  });

  // Calculations
  const waterfallResult = useMemo(
    () => calculateProfitWaterfall(waterfallInput),
    [waterfallInput]
  );

  const unitResult = useMemo(
    () => calculateUnitEconomics(unitInput),
    [unitInput]
  );

  const ecommerceResult = useMemo(
    () => calculateEcommerceOrderProfit(ecommerceInput),
    [ecommerceInput]
  );

  // Preset Loader
  const handleLoadPreset = (preset: ProfitPreset) => {
    setCurrency(preset.currency);
    setWaterfallInput(preset.waterfall);
    setUnitInput(preset.unit);
    setEcommerceInput(preset.ecommerce);
  };

  // Copy Summary
  const handleCopySummary = () => {
    let summary = "";
    if (activeTab === "waterfall") {
      summary = `P&L PROFIT WATERFALL STATEMENT (${currency})\n` +
        `----------------------------------------\n` +
        `Gross Revenue: ${formatProfitCurrency(waterfallResult.revenue, currency)}\n` +
        `Cost of Goods Sold: -${formatProfitCurrency(waterfallResult.cogs, currency)}\n` +
        `Gross Profit: ${formatProfitCurrency(waterfallResult.grossProfit, currency)} (${waterfallResult.grossMarginPercent.toFixed(1)}%)\n` +
        `Total OPEX: -${formatProfitCurrency(waterfallResult.totalOpex, currency)}\n` +
        `EBITDA: ${formatProfitCurrency(waterfallResult.ebitda, currency)} (${waterfallResult.ebitdaMarginPercent.toFixed(1)}%)\n` +
        `Operating Profit (EBIT): ${formatProfitCurrency(waterfallResult.operatingProfit, currency)} (${waterfallResult.operatingMarginPercent.toFixed(1)}%)\n` +
        `Income Tax: -${formatProfitCurrency(waterfallResult.incomeTax, currency)}\n` +
        `Net Profit (Bottom Line): ${formatProfitCurrency(waterfallResult.netProfit, currency)} (${waterfallResult.netMarginPercent.toFixed(1)}%)\n` +
        `Health: ${waterfallResult.health.headline}`;
    } else if (activeTab === "unit") {
      summary = `UNIT ECONOMICS & MARGIN ANALYSIS (${currency})\n` +
        `----------------------------------------\n` +
        `Cost Price: ${formatProfitCurrency(unitResult.costPrice, currency)}\n` +
        `Selling Price: ${formatProfitCurrency(unitResult.sellingPrice, currency)}\n` +
        `Profit per Unit: ${formatProfitCurrency(unitResult.profitPerUnit, currency)}\n` +
        `Gross Margin: ${unitResult.grossMarginPercent.toFixed(1)}%\n` +
        `Markup: ${unitResult.markupPercent.toFixed(1)}%`;
    } else {
      summary = `E-COMMERCE ORDER PROFITABILITY (${currency})\n` +
        `----------------------------------------\n` +
        `Retail Price: ${formatProfitCurrency(ecommerceResult.retailPrice, currency)}\n` +
        `Landed COGS: -${formatProfitCurrency(ecommerceResult.cogs, currency)}\n` +
        `Payment & Platform Fees: -${formatProfitCurrency(ecommerceResult.paymentFee + ecommerceResult.platformFee, currency)}\n` +
        `Shipping & Fulfillment: -${formatProfitCurrency(ecommerceResult.shippingAndFulfillment, currency)}\n` +
        `Ad Spend (CAC): -${formatProfitCurrency(ecommerceResult.adSpend, currency)}\n` +
        `Net Profit per Order: ${formatProfitCurrency(ecommerceResult.netProfitPerOrder, currency)} (${ecommerceResult.netMarginPercent.toFixed(1)}%)\n` +
        `Max Break-Even CPA: ${formatProfitCurrency(ecommerceResult.maxBreakevenAdSpend, currency)}`;
    }

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download CSV Statement
  const handleDownloadCSV = () => {
    let csv = "";
    if (activeTab === "waterfall") {
      csv = "Stage,Amount,Percentage of Revenue,Description\n" +
        waterfallResult.waterfallStages
          .map((s) => `"${s.name}",${s.amount},${s.percentageOfRevenue.toFixed(2)}%,"${s.description}"`)
          .join("\n");
    } else if (activeTab === "unit") {
      csv = "Units,Total Revenue,Total Cost,Total Profit,Margin %\n" +
        unitResult.volumeTiers
          .map((t) => `${t.units},${t.totalRevenue},${t.totalCost},${t.totalProfit},${t.marginPercent.toFixed(2)}%`)
          .join("\n");
    } else {
      csv = "Item,Amount\n" +
        `"Retail Price",${ecommerceResult.retailPrice}\n` +
        `"COGS",${ecommerceResult.cogs}\n` +
        `"Payment Processing",${ecommerceResult.paymentFee}\n` +
        `"Platform Commission",${ecommerceResult.platformFee}\n` +
        `"Shipping & Pick/Pack",${ecommerceResult.shippingAndFulfillment}\n` +
        `"Ad Spend (CAC)",${ecommerceResult.adSpend}\n` +
        `"Return Allowance",${ecommerceResult.returnAllowance}\n` +
        `"Net Profit",${ecommerceResult.netProfitPerOrder}\n` +
        `"Net Margin %",${ecommerceResult.netMarginPercent.toFixed(2)}%\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profit_${activeTab}_analysis.csv`;
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
          {PROFIT_PRESETS.map((preset) => (
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
          onClick={() => setActiveTab("waterfall")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "waterfall"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>P&L Profit Waterfall</span>
        </button>

        <button
          onClick={() => setActiveTab("unit")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "unit"
              ? "bg-primary text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Unit Margin & Markup Solver</span>
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
          <span>E-Commerce DTC Order Profit</span>
        </button>
      </div>

      {/* TAB 1: P&L PROFIT WATERFALL */}
      {activeTab === "waterfall" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input Form */}
          <div className="xl:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Income Statement Inputs
              </span>
              <button
                onClick={() =>
                  setWaterfallInput({
                    revenue: 1000000,
                    cogs: 400000,
                    operatingExpenses: { salesMarketing: 150000, researchDev: 100000, generalAdmin: 60000, rentUtilities: 30000, otherOpex: 10000 },
                    depreciationAmortization: 20000,
                    interestExpense: 10000,
                    taxRatePercent: 21,
                  })
                }
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Revenue & COGS */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">
                  Gross Top-Line Revenue ({SUPPORTED_CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={waterfallInput.revenue}
                  onChange={(e) =>
                    setWaterfallInput((prev) => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-primary">
                    Cost of Goods Sold (COGS) ({SUPPORTED_CURRENCIES[currency]?.symbol})
                  </label>
                  <span className="text-[11px] font-mono text-text-muted">
                    {waterfallResult.revenue > 0
                      ? `${((waterfallInput.cogs / waterfallResult.revenue) * 100).toFixed(1)}% of Rev`
                      : ""}
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={waterfallInput.cogs}
                  onChange={(e) =>
                    setWaterfallInput((prev) => ({ ...prev, cogs: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Operating Expenses (OPEX) */}
            <div className="flex flex-col gap-3 p-4 bg-surface-raised border border-border rounded-xl">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-xs font-bold text-text-primary uppercase">Operating Expenses (OPEX)</span>
                <span className="text-xs font-mono font-bold text-text-primary">
                  {formatProfitCurrency(waterfallResult.totalOpex, currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">Sales & Marketing</label>
                  <input
                    type="number"
                    step="any"
                    value={waterfallInput.operatingExpenses.salesMarketing}
                    onChange={(e) =>
                      setWaterfallInput((prev) => ({
                        ...prev,
                        operatingExpenses: { ...prev.operatingExpenses, salesMarketing: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">R&D / Engineering</label>
                  <input
                    type="number"
                    step="any"
                    value={waterfallInput.operatingExpenses.researchDev}
                    onChange={(e) =>
                      setWaterfallInput((prev) => ({
                        ...prev,
                        operatingExpenses: { ...prev.operatingExpenses, researchDev: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">General & Admin (G&A)</label>
                  <input
                    type="number"
                    step="any"
                    value={waterfallInput.operatingExpenses.generalAdmin}
                    onChange={(e) =>
                      setWaterfallInput((prev) => ({
                        ...prev,
                        operatingExpenses: { ...prev.operatingExpenses, generalAdmin: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">Rent & Utilities</label>
                  <input
                    type="number"
                    step="any"
                    value={waterfallInput.operatingExpenses.rentUtilities}
                    onChange={(e) =>
                      setWaterfallInput((prev) => ({
                        ...prev,
                        operatingExpenses: { ...prev.operatingExpenses, rentUtilities: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Below the Line: D&A, Interest & Tax */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">D&A</label>
                <input
                  type="number"
                  step="any"
                  value={waterfallInput.depreciationAmortization}
                  onChange={(e) =>
                    setWaterfallInput((prev) => ({
                      ...prev,
                      depreciationAmortization: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">Interest Expense</label>
                <input
                  type="number"
                  step="any"
                  value={waterfallInput.interestExpense}
                  onChange={(e) =>
                    setWaterfallInput((prev) => ({
                      ...prev,
                      interestExpense: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">Tax Rate (%)</label>
                <input
                  type="number"
                  step="any"
                  value={waterfallInput.taxRatePercent}
                  onChange={(e) =>
                    setWaterfallInput((prev) => ({
                      ...prev,
                      taxRatePercent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Waterfall Analytics & Health Display */}
          <div className="xl:col-span-7 flex flex-col gap-6 sticky top-20">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Gross Profit</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {formatProfitCurrency(waterfallResult.grossProfit, currency)}
                </span>
                <span className="text-[11px] font-semibold text-emerald-500">
                  {waterfallResult.grossMarginPercent.toFixed(1)}% Margin
                </span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">EBITDA</span>
                <span className="text-lg font-black font-mono text-blue-400">
                  {formatProfitCurrency(waterfallResult.ebitda, currency)}
                </span>
                <span className="text-[11px] font-semibold text-blue-500">
                  {waterfallResult.ebitdaMarginPercent.toFixed(1)}% Margin
                </span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Operating Profit</span>
                <span className="text-lg font-black font-mono text-indigo-400">
                  {formatProfitCurrency(waterfallResult.operatingProfit, currency)}
                </span>
                <span className="text-[11px] font-semibold text-indigo-500">
                  {waterfallResult.operatingMarginPercent.toFixed(1)}% Margin
                </span>
              </div>

              <div
                className={`border p-3.5 rounded-xl shadow-card flex flex-col gap-1 ${
                  waterfallResult.netProfit >= 0
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : "bg-red-950/20 border-red-500/30"
                }`}
              >
                <span className="text-[11px] text-text-muted">Net Profit (Bottom Line)</span>
                <span
                  className={`text-lg font-black font-mono ${
                    waterfallResult.netProfit >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatProfitCurrency(waterfallResult.netProfit, currency)}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    waterfallResult.netProfit >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {waterfallResult.netMarginPercent.toFixed(1)}% Net Margin
                </span>
              </div>
            </div>

            {/* Financial Health Assessment Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
                waterfallResult.health.status === "excellent"
                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                  : waterfallResult.health.status === "healthy"
                  ? "bg-blue-950/20 border-blue-500/40 text-blue-300"
                  : waterfallResult.health.status === "caution"
                  ? "bg-amber-950/20 border-amber-500/40 text-amber-300"
                  : "bg-red-950/20 border-red-500/40 text-red-300"
              }`}
            >
              {waterfallResult.health.status === "critical" || waterfallResult.health.status === "caution" ? (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-bold text-sm">{waterfallResult.health.headline}</span>
                {waterfallResult.health.insights.map((insight, i) => (
                  <p key={i} className="text-text-secondary leading-relaxed">
                    {insight}
                  </p>
                ))}
              </div>
            </div>

            {/* Waterfall Step-Down Table / Cards */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Step-Down Profit Waterfall Stages
                </span>
                <span className="text-[11px] text-text-muted">
                  Cost-to-Income: {waterfallResult.costToIncomeRatio.toFixed(1)}%
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {waterfallResult.waterfallStages.map((stage) => {
                  const isPositive = stage.type === "positive";
                  const isNegative = stage.type === "negative";
                  const isSubtotal = stage.type === "subtotal";
                  const isFinal = stage.type === "final";

                  return (
                    <div
                      key={stage.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                        isFinal
                          ? stage.amount >= 0
                            ? "bg-emerald-950/30 border-emerald-500/40 font-bold"
                            : "bg-red-950/30 border-red-500/40 font-bold"
                          : isSubtotal
                          ? "bg-surface-raised border-border font-semibold text-text-primary"
                          : "bg-surface/50 border-border/40 text-text-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isPositive && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
                        {isNegative && <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                        {isSubtotal && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                        {isFinal && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                        <div className="flex flex-col">
                          <span className={isFinal ? "text-sm text-text-primary" : ""}>{stage.name}</span>
                          <span className="text-[10px] text-text-muted">{stage.description}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <span className="font-mono text-[11px] text-text-muted w-16">
                          {stage.percentageOfRevenue.toFixed(1)}%
                        </span>
                        <span
                          className={`font-mono text-xs ${
                            isNegative
                              ? "text-red-400"
                              : isFinal
                              ? stage.amount >= 0
                                ? "text-emerald-400 text-sm font-black"
                                : "text-red-400 text-sm font-black"
                              : "text-text-primary"
                          }`}
                        >
                          {isNegative ? "-" : ""}
                          {formatProfitCurrency(Math.abs(stage.amount), currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNIT MARGIN & MARKUP SOLVER */}
      {activeTab === "unit" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Mode Selector & Inputs */}
          <div className="xl:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 shadow-card">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Unit Economics Configuration
            </span>

            {/* Mode Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Calculation Mode</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-raised border border-border rounded-xl text-xs font-medium">
                <button
                  onClick={() => setUnitInput((prev) => ({ ...prev, mode: "forward" }))}
                  className={`py-2 px-2 rounded-lg transition-all text-center ${
                    unitInput.mode === "forward" ? "bg-primary text-white font-bold" : "text-text-secondary"
                  }`}
                >
                  Cost + Sell
                </button>
                <button
                  onClick={() => setUnitInput((prev) => ({ ...prev, mode: "target_margin" }))}
                  className={`py-2 px-2 rounded-lg transition-all text-center ${
                    unitInput.mode === "target_margin" ? "bg-primary text-white font-bold" : "text-text-secondary"
                  }`}
                >
                  Target Margin
                </button>
                <button
                  onClick={() => setUnitInput((prev) => ({ ...prev, mode: "target_markup" }))}
                  className={`py-2 px-2 rounded-lg transition-all text-center ${
                    unitInput.mode === "target_markup" ? "bg-primary text-white font-bold" : "text-text-secondary"
                  }`}
                >
                  Target Markup
                </button>
              </div>
            </div>

            {/* Input Fields */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">
                  Unit Cost Price (COGS) ({SUPPORTED_CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={unitInput.costPrice}
                  onChange={(e) => setUnitInput((prev) => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {unitInput.mode === "forward" && (
                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 block">
                    Unit Selling Price ({SUPPORTED_CURRENCIES[currency]?.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={unitInput.sellingPrice ?? ""}
                    onChange={(e) => setUnitInput((prev) => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {unitInput.mode === "target_margin" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text-primary">Target Gross Margin (%)</label>
                    <span className="text-xs font-mono font-bold text-primary">{unitInput.targetMarginPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="95"
                    step="0.5"
                    value={unitInput.targetMarginPercent ?? 50}
                    onChange={(e) =>
                      setUnitInput((prev) => ({ ...prev, targetMarginPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full accent-primary"
                  />
                  <input
                    type="number"
                    step="any"
                    value={unitInput.targetMarginPercent ?? ""}
                    onChange={(e) =>
                      setUnitInput((prev) => ({ ...prev, targetMarginPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full mt-2 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              )}

              {unitInput.mode === "target_markup" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text-primary">Target Markup (%)</label>
                    <span className="text-xs font-mono font-bold text-primary">{unitInput.targetMarkupPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="1"
                    value={unitInput.targetMarkupPercent ?? 100}
                    onChange={(e) =>
                      setUnitInput((prev) => ({ ...prev, targetMarkupPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full accent-primary"
                  />
                  <input
                    type="number"
                    step="any"
                    value={unitInput.targetMarkupPercent ?? ""}
                    onChange={(e) =>
                      setUnitInput((prev) => ({ ...prev, targetMarkupPercent: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full mt-2 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing Outputs & Volume Tier Projections */}
          <div className="xl:col-span-7 flex flex-col gap-6 sticky top-20">
            {/* Primary Pricing Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Calculated Price</span>
                <span className="text-xl font-black font-mono text-primary">
                  {formatProfitCurrency(unitResult.sellingPrice, currency)}
                </span>
                <span className="text-[10px] text-text-muted">Recommended Retail</span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Unit Profit</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {formatProfitCurrency(unitResult.profitPerUnit, currency)}
                </span>
                <span className="text-[10px] text-text-muted">Gain Per Unit</span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Gross Margin</span>
                <span className="text-xl font-black font-mono text-blue-400">
                  {unitResult.grossMarginPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-text-muted">Profit / Selling Price</span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Markup</span>
                <span className="text-xl font-black font-mono text-amber-400">
                  {unitResult.markupPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-text-muted">Profit / Cost Price</span>
              </div>
            </div>

            {/* Volume Order Scalability Table */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Volume Order Revenue & Profit Matrix
                </span>
                <span className="text-[11px] text-text-muted">Batch Size Scaling</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-[11px]">
                      <th className="py-2 px-2">Units</th>
                      <th className="py-2 px-2 text-right">Total Revenue</th>
                      <th className="py-2 px-2 text-right">Total Cost</th>
                      <th className="py-2 px-2 text-right">Total Profit</th>
                      <th className="py-2 px-2 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {unitResult.volumeTiers.map((tier) => (
                      <tr key={tier.units} className="hover:bg-surface-raised">
                        <td className="py-2 px-2 font-bold text-text-primary">{tier.units.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-mono text-text-secondary">
                          {formatProfitCurrency(tier.totalRevenue, currency)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-text-muted">
                          {formatProfitCurrency(tier.totalCost, currency)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-emerald-400">
                          {formatProfitCurrency(tier.totalProfit, currency)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-primary">
                          {tier.marginPercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: E-COMMERCE DTC ORDER PROFIT */}
      {activeTab === "ecommerce" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Order Unit Deductions */}
          <div className="xl:col-span-5 flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 shadow-card">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Unit Order Economics
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Retail Selling Price</label>
                <input
                  type="number"
                  step="any"
                  value={ecommerceInput.retailPrice}
                  onChange={(e) =>
                    setEcommerceInput((prev) => ({ ...prev, retailPrice: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Product COGS (Landed)</label>
                <input
                  type="number"
                  step="any"
                  value={ecommerceInput.cogs}
                  onChange={(e) =>
                    setEcommerceInput((prev) => ({ ...prev, cogs: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Payment Fee (% + Fix)</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={ecommerceInput.paymentGatewayFeePercent}
                    onChange={(e) =>
                      setEcommerceInput((prev) => ({
                        ...prev,
                        paymentGatewayFeePercent: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-1/2 bg-surface-raised border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-mono"
                    placeholder="%"
                  />
                  <input
                    type="number"
                    step="0.05"
                    value={ecommerceInput.paymentGatewayFixedFee}
                    onChange={(e) =>
                      setEcommerceInput((prev) => ({
                        ...prev,
                        paymentGatewayFixedFee: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-1/2 bg-surface-raised border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-mono"
                    placeholder="Fixed"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Platform Fee (%)</label>
                <input
                  type="number"
                  step="any"
                  value={ecommerceInput.platformCommissionPercent}
                  onChange={(e) =>
                    setEcommerceInput((prev) => ({
                      ...prev,
                      platformCommissionPercent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  placeholder="0 for Shopify, 15 for Amazon"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Shipping Carrier Cost</label>
                <input
                  type="number"
                  step="any"
                  value={ecommerceInput.shippingCost}
                  onChange={(e) =>
                    setEcommerceInput((prev) => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Pick & Pack Fulfillment</label>
                <input
                  type="number"
                  step="any"
                  value={ecommerceInput.fulfillmentCost}
                  onChange={(e) =>
                    setEcommerceInput((prev) => ({ ...prev, fulfillmentCost: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Blended Ad Spend (CPA)</label>
                <input
                  type="number"
                  step="any"
                  value={ecommerceInput.adSpendPerOrder}
                  onChange={(e) =>
                    setEcommerceInput((prev) => ({ ...prev, adSpendPerOrder: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary mb-1 block">Return / Refund Rate (%)</label>
                <input
                  type="number"
                  step="any"
                  value={ecommerceInput.returnRatePercent}
                  onChange={(e) =>
                    setEcommerceInput((prev) => ({ ...prev, returnRatePercent: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                />
              </div>
            </div>
          </div>

          {/* Right Column: E-Commerce Take-Home Profits */}
          <div className="xl:col-span-7 flex flex-col gap-6 sticky top-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Net Profit per Order</span>
                <span
                  className={`text-xl font-black font-mono ${
                    ecommerceResult.netProfitPerOrder >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatProfitCurrency(ecommerceResult.netProfitPerOrder, currency)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-500">
                  {ecommerceResult.netMarginPercent.toFixed(1)}% Real Margin
                </span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Max Break-Even CPA</span>
                <span className="text-xl font-black font-mono text-amber-400">
                  {formatProfitCurrency(ecommerceResult.maxBreakevenAdSpend, currency)}
                </span>
                <span className="text-[10px] text-text-muted">Max ad spend before losing $</span>
              </div>

              <div className="bg-surface border border-border p-3.5 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Direct Cost per Unit</span>
                <span className="text-xl font-black font-mono text-text-secondary">
                  {formatProfitCurrency(ecommerceResult.totalDirectCost, currency)}
                </span>
                <span className="text-[10px] text-text-muted">All fees, shipping & ads</span>
              </div>
            </div>

            {/* Deductions Breakdown Card */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Per-Order Fee Breakdown
              </span>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40 text-text-secondary">
                  <span>Product Landed COGS</span>
                  <span className="font-mono text-red-400">-{formatProfitCurrency(ecommerceResult.cogs, currency)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40 text-text-secondary">
                  <span>Payment Gateway Processing</span>
                  <span className="font-mono text-red-400">
                    -{formatProfitCurrency(ecommerceResult.paymentFee, currency)}
                  </span>
                </div>
                {ecommerceResult.platformFee > 0 && (
                  <div className="flex justify-between py-1 border-b border-border/40 text-text-secondary">
                    <span>Platform Commission</span>
                    <span className="font-mono text-red-400">
                      -{formatProfitCurrency(ecommerceResult.platformFee, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-border/40 text-text-secondary">
                  <span>Shipping & Pick/Pack Fulfillment</span>
                  <span className="font-mono text-red-400">
                    -{formatProfitCurrency(ecommerceResult.shippingAndFulfillment, currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40 text-text-secondary">
                  <span>Ad Spend per Order (CAC)</span>
                  <span className="font-mono text-red-400">
                    -{formatProfitCurrency(ecommerceResult.adSpend, currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40 text-text-secondary">
                  <span>Returns & Restocking Allowance</span>
                  <span className="font-mono text-red-400">
                    -{formatProfitCurrency(ecommerceResult.returnAllowance, currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold text-text-primary">
                  <span>Net Take-Home Profit</span>
                  <span
                    className={`font-mono ${
                      ecommerceResult.netProfitPerOrder >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatProfitCurrency(ecommerceResult.netProfitPerOrder, currency)}
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
