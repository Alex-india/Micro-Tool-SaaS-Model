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
import { RotateCcw, Landmark, Zap } from "lucide-react";

export interface EMICalculatorViewProps {
  tool: ToolMeta;
}

export const EMICalculatorView: React.FC<EMICalculatorViewProps> = ({ tool }) => {
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(8.5);
  const [tenureValue, setTenureValue] = useState<number>(20);
  const [tenureUnit, setTenureUnit] = useState<"years" | "months">("years");
  const [extraPrepayment, setExtraPrepayment] = useState<string>("");
  const [scheduleView, setScheduleView] = useState<"monthly" | "yearly">("monthly");

  const numLoan = parseFloat(loanAmount) || 0;
  const numExtra = parseFloat(extraPrepayment) || 0;

  const standardResult = useMemo(() => {
    return calculateEMI({
      loanAmount: numLoan,
      annualInterestRate: annualInterestRate || 0,
      tenureValue: tenureValue || 0,
      tenureUnit,
    });
  }, [numLoan, annualInterestRate, tenureValue, tenureUnit]);

  // Prepayment impact calculation
  const prepaymentImpact = useMemo(() => {
    if (numLoan <= 0 || numExtra <= 0) return null;

    const totalMonths = tenureUnit === "years" ? tenureValue * 12 : tenureValue;
    const monthlyRate = annualInterestRate / 12 / 100;
    const emi = standardResult.monthlyEMI;
    const totalMonthlyPay = emi + numExtra;

    let balance = numLoan;
    let months = 0;
    let totalInterestWithPrepay = 0;

    while (balance > 0 && months < totalMonths) {
      months++;
      const interestForMonth = balance * monthlyRate;
      const principalForMonth = Math.min(balance, totalMonthlyPay - interestForMonth);
      balance = Math.max(0, balance - principalPaid(balance, totalMonthlyPay, interestForMonth));
      totalInterestWithPrepay += interestForMonth;
    }

    function principalPaid(b: number, pay: number, int: number) {
      return Math.min(b, Math.max(0, pay - int));
    }

    const interestSaved = Math.max(0, standardResult.totalInterest - totalInterestWithPrepay);
    const monthsSaved = Math.max(0, totalMonths - months);

    return {
      monthsToPayoff: months,
      yearsToPayoff: (months / 12).toFixed(1),
      interestSaved: Math.round(interestSaved),
      monthsSaved,
      totalInterestWithPrepay: Math.round(totalInterestWithPrepay),
    };
  }, [numLoan, numExtra, annualInterestRate, tenureValue, tenureUnit, standardResult]);

  // Yearly Aggregated Schedule
  const yearlySchedule = useMemo(() => {
    const schedule = standardResult.amortizationSchedule;
    if (!schedule || schedule.length === 0) return [];

    const yearsMap: Record<number, { year: string; principalPaid: number; interestPaid: number; remainingBalance: number }> = {};

    schedule.forEach((row) => {
      const yr = Math.ceil(row.period / 12);
      if (!yearsMap[yr]) {
        yearsMap[yr] = {
          year: `Year ${yr}`,
          principalPaid: 0,
          interestPaid: 0,
          remainingBalance: row.remainingBalance,
        };
      }
      yearsMap[yr].principalPaid += row.principalPaid;
      yearsMap[yr].interestPaid += row.interestPaid;
      yearsMap[yr].remainingBalance = row.remainingBalance;
    });

    return Object.values(yearsMap);
  }, [standardResult]);

  const handleReset = () => {
    setLoanAmount("");
    setAnnualInterestRate(8.5);
    setTenureValue(20);
    setTenureUnit("years");
    setExtraPrepayment("");
  };

  const pieChartData = [
    { name: "Principal Loan Amount", value: standardResult.totalPrincipal },
    { name: "Total Interest Payable", value: standardResult.totalInterest },
  ];

  const monthlyColumns = [
    { key: "period", label: "Month", align: "center" as const },
    { key: "emi", label: "Monthly EMI (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "principalPaid", label: "Principal (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "interestPaid", label: "Interest (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "remainingBalance", label: "Remaining Balance (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
  ];

  const yearlyColumns = [
    { key: "year", label: "Year", align: "center" as const },
    { key: "principalPaid", label: "Principal Paid (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "interestPaid", label: "Interest Paid (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "remainingBalance", label: "Ending Balance (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Column */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-accent" />
              Loan & EMI Parameters
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-text-tertiary hover:text-accent flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <Input
            label="Total Loan Amount (₹)"
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter loan amount (e.g. 2500000)..."
            helperText="Home loan, personal loan, car loan"
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

          <Input
            label="Extra Monthly Prepayment (₹) — Optional"
            type="number"
            value={extraPrepayment}
            onChange={(e) => setExtraPrepayment(e.target.value)}
            prefixSymbol="₹"
            placeholder="0"
            helperText="Calculate interest and tenure savings"
          />
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 flex flex-col gap-6 sticky top-20">
          <ResultDisplay
            primaryMetric={{
              label: "Monthly EMI Amount",
              value: formatCurrency(standardResult.monthlyEMI),
            }}
            secondaryMetrics={[
              { label: "Principal Loan Amount", value: formatCurrency(standardResult.totalPrincipal) },
              { label: "Total Interest Payable", value: formatCurrency(standardResult.totalInterest) },
              { label: "Total Loan Repayment", value: formatCurrency(standardResult.totalPayment) },
              { label: "Interest to Principal Ratio", value: `${standardResult.interestToPrincipalRatio}%` },
            ]}
          />

          {/* Prepayment Savings Callout if Active */}
          {prepaymentImpact && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-surface to-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-text-primary">Prepayment Benefit:</span>
                  <span className="text-text-secondary">
                    Save <strong className="text-emerald-400 font-mono">{formatCurrency(prepaymentImpact.interestSaved)}</strong> in interest and close loan <strong className="text-emerald-400 font-mono">{prepaymentImpact.monthsSaved} months</strong> earlier!
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                New Tenure: {prepaymentImpact.yearsToPayoff} Yrs
              </span>
            </div>
          )}

          <ChartPanel
            title="Loan Breakdown: Principal vs Total Interest"
            type="pie"
            data={pieChartData}
            xKey="name"
            series={[
              { key: "value", name: "Amount", color: "#3B82F6" },
              { key: "value", name: "Amount", color: "#F59E0B" },
            ]}
          />

          {/* Schedule View Toggle Tabs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Amortization Breakdown Schedule
              </h4>
              <Tabs
                tabs={[
                  { id: "monthly", label: "Monthly" },
                  { id: "yearly", label: "Yearly Summary" },
                ]}
                activeTab={scheduleView}
                onChange={(id) => setScheduleView(id as any)}
              />
            </div>

            {scheduleView === "monthly" ? (
              <TableDisplay
                title="Monthly Loan Repayment Schedule"
                columns={monthlyColumns}
                data={standardResult.amortizationSchedule}
                pageSize={12}
              />
            ) : (
              <TableDisplay
                title="Year-by-Year Amortization Schedule"
                columns={yearlyColumns}
                data={yearlySchedule}
                pageSize={10}
              />
            )}
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
