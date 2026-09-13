"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { ResultDisplay } from "../ResultDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { calculateGST } from "@/tools/finance/gst";
import { formatCurrency } from "@/lib/utils";

export interface GSTCalculatorViewProps {
  tool: ToolMeta;
}

export const GSTCalculatorView: React.FC<GSTCalculatorViewProps> = ({ tool }) => {
  const [amount, setAmount] = useState<string>("");
  const [gstRate, setGstRate] = useState<string>("18");
  const [calcType, setCalcType] = useState<"add" | "remove">("add");

  const numRate = parseFloat(gstRate) || 0;

  const result = useMemo(() => {
    return calculateGST({ amount: parseFloat(amount) || 0, gstRate: numRate, type: calcType });
  }, [amount, numRate, calcType]);

  const presetRates = [0, 5, 12, 18, 28];

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <Tabs
            tabs={[
              { id: "add", label: "Add GST (Exclusive)" },
              { id: "remove", label: "Remove GST (Inclusive)" },
            ]}
            activeTab={calcType}
            onChange={(id) => setCalcType(id as "add" | "remove")}
          />

          <Input
            label={calcType === "add" ? "Original Net Amount (₹)" : "GST-Inclusive Total Amount (₹)"}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            prefixSymbol="₹"
            placeholder="Enter amount (e.g. 10000)..."
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">GST Rate (%)</span>
            <div className="grid grid-cols-5 gap-2">
              {presetRates.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setGstRate(rate.toString())}
                  className={`py-2 text-xs font-semibold rounded-md border transition-all ${
                    gstRate === rate.toString()
                      ? "bg-accent border-accent text-white shadow-glow"
                      : "bg-surface-raised border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={gstRate}
              placeholder="18"
              onChange={(e) => setGstRate(e.target.value)}
              suffixSymbol="%"
              helperText="Or enter custom rate (e.g. 13.5)"
              className="mt-1"
            />
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6 lg:sticky lg:top-24">
          <ResultDisplay
            primaryMetric={{
              label: calcType === "add" ? "Total Gross Amount (with GST)" : "Original Net Amount (before GST)",
              value: formatCurrency(calcType === "add" ? result.totalAmount : result.originalAmount),
            }}
            secondaryMetrics={[
              { label: "Net Original Amount", value: formatCurrency(result.originalAmount) },
              { label: `Total GST (${gstRate}%)`, value: formatCurrency(result.gstAmount) },
              { label: "CGST (Central GST)", value: formatCurrency(result.cgstAmount) },
              { label: "SGST (State GST)", value: formatCurrency(result.sgstAmount) },
            ]}
          />
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
