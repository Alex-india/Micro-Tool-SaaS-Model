"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { ResultDisplay } from "../ResultDisplay";
import { ChartPanel } from "../ChartPanel";
import { TableDisplay } from "../TableDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { formatCurrency } from "@/lib/utils";
import { calculateIncomeTax } from "@/tools/finance/tax";

export interface TaxAndSalaryCalculatorViewProps {
  tool: ToolMeta;
}

export const TaxAndSalaryCalculatorView: React.FC<TaxAndSalaryCalculatorViewProps> = ({ tool }) => {
  const [annualCTC, setAnnualCTC] = useState<string>("");
  const [basicPercent, setBasicPercent] = useState<string>("50");
  const [hraExemption, setHraExemption] = useState<string>("");
  const [section80C, setSection80C] = useState<string>("");
  const [section80D, setSection80D] = useState<string>("");

  const numCTC = parseFloat(annualCTC) || 0;
  const numBasic = parseFloat(basicPercent) || 50;
  const numHra = parseFloat(hraExemption) || 0;
  const num80C = Math.min(150000, parseFloat(section80C) || 0);
  const num80D = parseFloat(section80D) || 0;

  const taxResult = useMemo(() => {
    return calculateIncomeTax({
      financialYear: "FY 2024-25",
      annualIncome: numCTC,
      section80CDeductions: num80C,
      hraExemption: numHra,
      otherDeductions: num80D,
    });
  }, [numCTC, num80C, num80D, numHra]);

  const monthlyBreakdown = useMemo(() => {
    const monthlyGross = numCTC / 12;
    const monthlyBasic = (numCTC * (numBasic / 100)) / 12;
    const monthlyPF = Math.min(monthlyBasic * 0.12, 1800);
    const monthlyProfTax = 200;
    const monthlyTax = (taxResult.newRegime.totalTax) / 12;
    const monthlyInHand = Math.max(0, monthlyGross - monthlyPF - monthlyProfTax - monthlyTax);

    return {
      monthlyGross: Math.round(monthlyGross),
      monthlyBasic: Math.round(monthlyBasic),
      monthlyPF: Math.round(monthlyPF),
      monthlyProfTax: Math.round(monthlyProfTax),
      monthlyTax: Math.round(monthlyTax),
      monthlyInHand: Math.round(monthlyInHand),
    };
  }, [numCTC, numBasic, taxResult]);

  const taxComparisonData = [
    { regime: "New Tax Regime (FY 2024-25)", tax: taxResult.newRegime.totalTax, cess: taxResult.newRegime.cess },
    { regime: "Old Tax Regime", tax: taxResult.oldRegime.totalTax, cess: taxResult.oldRegime.cess },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Settings */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-lg p-5 shadow-subtle">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
            Salary & Exemption Details
          </h3>

          <Input
            label="Annual Cost to Company (CTC / Gross Salary)"
            type="number"
            value={annualCTC}
            onChange={(e) => setAnnualCTC(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter annual CTC (e.g. 1200000)..."
          />

          <Input
            label="Basic Salary Ratio (% of CTC)"
            type="number"
            value={basicPercent}
            placeholder="50"
            onChange={(e) => setBasicPercent(e.target.value)}
            suffixSymbol="%"
          />

          <Input
            label="HRA Exemption Claim (₹ / year)"
            type="number"
            value={hraExemption}
            onChange={(e) => setHraExemption(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter HRA exemption (e.g. 100000)..."
          />

          <Input
            label="Section 80C Deductions (Max ₹1.5L)"
            type="number"
            value={section80C}
            onChange={(e) => setSection80C(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter 80C deductions (e.g. 150000)..."
          />

          <Input
            label="Section 80D Health Insurance (₹ / year)"
            type="number"
            value={section80D}
            onChange={(e) => setSection80D(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter 80D health insurance (e.g. 25000)..."
          />
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6 sticky top-20">
          <ResultDisplay
            primaryMetric={{
              label: "Estimated Monthly In-Hand Salary",
              value: formatCurrency(monthlyBreakdown.monthlyInHand),
            }}
            secondaryMetrics={[
              { label: "Gross Monthly Salary", value: formatCurrency(monthlyBreakdown.monthlyGross) },
              { label: "New Regime Annual Tax", value: formatCurrency(taxResult.newRegime.totalTax) },
              { label: "Old Regime Annual Tax", value: formatCurrency(taxResult.oldRegime.totalTax) },
              { label: "Recommended Regime", value: taxResult.recommendedRegime.toUpperCase() },
            ]}
          />

          <div className="bg-surface border border-border rounded-lg p-4 shadow-subtle flex flex-col gap-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Monthly Pay Slip Breakdown</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-surface-raised border border-border">
                <span className="text-[11px] text-text-tertiary block">Basic Pay</span>
                <span className="font-mono font-bold text-text-primary">{formatCurrency(monthlyBreakdown.monthlyBasic)}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-raised border border-border">
                <span className="text-[11px] text-text-tertiary block">Provident Fund (PF)</span>
                <span className="font-mono font-bold text-text-primary">{formatCurrency(monthlyBreakdown.monthlyPF)}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-raised border border-border">
                <span className="text-[11px] text-text-tertiary block">Monthly TDS</span>
                <span className="font-mono font-bold text-red-500">{formatCurrency(monthlyBreakdown.monthlyTax)}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-raised border border-border">
                <span className="text-[11px] text-text-tertiary block">Net In-Hand</span>
                <span className="font-mono font-bold text-emerald-500">{formatCurrency(monthlyBreakdown.monthlyInHand)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
