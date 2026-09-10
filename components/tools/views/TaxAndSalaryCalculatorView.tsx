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
import { formatCurrency } from "@/lib/utils";
import { calculateIncomeTax } from "@/tools/finance/tax";
import { RotateCcw, Receipt, Banknote, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export interface TaxAndSalaryCalculatorViewProps {
  tool: ToolMeta;
}

export const TaxAndSalaryCalculatorView: React.FC<TaxAndSalaryCalculatorViewProps> = ({ tool }) => {
  const isSalaryTool = tool.slug.includes("salary") || tool.slug.includes("ctc") || tool.slug.includes("in-hand");

  // Common CTC / Salary States
  const [annualCTC, setAnnualCTC] = useState<string>("");
  const [basicPercent, setBasicPercent] = useState<number>(50);
  const [hraPercent, setHraPercent] = useState<number>(50);
  const [variableBonus, setVariableBonus] = useState<string>("");
  const [regimePreference, setRegimePreference] = useState<"new" | "old">("new");
  
  // Income Tax Exemptions States
  const [hraExemption, setHraExemption] = useState<string>("");
  const [section80C, setSection80C] = useState<string>("");
  const [section80D, setSection80D] = useState<string>("");
  const [homeLoanInterest, setHomeLoanInterest] = useState<string>("");
  const [nps80CCD, setNps80CCD] = useState<string>("");
  const [otherDeductions, setOtherDeductions] = useState<string>("");

  const numCTC = Math.max(0, parseFloat(annualCTC) || 0);
  const num80C = Math.min(150000, Math.max(0, parseFloat(section80C) || 0));
  const num80D = Math.max(0, parseFloat(section80D) || 0);
  const numHra = Math.max(0, parseFloat(hraExemption) || 0);
  const numHomeLoan = Math.min(200000, Math.max(0, parseFloat(homeLoanInterest) || 0));
  const numNps = Math.min(50000, Math.max(0, parseFloat(nps80CCD) || 0));
  const numOther = Math.max(0, parseFloat(otherDeductions) || 0);
  const numBonus = Math.max(0, parseFloat(variableBonus) || 0);

  // Income Tax Calculation Engine
  const taxResult = useMemo(() => {
    const totalOldDeductions = num80C + num80D + numHra + numHomeLoan + numNps + numOther;
    return calculateIncomeTax({
      financialYear: "FY 2024-25",
      annualIncome: numCTC,
      section80CDeductions: num80C,
      hraExemption: numHra,
      otherDeductions: num80D + numHomeLoan + numNps + numOther,
    });
  }, [numCTC, num80C, num80D, numHra, numHomeLoan, numNps, numOther]);

  // Salary & In-Hand Pay Calculations
  const salaryBreakdown = useMemo(() => {
    const grossCTC = numCTC;
    const baseAnnual = (grossCTC * (basicPercent / 100));
    const monthlyBasic = baseAnnual / 12;

    // EPF Employee (12% of basic)
    const monthlyEmployeePF = Math.round(monthlyBasic * 0.12);
    const annualEmployeePF = monthlyEmployeePF * 12;

    // Employer PF (12% of basic, part of CTC)
    const monthlyEmployerPF = monthlyEmployeePF;
    const annualEmployerPF = annualEmployeePF;

    // HRA (percentage of basic)
    const annualHRA = (baseAnnual * (hraPercent / 100));
    const monthlyHRA = Math.round(annualHRA / 12);

    // Special Allowances & Flexi Pay (Remaining CTC)
    const specialAllowanceAnnual = Math.max(0, grossCTC - baseAnnual - annualEmployerPF - numBonus);
    const monthlySpecialAllowance = Math.round(specialAllowanceAnnual / 12);

    // Gross Monthly Salary (Earnings)
    const grossMonthlySalary = Math.round((grossCTC - annualEmployerPF - numBonus) / 12);

    // Professional Tax (Standard ₹200/mo in India)
    const monthlyPT = grossMonthlySalary > 15000 ? 200 : 0;
    const annualPT = monthlyPT * 12;

    // Monthly TDS Tax
    const annualTax = regimePreference === "new" ? taxResult.newRegime.totalTax : taxResult.oldRegime.totalTax;
    const monthlyTax = Math.round(annualTax / 12);

    // Net In-Hand Take Home
    const monthlyTakeHome = Math.max(0, grossMonthlySalary - monthlyEmployeePF - monthlyPT - monthlyTax);
    const annualTakeHome = monthlyTakeHome * 12;

    return {
      grossMonthlySalary,
      monthlyBasic: Math.round(monthlyBasic),
      monthlyHRA,
      monthlySpecialAllowance,
      monthlyEmployeePF,
      monthlyEmployerPF,
      monthlyPT,
      monthlyTax,
      monthlyTakeHome,
      annualTakeHome,
      annualTax,
      annualEmployeePF,
      annualPT,
    };
  }, [numCTC, basicPercent, hraPercent, numBonus, regimePreference, taxResult]);

  const handleReset = () => {
    setAnnualCTC("");
    setBasicPercent(50);
    setHraPercent(50);
    setVariableBonus("");
    setRegimePreference("new");
    setHraExemption("");
    setSection80C("");
    setSection80D("");
    setHomeLoanInterest("");
    setNps80CCD("");
    setOtherDeductions("");
  };

  const salaryPieData = [
    { name: "Take-Home Salary", value: salaryBreakdown.annualTakeHome },
    { name: "Income Tax (TDS)", value: salaryBreakdown.annualTax },
    { name: "Provident Fund (PF)", value: salaryBreakdown.annualEmployeePF * 2 },
    { name: "Professional Tax", value: salaryBreakdown.annualPT },
  ];

  const taxComparisonBarData = [
    { name: "New Tax Regime", tax: taxResult.newRegime.totalTax, inHand: taxResult.newRegime.monthlyInHand * 12 },
    { name: "Old Tax Regime", tax: taxResult.oldRegime.totalTax, inHand: taxResult.oldRegime.monthlyInHand * 12 },
  ];

  const salaryTableColumns = [
    { key: "component", label: "Salary Component", align: "left" as const },
    { key: "monthly", label: "Monthly (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
    { key: "annual", label: "Annual (₹)", align: "right" as const, format: (v: number) => formatCurrency(v) },
  ];

  const salaryTableData = [
    { component: "Basic Salary", monthly: salaryBreakdown.monthlyBasic, annual: salaryBreakdown.monthlyBasic * 12 },
    { component: "House Rent Allowance (HRA)", monthly: salaryBreakdown.monthlyHRA, annual: salaryBreakdown.monthlyHRA * 12 },
    { component: "Special / Other Allowances", monthly: salaryBreakdown.monthlySpecialAllowance, annual: salaryBreakdown.monthlySpecialAllowance * 12 },
    { component: "Gross Earnings", monthly: salaryBreakdown.grossMonthlySalary, annual: salaryBreakdown.grossMonthlySalary * 12 },
    { component: "Employee PF Deduction (12%)", monthly: -salaryBreakdown.monthlyEmployeePF, annual: -salaryBreakdown.monthlyEmployeePF * 12 },
    { component: "Professional Tax (PT)", monthly: -salaryBreakdown.monthlyPT, annual: -salaryBreakdown.monthlyPT * 12 },
    { component: `Income Tax / TDS (${regimePreference.toUpperCase()})`, monthly: -salaryBreakdown.monthlyTax, annual: -salaryBreakdown.annualTax },
    { component: "Net In-Hand (Take-Home)", monthly: salaryBreakdown.monthlyTakeHome, annual: salaryBreakdown.annualTakeHome },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              {isSalaryTool ? <Banknote className="w-4 h-4 text-accent" /> : <Receipt className="w-4 h-4 text-accent" />}
              {isSalaryTool ? "CTC & Salary Parameters" : "Tax Assessment & Deductions"}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-text-tertiary hover:text-accent flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <Input
            label={isSalaryTool ? "Annual Cost to Company (CTC) (₹)" : "Annual Gross Total Income (₹)"}
            type="number"
            value={annualCTC}
            onChange={(e) => setAnnualCTC(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter annual income (e.g. 1200000)..."
            helperText="Gross annual package before tax & deductions"
          />

          {isSalaryTool ? (
            <>
              <Slider
                label="Basic Salary (% of CTC)"
                min={30}
                max={60}
                step={5}
                value={basicPercent}
                unit="%"
                onChangeValue={(v) => setBasicPercent(v)}
              />

              <Slider
                label="HRA Component (% of Basic)"
                min={30}
                max={50}
                step={5}
                value={hraPercent}
                unit="%"
                onChangeValue={(v) => setHraPercent(v)}
              />

              <Input
                label="Annual Variable Pay / Performance Bonus (₹) — Optional"
                type="number"
                value={variableBonus}
                onChange={(e) => setVariableBonus(e.target.value)}
                prefixSymbol="₹"
                placeholder="0"
                helperText="Paid out separately as annual lump sum"
              />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-secondary">Preferred Tax Regime for TDS</span>
                <Tabs
                  tabs={[
                    { id: "new", label: "New Tax Regime (Default)" },
                    { id: "old", label: "Old Tax Regime" },
                  ]}
                  activeTab={regimePreference}
                  onChange={(id) => setRegimePreference(id as "new" | "old")}
                />
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Standard Deduction:
                </span>
                <span>₹75,000 (New) / ₹50,000 (Old)</span>
              </div>

              <Input
                label="Section 80C Deductions (Max ₹1,50,000)"
                type="number"
                value={section80C}
                onChange={(e) => setSection80C(e.target.value)}
                prefixSymbol="₹"
                placeholder="PPF, ELSS, EPF, Life Insurance..."
              />

              <Input
                label="Section 80D Health Insurance (₹ / year)"
                type="number"
                value={section80D}
                onChange={(e) => setSection80D(e.target.value)}
                prefixSymbol="₹"
                placeholder="Self & family health insurance (e.g. 25000)..."
              />

              <Input
                label="HRA Exemption Claimed (₹ / year)"
                type="number"
                value={hraExemption}
                onChange={(e) => setHraExemption(e.target.value)}
                prefixSymbol="₹"
                placeholder="Rent receipts exemption (e.g. 120000)..."
              />

              <Input
                label="Home Loan Interest - Section 24b (Max ₹2,00,000)"
                type="number"
                value={homeLoanInterest}
                onChange={(e) => setHomeLoanInterest(e.target.value)}
                prefixSymbol="₹"
                placeholder="Interest on self-occupied housing loan..."
              />

              <Input
                label="NPS - Section 80CCD (1B) (Max ₹50,000)"
                type="number"
                value={nps80CCD}
                onChange={(e) => setNps80CCD(e.target.value)}
                prefixSymbol="₹"
                placeholder="National Pension Scheme additional deduction..."
              />
            </>
          )}
        </div>

        {/* Right Outputs Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6 sticky top-20">
          {isSalaryTool ? (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: "Estimated Monthly In-Hand (Take-Home)",
                  value: formatCurrency(salaryBreakdown.monthlyTakeHome),
                }}
                secondaryMetrics={[
                  { label: "Annual Take-Home Pay", value: formatCurrency(salaryBreakdown.annualTakeHome) },
                  { label: "Gross Monthly Earnings", value: formatCurrency(salaryBreakdown.grossMonthlySalary) },
                  { label: "Monthly Income Tax (TDS)", value: formatCurrency(salaryBreakdown.monthlyTax) },
                  { label: "Monthly Employee PF", value: formatCurrency(salaryBreakdown.monthlyEmployeePF) },
                ]}
              />

              <ChartPanel
                title="Annual Package Distribution Breakdown"
                type="pie"
                data={salaryPieData}
                xKey="name"
                series={[
                  { key: "value", name: "Amount", color: "#10B981" },
                  { key: "value", name: "Amount", color: "#EF4444" },
                  { key: "value", name: "Amount", color: "#3B82F6" },
                  { key: "value", name: "Amount", color: "#8B5CF6" },
                ]}
              />

              <TableDisplay
                title="Detailed Salary Slip Breakdown"
                columns={salaryTableColumns}
                data={salaryTableData}
              />
            </>
          ) : (
            <>
              <ResultDisplay
                primaryMetric={{
                  label: `Recommended: ${taxResult.recommendedRegime}`,
                  value: `Saves ${formatCurrency(taxResult.savingsAmount)} in Tax`,
                }}
                secondaryMetrics={[
                  { label: "New Regime Total Tax", value: formatCurrency(taxResult.newRegime.totalTax) },
                  { label: "Old Regime Total Tax", value: formatCurrency(taxResult.oldRegime.totalTax) },
                  { label: "New Regime Monthly In-Hand", value: formatCurrency(taxResult.newRegime.monthlyInHand) },
                  { label: "Old Regime Monthly In-Hand", value: formatCurrency(taxResult.oldRegime.monthlyInHand) },
                ]}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* New Regime Slabs */}
                <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-bold text-xs text-accent">New Tax Regime Slabs</span>
                    <span className="font-mono text-xs font-bold text-text-primary">
                      {formatCurrency(taxResult.newRegime.totalTax)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
                    {taxResult.newRegime.slabs.map((slab, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span>{slab.slab} ({slab.rate})</span>
                        <span className="font-mono font-medium text-text-primary">{formatCurrency(slab.taxAmount)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-[11px] text-text-tertiary">
                      <span>4% Health & Education Cess</span>
                      <span className="font-mono">{formatCurrency(taxResult.newRegime.cess)}</span>
                    </div>
                  </div>
                </div>

                {/* Old Regime Slabs */}
                <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-bold text-xs text-text-primary">Old Tax Regime Slabs</span>
                    <span className="font-mono text-xs font-bold text-text-primary">
                      {formatCurrency(taxResult.oldRegime.totalTax)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
                    {taxResult.oldRegime.slabs.map((slab, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span>{slab.slab} ({slab.rate})</span>
                        <span className="font-mono font-medium text-text-primary">{formatCurrency(slab.taxAmount)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-[11px] text-text-tertiary">
                      <span>4% Health & Education Cess</span>
                      <span className="font-mono">{formatCurrency(taxResult.oldRegime.cess)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <ChartPanel
                title="Tax Liability Comparison (New vs Old)"
                type="bar"
                data={taxComparisonBarData}
                xKey="name"
                series={[
                  { key: "tax", name: "Total Tax Liability (₹)", color: "#EF4444" },
                ]}
              />
            </>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
