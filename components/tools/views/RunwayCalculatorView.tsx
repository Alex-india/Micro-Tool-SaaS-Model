"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  ExpenseBreakdown,
  RunwayInputs,
  calculateRunwayMetrics,
  simulateDynamicRunway,
  calculateWhatIfScenarios,
  formatRunwayCurrency,
  RUNWAY_PRESETS,
  RunwayPreset,
} from "@/tools/business/runwayEngine";
import {
  Flame,
  DollarSign,
  TrendingUp,
  TrendingDown,
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
  Building2,
  Clock,
  Zap,
  Sliders,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export interface RunwayCalculatorViewProps {
  tool: ToolMeta;
}

export const RunwayCalculatorView: React.FC<RunwayCalculatorViewProps> = ({ tool }) => {
  // Mode selection: "overview" | "expenses" | "simulation" | "scenarios"
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "simulation" | "scenarios">("overview");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [copied, setCopied] = useState<boolean>(false);

  // Core Inputs
  const [cashBalance, setCashBalance] = useState<number>(1800000);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(25000);
  const [manualGrossBurn, setManualGrossBurn] = useState<number>(115000);
  const [useItemizedExpenses, setUseItemizedExpenses] = useState<boolean>(true);

  // Itemized Expenses
  const [expenses, setExpenses] = useState<ExpenseBreakdown>({
    payroll: 75000,
    cloudCompute: 8500,
    marketing: 18000,
    saasTools: 4500,
    officeGa: 9000,
  });

  // Dynamic Simulation Inputs
  const [revenueGrowthRate, setRevenueGrowthRate] = useState<number>(6.0);
  const [expenseGrowthRate, setExpenseGrowthRate] = useState<number>(2.5);

  // Update Itemized Expense Field
  const updateExpense = (field: keyof ExpenseBreakdown, value: number) => {
    setExpenses((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  // Calculations
  const runwayInputs: RunwayInputs = useMemo(
    () => ({
      cashBalance,
      monthlyRevenue,
      grossBurn: useItemizedExpenses ? 0 : manualGrossBurn,
      expenses: useItemizedExpenses
        ? expenses
        : {
            payroll: manualGrossBurn * 0.65,
            cloudCompute: manualGrossBurn * 0.1,
            marketing: manualGrossBurn * 0.15,
            saasTools: manualGrossBurn * 0.05,
            officeGa: manualGrossBurn * 0.05,
          },
    }),
    [cashBalance, monthlyRevenue, manualGrossBurn, useItemizedExpenses, expenses]
  );

  const runwayResult = useMemo(() => calculateRunwayMetrics(runwayInputs), [runwayInputs]);

  const simulationResult = useMemo(
    () =>
      simulateDynamicRunway({
        cashBalance,
        monthlyRevenue,
        monthlyExpenses: runwayResult.grossBurn,
        monthlyRevenueGrowthRate: revenueGrowthRate,
        monthlyExpenseGrowthRate: expenseGrowthRate,
        maxMonths: 24,
      }),
    [cashBalance, monthlyRevenue, runwayResult.grossBurn, revenueGrowthRate, expenseGrowthRate]
  );

  const whatIfScenarios = useMemo(
    () => calculateWhatIfScenarios(cashBalance, monthlyRevenue, runwayInputs.expenses),
    [cashBalance, monthlyRevenue, runwayInputs.expenses]
  );

  // Preset Loader
  const loadPreset = (preset: RunwayPreset) => {
    setCashBalance(preset.cashBalance);
    setMonthlyRevenue(preset.monthlyRevenue);
    setExpenses(preset.expenses);
    setUseItemizedExpenses(true);
    setRevenueGrowthRate(preset.revenueGrowthRate);
    setExpenseGrowthRate(preset.expenseGrowthRate);
  };

  // Reset to default seed stage
  const handleReset = () => {
    loadPreset(RUNWAY_PRESETS[1]);
  };

  // Copy Executive Summary
  const handleCopySummary = () => {
    const summary = `=== ToolVerse Startup Burn Rate & Runway Analysis ===
Cash Balance: ${formatRunwayCurrency(runwayResult.cashBalance, currency)}
Monthly Revenue: ${formatRunwayCurrency(runwayResult.monthlyRevenue, currency)}
Gross Monthly Burn: ${formatRunwayCurrency(runwayResult.grossBurn, currency)}
Net Monthly Burn: ${formatRunwayCurrency(runwayResult.netBurn, currency)}
Cash Runway: ${runwayResult.isProfitable ? "Default Alive" : `${runwayResult.runwayMonths} Months (~${runwayResult.runwayDays} Days)`}
Zero Cash Date: ${runwayResult.zeroCashDate}
Fundraising Status: ${runwayResult.statusLabel} (${runwayResult.statusDescription})
Bessemer Burn Multiple: ${runwayResult.burnMultiple}x

--- Departmental Expense Breakdown ---
• Payroll & Team: ${formatRunwayCurrency(runwayInputs.expenses.payroll, currency)} (${runwayResult.expenseBreakdownSummary.find((s) => s.key === "payroll")?.percentage}%)
• Cloud & Compute: ${formatRunwayCurrency(runwayInputs.expenses.cloudCompute, currency)} (${runwayResult.expenseBreakdownSummary.find((s) => s.key === "cloudCompute")?.percentage}%)
• Marketing & Growth: ${formatRunwayCurrency(runwayInputs.expenses.marketing, currency)} (${runwayResult.expenseBreakdownSummary.find((s) => s.key === "marketing")?.percentage}%)
• SaaS & Tooling: ${formatRunwayCurrency(runwayInputs.expenses.saasTools, currency)} (${runwayResult.expenseBreakdownSummary.find((s) => s.key === "saasTools")?.percentage}%)
• Office, Legal & G&A: ${formatRunwayCurrency(runwayInputs.expenses.officeGa, currency)} (${runwayResult.expenseBreakdownSummary.find((s) => s.key === "officeGa")?.percentage}%)

--- Dynamic Forward Simulation (24 Mo) ---
Assumptions: +${revenueGrowthRate}% MoM Revenue Growth | +${expenseGrowthRate}% MoM Expense Inflation
Projected Horizon: ${simulationResult.reachedProfitability ? `Achieves Profitability in Month ${simulationResult.profitabilityMonth}` : `Exhausts Cash in Month ${simulationResult.zeroCashMonth || "24+"}`}

Generated on ToolVerse: ${window.location.href}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    let csv = "Category,Metric,Value\n";
    csv += `Overview,Cash Balance,${runwayResult.cashBalance}\n`;
    csv += `Overview,Monthly Revenue,${runwayResult.monthlyRevenue}\n`;
    csv += `Overview,Gross Monthly Burn,${runwayResult.grossBurn}\n`;
    csv += `Overview,Net Monthly Burn,${runwayResult.netBurn}\n`;
    csv += `Overview,Runway Months,${runwayResult.runwayMonths}\n`;
    csv += `Overview,Runway Days,${runwayResult.runwayDays}\n`;
    csv += `Overview,Zero Cash Date,"${runwayResult.zeroCashDate}"\n`;
    csv += `Overview,Fundraising Status,"${runwayResult.statusLabel}"\n`;
    csv += `Overview,Burn Multiple,${runwayResult.burnMultiple}\n\n`;

    csv += "Expense Category,Amount,Percentage (%)\n";
    runwayResult.expenseBreakdownSummary.forEach((s) => {
      csv += `"${s.category}",${s.amount},${s.percentage}%\n`;
    });

    csv += "\nSimulation Period,Starting Cash,Revenue,Expenses,Net Burn,Ending Cash,Status\n";
    simulationResult.months.forEach((m) => {
      csv += `"${m.monthName}",${m.startCash},${m.revenue},${m.expenses},${m.netBurn},${m.endCash},"${m.status}"\n`;
    });

    csv += "\nSurvival Action,Revised Gross Burn,Revised Net Burn,Runway Months,Months Gained,New Zero Cash Date\n";
    whatIfScenarios.forEach((s) => {
      csv += `"${s.name}",${s.revisedGrossBurn},${s.revisedNetBurn},${s.revisedRunwayMonths},+${s.monthsGained},"${s.newZeroCashDate}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `runway_analysis_${Date.now()}.csv`);
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
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {RUNWAY_PRESETS.map((preset) => (
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
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
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
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 transition-colors border border-amber-500/30"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 gap-2 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "overview"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          }`}
        >
          <Flame className="w-4 h-4" />
          Runway & Burn Overview
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "expenses"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          }`}
        >
          <Layers className="w-4 h-4" />
          Departmental Expense Breakdown
        </button>

        <button
          onClick={() => setActiveTab("simulation")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "simulation"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Dynamic Forward Simulation
        </button>

        <button
          onClick={() => setActiveTab("scenarios")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "scenarios"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          }`}
        >
          <Sliders className="w-4 h-4" />
          What-If Survival Scenarios
        </button>
      </div>

      {/* TAB 1: RUNWAY & BURN OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
              <h3 className="text-base font-semibold text-neutral-100 mb-1 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Treasury & Burn Inputs
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Enter current cash reserves in bank, recurring monthly revenue, and operational expenses.
              </p>

              <div className="space-y-4">
                {/* Cash Balance */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Current Cash in Bank (Treasury Reserves)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                      {SUPPORTED_CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={cashBalance}
                      onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Monthly Revenue */}
                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Monthly Cash Inflows (Revenue / Collections)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                      {SUPPORTED_CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950/80 border border-emerald-900/40 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Gross Burn Rate Toggle */}
                <div className="pt-2 border-t border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-neutral-300">
                      Monthly Operating Expenses (Gross Burn)
                    </label>
                    <button
                      onClick={() => setUseItemizedExpenses(!useItemizedExpenses)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {useItemizedExpenses ? "Switch to Lump Sum" : "Use Itemized Breakdown"}
                    </button>
                  </div>

                  {!useItemizedExpenses ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                        {SUPPORTED_CURRENCIES[currency].symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={manualGrossBurn}
                        onChange={(e) => setManualGrossBurn(parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Sum of Departmental Items:</span>
                      <span className="font-bold text-neutral-100">
                        {formatRunwayCurrency(runwayResult.grossBurn, currency)} / mo
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inflow vs Outflow Mini Gauge */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-emerald-400 font-medium">
                  Monthly Revenue: +{formatRunwayCurrency(runwayResult.monthlyRevenue, currency)}
                </span>
                <span className="text-rose-400 font-medium">
                  Gross Burn: -{formatRunwayCurrency(runwayResult.grossBurn, currency)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${
                      runwayResult.grossBurn + runwayResult.monthlyRevenue > 0
                        ? Math.min(100, (runwayResult.monthlyRevenue / (runwayResult.grossBurn + runwayResult.monthlyRevenue)) * 100)
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{
                    width: `${
                      runwayResult.grossBurn + runwayResult.monthlyRevenue > 0
                        ? Math.min(100, (runwayResult.grossBurn / (runwayResult.grossBurn + runwayResult.monthlyRevenue)) * 100)
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {/* Cash Runway Months */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/30">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Cash Runway
                </div>
                <div className="text-3xl font-extrabold text-neutral-100">
                  {runwayResult.isProfitable ? "Default Alive" : `${runwayResult.runwayMonths} Mo`}
                </div>
                <div className="text-xs text-amber-400/90 mt-1">
                  {runwayResult.isProfitable ? "Profitable & Self-Sustaining" : `~${runwayResult.runwayDays} Days Remaining`}
                </div>
              </div>

              {/* Zero Cash Date */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Zero Cash Date
                </div>
                <div className="text-2xl font-bold text-neutral-100">
                  {runwayResult.zeroCashDate}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Estimated treasury exhaustion date
                </div>
              </div>

              {/* Net Monthly Burn */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> Net Monthly Burn
                </div>
                <div className={`text-2xl font-bold ${runwayResult.netBurn === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatRunwayCurrency(runwayResult.netBurn, currency)}
                  <span className="text-xs font-normal text-neutral-400"> / mo</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Gross Burn minus monthly collections
                </div>
              </div>

              {/* Bessemer Burn Multiple */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-400" /> Bessemer Burn Multiple
                </div>
                <div className="text-2xl font-bold text-neutral-100">
                  {runwayResult.burnMultiple}x
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {runwayResult.burnMultiple <= 1.0
                    ? "Exceptional (<1.0x)"
                    : runwayResult.burnMultiple <= 1.5
                    ? "Healthy (1.0x - 1.5x)"
                    : "High Burn (>2.0x)"}
                </div>
              </div>
            </div>

            {/* Fundraising Stage Alert Card */}
            <div
              className={`p-5 rounded-2xl border ${
                runwayResult.status === "profitable"
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : runwayResult.status === "safe"
                  ? "bg-teal-950/20 border-teal-500/30"
                  : runwayResult.status === "pitch-window"
                  ? "bg-blue-950/20 border-blue-500/30"
                  : runwayResult.status === "danger"
                  ? "bg-amber-950/20 border-amber-500/30"
                  : "bg-rose-950/20 border-rose-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                {runwayResult.status === "profitable" || runwayResult.status === "safe" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : runwayResult.status === "pitch-window" ? (
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutral-100">
                      {runwayResult.statusLabel}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                      Stage Alert
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed my-2">
                    {runwayResult.statusDescription}
                  </p>

                  {/* Visual Runway Timeline Map */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80">
                    <div className="text-[11px] text-neutral-400 mb-2 font-medium">
                      Venture Capital Fundraising Windows:
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-semibold">
                      <div
                        className={`p-2 rounded-lg border ${
                          runwayResult.status === "critical"
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        <div>&lt; 3 Months</div>
                        <div className="text-[9px] font-normal mt-0.5">Emergency Zone</div>
                      </div>

                      <div
                        className={`p-2 rounded-lg border ${
                          runwayResult.status === "danger"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        <div>3 - 6 Months</div>
                        <div className="text-[9px] font-normal mt-0.5">Danger Zone</div>
                      </div>

                      <div
                        className={`p-2 rounded-lg border ${
                          runwayResult.status === "pitch-window"
                            ? "bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        <div>6 - 9 Months</div>
                        <div className="text-[9px] font-normal mt-0.5">Pitch Window</div>
                      </div>

                      <div
                        className={`p-2 rounded-lg border ${
                          runwayResult.status === "safe" || runwayResult.status === "profitable"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        <div>&gt; 12 Months</div>
                        <div className="text-[9px] font-normal mt-0.5">Safe Horizon</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTAL EXPENSE BREAKDOWN */}
      {activeTab === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Itemized Inputs */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
              <h3 className="text-base font-semibold text-neutral-100 mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Monthly Operating Cost Categories
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Break down monthly cash expenses across core startup operational departments.
              </p>

              <div className="space-y-3.5">
                {/* Payroll */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" /> Payroll & Contractors
                    </span>
                    <span className="text-[11px] text-neutral-400">Salaries, Benefits, Taxes</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                      {SUPPORTED_CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={expenses.payroll}
                      onChange={(e) => updateExpense("payroll", parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Cloud & Compute */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" /> Cloud & Compute
                    </span>
                    <span className="text-[11px] text-neutral-400">AWS, GCP, Azure, LLM APIs</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                      {SUPPORTED_CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={expenses.cloudCompute}
                      onChange={(e) => updateExpense("cloudCompute", parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Marketing */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Sales & Marketing
                    </span>
                    <span className="text-[11px] text-neutral-400">Ads, Agencies, Events</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                      {SUPPORTED_CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={expenses.marketing}
                      onChange={(e) => updateExpense("marketing", parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* SaaS & Tools */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-400" /> Software & SaaS Tooling
                    </span>
                    <span className="text-[11px] text-neutral-400">Slack, GitHub, Notion, CRM</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                      {SUPPORTED_CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={expenses.saasTools}
                      onChange={(e) => updateExpense("saasTools", parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Office & G&A */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> Office, Legal & G&A
                    </span>
                    <span className="text-[11px] text-neutral-400">Rent, Legal, Accounting, Insurance</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">
                      {SUPPORTED_CURRENCIES[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={expenses.officeGa}
                      onChange={(e) => updateExpense("officeGa", parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950/80 border border-neutral-700/70 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown & Analysis */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
              <h4 className="text-sm font-semibold text-neutral-100 mb-1">
                Burn Concentration by Category
              </h4>
              <p className="text-xs text-neutral-400 mb-4">
                Total Gross Burn: {formatRunwayCurrency(runwayResult.grossBurn, currency)} / month
              </p>

              {/* Visual Multi-Segment Bar */}
              <div className="w-full h-4 rounded-full bg-neutral-800 overflow-hidden flex mb-5">
                {runwayResult.expenseBreakdownSummary.map((item, idx) => (
                  <div
                    key={item.key}
                    style={{ width: `${item.percentage}%` }}
                    className={`transition-all duration-300 ${
                      idx === 0
                        ? "bg-blue-500"
                        : idx === 1
                        ? "bg-purple-500"
                        : idx === 2
                        ? "bg-emerald-500"
                        : idx === 3
                        ? "bg-teal-500"
                        : "bg-amber-500"
                    }`}
                    title={`${item.category}: ${item.percentage}%`}
                  />
                ))}
              </div>

              {/* Category Rows */}
              <div className="space-y-3 text-xs">
                {runwayResult.expenseBreakdownSummary.map((item, idx) => (
                  <div
                    key={item.key}
                    className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          idx === 0
                            ? "bg-blue-500"
                            : idx === 1
                            ? "bg-purple-500"
                            : idx === 2
                            ? "bg-emerald-500"
                            : idx === 3
                            ? "bg-teal-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="text-neutral-200 font-medium">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-neutral-100">
                        {formatRunwayCurrency(item.amount, currency)}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[11px] font-bold text-neutral-300 min-w-[45px] text-center">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC FORWARD SIMULATION */}
      {activeTab === "simulation" && (
        <div className="flex flex-col gap-5">
          {/* Controls & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
              <h3 className="text-base font-semibold text-neutral-100 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Dynamic Growth & Burn Modeler
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Real startup burn is never static. Model compounding monthly revenue growth against hiring and inflation.
              </p>

              <div className="space-y-4">
                {/* Revenue Growth Slider */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-neutral-300 mb-1.5">
                    <span>Monthly Revenue Growth (%):</span>
                    <span className="font-bold text-emerald-400">+{revenueGrowthRate}% / mo</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="20"
                    step="0.5"
                    value={revenueGrowthRate}
                    onChange={(e) => setRevenueGrowthRate(parseFloat(e.target.value) || 0)}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                    <span>-5% (Churn)</span>
                    <span>0% (Flat)</span>
                    <span>7% (Target)</span>
                    <span>20% (Fast)</span>
                  </div>
                </div>

                {/* Expense Growth Slider */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-neutral-300 mb-1.5">
                    <span>Monthly Expense Growth / Hiring Ramp (%):</span>
                    <span className="font-bold text-rose-400">+{expenseGrowthRate}% / mo</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={expenseGrowthRate}
                    onChange={(e) => setExpenseGrowthRate(parseFloat(e.target.value) || 0)}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                    <span>0% (Freeze)</span>
                    <span>3% (Controlled)</span>
                    <span>8% (Aggressive)</span>
                    <span>15% (Scaleup)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation Headline Outcome */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-center">
                <div className="text-xs text-neutral-400 mb-1">Simulated Treasury Horizon</div>
                <div className="text-2xl font-bold text-neutral-100">
                  {simulationResult.reachedProfitability
                    ? `Default Alive in Month ${simulationResult.profitabilityMonth}`
                    : simulationResult.zeroCashMonth
                    ? `${simulationResult.zeroCashMonth} Months Survives`
                    : "24+ Months Survives"}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {simulationResult.reachedProfitability
                    ? "Revenue crosses expenses before cash depletion"
                    : "Zero cash reached under compounding expansion"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/80 border border-amber-500/30 flex flex-col justify-center">
                <div className="text-xs text-neutral-400 mb-1">Static vs Dynamic Discrepancy</div>
                <div className="text-2xl font-bold text-amber-400">
                  {Math.abs(Number((runwayResult.runwayMonths - simulationResult.survivedMonths).toFixed(1)))} Months
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {simulationResult.survivedMonths > runwayResult.runwayMonths
                    ? "Revenue growth adds months to static calculation"
                    : "Hiring inflation burns cash faster than static estimate"}
                </div>
              </div>
            </div>
          </div>

          {/* Month-by-Month Projection Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400">
                  <th className="py-3 px-4 font-semibold">Month</th>
                  <th className="py-3 px-4 font-semibold">Starting Treasury</th>
                  <th className="py-3 px-4 font-semibold">Projected Revenue</th>
                  <th className="py-3 px-4 font-semibold">Projected Expenses</th>
                  <th className="py-3 px-4 font-semibold">Net Monthly Burn</th>
                  <th className="py-3 px-4 font-semibold">Ending Treasury</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {simulationResult.months.map((m) => (
                  <tr key={m.month} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-neutral-300">
                      M{m.month} ({m.monthName})
                    </td>
                    <td className="py-2.5 px-4 text-neutral-200">
                      {formatRunwayCurrency(m.startCash, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-400 font-semibold">
                      +{formatRunwayCurrency(m.revenue, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-rose-400">
                      -{formatRunwayCurrency(m.expenses, currency)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold">
                      {m.netBurn <= 0 ? (
                        <span className="text-emerald-400 font-bold">+$0 (Profitable)</span>
                      ) : (
                        <span className="text-rose-400">-{formatRunwayCurrency(m.netBurn, currency)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-neutral-100">
                      {formatRunwayCurrency(m.endCash, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {m.status === "profitable" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Profitable
                        </span>
                      )}
                      {m.status === "alert" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          &lt; 3 Mo Left
                        </span>
                      )}
                      {m.status === "out-of-cash" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Zero Cash
                        </span>
                      )}
                      {m.status === "normal" && (
                        <span className="text-neutral-400 text-[11px]">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WHAT-IF SURVIVAL SCENARIOS */}
      {activeTab === "scenarios" && (
        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
            <h3 className="text-base font-semibold text-neutral-100 mb-1 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Strategic Survival & Runway Extension Levers
            </h3>
            <p className="text-xs text-neutral-400">
              Model board-level survival decisions: quantify exactly how many months of runway are preserved by marketing reductions, headcount freezes, or restructuring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whatIfScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-neutral-100">{scenario.name}</h4>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      +{scenario.monthsGained} Mo Runway
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                    {scenario.actionDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                      <span className="text-neutral-400 block text-[11px]">Revised Gross Burn</span>
                      <span className="text-neutral-200 font-bold">
                        {formatRunwayCurrency(scenario.revisedGrossBurn, currency)} / mo
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                      <span className="text-neutral-400 block text-[11px]">Revised Net Burn</span>
                      <span className="text-neutral-200 font-bold">
                        {formatRunwayCurrency(scenario.revisedNetBurn, currency)} / mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">
                    New Runway: <strong className="text-neutral-100">{scenario.revisedRunwayMonths} Months</strong>
                  </span>
                  <span className="text-neutral-400">
                    Zero Cash: <strong className="text-amber-400">{scenario.newZeroCashDate}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO & Methodological Guide */}
      <SEOContent tool={tool} />

      {/* Related Tools */}
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
