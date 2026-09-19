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
  buildUtmUrl,
  parseUtmUrl,
  cleanUtmUrl,
  generateBatchUtmUrls,
  CHANNEL_TEMPLATES,
  UTM_PRESETS,
  type UtmParams,
  type UtmBuildOptions,
  type UtmBuildResult,
  type CleanUrlResult,
  type BatchUtmItem,
} from "@/tools/web/utmEngine";
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  Trash2,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Share2,
  Globe,
  Tag,
  Search,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  FileSpreadsheet,
} from "lucide-react";

export interface UTMBuilderViewProps {
  tool: ToolMeta;
}

export const UTMBuilderView: React.FC<UTMBuilderViewProps> = ({ tool }) => {
  const isCleanerDefault = tool.slug === "utm-cleaner";

  // Tab State
  const [activeTab, setActiveTab] = useState<"builder" | "batch" | "cleaner" | "inspector">(
    isCleanerDefault ? "cleaner" : "builder"
  );

  // Builder Parameters State
  const [baseUrl, setBaseUrl] = useState<string>("https://toolverse.app/pricing");
  const [utmSource, setUtmSource] = useState<string>("google");
  const [utmMedium, setUtmMedium] = useState<string>("cpc");
  const [utmCampaign, setUtmCampaign] = useState<string>("autumn-promo-2025");
  const [utmTerm, setUtmTerm] = useState<string>("developer-tools");
  const [utmContent, setUtmContent] = useState<string>("banner-hero");

  // GA4 Extended Parameters
  const [showGa4Extended, setShowGa4Extended] = useState<boolean>(false);
  const [utmId, setUtmId] = useState<string>("");
  const [utmSourcePlatform, setUtmSourcePlatform] = useState<string>("");
  const [utmCreativeFormat, setUtmCreativeFormat] = useState<string>("");
  const [utmMarketingTactic, setUtmMarketingTactic] = useState<string>("");

  // Options
  const [autoLowercase, setAutoLowercase] = useState<boolean>(true);
  const [spaceReplacement, setSpaceReplacement] = useState<"hyphen" | "underscore" | "plus" | "none">("hyphen");
  const [preserveExistingParams, setPreserveExistingParams] = useState<boolean>(true);

  // Batch Generator State
  const [batchBaseUrl, setBatchBaseUrl] = useState<string>("https://toolverse.app/tools");
  const [batchCampaign, setBatchCampaign] = useState<string>("product-launch");

  // Cleaner State
  const [cleanerInputUrl, setCleanerInputUrl] = useState<string>(
    "https://news.com/article?id=492&utm_source=facebook&utm_medium=social&fbclid=IwAR23149817234&gclid=CjwKCAiA#comments"
  );

  // Inspector State
  const [inspectorInputUrl, setInspectorInputUrl] = useState<string>(
    "https://store.com/item?category=gadgets&utm_source=twitter&utm_medium=social&utm_campaign=fall_deals#specifications"
  );

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Copy States
  const [copiedBuilder, setCopiedBuilder] = useState<boolean>(false);
  const [copiedCleaner, setCopiedCleaner] = useState<boolean>(false);
  const [copiedBatchId, setCopiedBatchId] = useState<string | null>(null);

  // Memoized Build Options
  const buildOptions: UtmBuildOptions = useMemo(
    () => ({
      autoLowercase,
      spaceReplacement,
      preserveExistingParams,
    }),
    [autoLowercase, spaceReplacement, preserveExistingParams]
  );

  // Build current UTM URL
  const buildResult: UtmBuildResult = useMemo(() => {
    return buildUtmUrl(
      {
        baseUrl,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        utmId,
        utmSourcePlatform,
        utmCreativeFormat,
        utmMarketingTactic,
      },
      buildOptions
    );
  }, [
    baseUrl,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    utmId,
    utmSourcePlatform,
    utmCreativeFormat,
    utmMarketingTactic,
    buildOptions,
  ]);

  // Clean URL result
  const cleanResult: CleanUrlResult = useMemo(() => {
    return cleanUtmUrl(cleanerInputUrl);
  }, [cleanerInputUrl]);

  // Inspector parsed result
  const inspectResult: UtmBuildResult = useMemo(() => {
    return parseUtmUrl(inspectorInputUrl);
  }, [inspectorInputUrl]);

  // Batch links
  const batchResults: BatchUtmItem[] = useMemo(() => {
    return generateBatchUtmUrls(batchBaseUrl, batchCampaign, buildOptions);
  }, [batchBaseUrl, batchCampaign, buildOptions]);

  // Update QR Code when fullUrl changes
  useEffect(() => {
    if (buildResult.fullUrl && buildResult.isValidUrl) {
      generateQRCode({
        text: buildResult.fullUrl,
        size: 300,
        fgColor: "#0f172a",
        bgColor: "#ffffff",
      }).then((url) => setQrDataUrl(url));
    } else {
      setQrDataUrl("");
    }
  }, [buildResult.fullUrl, buildResult.isValidUrl]);

  // Copy handler
  const handleCopy = useCallback((text: string, type: "builder" | "cleaner" | "batch", batchId = "") => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (type === "builder") {
        setCopiedBuilder(true);
        setTimeout(() => setCopiedBuilder(false), 2000);
      } else if (type === "cleaner") {
        setCopiedCleaner(true);
        setTimeout(() => setCopiedCleaner(false), 2000);
      } else if (type === "batch") {
        setCopiedBatchId(batchId);
        setTimeout(() => setCopiedBatchId(null), 2000);
      }
    });
  }, []);

  // Export batch links as CSV
  const handleExportBatchCsv = () => {
    if (batchResults.length === 0) return;
    const header = "Channel,Source,Medium,Tracking URL\n";
    const rows = batchResults
      .map((b) => `"${b.channelName}","${b.source}","${b.medium}","${b.url}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-links-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preset loader
  const loadPreset = (presetId: string) => {
    const found = UTM_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setBaseUrl(found.params.baseUrl);
      setUtmSource(found.params.utmSource);
      setUtmMedium(found.params.utmMedium);
      setUtmCampaign(found.params.utmCampaign);
      setUtmTerm(found.params.utmTerm || "");
      setUtmContent(found.params.utmContent || "");
      setUtmId(found.params.utmId || "");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <ToolHeader tool={tool} />

      {/* Main Studio Card */}
      <div className="bg-surface/80 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
            <button
              onClick={() => setActiveTab("builder")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "builder"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Link2 className="w-4 h-4" />
              UTM Builder
            </button>
            <button
              onClick={() => setActiveTab("batch")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "batch"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Layers className="w-4 h-4" />
              Batch Channels
            </button>
            <button
              onClick={() => setActiveTab("cleaner")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "cleaner"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Scissors className="w-4 h-4" />
              URL De-Tracker
            </button>
            <button
              onClick={() => setActiveTab("inspector")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "inspector"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Search className="w-4 h-4" />
              Link Inspector
            </button>
          </div>

          {activeTab === "builder" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted hidden sm:inline">Templates:</span>
              <select
                onChange={(e) => loadPreset(e.target.value)}
                defaultValue="google_search"
                className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent focus:outline-none"
              >
                {UTM_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Campaign URL Builder */}
        {activeTab === "builder" && (
          <div className="space-y-6">
            {/* Options Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-secondary/40 border border-border/60 rounded-xl text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoLowercase}
                    onChange={(e) => setAutoLowercase(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  Auto-Lowercase (Recommended for GA4)
                </label>
                <label className="flex items-center gap-1.5 font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveExistingParams}
                    onChange={(e) => setPreserveExistingParams(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  Preserve Existing Query Parameters
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted">Space Replacement:</span>
                <select
                  value={spaceReplacement}
                  onChange={(e) => setSpaceReplacement(e.target.value as any)}
                  className="bg-surface border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-accent text-xs"
                >
                  <option value="hyphen">Hyphen (-)</option>
                  <option value="underscore">Underscore (_)</option>
                  <option value="plus">Plus (+)</option>
                  <option value="none">None (Raw %20)</option>
                </select>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Form: Inputs */}
              <div className="space-y-4">
                {/* Target URL */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>
                      Website Target URL <span className="text-destructive">*</span>
                    </span>
                    <span className="text-[11px] text-muted">Destination landing page</span>
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://yourwebsite.com/landing"
                    className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Source & Medium */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>
                        Campaign Source <span className="text-destructive">*</span>
                      </span>
                      <span className="text-[10px] text-muted font-mono">utm_source</span>
                    </label>
                    <input
                      type="text"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="e.g. google, newsletter, facebook"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>
                        Campaign Medium <span className="text-destructive">*</span>
                      </span>
                      <span className="text-[10px] text-muted font-mono">utm_medium</span>
                    </label>
                    <input
                      type="text"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="e.g. cpc, email, paid-social"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Campaign Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>
                      Campaign Name <span className="text-destructive">*</span>
                    </span>
                    <span className="text-[10px] text-muted font-mono">utm_campaign</span>
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="e.g. summer-promo, black-friday-2025"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Term & Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Campaign Term (Optional)</span>
                      <span className="text-[10px] text-muted font-mono">utm_term</span>
                    </label>
                    <input
                      type="text"
                      value={utmTerm}
                      onChange={(e) => setUtmTerm(e.target.value)}
                      placeholder="e.g. keywords for paid search"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Campaign Content (Optional)</span>
                      <span className="text-[10px] text-muted font-mono">utm_content</span>
                    </label>
                    <input
                      type="text"
                      value={utmContent}
                      onChange={(e) => setUtmContent(e.target.value)}
                      placeholder="e.g. banner-v1, cta-link-bottom"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Toggle GA4 Extended Fields */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGa4Extended(!showGa4Extended)}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {showGa4Extended ? "Hide GA4 Advanced Tracking Parameters" : "+ Show GA4 Advanced Tracking Parameters"}
                  </button>
                </div>

                {/* GA4 Extended Fields */}
                {showGa4Extended && (
                  <div className="p-4 bg-surface-secondary/50 border border-border rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted font-mono">utm_id (Campaign ID)</label>
                        <input
                          type="text"
                          value={utmId}
                          onChange={(e) => setUtmId(e.target.value)}
                          placeholder="e.g. ga-9821"
                          className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted font-mono">utm_source_platform</label>
                        <input
                          type="text"
                          value={utmSourcePlatform}
                          onChange={(e) => setUtmSourcePlatform(e.target.value)}
                          placeholder="e.g. Search Ads 360"
                          className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted font-mono">utm_creative_format</label>
                        <input
                          type="text"
                          value={utmCreativeFormat}
                          onChange={(e) => setUtmCreativeFormat(e.target.value)}
                          placeholder="e.g. carousel, display"
                          className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted font-mono">utm_marketing_tactic</label>
                        <input
                          type="text"
                          value={utmMarketingTactic}
                          onChange={(e) => setUtmMarketingTactic(e.target.value)}
                          placeholder="e.g. onboarding, remarketing"
                          className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Box: Live Output & QR Preview */}
              <div className="flex flex-col justify-between p-5 bg-surface-secondary/40 border border-border rounded-xl space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-accent" />
                      Generated Campaign URL
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
                      {buildResult.totalParamCount} parameters attached
                    </span>
                  </div>

                  {/* Warnings if any */}
                  {buildResult.warnings.length > 0 && (
                    <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        {buildResult.warnings.map((w, idx) => (
                          <p key={idx}>• {w}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* URL Display Area */}
                  <div className="p-4 bg-surface border border-border rounded-xl font-mono text-xs text-foreground break-all leading-relaxed select-all">
                    {buildResult.fullUrl || (
                      <span className="text-muted italic">Tracking URL will appear here...</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopy(buildResult.fullUrl, "builder")}
                      disabled={!buildResult.fullUrl}
                      className="flex-1 py-2 px-4 rounded-lg bg-accent text-accent-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-sm disabled:opacity-50"
                    >
                      {copiedBuilder ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Campaign URL</span>
                        </>
                      )}
                    </button>

                    {buildResult.fullUrl && (
                      <a
                        href={buildResult.fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
                        title="Test link in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => setShowQrModal(!showQrModal)}
                      disabled={!buildResult.fullUrl}
                      className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
                      title="View QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* QR Code Inline Preview */}
                {showQrModal && qrDataUrl && (
                  <div className="p-4 bg-surface border border-border rounded-xl flex flex-col items-center gap-3 animate-in fade-in duration-200">
                    <img src={qrDataUrl} alt="Campaign QR Code" className="w-40 h-40 rounded-lg shadow-sm" />
                    <div className="flex items-center gap-2">
                      <a
                        href={qrDataUrl}
                        download={`qr-campaign-${Date.now()}.png`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-secondary border border-border text-foreground hover:bg-surface transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PNG
                      </a>
                    </div>
                  </div>
                )}

                {/* Breakdown of Tags */}
                <div className="p-3 bg-surface/60 border border-border/80 rounded-xl space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    UTM Breakdown
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(buildResult.utmParams).map(([k, v]) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent font-mono text-[11px]"
                      >
                        {k}={v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Multi-Channel Batch Generator */}
        {activeTab === "batch" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  Multi-Channel Batch Campaign Generator
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Generate platform-optimized UTM links for Google, Meta, Email, LinkedIn, and more in 1 click.
                </p>
              </div>

              <button
                onClick={handleExportBatchCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border text-foreground hover:bg-surface-secondary transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Export CSV Sheet
              </button>
            </div>

            {/* Batch Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-secondary/40 border border-border rounded-xl">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Base Destination URL</label>
                <input
                  type="text"
                  value={batchBaseUrl}
                  onChange={(e) => setBatchBaseUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/offer"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Campaign Name</label>
                <input
                  type="text"
                  value={batchCampaign}
                  onChange={(e) => setBatchCampaign(e.target.value)}
                  placeholder="e.g. spring-sale-2025"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Batch Links Table */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-secondary/80 border-b border-border text-muted">
                    <th className="p-3 font-semibold">Channel</th>
                    <th className="p-3 font-semibold">Source</th>
                    <th className="p-3 font-semibold">Medium</th>
                    <th className="p-3 font-semibold">Generated Tracking Link</th>
                    <th className="p-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {batchResults.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                      <td className="p-3 font-sans font-medium text-foreground">{item.channelName}</td>
                      <td className="p-3 text-accent">{item.source}</td>
                      <td className="p-3 text-emerald-400">{item.medium}</td>
                      <td className="p-3 text-muted max-w-xs truncate" title={item.url}>
                        {item.url}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleCopy(item.url, "batch", item.id)}
                          className="px-2.5 py-1 rounded bg-surface border border-border text-foreground hover:bg-surface-secondary transition-colors inline-flex items-center gap-1 font-sans text-xs"
                        >
                          {copiedBatchId === item.id ? (
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

        {/* Tab 3: URL Cleaner / De-Tracker */}
        {activeTab === "cleaner" && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Scissors className="w-4 h-4 text-accent" />
                UTM & Ad Tracking URL Cleaner (De-Tracker)
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Remove messy UTM tags, Facebook click IDs (<code className="text-accent">fbclid</code>), and Google Ads tracking (<code className="text-accent">gclid</code>) for clean sharing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Messy URL with Tracking Tags</label>
                <textarea
                  value={cleanerInputUrl}
                  onChange={(e) => setCleanerInputUrl(e.target.value)}
                  placeholder="Paste URL with utm_source, fbclid, gclid, etc..."
                  rows={6}
                  className="w-full bg-surface border border-border rounded-xl p-3.5 font-mono text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Clean Output */}
              <div className="p-4 bg-surface-secondary/40 border border-border rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Cleaned Canonical URL</span>
                    {cleanResult.charactersSaved > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        -{cleanResult.charactersSaved} characters stripped
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 bg-surface border border-border rounded-xl font-mono text-xs text-emerald-400 break-all select-all">
                    {cleanResult.cleanUrl || <span className="text-muted italic">Clean URL will appear here...</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(cleanResult.cleanUrl, "cleaner")}
                      disabled={!cleanResult.cleanUrl}
                      className="flex-1 py-2 px-4 rounded-lg bg-accent text-accent-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50"
                    >
                      {copiedCleaner ? (
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
                    {cleanResult.cleanUrl && (
                      <a
                        href={cleanResult.cleanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Removed parameters list */}
                  {cleanResult.removedParams.length > 0 && (
                    <div className="text-xs text-muted">
                      <span className="font-semibold block mb-1">Removed Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {cleanResult.removedParams.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive rounded text-[11px] font-mono"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Link Inspector */}
        {activeTab === "inspector" && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                UTM Link Inspector & Analytics Audit
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Inspect and decode incoming campaign URLs to audit source, medium, and campaign parameters.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Paste Campaign Link to Inspect</label>
              <input
                type="text"
                value={inspectorInputUrl}
                onChange={(e) => setInspectorInputUrl(e.target.value)}
                placeholder="https://example.com/?utm_source=..."
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
              />
            </div>

            {/* Inspection Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-surface border border-border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Campaign Source</span>
                <span className="text-sm font-bold text-accent block font-mono">
                  {inspectResult.utmParams["utm_source"] || <span className="text-muted font-normal italic">None</span>}
                </span>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Campaign Medium</span>
                <span className="text-sm font-bold text-emerald-400 block font-mono">
                  {inspectResult.utmParams["utm_medium"] || <span className="text-muted font-normal italic">None</span>}
                </span>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Campaign Name</span>
                <span className="text-sm font-bold text-purple-400 block font-mono">
                  {inspectResult.utmParams["utm_campaign"] || <span className="text-muted font-normal italic">None</span>}
                </span>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Term / Keyword</span>
                <span className="text-sm font-bold text-blue-400 block font-mono">
                  {inspectResult.utmParams["utm_term"] || <span className="text-muted font-normal italic">None</span>}
                </span>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Content / Creative</span>
                <span className="text-sm font-bold text-amber-400 block font-mono">
                  {inspectResult.utmParams["utm_content"] || <span className="text-muted font-normal italic">None</span>}
                </span>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Hash Fragment</span>
                <span className="text-sm font-bold text-foreground block font-mono">
                  {inspectResult.hash || <span className="text-muted font-normal italic">None</span>}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEO Content */}
      <SEOContent tool={tool} />

      {/* Related Tools */}
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
