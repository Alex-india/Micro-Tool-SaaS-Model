"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { ResultDisplay } from "../ResultDisplay";
import { ChartPanel } from "../ChartPanel";
import { TableDisplay } from "../TableDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

export interface InvestmentCalculatorViewProps {
  tool: ToolMeta;
}

export const InvestmentCalculatorView: React.FC<InvestmentCalculatorViewProps> = ({ tool }) => {
  const [principal, setPrincipal] = useState<string>("");
  const [interestRate, setInterestRate] = useState<number>(7.5);
  const [durationYears, setDurationYears] = useState<number>(5);
  const [compoundingFreq, setCompoundingFreq] = useState<number>(4); // Quarterly by default

  const calculation = useMemo(() => {
    const numPrincipal = parseFloat(principal) || 0;
    const p = Math.max(0, numPrincipal);
    const r = (interestRate || 0) / 100;
    const t = Math.max(1, durationYears || 1);
    const n = Math.max(1, compoundingFreq);

    // Is it Simple Interest?
    const isSimpleInterest = tool.slug === "simple-interest-calculator";
    
    // Is it RD (Recurring Deposit)?
    const isRD = tool.slug === "rd-calculator";

    let maturity = 0;
    let totalDeposit = p;
    let interestEarned = 0;
    const yearlyBreakdown: any[] = [];

    if (isSimpleInterest) {
      interestEarned = p * r * t;
      maturity = p + interestEarned;
      for (let y = 1; y <= t; y++) {
        const yInterest = p * r * y;
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          investedAmount: Math.round(p),
          interestEarned: Math.round(yInterest),
          totalValue: Math.round(p + yInterest),
        });
      }
    } else if (isRD) {
      // Monthly deposit = principal
      const monthlyDeposit = p;
      const totalMonths = t * 12;
      totalDeposit = monthlyDeposit * totalMonths;
      
      let currentTotal = 0;
      for (let m = 1; m <= totalMonths; m++) {
        currentTotal += monthlyDeposit;
        currentTotal *= Math.pow(1 + r / n, (1 / 12) * (n / 1));
      }
      maturity = currentTotal;
      interestEarned = Math.max(0, maturity - totalDeposit);

      for (let y = 1; y <= t; y++) {
        const months = y * 12;
        let yTotal = 0;
        for (let m = 1; m <= months; m++) {
          yTotal += monthlyDeposit;
          yTotal *= Math.pow(1 + r / n, (1 / 12) * (n / 1));
        }
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          investedAmount: Math.round(monthlyDeposit * months),
          interestEarned: Math.round(Math.max(0, yTotal - monthlyDeposit * months)),
          totalValue: Math.round(yTotal),
        });
      }
    } else {
      // Compound Interest / FD / Savings Goal / ROI
      maturity = p * Math.pow(1 + r / n, n * t);
      interestEarned = maturity - p;

      for (let y = 1; y <= t; y++) {
        const yMaturity = p * Math.pow(1 + r / n, n * y);
        yearlyBreakdown.push({
          year: `Yr ${y}`,
          investedAmount: Math.round(p),
          interestEarned: Math.round(yMaturity - p),
          totalValue: Math.round(yMaturity),
        });
      }
    }

    return {
      maturity: Math.round(maturity),
      totalDeposit: Math.round(totalDeposit),
      interestEarned: Math.round(interestEarned),
      yearlyBreakdown,
    };
  }, [principal, interestRate, durationYears, compoundingFreq, tool.slug]);

  const handleReset = () => {
    setPrincipal("");
    setInterestRate(7.5);
    setDurationYears(5);
    setCompoundingFreq(4);
  };

  const chartSeries = [
    { key: "investedAmount", name: "Principal Deposited", color: "#3B82F6" },
    { key: "totalValue", name: "Maturity Growth", color: "#10B981" },
  ];

  const tableColumns = [
    { key: "year", label: "Year", align: "center" as const },
    { key: "investedAmount", label: "Deposited (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "interestEarned", label: "Interest (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "totalValue", label: "Total Balance (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input panel */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-lg p-5 shadow-subtle">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Calculation Parameters</h3>
            <button
              onClick={handleReset}
              className="text-xs text-text-tertiary hover:text-accent flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <Input
            label={tool.slug === "rd-calculator" ? "Monthly Deposit Amount (₹)" : "Initial Principal / Investment (₹)"}
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter principal amount (e.g. 100000)..."
          />

          <Slider
            label="Annual Interest Rate (%)"
            min={1}
            max={25}
            step={0.1}
            value={interestRate}
            unit="%"
            onChangeValue={(v) => setInterestRate(v)}
          />

          <Slider
            label="Tenure / Duration (Years)"
            min={1}
            max={30}
            step={1}
            value={durationYears}
            unit="years"
            onChangeValue={(v) => setDurationYears(v)}
          />

          <div className="flex flex-col gap-1.5 text-xs">
            <label className="font-medium text-text-secondary">Compounding Frequency</label>
            <select
              value={compoundingFreq}
              onChange={(e) => setCompoundingFreq(Number(e.target.value))}
              className="bg-surface-raised border border-border rounded-md px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
            >
              <option value={1}>Annually (1x / year)</option>
              <option value={2}>Semi-Annually (2x / year)</option>
              <option value={4}>Quarterly (4x / year)</option>
              <option value={12}>Monthly (12x / year)</option>
            </select>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6 sticky top-20">
          <ResultDisplay
            primaryMetric={{
              label: "Maturity / Final Value",
              value: formatCurrency(calculation.maturity),
            }}
            secondaryMetrics={[
              { label: "Total Deposited", value: formatCurrency(calculation.totalDeposit) },
              { label: "Interest Earned", value: formatCurrency(calculation.interestEarned) },
              { label: "Growth Percentage", value: `${((calculation.interestEarned / (calculation.totalDeposit || 1)) * 100).toFixed(1)}%` },
            ]}
          />

          <ChartPanel
            title="Interest Growth Projection"
            type="area"
            data={calculation.yearlyBreakdown}
            xKey="year"
            series={chartSeries}
          />

          <TableDisplay
            title="Yearly Amortization Table"
            columns={tableColumns}
            data={calculation.yearlyBreakdown}
          />
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
