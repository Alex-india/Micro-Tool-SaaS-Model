"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Tabs } from "@/components/ui/Tabs";
import { ResultDisplay } from "../ResultDisplay";
import { ChartPanel } from "../ChartPanel";
import { TableDisplay } from "../TableDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { calculateEMI } from "@/tools/finance/emi";
import { formatCurrency } from "@/lib/utils";

export interface EMICalculatorViewProps {
  tool: ToolMeta;
}

export const EMICalculatorView: React.FC<EMICalculatorViewProps> = ({ tool }) => {
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(8.5);
  const [tenureValue, setTenureValue] = useState<number>(20);
  const [tenureUnit, setTenureUnit] = useState<"years" | "months">("years");

  const result = useMemo(() => {
    return calculateEMI({
      loanAmount: parseFloat(loanAmount) || 0,
      annualInterestRate: annualInterestRate || 0,
      tenureValue: tenureValue || 0,
      tenureUnit,
    });
  }, [loanAmount, annualInterestRate, tenureValue, tenureUnit]);

  const handleReset = () => {
    setLoanAmount("");
    setAnnualInterestRate(8.5);
    setTenureValue(20);
    setTenureUnit("years");
  };

  const pieChartData = [
    { name: "Principal Amount", value: result.totalPrincipal },
    { name: "Total Interest", value: result.totalInterest },
  ];

  const tableColumns = [
    { key: "period", label: "Month", align: "center" as const },
    { key: "emi", label: "EMI (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "principalPaid", label: "Principal (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "interestPaid", label: "Interest (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "balance", label: "Balance (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary">Loan Parameters</h3>
            <button
              onClick={handleReset}
              className="text-xs text-text-tertiary hover:text-accent flex items-center gap-1 transition-colors"
            >
              Reset
            </button>
          </div>

          <Input
            label="Loan Amount (₹)"
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter loan amount (e.g. 2500000)..."
          />

          <Slider
            label="Annual Interest Rate (%)"
            min={1}
            max={25}
            step={0.1}
            value={annualInterestRate}
            unit="%"
            onChangeValue={(v) => setAnnualInterestRate(v)}
          />

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-text-secondary">Tenure Unit</span>
            </div>
            <Tabs
              tabs={[
                { id: "years", label: "Years" },
                { id: "months", label: "Months" },
              ]}
              activeTab={tenureUnit}
              onChange={(id) => setTenureUnit(id as "years" | "months")}
            />
          </div>

          <Slider
            label={`Loan Tenure (${tenureUnit})`}
            min={1}
            max={tenureUnit === "years" ? 30 : 360}
            step={1}
            value={tenureValue}
            unit={tenureUnit}
            onChangeValue={(v) => setTenureValue(v)}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6 sticky top-20">
          <ResultDisplay
            primaryMetric={{
              label: "Monthly EMI Payable",
              value: formatCurrency(result.monthlyEMI),
            }}
            secondaryMetrics={[
              { label: "Total Principal", value: formatCurrency(result.totalPrincipal) },
              { label: "Total Interest Payable", value: formatCurrency(result.totalInterest) },
              { label: "Total Payment", value: formatCurrency(result.totalPayment) },
              { label: "Interest to Principal Ratio", value: `${result.interestToPrincipalRatio}%` },
            ]}
          />

          <ChartPanel
            title="Principal vs Interest Breakdown"
            type="pie"
            data={pieChartData}
            xKey="name"
            series={[
              { key: "value", name: "Amount", color: "#6C63FF" },
              { key: "value", name: "Amount", color: "#F59E0B" },
            ]}
          />

          <TableDisplay
            title="Full Monthly Amortization Schedule"
            columns={tableColumns}
            data={result.amortizationSchedule}
            pageSize={12}
          />
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
