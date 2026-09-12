import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Download, Share2, Check } from "lucide-react";

export interface MetricItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface ResultDisplayProps {
  primaryMetric: {
    label: string;
    value: string | number;
  };
  secondaryMetrics?: MetricItem[];
  onDownloadPDF?: () => void;
  onCopyResult?: () => void;
}

export const ResultDisplay = React.memo<ResultDisplayProps>(({
  primaryMetric,
  secondaryMetrics = [],
  onDownloadPDF,
  onCopyResult,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = () => {
    let text = `${primaryMetric.label}: ${primaryMetric.value}\n`;
    secondaryMetrics.forEach((m) => {
      text += `${m.label}: ${m.value}\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopyResult) onCopyResult();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: primaryMetric.label,
        text: `${primaryMetric.label}: ${primaryMetric.value}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-5 bg-surface border border-border rounded-lg p-5 shadow-subtle">
      {/* Primary metric section */}
      <div className="flex flex-col gap-1 pb-4 border-b border-border">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          {primaryMetric.label}
        </span>
        <div className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight font-mono">
          {primaryMetric.value || "—"}
        </div>
      </div>

      {/* Grid of secondary metrics */}
      {secondaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {secondaryMetrics.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 p-3 rounded-md bg-surface-raised border border-border/80">
              <span className="text-[11px] text-text-secondary">{item.label}</span>
              <span className="text-base font-bold font-mono text-text-primary">
                {item.value !== undefined && item.value !== "" ? item.value : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {copied ? "Copied" : "Copy"}
        </Button>

        {onDownloadPDF && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownloadPDF}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export PDF
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          leftIcon={shared ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
        >
          {shared ? "Copied URL" : "Share"}
        </Button>
      </div>
    </div>
  );
});

ResultDisplay.displayName = "ResultDisplay";

export default ResultDisplay;
