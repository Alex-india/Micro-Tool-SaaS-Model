"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "../ResultDisplay";
import { ChartPanel } from "../ChartPanel";
import { TableDisplay } from "../TableDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { calculateSIP, SIPInput } from "@/tools/finance/sip";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

export interface SIPCalculatorViewProps {
  tool: ToolMeta;
}

export const SIPCalculatorView: React.FC<SIPCalculatorViewProps> = ({ tool }) => {
  const [monthlyInvestment, setMonthlyInvestment] = useState<string>("");
  const [expectedReturnRate, setExpectedReturnRate] = useState<number>(12);
  const [durationYears, setDurationYears] = useState<number>(10);
  const [annualStepUpPercent, setAnnualStepUpPercent] = useState<string>("");
  const [lumpSumAmount, setLumpSumAmount] = useState<string>("");

  const result = useMemo(() => {
    return calculateSIP({
      monthlyInvestment: parseFloat(monthlyInvestment) || 0,
      expectedReturnRate: expectedReturnRate || 0,
      durationYears: durationYears || 0,
      annualStepUpPercent: parseFloat(annualStepUpPercent) || 0,
      lumpSumAmount: parseFloat(lumpSumAmount) || 0,
    });
  }, [monthlyInvestment, expectedReturnRate, durationYears, annualStepUpPercent, lumpSumAmount]);

  const handleReset = () => {
    setMonthlyInvestment("");
    setExpectedReturnRate(12);
    setDurationYears(10);
    setAnnualStepUpPercent("");
    setLumpSumAmount("");
  };

  const chartSeries = [
    { key: "investedAmount", name: "Amount Invested", color: "#3B82F6" },
    { key: "totalValue", name: "Total Portfolio Value", color: "#6C63FF" },
  ];

  const tableColumns = [
    { key: "year", label: "Year", align: "center" as const },
    { key: "investedAmount", label: "Invested (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "interestEarned", label: "Returns (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "totalValue", label: "Total Value (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Main 2-column layout (Inputs left, Output right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary">Investment Settings</h3>
            <button
              onClick={handleReset}
              className="text-xs text-text-tertiary hover:text-accent flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <Input
            label="Monthly Investment Amount (₹)"
            type="number"
            value={monthlyInvestment}
            onChange={(e) => setMonthlyInvestment(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter monthly investment (e.g. 5000)..."
            helperText="Min ₹100 / month"
          />

          <Slider
            label="Expected Annual Return (%)"
            min={1}
            max={30}
            step={0.1}
            value={expectedReturnRate}
            unit="%"
            onChangeValue={(v) => setExpectedReturnRate(v)}
          />

          <Slider
            label="Investment Duration (Years)"
            min={1}
            max={40}
            step={1}
            value={durationYears}
            unit="years"
            onChangeValue={(v) => setDurationYears(v)}
          />

          <Input
            label="Annual Step-up SIP (%) — Optional"
            type="number"
            value={annualStepUpPercent}
            placeholder="0"
            onChange={(e) => setAnnualStepUpPercent(e.target.value)}
            suffixSymbol="%"
            helperText="Increase monthly SIP every year"
          />

          <Input
            label="Initial Lump Sum (₹) — Optional"
            type="number"
            value={lumpSumAmount}
            placeholder="0"
            onChange={(e) => setLumpSumAmount(e.target.value)}
            prefixSymbol="₹"
            helperText="One-time starting investment"
          />
        </div>

        {/* Right Column: Output Metrics & Charts */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:sticky lg:top-24">
          <ResultDisplay
            primaryMetric={{
              label: "Estimated Maturity Value",
              value: formatCurrency(result.maturityValue),
            }}
            secondaryMetrics={[
              { label: "Total Invested", value: formatCurrency(result.totalInvested) },
              { label: "Estimated Returns", value: formatCurrency(result.estimatedReturns) },
              { label: "Return Growth %", value: `${result.returnPercentage}%` },
              { label: "Effective CAGR", value: `${result.effectiveCAGR}%` },
            ]}
          />

          <ChartPanel
            title="SIP Growth Projection Over Time"
            type="area"
            data={result.yearlyBreakdown}
            xKey="year"
            series={chartSeries}
          />

          <TableDisplay
            title="Year-by-Year Wealth Amortization"
            columns={tableColumns}
            data={result.yearlyBreakdown}
          />
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
