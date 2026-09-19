"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  generateCanonicalUrl,
  CANONICAL_PRESETS,
  type CanonicalOptions,
  type ProtocolOption,
  type WwwOption,
  type TrailingSlashOption,
  type QueryOption,
  type CanonicalResult,
} from "@/tools/web/canonicalEngine";
import {
  Link2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ArrowRight,
  Code2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Sliders,
  FileCode,
  Info,
  BookOpen,
} from "lucide-react";

export interface CanonicalUrlGeneratorViewProps {
  tool: ToolMeta;
}

export const CanonicalUrlGeneratorView: React.FC<CanonicalUrlGeneratorViewProps> = ({ tool }) => {
  // Preset or default URL
  const defaultPreset = CANONICAL_PRESETS[0];

  const [inputUrl, setInputUrl] = useState<string>(defaultPreset.url);
  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);

  // Normalization options
  const [protocol, setProtocol] = useState<ProtocolOption>("https");
  const [www, setWww] = useState<WwwOption>("remove");
  const [trailingSlash, setTrailingSlash] = useState<TrailingSlashOption>("remove");
  const [queryMode, setQueryMode] = useState<QueryOption>("strip_tracking");
  const [whitelistInput, setWhitelistInput] = useState<string>("id, page, p, v, q, category");
  const [stripHash, setStripHash] = useState<boolean>(true);
  const [sortQueryParams, setSortQueryParams] = useState<boolean>(true);

  // Active Code Export Tab
  const [exportTab, setExportTab] = useState<"html" | "header" | "nextApp" | "nextPages" | "nuxt">("html");

  // Copy status feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compile options
  const canonicalOptions: CanonicalOptions = useMemo(() => {
    const keepList = whitelistInput
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    return {
      protocol,
      www,
      trailingSlash,
      queryMode,
      paramsToKeep: keepList,
      stripHash,
      sortQueryParams,
    };
  }, [protocol, www, trailingSlash, queryMode, whitelistInput, stripHash, sortQueryParams]);

  // Compute canonical result
  const result: CanonicalResult = useMemo(() => {
    return generateCanonicalUrl(inputUrl, canonicalOptions);
  }, [inputUrl, canonicalOptions]);

  // Clipboard handler
  const handleCopy = useCallback((text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Download export snippet
  const handleDownload = useCallback(() => {
    let content = "";
    let filename = "canonical.html";

    switch (exportTab) {
      case "html":
        content = result.htmlTag;
        filename = "canonical-tag.html";
        break;
      case "header":
        content = result.httpHeader;
        filename = "canonical-header.txt";
        break;
      case "nextApp":
        content = result.nextJsAppCode;
        filename = "next-app-canonical.tsx";
        break;
      case "nextPages":
        content = result.nextJsPagesCode;
        filename = "next-pages-canonical.tsx";
        break;
      case "nuxt":
        content = result.nuxtCode;
        filename = "nuxt-canonical.vue";
        break;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportTab, result]);

  // Load Preset
  const handleLoadPreset = (preset: typeof CANONICAL_PRESETS[number]) => {
    setInputUrl(preset.url);
    setActivePresetId(preset.id);
  };

  // Active Code string for current tab
  const activeCodeSnippet = useMemo(() => {
    switch (exportTab) {
      case "html":
        return result.htmlTag;
      case "header":
        return result.httpHeader;
      case "nextApp":
        return result.nextJsAppCode;
      case "nextPages":
        return result.nextJsPagesCode;
      case "nuxt":
        return result.nuxtCode;
      default:
        return result.htmlTag;
    }
  }, [exportTab, result]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
      <ToolHeader tool={tool} />

      {/* Preset Bar */}
      <div className="flex flex-col gap-2 bg-surface-raised/40 backdrop-blur-md p-4 rounded-xl border border-border/80">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Quick Scenarios & Edge Cases
          </span>
          <span className="text-[11px] text-text-tertiary">
            Click any scenario to test URL normalization
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CANONICAL_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-accent text-white border-accent shadow-sm"
                    : "bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary border-border"
                }`}
                title={preset.description}
              >
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Settings on Left, Inspector & Code on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Options (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Input URL Card */}
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label htmlFor="canonical-url-input" className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Raw / Source Webpage URL
              </label>
              <div className="flex items-center gap-1">
                {inputUrl && (
                  <button
                    onClick={() => {
                      setInputUrl("");
                      setActivePresetId("");
                    }}
                    className="text-[11px] text-text-tertiary hover:text-red-400 px-2 py-0.5 rounded transition"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setInputUrl(text.trim());
                        setActivePresetId("");
                      }
                    } catch {
                      // Clipboard access error handling
                    }
                  }}
                  className="text-[11px] text-accent hover:underline px-2 py-0.5 rounded"
                >
                  Paste
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="canonical-url-input"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setActivePresetId("");
                }}
                rows={3}
                placeholder="https://example.com/products/item?color=blue&utm_source=fb#reviews"
                className="w-full bg-background border border-border focus:border-accent rounded-lg p-3 text-xs font-mono text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none transition"
              />
              <div className="absolute right-2 bottom-2">
                {result.isValid ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Valid URI
                  </span>
                ) : inputUrl ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" />
                    Invalid URI
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Normalization Engine Settings */}
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" />
                Canonical Normalization Rules
              </h2>
              <button
                onClick={() => {
                  setProtocol("https");
                  setWww("remove");
                  setTrailingSlash("remove");
                  setQueryMode("strip_tracking");
                  setStripHash(true);
                  setSortQueryParams(true);
                  setWhitelistInput("id, page, p, v, q, category");
                }}
                className="text-[11px] text-text-tertiary hover:text-accent flex items-center gap-1 transition"
                title="Reset to recommended SEO standards"
              >
                <RotateCcw className="w-3 h-3" />
                Defaults
              </button>
            </div>

            {/* Protocol */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary flex justify-between">
                <span>Protocol Policy</span>
                <span className="text-[10px] text-accent">Google strongly prefers HTTPS</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "https", label: "Enforce HTTPS", hint: "Recommended" },
                    { id: "http", label: "Enforce HTTP", hint: "Legacy" },
                    { id: "preserve", label: "Preserve", hint: "As entered" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setProtocol(opt.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs text-center transition flex flex-col items-center ${
                      protocol === opt.id
                        ? "bg-accent/15 border-accent text-accent font-semibold"
                        : "bg-surface-raised border-border text-text-secondary hover:border-border/80"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[9px] opacity-70">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subdomain (WWW) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary flex justify-between">
                <span>Subdomain (WWW) Rule</span>
                <span className="text-[10px] text-text-tertiary">Avoid splitting domain equity</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "remove", label: "Strip www", hint: "naked domain" },
                    { id: "enforce", label: "Enforce www", hint: "www.example.com" },
                    { id: "preserve", label: "Preserve", hint: "As entered" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setWww(opt.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs text-center transition flex flex-col items-center ${
                      www === opt.id
                        ? "bg-accent/15 border-accent text-accent font-semibold"
                        : "bg-surface-raised border-border text-text-secondary hover:border-border/80"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[9px] opacity-70">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trailing Slash */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary flex justify-between">
                <span>Trailing Slash Structure</span>
                <span className="text-[10px] text-text-tertiary">Consistent URI paths</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "remove", label: "No Slash", hint: "/page" },
                    { id: "enforce", label: "Force Slash", hint: "/page/" },
                    { id: "preserve", label: "Preserve", hint: "As entered" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTrailingSlash(opt.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs text-center transition flex flex-col items-center ${
                      trailingSlash === opt.id
                        ? "bg-accent/15 border-accent text-accent font-semibold"
                        : "bg-surface-raised border-border text-text-secondary hover:border-border/80"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[9px] opacity-70">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Parameters Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary flex justify-between">
                <span>Query Parameter Handling</span>
                <span className="text-[10px] text-accent">Prevent duplicate crawl waste</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "strip_tracking", label: "Strip Tracking", hint: "utm, fbclid, gclid..." },
                    { id: "strip_all", label: "Strip All", hint: "Clean permalinks" },
                    { id: "whitelist", label: "Whitelist Only", hint: "Keep specific params" },
                    { id: "preserve", label: "Preserve All", hint: "Keep everything" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setQueryMode(opt.id)}
                    className={`p-2 rounded-lg border text-xs text-left transition flex flex-col ${
                      queryMode === opt.id
                        ? "bg-accent/15 border-accent text-accent font-semibold"
                        : "bg-surface-raised border-border text-text-secondary hover:border-border/80"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] opacity-70">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Whitelist Input (conditionally visible) */}
            {queryMode === "whitelist" && (
              <div className="flex flex-col gap-1 bg-surface-raised p-3 rounded-lg border border-border">
                <label htmlFor="whitelist-input" className="text-xs font-medium text-text-primary">
                  Whitelisted Parameter Keys (comma separated)
                </label>
                <input
                  id="whitelist-input"
                  type="text"
                  value={whitelistInput}
                  onChange={(e) => setWhitelistInput(e.target.value)}
                  placeholder="id, page, category, variant"
                  className="w-full bg-background border border-border focus:border-accent rounded px-2.5 py-1.5 text-xs font-mono text-text-primary focus:outline-none"
                />
                <span className="text-[10px] text-text-tertiary">
                  Any query parameters not listed will be excised from the canonical link tag.
                </span>
              </div>
            )}

            {/* Toggles */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/70">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-text-primary group-hover:text-accent transition">
                    Strip Fragment Identifiers (#)
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    RFC 6596 mandates canonical URLs omit in-page anchors
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={stripHash}
                  onChange={(e) => setStripHash(e.target.checked)}
                  className="w-4 h-4 rounded text-accent focus:ring-accent bg-surface-raised border-border"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-text-primary group-hover:text-accent transition">
                    Sort Query Parameters Alphabetically
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    Ensures deterministic URL format regardless of query string order
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sortQueryParams}
                  onChange={(e) => setSortQueryParams(e.target.checked)}
                  className="w-4 h-4 rounded text-accent focus:ring-accent bg-surface-raised border-border"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Diff Inspector & Code Export (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Canonical Diff & Inspection Card */}
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                Normalized Canonical Destination
              </h2>
              {result.isValid && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      result.score >= 90
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Score: {result.score}/100
                  </span>
                </div>
              )}
            </div>

            {/* Visual URL Display */}
            <div className="bg-background/90 rounded-lg border border-border p-3.5 flex flex-col gap-2">
              <div className="text-[11px] font-medium text-text-tertiary">Canonical URL:</div>
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs text-emerald-400 break-all select-all font-medium leading-relaxed">
                  {result.canonicalUrl || <span className="text-text-tertiary italic">Enter a URL to preview</span>}
                </div>
                {result.canonicalUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(result.canonicalUrl, "canonical_url")}
                    className="shrink-0 h-8 px-2.5 text-xs"
                    leftIcon={copiedKey === "canonical_url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedKey === "canonical_url" ? "Copied" : "Copy URL"}
                  </Button>
                )}
              </div>
            </div>

            {/* Changes Log */}
            {result.changes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  Transformations Applied ({result.changes.length}):
                </span>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {result.changes.map((c, i) => (
                    <div
                      key={i}
                      className="text-xs bg-surface-raised p-2 rounded-lg border border-border/70 flex items-start gap-2.5"
                    >
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-accent shrink-0">
                        {c.type.replace("_", " ")}
                      </span>
                      <div className="flex-1 flex flex-col">
                        <span className="text-text-primary text-[11px] font-medium">{c.reason}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-tertiary mt-0.5">
                          <span className="line-through text-red-400/80 truncate max-w-[200px]">{c.before}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-text-tertiary shrink-0" />
                          <span className="text-emerald-400 font-semibold truncate max-w-[200px]">{c.after}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Checklist */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border/70">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SEO Health Diagnostics:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.auditIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border flex items-start gap-2 text-xs ${
                      issue.type === "success"
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                        : issue.type === "warning"
                        ? "bg-amber-500/5 border-amber-500/20 text-amber-300"
                        : "bg-red-500/5 border-red-500/20 text-red-300"
                    }`}
                  >
                    {issue.type === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : issue.type === "warning" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px] leading-tight">{issue.message}</span>
                      <span className="text-[10px] opacity-80 mt-0.5">{issue.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-Framework Export Card */}
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-text-primary">Implementation Code Snippet</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownload}
                  disabled={!result.isValid}
                  className="h-7 px-2.5 text-xs"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleCopy(activeCodeSnippet, "export_code")}
                  disabled={!result.isValid}
                  className="h-7 px-2.5 text-xs"
                  leftIcon={copiedKey === "export_code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedKey === "export_code" ? "Copied!" : "Copy Code"}
                </Button>
              </div>
            </div>

            {/* Framework Tabs */}
            <div className="flex items-center gap-1 border-b border-border pb-2 overflow-x-auto scrollbar-thin">
              {[
                { id: "html", label: "HTML Tag" },
                { id: "header", label: "HTTP Header (PDF)" },
                { id: "nextApp", label: "Next.js App Router" },
                { id: "nextPages", label: "Next.js Pages" },
                { id: "nuxt", label: "Nuxt 3" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setExportTab(tab.id as any)}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition whitespace-nowrap ${
                    exportTab === tab.id
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Display Area */}
            <div className="relative group">
              <pre className="w-full bg-[#0a0f1d] border border-border/80 rounded-lg p-3.5 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-56">
                <code>{activeCodeSnippet}</code>
              </pre>
            </div>

            {/* Usage Tip */}
            <div className="text-[11px] text-text-tertiary flex items-start gap-1.5 bg-surface-raised p-2.5 rounded-lg border border-border/60">
              <Info className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <span>
                {exportTab === "html" && (
                  <>
                    Place inside the <code className="font-mono text-accent">&lt;head&gt;</code> element of your HTML template. Google requires absolute URLs for canonical tags.
                  </>
                )}
                {exportTab === "header" && (
                  <>
                    Use the HTTP <code className="font-mono text-accent">Link</code> header when serving PDF files, Word documents, or image assets where HTML tags cannot be injected.
                  </>
                )}
                {exportTab === "nextApp" && (
                  <>
                    Export in your Next.js <code className="font-mono text-accent">page.tsx</code> or <code className="font-mono text-accent">layout.tsx</code> via the Metadata API.
                  </>
                )}
                {exportTab === "nextPages" && (
                  <>
                    Import <code className="font-mono text-accent">Head</code> from <code className="font-mono text-accent">&apos;next/head&apos;</code> in your Pages router view.
                  </>
                )}
                {exportTab === "nuxt" && (
                  <>
                    Call <code className="font-mono text-accent">useHead()</code> inside your Vue component or page script setup block.
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Architecture & RFC 6596 Reference Guide */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5 mt-2">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <BookOpen className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-text-primary">Canonical URLs: Best Practices & RFC 6596 Guide</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-2 bg-surface-raised/50 p-4 rounded-xl border border-border/80">
            <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              1. Self-Referencing Canonicals
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every indexable page on your site should point its canonical tag to itself. If Google crawls the same page via a referral URL with tracking parameters (e.g., <code className="font-mono text-accent">?utm_source=twitter</code>), the self-referencing canonical instructs Google to consolidate link equity back to the clean master URL.
            </p>
          </div>

          <div className="flex flex-col gap-2 bg-surface-raised/50 p-4 rounded-xl border border-border/80">
            <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-accent" />
              2. Absolute URLs & HTTPS
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Never use relative paths like <code className="font-mono text-text-tertiary">href=&quot;/about&quot;</code> in canonical tags. Google requires fully qualified URLs with the schema and domain (<code className="font-mono text-accent">https://example.com/about</code>) to prevent misinterpretation across subdomains and protocols.
            </p>
          </div>

          <div className="flex flex-col gap-2 bg-surface-raised/50 p-4 rounded-xl border border-border/80">
            <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-purple-400" />
              3. HTTP Header for PDFs
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              PDFs and whitepapers often rank in Google and split search traffic with landing pages. Since PDFs have no HTML <code className="font-mono text-accent">&lt;head&gt;</code>, send an HTTP Link header: <code className="font-mono text-accent">Link: &lt;url&gt;; rel=&quot;canonical&quot;</code> to pass indexing equity.
            </p>
          </div>
        </div>
      </div>

      {/* SEO Content and Related Tools */}
      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related || []} />
    </div>
  );
};
