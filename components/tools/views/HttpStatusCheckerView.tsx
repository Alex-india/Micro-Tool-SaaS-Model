"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  getHttpStatusInfo,
  searchHttpStatusCodes,
  evaluateSeoVerdict,
  generateCurlCommand,
  HTTP_STATUS_DATABASE,
  HTTP_STATUS_PRESETS,
  type HttpStatusClass,
  type HttpStatusCodeInfo,
  type HttpStatusCheckResult,
} from "@/tools/web/httpStatusEngine";
import {
  Globe,
  Search,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  BookOpen,
  Filter,
  RefreshCw,
  Code2,
  FileSpreadsheet,
  List,
  Info,
} from "lucide-react";

export interface HttpStatusCheckerViewProps {
  tool: ToolMeta;
}

export const HttpStatusCheckerView: React.FC<HttpStatusCheckerViewProps> = ({ tool }) => {
  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState<"checker" | "dictionary" | "guide" | "curl">("checker");

  // Single URL Checker State
  const [urlInput, setUrlInput] = useState<string>("https://www.google.com");
  const [followRedirects, setFollowRedirects] = useState<boolean>(true);
  const [userAgent, setUserAgent] = useState<string>("default");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<HttpStatusCheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [headerFilter, setHeaderFilter] = useState<string>("");

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchInput, setBatchInput] = useState<string>(
    "https://www.google.com\nhttp://github.com\nhttps://httpbin.org/status/404\nhttps://httpbin.org/status/503"
  );
  const [batchResults, setBatchResults] = useState<Array<{
    url: string;
    status: number;
    statusText: string;
    latencyMs: number;
    redirectLocation?: string;
    error?: string;
  }>>([]);
  const [isBatchLoading, setIsBatchLoading] = useState<boolean>(false);

  // Dictionary State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [classFilter, setClassFilter] = useState<HttpStatusClass | "all">("all");
  const [selectedStatusCode, setSelectedStatusCode] = useState<number>(200);
  const [serverConfigTab, setServerConfigTab] = useState<"nginx" | "apache" | "nextjs" | "express">("nginx");

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

  // Run Live URL Check
  const handleCheckUrl = async (urlToCheck?: string) => {
    const target = (urlToCheck || urlInput).trim();
    if (!target) return;

    setIsLoading(true);
    setCheckError(null);

    try {
      const res = await fetch("/api/web/http-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: target,
          followRedirects,
          userAgent: userAgentMap[userAgent],
        }),
      });

      const data = await res.json();
      if (!data.success && !data.status) {
        setCheckError(data.error || "Failed to connect to target URL.");
        setCheckResult(null);
      } else {
        setCheckResult(data);
      }
    } catch (err: any) {
      setCheckError(err.message || "Network error performing check.");
      setCheckResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Batch Check
  const handleRunBatch = async () => {
    const urls = batchInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .slice(0, 10); // Limit 10 for performance

    if (urls.length === 0) return;

    setIsBatchLoading(true);
    setBatchResults([]);

    const results: typeof batchResults = [];
    for (const url of urls) {
      try {
        const res = await fetch("/api/web/http-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            followRedirects: false,
            userAgent: userAgentMap[userAgent],
          }),
        });
        const data = await res.json();
        if (data.success) {
          results.push({
            url,
            status: data.status,
            statusText: data.statusText,
            latencyMs: data.latencyMs,
            redirectLocation: data.redirectLocation,
          });
        } else {
          results.push({
            url,
            status: data.status || 0,
            statusText: data.statusText || "Error",
            latencyMs: 0,
            error: data.error,
          });
        }
      } catch (err: any) {
        results.push({
          url,
          status: 0,
          statusText: "Failed",
          latencyMs: 0,
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
    const header = "URL,Status Code,Status Text,Latency (ms),Redirect Location,Error\n";
    const rows = batchResults
      .map(
        (r) =>
          `"${r.url}",${r.status},"${r.statusText}",${r.latencyMs},"${r.redirectLocation || ""}",${r.error ? `"${r.error}"` : '""'}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "http-status-audit.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered dictionary items
  const filteredCodes = useMemo(() => {
    return searchHttpStatusCodes(searchQuery, classFilter);
  }, [searchQuery, classFilter]);

  // Selected status code info
  const activeCodeInfo: HttpStatusCodeInfo = useMemo(() => {
    return getHttpStatusInfo(selectedStatusCode);
  }, [selectedStatusCode]);

  // Generated cURL Command
  const curlCommand = useMemo(() => {
    const url = urlInput.trim() || "https://example.com";
    return generateCurlCommand(url, userAgentMap[userAgent], followRedirects);
  }, [urlInput, userAgent, followRedirects]);

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
    if (status >= 520 && status <= 530) {
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
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
            Quick Status Code Scenarios
          </span>
          <span className="text-[11px] text-text-tertiary">
            Click any scenario to immediately inspect response headers and SEO behavior
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {HTTP_STATUS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setUrlInput(preset.url);
                setIsBatchMode(false);
                setActiveTab("checker");
                handleCheckUrl(preset.url);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary border-border transition-all whitespace-nowrap flex items-center gap-2 group"
              title={preset.description}
            >
              <span
                className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${getStatusBadgeClass(
                  preset.expectedStatus
                )}`}
              >
                {preset.expectedStatus}
              </span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto scrollbar-thin">
        {[
          { id: "checker", label: "Live URL Inspector", icon: Globe },
          { id: "dictionary", label: "HTTP Code Encyclopedia", icon: BookOpen },
          { id: "guide", label: "SEO Impact & Architecture", icon: ShieldCheck },
          { id: "curl", label: "cURL & Terminal Generator", icon: Terminal },
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

      {/* TAB 1: LIVE URL CHECKER */}
      {activeTab === "checker" && (
        <div className="flex flex-col gap-6">
          {/* Mode Switcher: Single vs Batch */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border">
              <button
                onClick={() => setIsBatchMode(false)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
                  !isBatchMode ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Single URL Audit
              </button>
              <button
                onClick={() => setIsBatchMode(true)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                  isBatchMode ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Batch Multi-URL Audit
              </button>
            </div>

            {/* User Agent Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-tertiary">Crawler Bot:</span>
              <select
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="default">Standard Browser (Chrome)</option>
                <option value="googlebot_desktop">Googlebot Desktop</option>
                <option value="googlebot_mobile">Googlebot Smartphone</option>
                <option value="bingbot">Bingbot</option>
                <option value="curl">cURL 8.0</option>
              </select>
            </div>
          </div>

          {!isBatchMode ? (
            /* Single URL Mode */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Input Card (Left 5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="http-url-input" className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <Globe className="w-4 h-4 text-accent" />
                      Target Endpoint or Webpage URL
                    </label>
                    <button
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) setUrlInput(text.trim());
                        } catch {}
                      }}
                      className="text-[11px] text-accent hover:underline px-1.5 py-0.5"
                    >
                      Paste
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      id="http-url-input"
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCheckUrl();
                      }}
                      placeholder="https://example.com/page"
                      className="w-full bg-background border border-border focus:border-accent rounded-lg px-3.5 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none"
                    />
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                      <span>Supports HTTP, HTTPS, redirects, and API endpoints</span>
                      {urlInput && (
                        <button
                          onClick={() => {
                            setUrlInput("");
                            setCheckResult(null);
                            setCheckError(null);
                          }}
                          className="hover:text-red-400 transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-2.5 pt-3 border-t border-border/70">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-text-primary group-hover:text-accent transition">
                          Trace Redirect Chains
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          Follow 301/302 hops to reveal the final destination URL
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={followRedirects}
                        onChange={(e) => setFollowRedirects(e.target.checked)}
                        className="w-4 h-4 rounded text-accent focus:ring-accent bg-surface-raised border-border"
                      />
                    </label>
                  </div>

                  {/* Check Button */}
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => handleCheckUrl()}
                    disabled={isLoading || !urlInput.trim()}
                    className="w-full mt-2"
                    leftIcon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  >
                    {isLoading ? "Querying Server..." : "Check HTTP Status"}
                  </Button>
                </div>

                {/* Quick Info snippet */}
                <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary flex flex-col gap-2">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Secure Server-Side Check
                  </div>
                  <p className="text-[11px] text-text-tertiary leading-relaxed">
                    ToolVerse queries target servers through an isolated Node.js runtime, bypassing browser CORS restrictions and capturing exact raw headers, TTFB latency, and redirect signals.
                  </p>
                </div>
              </div>

              {/* Results Column (Right 7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                {checkError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-start gap-3 text-xs">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">Connection Failed</span>
                      <span className="text-text-secondary">{checkError}</span>
                    </div>
                  </div>
                )}

                {checkResult && (
                  <>
                    {/* Status Badge Card */}
                    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-mono text-3xl font-extrabold px-3.5 py-1.5 rounded-xl border flex items-center gap-2 ${getStatusBadgeClass(
                              checkResult.status
                            )}`}
                          >
                            {checkResult.status}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-text-primary">
                              {checkResult.statusText || checkResult.info?.title}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              {checkResult.info?.categoryName} ({checkResult.category.toUpperCase()}) &bull;{" "}
                              {checkResult.info?.rfc}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-text-secondary flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-accent" />
                            {checkResult.latencyMs} ms
                          </span>
                        </div>
                      </div>

                      {/* Redirect Chain Visualization */}
                      {checkResult.redirectChain && checkResult.redirectChain.length > 1 && (
                        <div className="flex flex-col gap-2 pt-3 border-t border-border/70">
                          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-sky-400" />
                            Redirect Chain ({checkResult.redirectChain.length} hops):
                          </span>
                          <div className="flex flex-col gap-2">
                            {checkResult.redirectChain.map((hop, index) => (
                              <div
                                key={index}
                                className="bg-surface-raised p-2.5 rounded-lg border border-border/70 flex items-center justify-between gap-2 text-xs font-mono"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getStatusBadgeClass(
                                      hop.status
                                    )}`}
                                  >
                                    {hop.status}
                                  </span>
                                  <span className="truncate text-text-primary">{hop.url}</span>
                                </div>
                                {hop.location && (
                                  <div className="flex items-center gap-1 text-[11px] text-text-tertiary shrink-0">
                                    <ArrowRight className="w-3 h-3 text-sky-400" />
                                    <span className="text-sky-300 font-sans">Next hop</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SEO Health & Crawler Verdict */}
                      <div
                        className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                          checkResult.seoVerdict.badge === "success"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : checkResult.seoVerdict.badge === "warning"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                            : checkResult.seoVerdict.badge === "error"
                            ? "bg-red-500/10 border-red-500/20 text-red-300"
                            : "bg-sky-500/10 border-sky-500/20 text-sky-300"
                        }`}
                      >
                        {checkResult.seoVerdict.badge === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : checkResult.seoVerdict.badge === "warning" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold">{checkResult.seoVerdict.message}</span>
                          <span className="opacity-90 leading-relaxed">
                            {checkResult.seoVerdict.recommendation}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* HTTP Response Headers Inspector */}
                    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-accent" />
                          <h3 className="text-sm font-semibold text-text-primary">
                            HTTP Response Headers ({Object.keys(checkResult.headers).length})
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              handleCopy(
                                Object.entries(checkResult.headers)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join("\n"),
                                "all_headers"
                              )
                            }
                            className="h-7 text-xs px-2.5"
                            leftIcon={
                              copiedKey === "all_headers" ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )
                            }
                          >
                            {copiedKey === "all_headers" ? "Copied" : "Copy All Headers"}
                          </Button>
                        </div>
                      </div>

                      {/* Header Filter input */}
                      <input
                        type="text"
                        value={headerFilter}
                        onChange={(e) => setHeaderFilter(e.target.value)}
                        placeholder="Filter headers (e.g. content-type, cache-control, x-robots)..."
                        className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                      />

                      {/* Headers Key-Value Table */}
                      <div className="max-h-72 overflow-y-auto border border-border rounded-lg scrollbar-thin">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-surface-raised sticky top-0 border-b border-border text-text-tertiary uppercase text-[10px]">
                            <tr>
                              <th className="p-2.5 font-semibold">Header Name</th>
                              <th className="p-2.5 font-semibold">Value</th>
                              <th className="p-2.5 font-semibold w-12 text-center">Copy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                            {Object.entries(checkResult.headers)
                              .filter(([k, v]) =>
                                !headerFilter
                                  ? true
                                  : k.toLowerCase().includes(headerFilter.toLowerCase()) ||
                                    v.toLowerCase().includes(headerFilter.toLowerCase())
                              )
                              .map(([k, v]) => (
                                <tr key={k} className="hover:bg-surface-raised/60 transition group">
                                  <td className="p-2.5 text-accent font-semibold align-top whitespace-nowrap">
                                    {k}
                                  </td>
                                  <td className="p-2.5 text-text-secondary break-all align-top font-sans text-xs">
                                    {v}
                                  </td>
                                  <td className="p-2.5 text-center align-top">
                                    <button
                                      onClick={() => handleCopy(`${k}: ${v}`, k)}
                                      className="p-1 rounded hover:bg-surface text-text-tertiary hover:text-text-primary transition"
                                      title="Copy header"
                                    >
                                      {copiedKey === k ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {!checkResult && !checkError && !isLoading && (
                  <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center justify-center gap-3">
                    <Globe className="w-12 h-12 text-text-tertiary stroke-1" />
                    <h3 className="text-base font-semibold text-text-primary">Ready to Test</h3>
                    <p className="text-xs text-text-tertiary max-w-sm">
                      Enter any URL above or select a preset scenario to inspect status codes, headers, and SEO crawl signals.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Batch Multi-URL Mode */
            <div className="flex flex-col gap-5">
              <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <List className="w-4 h-4 text-accent" />
                      Paste URLs for Batch Audit (Up to 10 URLs)
                    </h3>
                    <span className="text-xs text-text-tertiary">
                      One URL per line. Tests each URL sequentially and produces a unified audit sheet.
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
                      {isBatchLoading ? "Auditing..." : "Audit All URLs"}
                    </Button>
                  </div>
                </div>

                <textarea
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  rows={5}
                  placeholder="https://example.com/page1&#10;https://example.com/page2"
                  className="w-full bg-background border border-border focus:border-accent rounded-lg p-3 text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              {/* Batch Results Table */}
              {batchResults.length > 0 && (
                <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Audit Results ({batchResults.length} URLs)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface border-b border-border text-text-tertiary uppercase text-[10px]">
                        <tr>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold">URL</th>
                          <th className="p-3 font-semibold">Reason Phrase</th>
                          <th className="p-3 font-semibold">Latency</th>
                          <th className="p-3 font-semibold">Redirect Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {batchResults.map((item, idx) => (
                          <tr key={idx} className="hover:bg-surface-raised/50 transition">
                            <td className="p-3">
                              <span
                                className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(
                                  item.status
                                )}`}
                              >
                                {item.status || "ERR"}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-text-primary break-all">{item.url}</td>
                            <td className="p-3 text-text-secondary">{item.statusText}</td>
                            <td className="p-3 font-mono text-text-tertiary">
                              {item.latencyMs ? `${item.latencyMs} ms` : "-"}
                            </td>
                            <td className="p-3 font-mono text-sky-400 truncate max-w-xs">
                              {item.redirectLocation || "-"}
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
      )}

      {/* TAB 2: RFC 9110 STATUS CODE ENCYCLOPEDIA */}
      {activeTab === "dictionary" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Search & Filter Grid (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code or keyword (e.g. 404, redirect, cache)..."
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Class Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "2xx", label: "2xx Success" },
                    { id: "3xx", label: "3xx Redirect" },
                    { id: "4xx", label: "4xx Client" },
                    { id: "5xx", label: "5xx Server" },
                    { id: "cdn", label: "CDN Edge" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setClassFilter(c.id as any)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition ${
                      classFilter === c.id
                        ? "bg-accent text-white border-accent"
                        : "bg-surface-raised border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code List Cards */}
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredCodes.map((item) => {
                const isSelected = selectedStatusCode === item.code;
                return (
                  <button
                    key={item.code}
                    onClick={() => setSelectedStatusCode(item.code)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-surface-raised border-accent shadow-sm"
                        : "bg-surface hover:bg-surface-raised/70 border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`font-mono text-sm font-extrabold px-2 py-0.5 rounded border shrink-0 ${getStatusBadgeClass(
                          item.code
                        )}`}
                      >
                        {item.code}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{item.title}</span>
                        <span className="text-[11px] text-text-tertiary line-clamp-1">
                          {item.summary}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-tertiary shrink-0 mt-1" />
                  </button>
                );
              })}
              {filteredCodes.length === 0 && (
                <div className="p-8 text-center text-xs text-text-tertiary bg-surface rounded-xl border border-border">
                  No status codes matching query &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Code Detail Deep Dive (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border/70 pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-3xl font-black px-3.5 py-1.5 rounded-xl border ${getStatusBadgeClass(
                      activeCodeInfo.code
                    )}`}
                  >
                    {activeCodeInfo.code}
                  </span>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-text-primary">{activeCodeInfo.title}</h2>
                    <span className="text-xs text-text-tertiary">
                      {activeCodeInfo.categoryName} &bull; {activeCodeInfo.rfc}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Technical Meaning
                </h3>
                <p className="text-xs text-text-primary leading-relaxed bg-surface-raised p-3.5 rounded-lg border border-border/60">
                  {activeCodeInfo.description}
                </p>
              </div>

              {/* SEO & Crawler Impact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 bg-surface-raised p-3.5 rounded-lg border border-border/60">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    SEO & Indexing Impact
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {activeCodeInfo.seoImpact}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 bg-surface-raised p-3.5 rounded-lg border border-border/60">
                  <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Googlebot Action
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {activeCodeInfo.crawlerAction}
                  </p>
                </div>
              </div>

              {/* Fix Recommendation */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  Recommended Action & Implementation
                </h3>
                <p className="text-xs text-text-primary leading-relaxed bg-accent/5 border border-accent/20 p-3.5 rounded-lg">
                  {activeCodeInfo.fixRecommendation}
                </p>
              </div>

              {/* Server Configuration Snippets */}
              <div className="flex flex-col gap-3 pt-2 border-t border-border/70">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-accent" />
                    Server Configuration Snippets
                  </span>
                  <div className="flex items-center gap-1 bg-surface-raised p-0.5 rounded-lg border border-border">
                    {(["nginx", "apache", "nextjs", "express"] as const).map((framework) => (
                      <button
                        key={framework}
                        onClick={() => setServerConfigTab(framework)}
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded transition ${
                          serverConfigTab === framework
                            ? "bg-accent text-white"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {framework}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <pre className="bg-[#0a0f1d] border border-border/80 rounded-lg p-3 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                    <code>{activeCodeInfo.serverConfigs[serverConfigTab]}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      handleCopy(activeCodeInfo.serverConfigs[serverConfigTab], "server_config")
                    }
                    className="absolute right-2 top-2 h-7 px-2 text-xs"
                    leftIcon={
                      copiedKey === "server_config" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )
                    }
                  >
                    {copiedKey === "server_config" ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SEO IMPACT & ARCHITECTURE GUIDE */}
      {activeTab === "guide" && (
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text-primary">
                Search Engine Redirection & Error Architecture (RFC 9110)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 301 vs 302 */}
              <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
                <span className="font-bold text-xs text-text-primary flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                  301 vs 302 vs 308 Redirections
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  A <strong>301 Moved Permanently</strong> passes 90-99% of PageRank link equity to the destination URL and tells Google to index the new link. A <strong>302 Found</strong> is temporary: Google keeps indexing the old URL. Use <strong>308</strong> when you need modern permanent redirects that guarantee the HTTP method (POST) is preserved.
                </p>
              </div>

              {/* 404 vs 410 */}
              <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
                <span className="font-bold text-xs text-text-primary flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-amber-400" />
                  404 Not Found vs 410 Gone
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Google treats <strong>404</strong> as a missing page that may be accidental, re-checking it repeatedly before de-indexing. In contrast, <strong>410 Gone</strong> signals deliberate, permanent deletion; Googlebot de-indexes 410 URLs significantly faster, saving crawl budget on large sites.
                </p>
              </div>

              {/* 503 Maintenance */}
              <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
                <span className="font-bold text-xs text-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  503 Maintenance with Retry-After
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  During scheduled maintenance or database updates, never return a 200 with an error page or a raw 500 crash. Serve a <strong>503 Service Unavailable</strong> with a <code className="font-mono text-accent">Retry-After: 3600</code> header. Googlebot will preserve all search rankings and return later.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CURL & TERMINAL GENERATOR */}
      {activeTab === "curl" && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text-primary">
                cURL Command Generator for Terminal Testing
              </h2>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleCopy(curlCommand, "curl_cmd")}
              leftIcon={
                copiedKey === "curl_cmd" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
            >
              {copiedKey === "curl_cmd" ? "Copied!" : "Copy cURL"}
            </Button>
          </div>

          <p className="text-xs text-text-secondary">
            Execute this command in your local terminal (macOS, Linux bash, or Windows PowerShell) to query HTTP response headers without downloading the HTML body:
          </p>

          <pre className="bg-[#0a0f1d] border border-border rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
            <code>{curlCommand}</code>
          </pre>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-text-secondary">
            <div className="bg-surface-raised p-3 rounded-lg border border-border">
              <span className="font-mono font-bold text-accent">-I (--head)</span>
              <p className="text-[11px] text-text-tertiary mt-1">
                Fetches only HTTP response headers without downloading payload.
              </p>
            </div>
            <div className="bg-surface-raised p-3 rounded-lg border border-border">
              <span className="font-mono font-bold text-accent">-L (--location)</span>
              <p className="text-[11px] text-text-tertiary mt-1">
                Instructs cURL to follow 301/302 redirects until reaching final 200 OK.
              </p>
            </div>
            <div className="bg-surface-raised p-3 rounded-lg border border-border">
              <span className="font-mono font-bold text-accent">-A (--user-agent)</span>
              <p className="text-[11px] text-text-tertiary mt-1">
                Customizes the User-Agent header string sent to target server.
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
