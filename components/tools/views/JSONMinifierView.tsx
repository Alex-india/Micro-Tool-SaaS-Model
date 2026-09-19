"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Button } from "@/components/ui/Button";
import {
  minifyJSON,
  type JSONMinifierOptions,
  type JSONMinifierResult,
} from "@/tools/developer/jsonMinifierEngine";
import {
  Minimize2,
  Maximize2,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ArrowRight,
  FileText,
  Layers,
  ShieldCheck,
  Binary,
  RefreshCw,
  HelpCircle,
  Code2,
} from "lucide-react";

export interface JSONMinifierViewProps {
  tool: ToolMeta;
}

const SAMPLE_JSONS = {
  apiResponse: {
    label: "Nested API Response",
    text: JSON.stringify(
      {
        status: "success",
        code: 200,
        meta: {
          timestamp: 1726723200,
          requestId: "req_9f8a3c8e",
          totalResults: 3,
        },
        data: {
          users: [
            { id: 1, name: "Alex Rivera", role: "Engineer", active: true, tags: ["frontend", "react"] },
            { id: 2, name: "Sarah Chen", role: "Architect", active: true, tags: ["cloud", "devops"] },
            { id: 3, name: "Jordan Lee", role: "Designer", active: false, tags: ["ui", "ux"] },
          ],
        },
      },
      null,
      2
    ),
  },
  jsoncComments: {
    label: "JSONC with Comments & Commas",
    text: `{\n  // Service configuration\n  "service": "auth-gateway",\n  "version": "2.4.0", // latest release\n  /* Networking settings\n     adjust for production */\n  "host": "https://api.toolverse.app",\n  "ports": [80, 443, 8080,],\n  "debug": true,\n}`,
  },
  packageJson: {
    label: "Package.json Config",
    text: JSON.stringify(
      {
        name: "toolverse-studio",
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
        },
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          next: "^14.2.15",
          lucide: "^0.453.0",
        },
      },
      null,
      2
    ),
  },
};

