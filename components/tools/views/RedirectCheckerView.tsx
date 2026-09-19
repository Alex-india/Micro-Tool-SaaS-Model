"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  analyzeRedirectChain,
  generateDirectRules,
  REDIRECT_PRESETS,
  type RedirectHop,
  type RedirectChainReport,
} from "@/tools/web/redirectEngine";
import {
  ArrowRight,
  Search,
  RefreshCw,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  Code2,
  FileSpreadsheet,
  List,
  BookOpen,
  Server,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface RedirectCheckerViewProps {
  tool: ToolMeta;
}

export const RedirectCheckerView: React.FC<RedirectCheckerViewProps> = ({ tool }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"trace" | "batch" | "generator" | "guide">("trace");

  // Single URL Trace State
  const [urlInput, setUrlInput] = useState<string>("http://www.github.com");
  const [userAgent, setUserAgent] = useState<string>("default");
  const [maxHops, setMaxHops] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<RedirectChainReport | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [expandedHopIndex, setExpandedHopIndex] = useState<number | null>(null);

  // Batch Mode State
  const [batchInput, setBatchInput] = useState<string>(
    "http://github.com\nhttp://www.github.com\nhttps://httpbin.org/redirect/2\nhttps://httpbin.org/status/404"
  );
  const [batchResults, setBatchResults] = useState<Array<{
    initialUrl: string;
    finalUrl: string;
    finalStatus: number;
    totalHops: number;
    summary: string;
    latencyMs: number;
    hasChain: boolean;
    error?: string;
  }>>([]);
  const [isBatchLoading, setIsBatchLoading] = useState<boolean>(false);

  // Standalone Rule Generator State
  const [genSource, setGenSource] = useState<string>("/old-page");
  const [genTarget, setGenTarget] = useState<string>("https://example.com/new-page");
  const [genStatus, setGenStatus] = useState<number>(301);
  const [ruleFramework, setRuleFramework] = useState<"nginx" | "apache" | "nextjs" | "cloudflare" | "express">("nginx");

  // Copy Status Tracker
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = useCallback((text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // User Agent Map
  const userAgentMap: Record<string, string> = {
    default: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ToolVerse/1.0",
    googlebot_desktop: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    googlebot_mobile: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    curl: "curl/8.0.0",
  };

  // Run Live Trace
  const handleTraceUrl = async (targetOverride?: string) => {
    const target = (targetOverride || urlInput).trim();
    if (!target) return;

    setIsLoading(true);
    setTraceError(null);
    setExpandedHopIndex(null);

    try {
      const res = await fetch("/api/web/redirect-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: target,
          userAgent: userAgentMap[userAgent],
          maxHops,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setTraceError(data.error || "Failed to trace redirects.");
        setReport(null);
      } else {
        setReport(data.report);
      }
    } catch (err: any) {
      setTraceError(err.message || "Network error while tracing URL.");
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Batch Trace
  const handleRunBatch = async () => {
    const urls = batchInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .slice(0, 10);

    if (urls.length === 0) return;

    setIsBatchLoading(true);
    setBatchResults([]);

    const results: typeof batchResults = [];
    for (const url of urls) {
      try {
        const res = await fetch("/api/web/redirect-checker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            userAgent: userAgentMap[userAgent],
            maxHops: 8,
          }),
        });
        const data = await res.json();
        if (data.success && data.report) {
          results.push({
            initialUrl: data.report.initialUrl,
            finalUrl: data.report.finalUrl,
            finalStatus: data.report.finalStatus,
            totalHops: data.report.totalHops,
            summary: data.report.statusSummary,
            latencyMs: data.report.totalLatencyMs,
            hasChain: data.report.hasChain,
          });
        } else {
          results.push({
            initialUrl: url,
            finalUrl: url,
            finalStatus: 0,
            totalHops: 0,
            summary: "Error",
            latencyMs: 0,
            hasChain: false,
            error: data.error || "Failed",
          });
        }
      } catch (err: any) {
        results.push({
          initialUrl: url,
          finalUrl: url,
          finalStatus: 0,
          totalHops: 0,
          summary: "Network Failed",
          latencyMs: 0,
          hasChain: false,
          error: err.message,
        });
      }
    }

    setBatchResults(results);
    setIsBatchLoading(false);
  };

  // Export Batch CSV
  const handleExportBatchCsv = () => {
    if (batchResults.length === 0) return;
    const header = "Initial URL,Hops,Chain Summary,Final URL,Final Status,Total Latency (ms),Error\n";
    const rows = batchResults
      .map(
        (r) =>
          `"${r.initialUrl}",${r.totalHops},"${r.summary}","${r.finalUrl}",${r.finalStatus},${r.latencyMs},"${r.error || ""}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "redirect-chain-audit.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Standalone generated rules
  const standaloneRules = useMemo(() => {
    return generateDirectRules(genSource, genTarget, genStatus);
  }, [genSource, genTarget, genStatus]);

  // Status badge styling helper
  const getStatusBadgeClass = (status: number) => {
    if (status >= 200 && status < 300) {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (status >= 300 && status < 400) {
      return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    }
    if (status >= 400 && status < 500) {
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    }
    return "bg-red-500/15 text-red-400 border-red-500/30";
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
      <ToolHeader tool={tool} />

      {/* Preset Scenario Launcher */}
      <div className="flex flex-col gap-2 bg-surface-raised/40 backdrop-blur-md p-4 rounded-xl border border-border/80">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Quick Redirect Scenarios
          </span>
          <span className="text-[11px] text-text-tertiary">
            Click any scenario to trace hops and analyze SEO equity retention
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {REDIRECT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setUrlInput(preset.url);
                setActiveTab("trace");
                handleTraceUrl(preset.url);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary border-border transition-all whitespace-nowrap flex items-center gap-2"
              title={preset.description}
            >
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                {preset.expectedHops} {preset.expectedHops === 1 ? "Hop" : "Hops"}
              </span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto scrollbar-thin">
        {[
          { id: "trace", label: "Redirect Path Tracer", icon: ArrowRight },
          { id: "batch", label: "Batch Chain Auditor", icon: List },
          { id: "generator", label: "Redirect Rule Generator", icon: Code2 },
          { id: "guide", label: "SEO & Core Web Vitals Guide", icon: BookOpen },
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

      {/* TAB 1: REDIRECT PATH TRACER */}
      {activeTab === "trace" && (
        <div className="flex flex-col gap-6">
          {/* Controls Card */}
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label htmlFor="redirect-url-input" className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Target URL to Trace
              </label>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-text-tertiary">Bot User-Agent:</span>
                  <select
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="default">Standard Chrome Desktop</option>
                    <option value="googlebot_desktop">Googlebot Desktop</option>
                    <option value="googlebot_mobile">Googlebot Smartphone</option>
                    <option value="bingbot">Bingbot</option>
                    <option value="curl">cURL 8.0</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                id="redirect-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTraceUrl();
                }}
                placeholder="http://example.com/old-page"
                className="w-full bg-background border border-border focus:border-accent rounded-lg px-3.5 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
              <Button
                size="md"
                variant="primary"
                onClick={() => handleTraceUrl()}
                disabled={isLoading || !urlInput.trim()}
                className="shrink-0 w-full sm:w-auto px-5"
                leftIcon={
                  isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )
                }
              >
                {isLoading ? "Tracing Path..." : "Trace Redirection"}
              </Button>
            </div>
          </div>

          {/* Error display */}
          {traceError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold">Trace Failure</span>
                <span className="text-text-secondary">{traceError}</span>
              </div>
            </div>
          )}

          {/* Results Display */}
          {report && (
            <div className="flex flex-col gap-6">
              {/* Summary Bar */}
              <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-tertiary">Status Chain Path:</span>
                  <div className="flex items-center gap-2 flex-wrap font-mono text-sm font-bold text-text-primary">
                    {report.hops.map((hop, idx) => (
                      <React.Fragment key={idx}>
                        <span className={`px-2 py-0.5 rounded border text-xs ${getStatusBadgeClass(hop.status)}`}>
                          {hop.status} {hop.statusText}
                        </span>
                        {idx < report.hops.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-text-tertiary">SEO Equity Score</span>
                    <span
                      className={`text-base font-extrabold flex items-center gap-1 ${
                        report.linkEquityScore >= 90
                          ? "text-emerald-400"
                          : report.linkEquityScore >= 60
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {report.linkEquityScore}/100
                    </span>
                  </div>

                  <div className="h-8 w-px bg-border" />

                  <div className="flex flex-col items-end">
                    <span className="text-xs text-text-tertiary">Total Latency</span>
                    <span className="text-sm font-mono text-text-primary flex items-center gap-1 font-bold">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      {report.totalLatencyMs} ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Hop-by-Hop Timeline Cards */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  Hop-by-Hop Path Journey ({report.totalHops} Total Steps)
                </h3>

                <div className="flex flex-col gap-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
                  {report.hops.map((hop, idx) => {
                    const isLast = idx === report.hops.length - 1;
                    const isExpanded = expandedHopIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="relative pl-12 flex flex-col gap-2 group"
                      >
                        {/* Number Icon Bubble */}
                        <div
                          className={`absolute left-3 top-4 w-6 h-6 -translate-x-1/2 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold z-10 transition ${
                            isLast
                              ? "bg-accent text-white border-accent"
                              : "bg-surface-raised border-border text-text-secondary"
                          }`}
                        >
                          {hop.hopNumber}
                        </div>

                        {/* Card Content */}
                        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col gap-3 hover:border-border/90 transition">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(
                                  hop.status
                                )}`}
                              >
                                {hop.status} {hop.statusText}
                              </span>
                              <span className="text-xs font-bold text-text-primary">
                                {isLast ? "Final Destination" : `Hop ${hop.hopNumber} Redirection`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-raised border border-border text-text-tertiary flex items-center gap-1">
                                {hop.protocol === "https" ? (
                                  <Lock className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Unlock className="w-3 h-3 text-amber-400" />
                                )}
                                {hop.protocol.toUpperCase()}
                              </span>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-raised border border-border text-text-tertiary">
                                {hop.latencyMs} ms
                              </span>
                              {hop.server && (
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-raised border border-border text-text-tertiary flex items-center gap-1">
                                  <Server className="w-3 h-3 text-sky-400" />
                                  {hop.server}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* URL display */}
                          <div className="bg-background/80 p-2.5 rounded-lg border border-border/70 flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-text-primary break-all">
                              {hop.url}
                            </span>
                            <button
                              onClick={() => handleCopy(hop.url, `url_${idx}`)}
                              className="p-1 rounded text-text-tertiary hover:text-text-primary transition"
                              title="Copy URL"
                            >
                              {copiedKey === `url_${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Location Header if present */}
                          {hop.location && (
                            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg">
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Redirects to: {hop.location}</span>
                            </div>
                          )}

                          {/* Toggle Headers Button */}
                          {Object.keys(hop.headers).length > 0 && (
                            <div className="flex flex-col gap-2 pt-1">
                              <button
                                onClick={() =>
                                  setExpandedHopIndex(isExpanded ? null : idx)
                                }
                                className="text-[11px] text-text-tertiary hover:text-accent flex items-center gap-1 transition w-fit"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" /> Hide Hop Response Headers
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" /> Inspect Hop Response Headers ({Object.keys(hop.headers).length})
                                  </>
                                )}
                              </button>

                              {isExpanded && (
                                <div className="bg-[#0a0f1d] border border-border/80 rounded-lg p-3 text-xs font-mono max-h-48 overflow-y-auto scrollbar-thin">
                                  {Object.entries(hop.headers).map(([k, v]) => (
                                    <div key={k} className="flex items-start gap-2 py-0.5">
                                      <span className="text-accent font-semibold">{k}:</span>
                                      <span className="text-text-secondary break-all">{v}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEO Health & Recommendations */}
              <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-3">
                <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  SEO Health Diagnostics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.diagnostics.map((diag, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                        diag.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : diag.type === "warning"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                          : "bg-red-500/10 border-red-500/20 text-red-300"
                      }`}
                    >
                      {diag.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : diag.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold">{diag.title}</span>
                        <span className="opacity-90 leading-relaxed">{diag.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-Hop Direct Resolution Rule Generator */}
              {report.hasChain && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-accent" />
                        Resolve Chain to Direct 1-Hop Rule
                      </span>
                      <span className="text-xs text-text-tertiary">
                        Eliminate intermediate hops by updating server configuration directly to the final URL.
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        handleCopy(
                          (report.directRules as any)[ruleFramework],
                          "direct_rule"
                        )
                      }
                      leftIcon={
                        copiedKey === "direct_rule" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {copiedKey === "direct_rule" ? "Copied" : "Copy Direct Rule"}
                    </Button>
                  </div>

                  {/* Framework Tabs */}
                  <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
                    {(["nginx", "apache", "nextjs", "cloudflare", "express"] as const).map(
                      (fw) => (
                        <button
                          key={fw}
                          onClick={() => setRuleFramework(fw)}
                          className={`text-xs px-3 py-1 rounded-md font-medium transition ${
                            ruleFramework === fw
                              ? "bg-accent text-white"
                              : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                          }`}
                        >
                          {fw.toUpperCase()}
                        </button>
                      )
                    )}
                  </div>

                  <pre className="bg-[#0a0f1d] border border-border/80 rounded-lg p-3.5 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
                    <code>{(report.directRules as any)[ruleFramework]}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {!report && !traceError && !isLoading && (
            <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center justify-center gap-3">
              <ArrowRight className="w-12 h-12 text-text-tertiary stroke-1" />
              <h3 className="text-base font-semibold text-text-primary">Ready to Trace</h3>
              <p className="text-xs text-text-tertiary max-w-sm">
                Enter any URL above or launch a quick preset to map its full redirect journey hop-by-hop.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BATCH CHAIN AUDITOR */}
      {activeTab === "batch" && (
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <List className="w-4 h-4 text-accent" />
                  Audit Multiple Redirection Paths (Up to 10 URLs)
                </h3>
                <span className="text-xs text-text-tertiary">
                  Enter one URL per line to audit chains, loops, and dead ends across your site migration.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleExportBatchCsv}
                  disabled={batchResults.length === 0}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleRunBatch}
                  disabled={isBatchLoading}
                  leftIcon={
                    isBatchLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {isBatchLoading ? "Auditing Chains..." : "Audit All URLs"}
                </Button>
              </div>
            </div>

            <textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              rows={5}
              placeholder="http://example.com/page1&#10;http://example.com/page2"
              className="w-full bg-background border border-border focus:border-accent rounded-lg p-3 text-xs font-mono text-text-primary focus:outline-none"
            />
          </div>

          {/* Batch Results Table */}
          {batchResults.length > 0 && (
            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Audit Summary ({batchResults.length} URLs Checked)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface border-b border-border text-text-tertiary uppercase text-[10px]">
                    <tr>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Initial URL</th>
                      <th className="p-3 font-semibold">Hops</th>
                      <th className="p-3 font-semibold">Chain Path</th>
                      <th className="p-3 font-semibold">Final URL</th>
                      <th className="p-3 font-semibold">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {batchResults.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-raised/50 transition">
                        <td className="p-3">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(
                              item.finalStatus
                            )}`}
                          >
                            {item.finalStatus || "ERR"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-text-primary break-all">{item.initialUrl}</td>
                        <td className="p-3 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.totalHops > 2
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-surface-raised border border-border text-text-secondary"
                            }`}
                          >
                            {item.totalHops} {item.totalHops === 1 ? "hop" : "hops"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-text-secondary">{item.summary}</td>
                        <td className="p-3 font-mono text-sky-400 break-all">{item.finalUrl}</td>
                        <td className="p-3 font-mono text-text-tertiary">
                          {item.latencyMs ? `${item.latencyMs} ms` : "-"}
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

      {/* TAB 3: STANDALONE REDIRECT RULE GENERATOR */}
      {activeTab === "generator" && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Code2 className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-text-primary">
              Web Server 1-Hop Direct Redirect Rule Generator
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gen-source-path" className="text-xs font-medium text-text-secondary">Source Path</label>
              <input
                id="gen-source-path"
                type="text"
                value={genSource}
                onChange={(e) => setGenSource(e.target.value)}
                placeholder="/old-slug"
                className="bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="gen-target-url" className="text-xs font-medium text-text-secondary">Destination URL</label>
              <input
                id="gen-target-url"
                type="text"
                value={genTarget}
                onChange={(e) => setGenTarget(e.target.value)}
                placeholder="https://example.com/new-slug"
                className="bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="gen-status-code" className="text-xs font-medium text-text-secondary">HTTP Status Code</label>
              <select
                id="gen-status-code"
                value={genStatus}
                onChange={(e) => setGenStatus(Number(e.target.value))}
                className="bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none"
              >
                <option value={301}>301 Moved Permanently (Recommended for SEO)</option>
                <option value={308}>308 Permanent Redirect (Method Preserved)</option>
                <option value={302}>302 Found (Temporary Redirect)</option>
                <option value={307}>307 Temporary Redirect (Method Preserved)</option>
              </select>
            </div>
          </div>

          {/* Framework Code Tabs */}
          <div className="flex flex-col gap-3 pt-3 border-t border-border/70">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-surface-raised p-1 rounded-lg border border-border">
                {(["nginx", "apache", "nextjs", "cloudflare", "express"] as const).map(
                  (fw) => (
                    <button
                      key={fw}
                      onClick={() => setRuleFramework(fw)}
                      className={`text-xs px-3 py-1 rounded-md font-medium transition ${
                        ruleFramework === fw
                          ? "bg-accent text-white"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {fw.toUpperCase()}
                    </button>
                  )
                )}
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  handleCopy((standaloneRules as any)[ruleFramework], "gen_rule")
                }
                leftIcon={
                  copiedKey === "gen_rule" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
              >
                {copiedKey === "gen_rule" ? "Copied" : "Copy Rule"}
              </Button>
            </div>

            <pre className="bg-[#0a0f1d] border border-border/80 rounded-lg p-4 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
              <code>{(standaloneRules as any)[ruleFramework]}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: SEO & CORE WEB VITALS GUIDE */}
      {activeTab === "guide" && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-text-primary">
              Redirect Chains & Google Crawl Budget Guidelines
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Google&apos;s 5-Hop Limit
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Googlebot officially stops following redirects after <strong>5 hops</strong> to protect its crawler from infinite loops and resource starvation. Chains longer than 1 hop also degrade crawl budget efficiency on larger websites.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                Impact on Core Web Vitals (TTFB &amp; LCP)
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Every redirect hop incurs an additional DNS lookup, TCP handshake, and TLS negotiation round-trip. On mobile networks with 100ms RTT, a 3-hop chain adds <strong>300ms–800ms</strong> of pure latency before the HTML document can even begin downloading.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                301 vs 302 PageRank Equity
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                While modern Google Search passes link equity through 301 and 302 redirects, <strong>301 Moved Permanently</strong> is the only code that guarantees the search index updates the canonical URL to the new destination.
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
