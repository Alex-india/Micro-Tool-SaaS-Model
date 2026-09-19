"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { generateQRCode } from "@/tools/privacy/qrcode";
import {
  cleanAndAnalyzeUrl,
  cleanBulkUrls,
  CLEANER_PRESETS,
  type CleanerOptions,
  type DetailedCleanResult,
  type BulkCleanResult,
} from "@/tools/web/utmCleanerEngine";
import {
  Scissors,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  Trash2,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Link2,
  FileText,
  Filter,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export interface UTMCleanerViewProps {
  tool: ToolMeta;
}

export const UTMCleanerView: React.FC<UTMCleanerViewProps> = ({ tool }) => {
  // Mode Tab: Single vs Bulk
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single URL State
  const [singleInput, setSingleInput] = useState<string>(
    "https://store.example.com/products/wireless-headphones?id=8841&color=black&utm_source=facebook&utm_medium=paid-social&utm_campaign=black-friday-2025&fbclid=IwAR12XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ12345#customer-reviews"
  );

  // Bulk URLs State
  const [bulkInput, setBulkInput] = useState<string>(`https://example.com/item-1?id=101&utm_source=google&gclid=123456
https://example.com/item-2?user=demo&utm_source=facebook&fbclid=abcdef#comments
https://example.com/item-3?newsletter=read&mc_cid=9876&mc_eid=5432
https://example.com/item-4?igshid=insta_share_99&ttclid=tiktok_click_88
https://example.com/clean-link-already?category=gadgets&sort=newest`);

  // Advanced Options Toggles
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [stripUtm, setStripUtm] = useState<boolean>(true);
  const [stripAdClickIds, setStripAdClickIds] = useState<boolean>(true);
  const [stripSocialTracking, setStripSocialTracking] = useState<boolean>(true);
  const [stripEmailCrm, setStripEmailCrm] = useState<boolean>(true);
  const [stripAnalytics, setStripAnalytics] = useState<boolean>(true);
  const [stripAffiliate, setStripAffiliate] = useState<boolean>(false);
  const [stripHash, setStripHash] = useState<boolean>(false);
  const [stripAllQueryParams, setStripAllQueryParams] = useState<boolean>(false);
  const [customParamsInput, setCustomParamsInput] = useState<string>("");
  const [keepParamsInput, setKeepParamsInput] = useState<string>("id, v, q, page");

  // QR Code Modal State
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Copy Feedback
  const [copiedSingle, setCopiedSingle] = useState<boolean>(false);
  const [copiedBulk, setCopiedBulk] = useState<boolean>(false);
  const [copiedRowIdx, setCopiedRowIdx] = useState<number | null>(null);

  // Memoized Options
  const options: CleanerOptions = useMemo(() => {
    return {
      stripUtm,
      stripAdClickIds,
      stripSocialTracking,
      stripEmailCrm,
      stripAnalytics,
      stripAffiliate,
      stripHash,
      stripAllQueryParams,
      customParamsToRemove: customParamsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      paramsToKeep: keepParamsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }, [
    stripUtm,
    stripAdClickIds,
    stripSocialTracking,
    stripEmailCrm,
    stripAnalytics,
    stripAffiliate,
    stripHash,
    stripAllQueryParams,
    customParamsInput,
    keepParamsInput,
  ]);

  // Clean Single Result
  const singleResult: DetailedCleanResult = useMemo(() => {
    return cleanAndAnalyzeUrl(singleInput, options);
  }, [singleInput, options]);

  // Clean Bulk Result
  const bulkResult: BulkCleanResult = useMemo(() => {
    return cleanBulkUrls(bulkInput, options);
  }, [bulkInput, options]);

  // Update QR code whenever cleaned single URL changes
  useEffect(() => {
    if (singleResult.cleanUrl && singleResult.isValidUrl) {
      generateQRCode({
        text: singleResult.cleanUrl,
        size: 280,
        fgColor: "#0f172a",
        bgColor: "#ffffff",
      }).then((url) => setQrDataUrl(url));
    } else {
      setQrDataUrl("");
    }
  }, [singleResult.cleanUrl, singleResult.isValidUrl]);

  // Copy Single
  const handleCopySingle = useCallback(() => {
    if (!singleResult.cleanUrl) return;
    navigator.clipboard.writeText(singleResult.cleanUrl).then(() => {
      setCopiedSingle(true);
      setTimeout(() => setCopiedSingle(false), 2000);
    });
  }, [singleResult.cleanUrl]);

  // Copy Bulk All
  const handleCopyBulk = useCallback(() => {
    if (!bulkResult.allCleanedText) return;
    navigator.clipboard.writeText(bulkResult.allCleanedText).then(() => {
      setCopiedBulk(true);
      setTimeout(() => setCopiedBulk(false), 2000);
    });
  }, [bulkResult.allCleanedText]);

  // Copy Single Row in Bulk Table
  const handleCopyRow = useCallback((text: string, index: number) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRowIdx(index);
      setTimeout(() => setCopiedRowIdx(null), 2000);
    });
  }, []);

  // Export Bulk as TXT
  const handleExportTxt = () => {
    if (!bulkResult.allCleanedText) return;
    const blob = new Blob([bulkResult.allCleanedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleaned-urls-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Bulk as CSV
  const handleExportCsv = () => {
    if (bulkResult.items.length === 0) return;
    const header = "Index,Status,Original URL,Clean URL,Removed Params,Characters Saved\n";
    const rows = bulkResult.items
      .map(
        (item) =>
          `"${item.index}","${item.status}","${item.original.replace(/"/g, '""')}","${item.cleaned.replace(/"/g, '""')}","${item.removedCount}","${item.savedChars}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleaned-urls-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const p = CLEANER_PRESETS.find((x) => x.id === presetId);
    if (p) {
      if (p.id === "mixed_bulk") {
        setActiveTab("bulk");
        setBulkInput(p.url);
      } else {
        setActiveTab("single");
        setSingleInput(p.url);
      }
    }
  };

  // Reset to Defaults
  const handleResetFilters = () => {
    setStripUtm(true);
    setStripAdClickIds(true);
    setStripSocialTracking(true);
    setStripEmailCrm(true);
    setStripAnalytics(true);
    setStripAffiliate(false);
    setStripHash(false);
    setStripAllQueryParams(false);
    setCustomParamsInput("");
    setKeepParamsInput("id, v, q, page");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <ToolHeader tool={tool} />

      {/* Main Studio Card */}
      <div className="bg-surface/80 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        {/* Navigation Bar & Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
            <button
              onClick={() => setActiveTab("single")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "single"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Scissors className="w-4 h-4" />
              Single URL Cleaner & Inspector
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "bulk"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Layers className="w-4 h-4" />
              Bulk Multi-Line De-Tracker
              {bulkResult.totalUrls > 0 && (
                <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-accent-foreground/15 text-accent-foreground">
                  {bulkResult.totalUrls}
                </span>
              )}
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted font-medium mr-1 hidden sm:inline flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Samples:
            </span>
            {CLEANER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset.id)}
                title={preset.description}
                className="px-2.5 py-1 text-xs rounded-lg border border-border bg-surface hover:bg-surface-secondary text-foreground hover:border-accent/40 transition-all font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Cleaning Rules Toggle */}
        <div className="border border-border/70 bg-surface-secondary/30 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-surface-secondary/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-accent" />
              Cleaning Rules & Whitelist Options
              {(!stripUtm || !stripAdClickIds || stripAffiliate || stripHash || stripAllQueryParams) && (
                <span className="px-2 py-0.5 bg-accent/20 text-accent text-[10px] rounded-full">
                  Customized
                </span>
              )}
            </span>
            <span className="text-muted hover:text-foreground text-xs">
              {showOptions ? "Hide Options ▲" : "Show Options ▼"}
            </span>
          </button>

          {showOptions && (
            <div className="p-4 border-t border-border/60 bg-surface/40 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripUtm}
                    onChange={(e) => setStripUtm(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Strip UTM parameters (<code>utm_*</code>)</span>
                </label>

                <label className="flex items-center gap-2 text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripAdClickIds}
                    onChange={(e) => setStripAdClickIds(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Strip Ad Click IDs (<code>fbclid, gclid, etc.</code>)</span>
                </label>

                <label className="flex items-center gap-2 text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripSocialTracking}
                    onChange={(e) => setStripSocialTracking(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Strip Social Trackers (<code>igshid, ref_src</code>)</span>
                </label>

                <label className="flex items-center gap-2 text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripEmailCrm}
                    onChange={(e) => setStripEmailCrm(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Strip Email & CRM (<code>mc_cid, _hsenc</code>)</span>
                </label>

                <label className="flex items-center gap-2 text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripAnalytics}
                    onChange={(e) => setStripAnalytics(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Strip Analytics (<code>_ga, _gl, pk_campaign</code>)</span>
                </label>

                <label className="flex items-center gap-2 text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripAffiliate}
                    onChange={(e) => setStripAffiliate(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Strip Affiliate Tags (<code>tag, ascsubtag</code>)</span>
                </label>

                <label className="flex items-center gap-2 text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripHash}
                    onChange={(e) => setStripHash(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Strip Hash Fragment (<code>#section</code>)</span>
                </label>

                <label className="flex items-center gap-2 text-destructive cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    checked={stripAllQueryParams}
                    onChange={(e) => setStripAllQueryParams(e.target.checked)}
                    className="rounded border-border text-destructive focus:ring-destructive"
                  />
                  <span>Strip ALL Query Params (clean URL only)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div>
                  <label className="block text-foreground font-semibold mb-1">
                    Whitelist Parameters to Always Keep (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={keepParamsInput}
                    onChange={(e) => setKeepParamsInput(e.target.value)}
                    placeholder="e.g. id, v, q, page, category"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Parameters here will never be removed, even if they match tracking filters.
                  </p>
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">
                    Custom Parameters to Remove (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={customParamsInput}
                    onChange={(e) => setCustomParamsInput(e.target.value)}
                    placeholder="e.g. my_internal_id, user_tracker, sid"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Additional company-specific tracking tokens to strip.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-muted hover:text-foreground underline"
                >
                  Reset rules to default
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= SINGLE URL TAB ================= */}
        {activeTab === "single" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Input URL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-accent" />
                    Messy URL with UTM / Click Trackers
                  </label>
                  {singleInput && (
                    <button
                      onClick={() => setSingleInput("")}
                      className="text-xs text-muted hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                <textarea
                  value={singleInput}
                  onChange={(e) => setSingleInput(e.target.value)}
                  placeholder="Paste URL with utm_source, fbclid, gclid, or other tracking parameters..."
                  rows={6}
                  className="w-full bg-surface border border-border rounded-xl p-3.5 font-mono text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                />

                <div className="text-[11px] text-muted flex items-center justify-between">
                  <span>Input Length: {singleInput.length} characters</span>
                  <span>
                    Status:{" "}
                    {singleResult.isValidUrl ? (
                      <span className="text-emerald-400 font-semibold">Valid URL</span>
                    ) : (
                      <span className="text-amber-400 font-semibold">Invalid / Incomplete</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Right Column: Cleaned Output & Metrics */}
              <div className="bg-surface-secondary/30 border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-foreground">Cleaned Canonical URL</span>
                    </div>

                    {singleResult.charactersSaved > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                        -{singleResult.charactersSaved} chars ({singleResult.percentSaved}% stripped)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-surface border border-border text-muted text-xs">
                        Already Clean
                      </span>
                    )}
                  </div>

                  {/* Clean URL Output Box */}
                  <div className="p-3.5 bg-surface border border-border rounded-xl font-mono text-xs text-emerald-400 break-all select-all min-h-[90px] flex items-center">
                    {singleResult.cleanUrl || (
                      <span className="text-muted italic">Clean URL will be rendered here...</span>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleCopySingle}
                      disabled={!singleResult.cleanUrl}
                      className="flex-1 py-2 px-4 rounded-lg bg-accent text-accent-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {copiedSingle ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Copied Clean URL!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Clean URL</span>
                        </>
                      )}
                    </button>

                    {singleResult.cleanUrl && singleResult.isValidUrl && (
                      <>
                        <a
                          href={singleResult.cleanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open clean link in new browser tab"
                          className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => setShowQrModal(true)}
                          title="Generate QR code for this clean link"
                          className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50 text-center">
                  <div className="p-2 rounded-lg bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-muted uppercase font-semibold block">Trackers Stripped</span>
                    <span className="text-sm font-bold text-destructive font-mono">
                      {singleResult.removedParams.length}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-muted uppercase font-semibold block">Params Kept</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {singleResult.keptParams.length}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-muted uppercase font-semibold block">Chars Saved</span>
                    <span className="text-sm font-bold text-accent font-mono">
                      {singleResult.charactersSaved}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Parameters Breakdown Table */}
            {singleResult.parametersAnalyzed.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-accent" />
                    Deep Parameter Audit ({singleResult.parametersAnalyzed.length} detected)
                  </h4>
                  <span className="text-[11px] text-muted">
                    {singleResult.removedParams.length} removed • {singleResult.keptParams.length} preserved
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-secondary/80 border-b border-border text-muted">
                        <th className="p-3 font-semibold">Parameter Key</th>
                        <th className="p-3 font-semibold">Value</th>
                        <th className="p-3 font-semibold">Classification</th>
                        <th className="p-3 font-semibold">Action</th>
                        <th className="p-3 font-semibold">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono">
                      {singleResult.parametersAnalyzed.map((param, i) => (
                        <tr
                          key={`${param.key}-${i}`}
                          className={`transition-colors ${
                            param.action === "removed"
                              ? "bg-destructive/5 hover:bg-destructive/10"
                              : "hover:bg-surface-secondary/40"
                          }`}
                        >
                          <td className="p-3 font-bold text-foreground">{param.key}</td>
                          <td className="p-3 text-muted max-w-[200px] truncate" title={param.value}>
                            {param.value}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium border ${
                                param.category === "UTM Tag"
                                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                  : param.category === "Ad Click ID"
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                  : param.category === "Social Tracker"
                                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                  : param.category === "Email / CRM"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                  : param.category === "Web Analytics"
                                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                  : "bg-surface border-border text-muted"
                              }`}
                            >
                              {param.category || "Functional"}
                            </span>
                          </td>
                          <td className="p-3">
                            {param.action === "removed" ? (
                              <span className="inline-flex items-center gap-1 text-destructive font-semibold font-sans text-xs">
                                <XCircle className="w-3.5 h-3.5" />
                                Stripped
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold font-sans text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Kept
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-sans text-muted text-xs">{param.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= BULK MULTI-LINE TAB ================= */}
        {activeTab === "bulk" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Multi-line Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-accent" />
                    Paste Multiple URLs (One per line, up to 50 URLs)
                  </label>
                  {bulkInput && (
                    <button
                      onClick={() => setBulkInput("")}
                      className="text-xs text-muted hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="https://example.com/page?utm_source=google&#10;https://example.com/item?fbclid=123&#10;..."
                  rows={8}
                  className="w-full bg-surface border border-border rounded-xl p-3.5 font-mono text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                />

                <div className="text-[11px] text-muted flex items-center justify-between">
                  <span>Lines: {bulkResult.totalUrls} URLs</span>
                  <span className="text-emerald-400 font-medium">
                    Instant client-side processing
                  </span>
                </div>
              </div>

              {/* Right Column: Cleaned Bulk Output */}
              <div className="bg-surface-secondary/30 border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Cleaned URLs Output
                    </span>
                    <span className="text-xs text-muted">
                      {bulkResult.cleanedCount} sanitized • {bulkResult.alreadyCleanCount} already clean
                    </span>
                  </div>

                  <textarea
                    readOnly
                    value={bulkResult.allCleanedText}
                    rows={8}
                    className="w-full bg-surface border border-border rounded-xl p-3.5 font-mono text-xs text-emerald-400 select-all focus:outline-none"
                    placeholder="Clean URLs will appear here..."
                  />

                  {/* Bulk Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleCopyBulk}
                      disabled={!bulkResult.allCleanedText}
                      className="flex-1 py-2 px-4 rounded-lg bg-accent text-accent-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50"
                    >
                      {copiedBulk ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Copied All Clean URLs!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy All Clean URLs</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleExportTxt}
                      disabled={!bulkResult.allCleanedText}
                      className="px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-surface-secondary transition-colors disabled:opacity-50"
                      title="Download clean URLs as text file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      .TXT
                    </button>

                    <button
                      onClick={handleExportCsv}
                      disabled={bulkResult.items.length === 0}
                      className="px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-surface-secondary transition-colors disabled:opacity-50"
                      title="Download audit report as CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      .CSV
                    </button>
                  </div>
                </div>

                {/* Bulk Summary Counters */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/50 text-center">
                  <div className="p-2 rounded-lg bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-muted uppercase font-semibold block">Total URLs</span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {bulkResult.totalUrls}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-muted uppercase font-semibold block">Cleaned</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {bulkResult.cleanedCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-muted uppercase font-semibold block">Tags Removed</span>
                    <span className="text-sm font-bold text-destructive font-mono">
                      {bulkResult.totalParamsRemoved}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-muted uppercase font-semibold block">Chars Saved</span>
                    <span className="text-sm font-bold text-accent font-mono">
                      {bulkResult.totalCharactersSaved}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Item Results Table */}
            {bulkResult.items.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-accent" />
                    Processed URLs Breakdown ({bulkResult.items.length})
                  </h4>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-secondary/80 border-b border-border text-muted">
                        <th className="p-3 font-semibold">#</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Original Link</th>
                        <th className="p-3 font-semibold">Clean Link</th>
                        <th className="p-3 font-semibold">Tags Stripped</th>
                        <th className="p-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono">
                      {bulkResult.items.map((item) => (
                        <tr key={item.index} className="hover:bg-surface-secondary/30 transition-colors">
                          <td className="p-3 text-muted">{item.index}</td>
                          <td className="p-3 font-sans">
                            {item.status === "cleaned" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                Cleaned
                              </span>
                            ) : item.status === "already_clean" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface border border-border text-muted">
                                Clean
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                Invalid
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-muted max-w-xs truncate" title={item.original}>
                            {item.original}
                          </td>
                          <td className="p-3 text-emerald-400 max-w-xs truncate" title={item.cleaned}>
                            {item.cleaned}
                          </td>
                          <td className="p-3 text-destructive">
                            {item.removedCount > 0 ? `-${item.removedCount} tags` : "None"}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleCopyRow(item.cleaned, item.index)}
                              className="px-2.5 py-1 rounded bg-surface border border-border text-foreground hover:bg-surface-secondary transition-colors inline-flex items-center gap-1 font-sans text-xs"
                            >
                              {copiedRowIdx === item.index ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-accent" />
                Clean Link QR Code
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-muted hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-xl">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Clean URL QR Code" className="w-56 h-56" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-500">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="text-center text-xs text-muted font-mono truncate px-2" title={singleResult.cleanUrl}>
              {singleResult.cleanUrl}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (qrDataUrl) {
                    const a = document.createElement("a");
                    a.href = qrDataUrl;
                    a.download = `clean-url-qr-${Date.now()}.png`;
                    a.click();
                  }
                }}
                className="flex-1 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Download PNG
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="py-2 px-4 rounded-lg bg-surface-secondary border border-border text-foreground text-xs font-semibold hover:bg-surface transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO Educational Guide */}
      <SEOContent tool={tool} />

      {/* Related Tools */}
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