export const JSONMinifierView: React.FC<JSONMinifierViewProps> = ({ tool }) => {
  const [inputJSON, setInputJSON] = useState<string>(SAMPLE_JSONS.apiResponse.text);

  // Minification Options
  const [allowJsonc, setAllowJsonc] = useState<boolean>(true);
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [escapeUnicode, setEscapeUnicode] = useState<boolean>(false);
  const [escapeHtml, setEscapeHtml] = useState<boolean>(false);

  // View Mode: minified vs beautified preview
  const [viewMode, setViewMode] = useState<"minified" | "beautified">("minified");

  // Copy toast state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trigger copy
  const triggerCopy = (text: string, identifier: string, label = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    setToastMessage(label);
    setTimeout(() => {
      setCopiedKey(null);
      setToastMessage("");
    }, 2000);
  };

  // Minify Result
  const result: JSONMinifierResult = useMemo(() => {
    return minifyJSON(inputJSON, {
      allowJsonc,
      sortKeys,
      escapeUnicode,
      escapeHtml,
    });
  }, [inputJSON, allowJsonc, sortKeys, escapeUnicode, escapeHtml]);

  // Handle File Upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setInputJSON(content);
      }
    };
    reader.readAsText(file);
  };

  // Download minified file
  const handleDownload = () => {
    if (!result.isValid || !result.minifiedText) return;
    const blob = new Blob([result.minifiedText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minified.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Human readable bytes
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

      {/* JSON Suite Quick Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border">
          <Link
            href="/developer/json-formatter"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            JSON Formatter
          </Link>
          <Link
            href="/developer/json-validator"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            JSON Validator
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white shadow-sm">
            <Minimize2 className="w-3.5 h-3.5" />
            JSON Minifier
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Client-Side Processing &bull; 100% Offline & Private</span>
        </div>
      </div>

      {/* Compression Metrics Dashboard */}
      {result.isValid && inputJSON.trim().length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Metric 1: Original Size */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-card flex flex-col justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-text-muted">Original Size</span>
            <span className="text-lg md:text-xl font-mono font-bold text-text-primary">
              {formatBytes(result.originalBytes)}
            </span>
            <span className="text-[11px] text-text-secondary font-mono">{inputJSON.length} characters</span>
          </div>

          {/* Metric 2: Minified Size */}
          <div className="bg-surface border border-accent/40 rounded-2xl p-4 shadow-card flex flex-col justify-between gap-1 bg-gradient-to-br from-surface to-accent/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-accent">Minified Size</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Compressed
              </span>
            </div>
            <span className="text-lg md:text-xl font-mono font-bold text-text-primary">
              {formatBytes(result.minifiedBytes)}
            </span>
            <span className="text-[11px] text-text-secondary font-mono">
              {result.minifiedText.length} characters
            </span>
          </div>

          {/* Metric 3: Reduction % */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-card flex flex-col justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Space Saved</span>
            <span className="text-lg md:text-xl font-mono font-bold text-emerald-400">
              {result.percentSaved}%
            </span>
            <span className="text-[11px] text-text-secondary font-mono">
              -{formatBytes(result.bytesSaved)} saved
            </span>
          </div>

          {/* Metric 4: Gzip Estimate */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-card flex flex-col justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-text-muted">Estimated Gzip</span>
            <span className="text-lg md:text-xl font-mono font-bold text-text-primary">
              ~{formatBytes(result.gzipEstimatedBytes)}
            </span>
            <span className="text-[11px] text-text-secondary font-mono">Over the wire estimate</span>
          </div>
        </div>
      )}

      {/* Advanced Minification Options Toolbar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-card flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span className="font-bold text-text-primary uppercase tracking-wider">
              Minification & Compression Settings
            </span>
          </div>
          <span className="text-text-muted text-[11px]">Instant live recalculation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Toggle 1: Strip Comments & Trailing Commas (JSONC) */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-raised border border-border hover:border-accent/40 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              checked={allowJsonc}
              onChange={(e) => setAllowJsonc(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                Strip Comments & Commas
              </span>
              <span className="text-[10px] text-text-muted">JSONC //, /* */ & trailing commas</span>
            </div>
          </label>

          {/* Toggle 2: Alphabetical Key Sorting */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-raised border border-border hover:border-accent/40 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                Sort Object Keys
              </span>
              <span className="text-[10px] text-text-muted">Deterministic canonical JSON</span>
            </div>
          </label>

          {/* Toggle 3: Escape Unicode */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-raised border border-border hover:border-accent/40 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              checked={escapeUnicode}
              onChange={(e) => setEscapeUnicode(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                Escape Unicode (7-bit)
              </span>
              <span className="text-[10px] text-text-muted">Converts non-ASCII to \uXXXX</span>
            </div>
          </label>

          {/* Toggle 4: Escape HTML / Script Tags */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-raised border border-border hover:border-accent/40 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              checked={escapeHtml}
              onChange={(e) => setEscapeHtml(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                Safe HTML Script Embedding
              </span>
              <span className="text-[10px] text-text-muted">Escapes &lt;, &gt;, &amp; against XSS</span>
            </div>
          </label>
        </div>
      </div>

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: Input Editor */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Raw JSON Input
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,.jsonc,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                title="Upload JSON file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                onClick={() => setInputJSON("")}
                className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-text-muted font-medium shrink-0">Presets:</span>
            {Object.entries(SAMPLE_JSONS).map(([k, p]) => (
              <button
                key={k}
                onClick={() => setInputJSON(p.text)}
                className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary text-[11px] whitespace-nowrap transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Textarea */}
          <textarea
            value={inputJSON}
            onChange={(e) => setInputJSON(e.target.value)}
            placeholder="Paste formatted JSON or JSONC with comments here..."
            rows={14}
            className="w-full bg-surface-raised border border-border rounded-xl p-3.5 font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-y leading-relaxed"
          />

          {/* Error Banner if Invalid */}
          {!result.isValid && result.error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 font-mono flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold">JSON Syntax Error:</span>
                <span>{result.error}</span>
                {result.lineError && (
                  <span className="text-[11px] text-rose-300 mt-1">
                    Location: Line {result.lineError}, Column {result.columnError}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Output Minified / Beautified */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Minimize2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Minified Output
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {/* Toggle view between minified and beautified preview */}
              <div className="flex bg-surface-raised p-0.5 rounded-lg border border-border">
                <button
                  onClick={() => setViewMode("minified")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    viewMode === "minified" ? "bg-accent text-white" : "text-text-secondary"
                  }`}
                >
                  Minified (1 Line)
                </button>
                <button
                  onClick={() => setViewMode("beautified")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    viewMode === "beautified" ? "bg-accent text-white" : "text-text-secondary"
                  }`}
                >
                  Beautified
                </button>
              </div>

              <button
                onClick={() => triggerCopy(result.minifiedText, "min-json", "Copied minified JSON!")}
                disabled={!result.isValid || !result.minifiedText}
                className="px-3 py-1.5 rounded-lg bg-accent text-white font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                {copiedKey === "min-json" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!result.isValid || !result.minifiedText}
                className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                title="Download minified.json"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Output Display */}
          <div className="relative">
            <textarea
              readOnly
              value={
                result.isValid
                  ? viewMode === "minified"
                    ? result.minifiedText
                    : result.formattedText
                  : "Fix syntax errors on the left to generate minified JSON."
              }
              rows={14}
              className="w-full bg-surface-raised border border-border rounded-xl p-3.5 font-mono text-xs text-text-primary focus:outline-none resize-y leading-relaxed select-all"
            />
          </div>

          {/* Quick Copy Base64 / URL Param */}
          {result.isValid && result.minifiedText && (
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="text-text-muted">Compact single-line string with zero whitespace</span>
              <button
                onClick={() => {
                  const b64 = btoa(unescape(encodeURIComponent(result.minifiedText)));
                  triggerCopy(b64, "b64", "Copied Base64 JSON!");
                }}
                className="text-accent hover:text-accent-hover font-semibold flex items-center gap-1 text-[11px]"
              >
                <Binary className="w-3 h-3" />
                Copy as Base64
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Educational Guide */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <HelpCircle className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-text-primary">
            Why Minify JSON? Production Best Practices
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-text-secondary leading-relaxed">
          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Network Bandwidth & Latency
            </h3>
            <p>
              Formatting indentation, spaces, and line breaks frequently make up <strong>30% to 60%</strong> of a JSON payload's raw file size. Minifying JSON dramatically reduces HTTP payload sizes, accelerates API response times, and cuts cloud egress costs.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              V8 Engine Parse Performance
            </h3>
            <p>
              JavaScript engines (like Google V8 in Chrome & Node.js) parse minified JSON significantly faster because the lexical scanner does not need to allocate memory for indentation whitespace or advance line counters.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Canonical Hashing & Caching
            </h3>
            <p>
              By sorting keys alphabetically and minifying whitespace, identical JSON objects always produce identical byte streams. This enables exact cryptographic hash checks (SHA-256 ETag) and prevents cache misses across distributed microservices.
            </p>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
