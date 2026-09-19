"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  parseUrl,
  rebuildUrl,
  URL_PARSER_PRESETS,
  type ParsedUrlReport,
  type ParsedQueryParam,
} from "@/tools/web/urlParserEngine";
import {
  Link2,
  Copy,
  Check,
  Globe,
  Sliders,
  Sparkles,
  Layers,
  Code2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCode,
  Trash2,
  Plus,
  ArrowRight,
  BookOpen,
  ArrowUpDown,
  Filter,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export interface URLParserViewProps {
  tool: ToolMeta;
}

export const URLParserView: React.FC<URLParserViewProps> = ({ tool }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"breakdown" | "workbench" | "comparator" | "code" | "guide">("breakdown");

  // Single URL Parser State
  const defaultPreset = URL_PARSER_PRESETS[0];
  const [inputUrl, setInputUrl] = useState<string>(defaultPreset.url);

  // Comparator State
  const [compareUrlA, setCompareUrlA] = useState<string>(
    "https://store.example.com/products/shoes?color=blue&size=10&utm_source=facebook"
  );
  const [compareUrlB, setCompareUrlB] = useState<string>(
    "https://store.example.com/products/shoes?color=blue&size=10"
  );

  // Code Tab Framework
  const [codeLang, setCodeLang] = useState<"js" | "node" | "python" | "php" | "go" | "curl">("js");

  // Editable query params for Workbench
  const [editableParams, setEditableParams] = useState<Array<{ id: string; key: string; value: string }>>([]);

  // Copy Status Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = useCallback((text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Parse report
  const report: ParsedUrlReport = useMemo(() => {
    const rep = parseUrl(inputUrl);
    return rep;
  }, [inputUrl]);

  // Sync editable params whenever a new URL is entered
  React.useEffect(() => {
    setEditableParams(
      report.queryParams.map((p) => ({
        id: p.id,
        key: p.key,
        value: p.value,
      }))
    );
  }, [report.queryParams]);

  // Reconstructed URL from workbench
  const reconstructedWorkbenchUrl = useMemo(() => {
    if (!report.isValid) return inputUrl;
    return rebuildUrl({
      protocol: report.protocol,
      username: report.username,
      password: report.password,
      hostname: report.hostname,
      port: report.port,
      pathname: report.pathname,
      queryParams: editableParams,
      hash: report.hash,
    });
  }, [report, editableParams, inputUrl]);

  // Comparator reports
  const reportA = useMemo(() => parseUrl(compareUrlA), [compareUrlA]);
  const reportB = useMemo(() => parseUrl(compareUrlB), [compareUrlB]);

  // Workbench Actions
  const handleAddParam = () => {
    setEditableParams((prev) => [
      ...prev,
      { id: `custom_${Date.now()}`, key: "", value: "" },
    ]);
  };

  const handleUpdateParam = (index: number, field: "key" | "value", val: string) => {
    setEditableParams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleDeleteParam = (index: number) => {
    setEditableParams((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSortParams = () => {
    setEditableParams((prev) =>
      [...prev].sort((a, b) => a.key.localeCompare(b.key))
    );
  };

  const handleStripTracking = () => {
    setEditableParams((prev) =>
      prev.filter(
        (p) =>
          !p.key.toLowerCase().startsWith("utm_") &&
          !p.key.toLowerCase().includes("clid") &&
          p.key.toLowerCase() !== "session_id"
      )
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
      <ToolHeader tool={tool} />

      {/* Preset Scenarios Launcher */}
      <div className="flex flex-col gap-2 bg-surface-raised/40 backdrop-blur-md p-4 rounded-xl border border-border/80">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Quick URL Scenarios &amp; Complex Structures
          </span>
          <span className="text-[11px] text-text-tertiary">
            Click any scenario to dissect query strings, auth tokens, and components
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {URL_PARSER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setInputUrl(preset.url);
                setActiveTab("breakdown");
              }}
              className="text-xs px-3 py-1.5 rounded-lg border bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary border-border transition-all whitespace-nowrap flex items-center gap-2"
              title={preset.description}
            >
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto scrollbar-thin">
        {[
          { id: "breakdown", label: "URL Anatomy Breakdown", icon: Link2 },
          { id: "workbench", label: "Query Parameter Workbench", icon: Sliders },
          { id: "comparator", label: "Side-by-Side URL Diff", icon: ArrowUpDown },
          { id: "code", label: "Code Exporters", icon: Code2 },
          { id: "guide", label: "RFC 3986 Anatomy Guide", icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: URL ANATOMY BREAKDOWN */}
      {activeTab === "breakdown" && (
        <div className="flex flex-col gap-6">
          {/* Input Bar */}
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label htmlFor="url-input-field" className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Raw Webpage or API Endpoint URL
              </label>
              <div className="flex items-center gap-2 text-xs">
                {inputUrl && (
                  <button
                    onClick={() => setInputUrl("")}
                    className="text-text-tertiary hover:text-red-400 transition"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setInputUrl(text.trim());
                    } catch {}
                  }}
                  className="text-accent hover:underline font-medium"
                >
                  Paste
                </button>
              </div>
            </div>

            <textarea
              id="url-input-field"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              rows={3}
              placeholder="https://user:pass@sub.store.example.com:8443/products/item?id=123&utm_source=fb#reviews"
              className="w-full bg-background border border-border focus:border-accent rounded-lg p-3 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
          </div>

          {/* Audit Issues / Warnings if any */}
          {report.auditIssues.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {report.auditIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                    issue.type === "error"
                      ? "bg-red-500/10 border-red-500/20 text-red-300"
                      : issue.type === "warning"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                      : "bg-sky-500/10 border-sky-500/20 text-sky-300"
                  }`}
                >
                  {issue.type === "error" ? (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  ) : issue.type === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">{issue.message}</span>
                    <span className="opacity-90 leading-relaxed">{issue.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Components Grid */}
          {report.isValid && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Protocol / Scheme */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span className="font-semibold uppercase tracking-wider">Protocol / Scheme</span>
                  {report.isSecure ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Secure (TLS)
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Insecure (Cleartext)
                    </span>
                  )}
                </div>
                <div className="font-mono text-sm font-bold text-accent">{report.protocol}</div>
                <span className="text-[11px] text-text-tertiary">
                  Communication standard ({report.protocol.replace(":", "").toUpperCase()})
                </span>
              </div>

              {/* Host & Port */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span className="font-semibold uppercase tracking-wider">Host &amp; Port</span>
                  {report.port ? (
                    <span className="text-[10px] text-accent font-mono">Port :{report.port}</span>
                  ) : (
                    <span className="text-[10px] text-text-tertiary">Default Port</span>
                  )}
                </div>
                <div className="font-mono text-sm font-bold text-text-primary break-all">
                  {report.host}
                </div>
                <span className="text-[11px] text-text-tertiary">
                  {report.port ? `Custom non-standard port ${report.port}` : "Standard HTTP/HTTPS port implied"}
                </span>
              </div>

              {/* Domain & Subdomain */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span className="font-semibold uppercase tracking-wider">Domain &amp; TLD</span>
                  <span className="text-[10px] text-purple-400 font-mono">{report.tld}</span>
                </div>
                <div className="font-mono text-sm font-bold text-text-primary">
                  {report.domain || report.hostname}
                </div>
                <span className="text-[11px] text-text-tertiary">
                  {report.subdomain ? `Subdomain: ${report.subdomain}` : "No subdomain"}
                </span>
              </div>

              {/* Origin */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Origin (Protocol + Host)
                </span>
                <div className="font-mono text-sm font-bold text-text-primary break-all">
                  {report.origin}
                </div>
                <span className="text-[11px] text-text-tertiary">
                  Used by CORS and browser security boundaries
                </span>
              </div>

              {/* Pathname */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span className="font-semibold uppercase tracking-wider">Pathname</span>
                  <span className="text-[10px] font-mono text-text-secondary">
                    {report.pathSegments.length} segments
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-emerald-400 break-all">
                  {report.pathname || "/"}
                </div>
                {report.fileName && (
                  <span className="text-[11px] text-text-tertiary font-mono">
                    File: {report.fileName} ({report.fileExtension})
                  </span>
                )}
              </div>

              {/* Hash Fragment */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Hash Fragment / Anchor
                </span>
                <div className="font-mono text-sm font-bold text-sky-400 break-all">
                  {report.hash || <span className="text-text-tertiary italic">None</span>}
                </div>
                <span className="text-[11px] text-text-tertiary">
                  {report.hashPath ? `SPA Route: ${report.hashPath}` : "In-page DOM anchor ID"}
                </span>
              </div>
            </div>
          )}

          {/* Path Segments Visual Breadcrumbs */}
          {report.isValid && report.pathSegments.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-accent" />
                Path Segments Decomposition
              </span>
              <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                <span className="px-2 py-1 rounded bg-surface-raised border border-border text-text-tertiary">
                  /
                </span>
                {report.pathSegments.map((seg, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-2.5 py-1 rounded-md bg-surface-raised border border-border/80 text-text-primary font-medium">
                      {seg}
                    </span>
                    {idx < report.pathSegments.length - 1 && (
                      <span className="text-text-tertiary">/</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Query Parameters Preview Card */}
          {report.isValid && report.queryParams.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-accent" />
                  Query Parameters ({report.queryParams.length})
                </span>
                <button
                  onClick={() => setActiveTab("workbench")}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Open Parameter Workbench &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {report.queryParams.map((param, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex flex-col gap-1 text-xs font-mono ${
                      param.isSensitive
                        ? "bg-red-500/10 border-red-500/30"
                        : param.isTracking
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-surface-raised border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-accent font-bold truncate max-w-[140px]">{param.key}</span>
                      {param.isSensitive ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-sans font-semibold">
                          Sensitive
                        </span>
                      ) : param.isTracking ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-sans font-semibold">
                          Tracking
                        </span>
                      ) : null}
                    </div>
                    <span className="text-text-secondary break-all">{param.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUERY PARAMETER WORKBENCH */}
      {activeTab === "workbench" && (
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-accent" />
                  Interactive Query String Workbench
                </h3>
                <span className="text-xs text-text-tertiary">
                  Edit, add, sort, or strip parameters in real time. The reconstructed URL updates automatically.
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleStripTracking}
                  leftIcon={<Filter className="w-3.5 h-3.5" />}
                >
                  Strip Tracking
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSortParams}
                  leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
                >
                  Sort (A-Z)
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleAddParam}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Parameter
                </Button>
              </div>
            </div>

            {/* Editable Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-raised border-b border-border text-text-tertiary uppercase text-[10px]">
                  <tr>
                    <th className="p-3 font-semibold w-5/12">Key</th>
                    <th className="p-3 font-semibold w-6/12">Value</th>
                    <th className="p-3 font-semibold w-1/12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono text-xs">
                  {editableParams.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-surface-raised/40 transition">
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={p.key}
                          onChange={(e) => handleUpdateParam(idx, "key", e.target.value)}
                          placeholder="parameter_key"
                          className="w-full bg-background border border-border focus:border-accent rounded px-2.5 py-1 text-xs text-accent font-semibold focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => handleUpdateParam(idx, "value", e.target.value)}
                          placeholder="parameter_value"
                          className="w-full bg-background border border-border focus:border-accent rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteParam(idx)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-text-tertiary hover:text-red-400 transition"
                          title="Delete parameter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {editableParams.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-text-tertiary">
                        No query parameters attached. Click &quot;Add Parameter&quot; to append new query keys.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Live Reconstructed URL */}
            <div className="bg-surface-raised p-4 rounded-xl border border-border flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-tertiary">
                  Reconstructed Normalized URL:
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy(reconstructedWorkbenchUrl, "workbench_url")}
                  className="h-7 text-xs px-2.5"
                  leftIcon={
                    copiedKey === "workbench_url" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )
                  }
                >
                  {copiedKey === "workbench_url" ? "Copied" : "Copy URL"}
                </Button>
              </div>
              <div className="font-mono text-xs text-emerald-400 break-all select-all">
                {reconstructedWorkbenchUrl}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: URL COMPARATOR / DIFF */}
      {activeTab === "comparator" && (
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ArrowUpDown className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text-primary">
                Side-by-Side URL Comparison &amp; Parameter Diff
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="compare-url-a" className="text-xs font-semibold text-text-primary">URL A (Baseline)</label>
                <textarea
                  id="compare-url-a"
                  value={compareUrlA}
                  onChange={(e) => setCompareUrlA(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border focus:border-accent rounded-lg p-2.5 text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="compare-url-b" className="text-xs font-semibold text-text-primary">URL B (Comparison)</label>
                <textarea
                  id="compare-url-b"
                  value={compareUrlB}
                  onChange={(e) => setCompareUrlB(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border focus:border-accent rounded-lg p-2.5 text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Comparison Table */}
            <div className="border border-border rounded-lg overflow-hidden mt-2">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-surface-raised border-b border-border text-text-tertiary uppercase text-[10px]">
                  <tr>
                    <th className="p-3 font-semibold w-1/4">Component</th>
                    <th className="p-3 font-semibold w-3/8">URL A</th>
                    <th className="p-3 font-semibold w-3/8">URL B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {[
                    { label: "Protocol", valA: reportA.protocol, valB: reportB.protocol },
                    { label: "Hostname", valA: reportA.hostname, valB: reportB.hostname },
                    { label: "Port", valA: reportA.port || "Default", valB: reportB.port || "Default" },
                    { label: "Pathname", valA: reportA.pathname, valB: reportB.pathname },
                    { label: "Query Count", valA: `${reportA.queryParams.length} params`, valB: `${reportB.queryParams.length} params` },
                    { label: "Hash Fragment", valA: reportA.hash || "(none)", valB: reportB.hash || "(none)" },
                  ].map((row, i) => {
                    const isDiff = row.valA !== row.valB;
                    return (
                      <tr
                        key={i}
                        className={isDiff ? "bg-amber-500/5" : "hover:bg-surface-raised/40"}
                      >
                        <td className="p-3 font-semibold text-text-tertiary">{row.label}</td>
                        <td className={`p-3 break-all ${isDiff ? "text-amber-400 font-bold" : "text-text-primary"}`}>
                          {row.valA}
                        </td>
                        <td className={`p-3 break-all ${isDiff ? "text-amber-400 font-bold" : "text-text-primary"}`}>
                          {row.valB}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CODE EXPORTERS */}
      {activeTab === "code" && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text-primary">
                Multi-Language URL Parsing Code Snippets
              </h2>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleCopy(report.codeSnippets[codeLang], "code_snippet")}
              leftIcon={
                copiedKey === "code_snippet" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
            >
              {copiedKey === "code_snippet" ? "Copied!" : "Copy Code"}
            </Button>
          </div>

          {/* Lang Tabs */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border w-fit overflow-x-auto">
            {[
              { id: "js", label: "JavaScript (Browser)" },
              { id: "node", label: "Node.js" },
              { id: "python", label: "Python 3" },
              { id: "php", label: "PHP" },
              { id: "go", label: "Go" },
              { id: "curl", label: "cURL" },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setCodeLang(lang.id as any)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${
                  codeLang === lang.id
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <pre className="bg-[#0a0f1d] border border-border/80 rounded-lg p-4 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed max-h-80">
            <code>{report.codeSnippets[codeLang]}</code>
          </pre>
        </div>
      )}

      {/* TAB 5: RFC 3986 ANATOMY GUIDE */}
      {activeTab === "guide" && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-text-primary">
              RFC 3986 Uniform Resource Identifier (URI) Syntax
            </h2>
          </div>

          <div className="p-4 bg-surface-raised/70 rounded-xl border border-border flex flex-col gap-2 font-mono text-xs">
            <span className="text-text-tertiary">URI Generic Syntax Structure:</span>
            <div className="p-3 bg-[#0a0f1d] rounded-lg border border-border/80 text-emerald-400 font-bold overflow-x-auto">
              scheme:[//[user:password@]host[:port]][/]path[?query][#fragment]
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Plaintext Credentials Risk
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Embedding credentials (<code className="font-mono text-accent">user:password@host</code>) in URLs is officially deprecated. Proxies, browser histories, and web server access logs save URLs in plaintext, exposing secrets to unauthorized parties.
              </p>
            </div>

            <div className="flex flex-col gap-2 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Sensitive Tokens in Query Strings
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Passing API keys, session IDs, or JWT tokens in the <code className="font-mono text-accent">?token=...</code> query string exposes them to Referer header leakage when visitors click external links. Use the <code className="font-mono text-accent">Authorization</code> header instead.
              </p>
            </div>

            <div className="flex flex-col gap-2 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                Query String Canonicalization
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Search engines treat <code className="font-mono text-text-tertiary">?a=1&b=2</code> and <code className="font-mono text-text-tertiary">?b=2&a=1</code> as two separate URLs, which can waste crawl budget. Alphabetically sorting query parameters guarantees deterministic caching.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SEO Content and Related Tools */}
      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related || []} />
    </div>
  );
};
