"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  generateSlug,
  analyzeSlugSEO,
  SlugOptions,
  DEFAULT_SLUG_OPTIONS,
} from "@/tools/text/slugGenerator";
import {
  Copy,
  Check,
  Trash2,
  Sparkles,
  Layers,
  Settings2,
  Globe,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Link2,
  ArrowRight,
  ClipboardPaste,
  Share2,
  SlidersHorizontal,
  ChevronDown,
  Info,
  ShieldCheck,
  Zap,
  Server,
} from "lucide-react";

export interface SlugGeneratorViewProps {
  tool: ToolMeta;
}

const SAMPLE_PRESETS = [
  { label: "Blog Article", text: "Top 10 High-Yield AI SaaS Tools You Must Try in 2026!" },
  { label: "E-Commerce Product", text: "Apple iPhone 15 Pro Max (256 GB) - Natural Titanium @ ₹1,34,900" },
  { label: "How-To Tutorial", text: "How to Build & Deploy a Full-Stack Web App with Next.js 14?" },
  { label: "Accented Text", text: "Café & Gourmet Restaurant Guide: Où manger à Paris en été?" },
];

export const SlugGeneratorView: React.FC<SlugGeneratorViewProps> = ({ tool }) => {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single mode state
  const [inputText, setInputText] = useState<string>("Top 10 High-Yield AI SaaS Tools You Must Try in 2026!");
  const [copiedSlug, setCopiedSlug] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Bulk mode state
  const [bulkInput, setBulkInput] = useState<string>(
    "Top 10 High-Yield AI SaaS Tools in 2026\nHow to Build & Deploy a Full-Stack Next.js App\nApple iPhone 15 Pro Max Titanium Review\nCafé & Restaurant Guide in Paris Summer\nComplete SEO & URL Optimization Checklist"
  );
  const [copiedBulk, setCopiedBulk] = useState<boolean>(false);

  // Customization Options
  const [options, setOptions] = useState<SlugOptions>({
    ...DEFAULT_SLUG_OPTIONS,
    maxLength: 60,
  });

  const [domainPrefix, setDomainPrefix] = useState<string>("https://example.com/blog");
  const [apiSynced, setApiSynced] = useState<boolean>(true);

  // Instant client slug
  const clientSlug = useMemo(() => generateSlug(inputText, options), [inputText, options]);
  const [serverSlug, setServerSlug] = useState<string>("");

  // Debounced API sync
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/text/slug-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            options,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setServerSlug(json.data.slug);
            setApiSynced(true);
          }
        }
      } catch {
        setApiSynced(false);
      }
    }, 200);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputText, options]);

  const outputSlug = serverSlug || clientSlug;

  // Compute full URL
  const fullUrl = useMemo(() => {
    const base = domainPrefix.trim().replace(/\/$/, "");
    if (!base) return outputSlug;
    return `${base}/${outputSlug}`;
  }, [domainPrefix, outputSlug]);

  // SEO Analysis
  const seo = useMemo(() => {
    return analyzeSlugSEO(outputSlug);
  }, [outputSlug]);

  // Bulk Results
  const bulkResults = useMemo(() => {
    const lines = bulkInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line) => ({
      original: line,
      slug: generateSlug(line, options),
    }));
  }, [bulkInput, options]);

  // Actions
  const handleCopySlug = () => {
    if (!outputSlug) return;
    navigator.clipboard.writeText(outputSlug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const handleCopyUrl = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (mode === "single") setInputText(text);
        else setBulkInput(text);
      }
    } catch {
      // ignore clipboard error
    }
  };

  const handleCopyBulk = () => {
    const text = bulkResults.map((r) => r.slug).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedBulk(true);
    setTimeout(() => setCopiedBulk(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Original Title,Generated Slug", ...bulkResults.map((r) => `"${r.original.replace(/"/g, '""')}","${r.slug}"`)].join(
        "\n"
      );
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "slugs_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      <ToolHeader tool={tool} />

      {/* Backend API Connection Status Banner */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-surface border border-border text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-accent" />
            Backend API Connected:
          </span>
          <span className="font-mono text-emerald-400">/api/text/slug-generator</span>
        </div>
        <span className="text-[11px] text-text-tertiary hidden sm:inline">
          Instant SEO slug generator & bulk CSV exporter
        </span>
      </div>

      {/* Modern Hero Controls & Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-1.5 bg-surface/90 border border-border/80 rounded-2xl shadow-xl backdrop-blur-md">
        {/* Segmented Mode Tabs */}
        <div className="flex items-center p-1 bg-surface-raised rounded-xl border border-border/50 w-full sm:w-auto">
          <button
            onClick={() => setMode("single")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
              mode === "single"
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Single Slug
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
              mode === "bulk"
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Bulk Generator ({bulkResults.length})
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto px-2 py-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Presets:
          </span>
          {SAMPLE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (mode === "single") setInputText(p.text);
                else setBulkInput((prev) => `${prev}\n${p.text}`.trim());
              }}
              className="text-xs font-medium bg-surface-raised/80 hover:bg-surface border border-border/70 hover:border-accent text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg whitespace-nowrap transition-all shadow-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center Area: Main Interactive Generator */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {mode === "single" ? (
            /* Single Title Mode */
            <div className="flex flex-col gap-6">
              {/* 1. Input Box */}
              <div className="group relative bg-surface border border-border/80 hover:border-border-hover rounded-2xl p-5 sm:p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    Input Title or Heading
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePaste}
                      className="px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-raised hover:bg-surface border border-border/60 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" /> Paste
                    </button>
                    {inputText && (
                      <button
                        onClick={() => setInputText("")}
                        className="px-2.5 py-1 text-xs font-medium text-text-tertiary hover:text-rose-400 bg-surface-raised hover:bg-surface border border-border/60 rounded-md flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter any blog post title, product name, or phrase to convert..."
                    rows={3}
                    className="w-full bg-surface-raised/90 border border-border/90 rounded-xl p-4 text-sm sm:text-base text-text-primary placeholder:text-text-tertiary/70 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-medium resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-text-tertiary mt-2">
                  <span>{inputText.length} characters</span>
                  <span className="flex items-center gap-1 text-accent">
                    <Sparkles className="w-3 h-3" /> Real-time auto sync
                  </span>
                </div>
              </div>

              {/* 2. Output Showcase Card */}
              <div className="relative bg-gradient-to-br from-[#121624] via-[#0d101a] to-[#121624] border border-accent/40 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden flex flex-col gap-6">
                {/* Glow effects */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                      Generated SEO Slug
                    </span>
                  </div>

                  {/* SEO Health Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                      seo.lengthStatus === "optimal"
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : seo.lengthStatus === "warning"
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {seo.lengthStatus === "optimal" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {seo.lengthMessage}
                  </div>
                </div>

                {/* Primary Slug Display with Prominent Copy Action */}
                <div className="relative z-10 bg-black/50 border border-white/10 hover:border-accent/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-all group/slug shadow-inner">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-mono text-base sm:text-xl md:text-2xl font-bold tracking-tight text-white select-all break-all leading-snug">
                      {outputSlug ? (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-200 to-accent">
                          {outputSlug}
                        </span>
                      ) : (
                        <span className="text-text-tertiary font-normal text-sm italic">
                          Type or paste a title above to see instant slug...
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopySlug}
                      disabled={!outputSlug}
                      className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                        copiedSlug
                          ? "bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400"
                          : "bg-accent hover:bg-accent-hover text-white shadow-accent/30 hover:shadow-accent/50"
                      }`}
                    >
                      {copiedSlug ? (
                        <>
                          <Check className="w-4 h-4" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy Slug
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Stats Strip */}
                <div className="relative z-10 grid grid-cols-3 gap-3">
                  <div className="bg-white/[0.03] border border-white/[0.08] p-3.5 rounded-xl flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Length</span>
                    <span className="text-xl font-extrabold font-mono text-white mt-0.5">
                      {seo.length} <span className="text-xs font-normal text-text-tertiary">chars</span>
                    </span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.08] p-3.5 rounded-xl flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Word Count</span>
                    <span className="text-xl font-extrabold font-mono text-cyan-300 mt-0.5">
                      {seo.wordCount} <span className="text-xs font-normal text-text-tertiary">words</span>
                    </span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.08] p-3.5 rounded-xl flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Delimiter</span>
                    <span className="text-xl font-extrabold font-mono text-emerald-400 mt-0.5">
                      {options.separator ? `"${options.separator}"` : "None"}
                    </span>
                  </div>
                </div>

                {/* Real-time Google SERP Simulation */}
                <div className="relative z-10 bg-surface/90 border border-border/70 rounded-2xl p-5 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
                      <Globe className="w-3.5 h-3.5 text-accent" />
                      Live Google Search (SERP) Preview
                    </div>
                    <button
                      onClick={handleCopyUrl}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1.5"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedUrl ? "Copied URL!" : "Copy Full URL"}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    {/* SERP URL / Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <div className="w-4 h-4 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                        G
                      </div>
                      <div className="flex items-center gap-1 text-xs text-text-secondary truncate">
                        <span>{domainPrefix.replace(/^https?:\/\//, "")}</span>
                        <span>›</span>
                        <span className="text-emerald-400 font-mono font-medium truncate">
                          {outputSlug || "example-slug"}
                        </span>
                      </div>
                    </div>

                    {/* SERP Title */}
                    <h4 className="text-base sm:text-lg font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                      {inputText || "Your Catchy Headline Appears Here"}
                    </h4>

                    {/* SERP Meta Description Snippet */}
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      Clean and structured URLs give search crawlers clear context and boost user click-through rates. Fast, readable, and optimized for top SEO performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Bulk Mode */
            <div className="flex flex-col gap-6">
              <div className="bg-surface border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent" />
                    Paste Multiple Titles (One per line)
                  </span>
                  <button
                    onClick={() => setBulkInput("")}
                    className="px-2.5 py-1 text-xs font-medium text-text-tertiary hover:text-rose-400 bg-surface-raised border border-border/60 rounded-md flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>

                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Paste 10, 20, or 50 titles here..."
                  rows={8}
                  className="w-full bg-surface-raised border border-border rounded-xl p-4 text-sm font-sans text-text-primary placeholder:text-text-tertiary/70 outline-none focus:border-accent font-medium resize-y leading-relaxed"
                />

                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>Detected {bulkResults.length} title(s)</span>
                  <span>Instant bulk generation</span>
                </div>
              </div>

              {/* Bulk Results Card */}
              <div className="bg-surface border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Generated Slugs Output ({bulkResults.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadCSV}
                      className="px-3.5 py-2 rounded-lg bg-surface-raised hover:bg-surface border border-border text-xs font-bold text-text-primary flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                    <button
                      onClick={handleCopyBulk}
                      className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md"
                    >
                      {copiedBulk ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedBulk ? "Copied All!" : "Copy All Slugs"}
                    </button>
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border/70 divide-y divide-border/60">
                  {bulkResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-surface-raised/40 hover:bg-surface-raised transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col gap-0.5 max-w-[70%]">
                        <span className="text-text-secondary truncate font-medium">{item.original}</span>
                        <span className="font-mono text-emerald-400 font-bold truncate">{item.slug}</span>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(item.slug)}
                        className="self-end sm:self-center px-3 py-1.5 bg-surface hover:bg-surface-raised border border-border rounded-lg text-[11px] font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1 transition-all"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Customization Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-accent" />
                Slug Settings & Rules
              </h3>
              <button
                onClick={() =>
                  setOptions({
                    ...DEFAULT_SLUG_OPTIONS,
                    maxLength: 60,
                  })
                }
                className="text-xs font-semibold text-accent hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Separator Selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Word Separator
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Hyphen (-)", val: "-" },
                  { label: "Underscore (_)", val: "_" },
                  { label: "Dot (.)", val: "." },
                  { label: "Slash (/)", val: "/" },
                  { label: "Tilde (~)", val: "~" },
                  { label: "None", val: "" },
                ].map((sep) => (
                  <button
                    key={sep.val}
                    onClick={() => setOptions((o) => ({ ...o, separator: sep.val }))}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      options.separator === sep.val
                        ? "bg-accent text-white border-accent shadow-md shadow-accent/20"
                        : "bg-surface-raised border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface"
                    }`}
                  >
                    {sep.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Casing Selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Letter Casing
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "lowercase (SEO)", val: "lower" as const },
                  { label: "UPPERCASE", val: "upper" as const },
                  { label: "Title-Case", val: "title" as const },
                  { label: "Preserve", val: "preserve" as const },
                ].map((c) => (
                  <button
                    key={c.val}
                    onClick={() => setOptions((o) => ({ ...o, casing: c.val }))}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      options.casing === c.val
                        ? "bg-accent text-white border-accent shadow-md shadow-accent/20"
                        : "bg-surface-raised border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SEO Toggles */}
            <div className="flex flex-col gap-3 pt-2 border-t border-border/60">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                SEO Optimization Toggles
              </label>

              <label className="flex items-center justify-between p-3 bg-surface-raised/80 hover:bg-surface-raised rounded-xl border border-border/70 cursor-pointer transition-all">
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-bold text-text-primary">Remove Stop Words</span>
                  <span className="text-[11px] text-text-tertiary">Strip "the, a, in, on, for, with..."</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.removeStopWords}
                  onChange={(e) => setOptions((o) => ({ ...o, removeStopWords: e.target.checked }))}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface-raised/80 hover:bg-surface-raised rounded-xl border border-border/70 cursor-pointer transition-all">
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-bold text-text-primary">Transliterate Accents</span>
                  <span className="text-[11px] text-text-tertiary">Convert é→e, ñ→n, ü→u for clean URLs</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.transliterate}
                  onChange={(e) => setOptions((o) => ({ ...o, transliterate: e.target.checked }))}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface-raised/80 hover:bg-surface-raised rounded-xl border border-border/70 cursor-pointer transition-all">
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-bold text-text-primary">Remove Numbers</span>
                  <span className="text-[11px] text-text-tertiary">Strip digits (0-9) from slug</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.removeNumbers}
                  onChange={(e) => setOptions((o) => ({ ...o, removeNumbers: e.target.checked }))}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Max Length Slider */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-text-secondary uppercase tracking-wider">Max Character Limit</span>
                <span className="font-mono font-extrabold text-accent">{options.maxLength} chars</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="5"
                value={options.maxLength}
                onChange={(e) => setOptions((o) => ({ ...o, maxLength: Number(e.target.value) }))}
                className="w-full accent-accent cursor-pointer h-2 bg-surface-raised rounded-lg"
              />
            </div>

            {/* Base Domain Setting */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Website URL Prefix
              </label>
              <input
                type="text"
                value={domainPrefix}
                onChange={(e) => setDomainPrefix(e.target.value)}
                placeholder="https://example.com/blog"
                className="w-full bg-surface-raised border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
