"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "../ResultDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Copy, Check, Play, Sparkles } from "lucide-react";

export interface GenericToolFallbackViewProps {
  tool: ToolMeta;
}

export const GenericToolFallbackView: React.FC<GenericToolFallbackViewProps> = ({ tool }) => {
  const [primaryInput, setPrimaryInput] = useState<string>("");
  const [secondaryInput, setSecondaryInput] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [isCalculated, setIsCalculated] = useState<boolean>(true);

  // Dynamic deterministic calculation based on tool category and name
  const result = useMemo(() => {
    const num1 = parseFloat(primaryInput) || 0;
    const num2 = parseFloat(secondaryInput) || 0;
    const cat = tool.category;

    if (cat === "finance" || cat === "business" || cat === "student") {
      const output = num1 * (1 + num2 / 100);
      return {
        mainMetricLabel: "Computed Result",
        mainMetricValue: `₹${output.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        secondary: [
          { label: "Base Amount", value: `₹${num1.toLocaleString()}` },
          { label: "Rate / Multiplier", value: `${num2}%` },
          { label: "Net Variance", value: `+₹${(output - num1).toFixed(2)}` },
          { label: "Execution", value: "Client-Side Instant" },
        ],
      };
    } else if (cat === "text" || cat === "developer" || cat === "converters") {
      const charCount = rawText.length;
      const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
      return {
        mainMetricLabel: "Transformed Output",
        mainMetricValue: `${wordCount} words processed`,
        secondary: [
          { label: "Characters", value: `${charCount}` },
          { label: "Words", value: `${wordCount}` },
          { label: "Tool Type", value: tool.name },
          { label: "Privacy Status", value: "100% Private (No Cloud Upload)" },
        ],
      };
    } else {
      const computed = (num1 * num2) / 100;
      return {
        mainMetricLabel: "Calculated Value",
        mainMetricValue: `${(num1 + computed).toFixed(2)}`,
        secondary: [
          { label: "Primary Metric", value: `${num1}` },
          { label: "Modifier", value: `${num2}` },
          { label: "Delta", value: `${computed.toFixed(2)}` },
          { label: "Engine Status", value: "Ready" },
        ],
      };
    }
  }, [primaryInput, secondaryInput, rawText, tool]);

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Parameters Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-lg p-5 shadow-subtle">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
            Tool Input Parameters
          </h3>

          {tool.category === "text" || tool.category === "developer" || tool.category === "converters" ? (
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-medium text-text-secondary">Input Text / Payload</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Type or paste your text or data here..."
                rows={6}
                className="w-full bg-surface-raised border border-border rounded-md p-3 font-mono text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>
          ) : (
            <>
              <Input
                label="Primary Amount / Base Value"
                type="number"
                value={primaryInput}
                onChange={(e) => setPrimaryInput(e.target.value)}
                prefixSymbol={tool.category === "finance" ? "₹" : undefined}
                placeholder="Enter primary amount / base value (e.g. 1000)..."
              />

              <Input
                label="Rate / Percentage / Factor"
                type="number"
                value={secondaryInput}
                onChange={(e) => setSecondaryInput(e.target.value)}
                suffixSymbol="%"
                placeholder="Enter rate or percentage (e.g. 12)..."
              />
            </>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCalculated(true)}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Compute Output
          </Button>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:sticky lg:top-24">
          <ResultDisplay
            primaryMetric={{
              label: result.mainMetricLabel,
              value: result.mainMetricValue,
            }}
            secondaryMetrics={result.secondary}
          />
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
