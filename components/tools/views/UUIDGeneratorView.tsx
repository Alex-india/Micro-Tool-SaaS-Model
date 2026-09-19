"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Button } from "@/components/ui/Button";
import {
  generateUUID,
  generateBulkUUIDs,
  inspectUUID,
  formatUUIDString,
  type UUIDVersion,
  type UUIDFormat,
  type UUIDInspectionResult,
} from "@/tools/developer/uuidEngine";
import {
  Cpu,
  Copy,
  Check,
  Download,
  RefreshCw,
  Sliders,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Database,
  Binary,
  FileText,
  Terminal,
  Hash,
  ShieldCheck,
  Layers,
  ArrowRight,
  FileCode,
  Trash2,
  Search,
  CheckCircle,
  HelpCircle,
  Zap,
} from "lucide-react";

export interface UUIDGeneratorViewProps {
  tool: ToolMeta;
}

const VERSION_DESCRIPTIONS: Record<UUIDVersion, { title: string; subtitle: string; tag: string; color: string }> = {
  v4: {
    title: "UUID v4",
    subtitle: "Cryptographic Random (RFC 4122)",
    tag: "Most Common",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  v7: {
    title: "UUID v7",
    subtitle: "Unix Epoch Time-Ordered (RFC 9562)",
    tag: "DB Optimized",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  v1: {
    title: "UUID v1",
    subtitle: "Gregorian 100ns Time-based (RFC 4122)",
    tag: "Legacy Time",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  nil: {
    title: "Nil UUID",
    subtitle: "All 128 Bits Zero (00000000-...)",
    tag: "Special",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  max: {
    title: "Max UUID",
    subtitle: "All 128 Bits One (ffffffff-...)",
    tag: "Special",
    color: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
};

const FORMAT_OPTIONS: { id: UUIDFormat; label: string; example: string }[] = [
  { id: "standard", label: "Canonical (Standard)", example: "f47ac10b-58cc-4372-a567-0e02b2c3d479" },
  { id: "no-hyphens", label: "No Hyphens (32 Hex)", example: "f47ac10b58cc4372a5670e02b2c3d479" },
  { id: "braces", label: "Curly Braces {GUID}", example: "{f47ac10b-58cc-4372-a567-0e02b2c3d479}" },
  { id: "parentheses", label: "Parentheses (GUID)", example: "(f47ac10b-58cc-4372-a567-0e02b2c3d479)" },
  { id: "urn", label: "URN Namespace", example: "urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479" },
  { id: "base64", label: "Base64URL (22 chars)", example: "9HrBC1jMQ3KlZw4CssPUeQ" },
  { id: "json", label: "JSON Array", example: '["f47ac10b-58cc..."]' },
  { id: "sql", label: "SQL Insert Values", example: "('f47ac10b-58cc...')" },
];

export const UUIDGeneratorView: React.FC<UUIDGeneratorViewProps> = ({ tool }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"generate" | "inspect">("generate");

  // Generator Options State
  const [version, setVersion] = useState<UUIDVersion>("v4");
  const [count, setCount] = useState<number>(5);
  const [customCount, setCustomCount] = useState<string>("5");
  const [format, setFormat] = useState<UUIDFormat>("standard");
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [prefix, setPrefix] = useState<string>("");
  const [suffix, setSuffix] = useState<string>("");

  // Generated results
  const [generatedList, setGeneratedList] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Copy feedback
  const [copiedItem, setCopiedItem] = useState<number | "all" | string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Inspector State
  const [inspectInput, setInspectInput] = useState<string>("");
  const [inspectedResult, setInspectedResult] = useState<UUIDInspectionResult | null>(null);

  // Generate UUIDs function
  const runGeneration = useCallback(() => {
    setIsGenerating(true);
    const safeCount = Math.max(1, Math.min(count, 500));
    const items = generateBulkUUIDs(safeCount, version, {
      format: format === "json" || format === "sql" ? "standard" : format,
      uppercase,
      prefix: prefix.trim(),
      suffix: suffix.trim(),
    });
    setGeneratedList(items);
    setTimeout(() => setIsGenerating(false), 200);
  }, [count, version, format, uppercase, prefix, suffix]);

  // Initial generation on mount
  useEffect(() => {
    runGeneration();
  }, [runGeneration]);

  // Handle custom count input change
  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCustomCount(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setCount(Math.min(500, Math.max(1, num)));
    }
  };

  // Trigger copy with feedback
  const triggerCopy = (text: string, identifier: number | "all" | string, label = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    setCopiedItem(identifier);
    setToastMessage(label);
    setTimeout(() => {
      setCopiedItem(null);
      setToastMessage("");
    }, 2000);
  };

  // Formatted bulk text for Copy All / Download
  const bulkExportData = useMemo(() => {
    if (format === "json") {
      return JSON.stringify(generatedList, null, 2);
    }
    if (format === "sql") {
      const rows = generatedList.map((id) => `  ('${id}')`).join(",\n");
      return `INSERT INTO items (id)\nVALUES\n${rows};`;
    }
    return generatedList.join("\n");
  }, [generatedList, format]);

  // Download export as file
  const handleDownload = (ext: "txt" | "json" | "sql") => {
    let content = bulkExportData;
    let mime = "text/plain";
    if (ext === "json") {
      content = JSON.stringify(generatedList, null, 2);
      mime = "application/json";
    } else if (ext === "sql") {
      mime = "application/sql";
    }

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids-${version}-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Live UUID Inspection
  useEffect(() => {
    if (!inspectInput.trim()) {
      setInspectedResult(null);
      return;
    }
    const result = inspectUUID(inspectInput.trim());
    setInspectedResult(result);
  }, [inspectInput]);

  // Switch to inspect tab with a chosen UUID
  const inspectSpecificUUID = (uuid: string) => {
    // Strip custom prefixes/suffixes or braces if needed to give raw UUID
    const clean = uuid.replace(/^[^0-9a-fA-F]+/, "").replace(/[^0-9a-fA-F]+$/, "");
    setInspectInput(clean || uuid);
    setActiveTab("inspect");
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  // Relative time helper
  const getRelativeTime = (timestampMs: number | null | undefined): string => {
    if (!timestampMs) return "";
    const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
    if (diffSec < 2) return "just now";
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full">
      <ToolHeader tool={tool} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl shadow-2xl border border-blue-400/30 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {toastMessage}
        </div>
      )}

      {/* Navigation Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === "generate"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Generate UUIDs
          </button>
          <button
            onClick={() => setActiveTab("inspect")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === "inspect"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Search className="w-4 h-4" />
            Validate & Inspect
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Client-side Cryptographic Security &bull; RFC 4122 / RFC 9562</span>
        </div>
      </div>

      {/* TAB 1: GENERATE UUIDs */}
      {activeTab === "generate" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Controls Panel */}
          <div className="w-full lg:w-96 flex flex-col gap-5 bg-surface border border-border rounded-2xl p-5 shadow-card shrink-0">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Generation Controls
                </h2>
              </div>
              <button
                onClick={runGeneration}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover font-semibold transition-colors"
                title="Regenerate with current settings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>

            {/* 1. Version Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                <span>UUID Standard / Version</span>
                <span className="text-[10px] text-text-muted">RFC Compliant</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {(["v4", "v7", "v1", "nil", "max"] as UUIDVersion[]).map((v) => {
                  const meta = VERSION_DESCRIPTIONS[v];
                  const isSelected = version === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setVersion(v)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                          : "bg-surface-raised/60 border-border hover:border-border-hover text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">{meta.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${meta.color}`}>
                            {meta.tag}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted mt-0.5">{meta.subtitle}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-accent bg-accent text-white" : "border-border"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Quantity Selector */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Quantity
                </label>
                <span className="text-xs font-mono font-bold text-accent">
                  {count} {count === 1 ? "UUID" : "UUIDs"}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[1, 5, 10, 25, 50, 100].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setCount(num);
                      setCustomCount(num.toString());
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      count === num
                        ? "bg-accent border-accent text-white shadow-sm"
                        : "bg-surface-raised border-border hover:border-border-hover text-text-secondary"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-text-muted whitespace-nowrap">Custom (1-500):</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={customCount}
                  onChange={handleCustomCountChange}
                  className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* 3. Output Format */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as UUIDFormat)}
                className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                {FORMAT_OPTIONS.map((fmt) => (
                  <option key={fmt.id} value={fmt.id}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Formatting Toggles */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                  Uppercase Characters
                </span>
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Prefix</span>
                  <input
                    type="text"
                    placeholder="e.g. usr_"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Suffix</span>
                  <input
                    type="text"
                    placeholder="e.g. _v1"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Generate Action Button */}
            <Button
              variant="primary"
              size="md"
              onClick={runGeneration}
              className="w-full mt-2 font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/25"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              Generate {count} {VERSION_DESCRIPTIONS[version].title}
            </Button>
          </div>

          {/* Right Results Output Section */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Results Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-2xl px-5 py-3.5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-text-primary">Generated Output</span>
                  <span className="text-xs text-text-muted font-mono">
                    ({generatedList.length} items &bull; {VERSION_DESCRIPTIONS[version].title})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerCopy(bulkExportData, "all", "Copied all UUIDs to clipboard!")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all shadow-sm"
                >
                  {copiedItem === "all" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied All</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-accent" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>

                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all shadow-sm">
                    <Download className="w-3.5 h-3.5 text-text-muted" />
                    <span>Download</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-surface border border-border rounded-xl shadow-2xl py-1 w-32 z-20">
                    <button
                      onClick={() => handleDownload("txt")}
                      className="px-3 py-1.5 text-left text-xs hover:bg-surface-raised text-text-primary font-medium transition-colors"
                    >
                      Plain Text (.txt)
                    </button>
                    <button
                      onClick={() => handleDownload("json")}
                      className="px-3 py-1.5 text-left text-xs hover:bg-surface-raised text-text-primary font-medium transition-colors"
                    >
                      JSON Array (.json)
                    </button>
                    <button
                      onClick={() => handleDownload("sql")}
                      className="px-3 py-1.5 text-left text-xs hover:bg-surface-raised text-text-primary font-medium transition-colors"
                    >
                      SQL Inserts (.sql)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* If JSON or SQL format, show full formatted block view */}
            {format === "json" || format === "sql" ? (
              <div className="relative bg-surface border border-border rounded-2xl p-4 shadow-card overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3 text-xs text-text-muted">
                  <span className="font-mono uppercase font-bold text-accent">
                    {format === "json" ? "JSON Format" : "SQL Values"}
                  </span>
                  <span>{generatedList.length} rows</span>
                </div>
                <pre className="text-xs font-mono text-text-primary bg-surface-raised p-4 rounded-xl border border-border overflow-x-auto max-h-[520px] leading-relaxed selection:bg-accent selection:text-white">
                  {bulkExportData}
                </pre>
              </div>
            ) : (
              /* Regular List View with individual Copy and Inspect actions */
              <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
                {generatedList.map((uuid, idx) => (
                  <div
                    key={`${uuid}-${idx}`}
                    className="group flex items-center justify-between gap-3 p-3 bg-surface hover:bg-surface-raised border border-border hover:border-accent/40 rounded-xl transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[11px] font-mono text-text-muted select-none w-7 text-right">
                        #{(idx + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="text-xs md:text-sm font-mono text-text-primary tracking-wide break-all selection:bg-accent selection:text-white">
                        {uuid}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Inspect button */}
                      <button
                        onClick={() => inspectSpecificUUID(uuid)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Inspect & Decode Timestamp"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy button */}
                      <button
                        onClick={() => triggerCopy(uuid, idx, `Copied #${idx + 1} to clipboard`)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedItem === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VALIDATE & INSPECT */}
      {activeTab === "inspect" && (
        <div className="flex flex-col gap-6">
          {/* Input & Quick Sample Presets */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  UUID Validator & Timestamp Inspector
                </h2>
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <span>Decodes RFC 4122 / 9562 versions, variants & embedded timestamps</span>
              </div>
            </div>

            {/* Input area */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Paste any UUID / GUID string
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 018e6e58-6c00-72cb-881c-0b8982a74c3e or {9f8a3c8e-...}"
                  value={inspectInput}
                  onChange={(e) => setInspectInput(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent pr-24"
                />
                {inspectInput && (
                  <button
                    onClick={() => setInspectInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded bg-surface border border-border"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Test Samples */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-text-muted">Quick Test:</span>
              <button
                onClick={() => setInspectInput(generateUUID("v7"))}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                Fresh v7 (Time-Ordered)
              </button>
              <button
                onClick={() => setInspectInput(generateUUID("v4"))}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-colors"
              >
                Sample v4 (Random)
              </button>
              <button
                onClick={() => setInspectInput("6ba7b810-9dad-11d1-80b4-00c04fd430c8")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-colors"
              >
                Sample v1 (RFC 4122)
              </button>
              <button
                onClick={() => setInspectInput("00000000-0000-0000-0000-000000000000")}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold transition-colors"
              >
                Nil UUID
              </button>
              <button
                onClick={() => setInspectInput("invalid-uuid-12345")}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors"
              >
                Invalid Format
              </button>
            </div>
          </div>

          {/* Inspection Results */}
          {inspectedResult && (
            <div className="flex flex-col gap-6">
              {/* Validation Status Banner */}
              {inspectedResult.isValid ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-emerald-400">Valid UUID Format</h3>
                      <p className="text-xs text-text-secondary mt-0.5 font-mono">
                        Canonical: {inspectedResult.canonical}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                      {inspectedResult.versionName}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-rose-400">Invalid UUID</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{inspectedResult.error}</p>
                  </div>
                </div>
              )}

              {/* Detailed Breakdown Cards if Valid */}
              {inspectedResult.isValid && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Version & Spec Details */}
                  <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Version & Standard
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted">
                        Subtype: {inspectedResult.version}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-base font-bold text-text-primary">
                        {inspectedResult.versionName}
                      </span>
                      <p className="text-xs text-text-secondary leading-relaxed mt-1">
                        {inspectedResult.versionDescription}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border flex flex-col gap-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-text-muted">
                        RFC Variant
                      </span>
                      <span className="text-text-primary font-medium">
                        {inspectedResult.variant}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Timestamp & Temporal Analysis (if v7 or v1) */}
                  <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Timestamp Extraction
                      </span>
                      {inspectedResult.isTimeOrdered ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          Time-Ordered
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted">Non-temporal</span>
                      )}
                    </div>

                    {inspectedResult.isTimeOrdered && inspectedResult.timestampMs ? (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-text-muted">
                            Decoded UTC Time
                          </span>
                          <span className="text-xs font-mono font-bold text-text-primary">
                            {inspectedResult.timestampUtc}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-medium">
                            ({getRelativeTime(inspectedResult.timestampMs)})
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5 pt-1 border-t border-border">
                          <span className="text-[10px] uppercase font-bold text-text-muted">
                            Local Time
                          </span>
                          <span className="text-xs font-mono text-text-secondary">
                            {inspectedResult.timestampLocal}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5 pt-1 border-t border-border">
                          <span className="text-[10px] uppercase font-bold text-text-muted">
                            Unix Milliseconds
                          </span>
                          <span className="text-xs font-mono text-accent">
                            {inspectedResult.timestampMs} ms
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-text-muted gap-2">
                        <Cpu className="w-8 h-8 text-text-muted/40" />
                        <span className="text-xs">
                          {inspectedResult.version === 4
                            ? "UUID v4 is entirely pseudorandom and contains no embedded creation timestamp."
                            : "This UUID version does not encode chronological time."}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Instant Format Conversions */}
                  <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Convert Format
                      </span>
                      <span className="text-[10px] text-text-muted">1-Click Copy</span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                      {[
                        { label: "Canonical", val: inspectedResult.canonical || "" },
                        { label: "Uppercase", val: (inspectedResult.canonical || "").toUpperCase() },
                        {
                          label: "No Hyphens",
                          val: formatUUIDString(inspectedResult.canonical || "", { format: "no-hyphens" }),
                        },
                        {
                          label: "Braces {GUID}",
                          val: formatUUIDString(inspectedResult.canonical || "", { format: "braces" }),
                        },
                        {
                          label: "URN",
                          val: formatUUIDString(inspectedResult.canonical || "", { format: "urn" }),
                        },
                        {
                          label: "Base64URL",
                          val: formatUUIDString(inspectedResult.canonical || "", { format: "base64" }),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between p-2 rounded-lg bg-surface-raised border border-border text-xs"
                        >
                          <div className="flex flex-col overflow-hidden mr-2">
                            <span className="text-[10px] text-text-muted uppercase font-bold">
                              {item.label}
                            </span>
                            <span className="font-mono text-text-primary text-[11px] truncate">
                              {item.val}
                            </span>
                          </div>
                          <button
                            onClick={() => triggerCopy(item.val, item.label, `Copied ${item.label}`)}
                            className="p-1 rounded text-text-muted hover:text-accent hover:bg-surface transition-colors shrink-0"
                            title="Copy format"
                          >
                            {copiedItem === item.label ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bit Breakdown Map */}
              {inspectedResult.isValid && inspectedResult.canonical && (
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    UUID 128-Bit Structure Breakdown
                  </h3>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                    {inspectedResult.canonical.split("-").map((segment, idx) => {
                      const labels = [
                        inspectedResult.version === 7 ? "48-bit Unix Time (High)" : "Time Low / Random",
                        inspectedResult.version === 7 ? "16-bit Unix Time (Low)" : "Time Mid / Random",
                        `Version (${inspectedResult.version}) + Sub`,
                        "Variant + Clock/Rand",
                        "48-bit Node / Random",
                      ];
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col items-center gap-1"
                        >
                          <span className="text-[10px] uppercase font-bold text-accent">
                            {labels[idx]}
                          </span>
                          <span className="font-bold text-text-primary text-sm tracking-widest">
                            {segment}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Educational Guide & Comparison Section */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Database className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-text-primary">
            UUID v4 vs UUID v7: Modern Database Best Practices
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-text-secondary leading-relaxed">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              UUID v4 (Random)
            </h3>
            <p>
              UUID v4 generates 122 bits of pure pseudorandom data. While collision probability is practically zero, inserting v4 UUIDs into database B-Tree indexes causes severe <strong>index fragmentation</strong> and cache thrashing because new records are inserted at completely random positions on disk.
            </p>
            <div className="p-2.5 rounded-xl bg-surface-raised border border-border font-mono text-[11px] text-text-muted mt-1">
              Best for: Ephemeral tokens, session keys, public API IDs, distributed tracing.
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              UUID v7 (RFC 9562 Time-Ordered)
            </h3>
            <p>
              UUID v7 embeds a 48-bit millisecond timestamp in the leading bits followed by 74 random bits. Because keys increase monotonically over time, database inserts always append to the right edge of B-Tree pages, eliminating fragmentation and delivering up to <strong>300% faster database inserts</strong> in PostgreSQL, MySQL, and SQLite.
            </p>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-[11px] text-emerald-300 mt-1">
              Best for: Database primary keys, audit logs, distributed message queues.
            </div>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
