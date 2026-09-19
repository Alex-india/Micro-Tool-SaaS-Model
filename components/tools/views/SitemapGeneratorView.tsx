"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  generateSitemapXml,
  generateNextJsSitemapCode,
  parseBulkUrlsToEntries,
  auditSitemapConfig,
  formatDateIso,
  SITEMAP_PRESETS,
  type SitemapConfig,
  type SitemapUrlEntry,
  type SitemapIndexEntry,
  type ChangeFrequency,
  type SitemapAuditReport,
} from "@/tools/web/sitemapEngine";
import {
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  ListPlus,
  RefreshCw,
  Code2,
} from "lucide-react";

export interface SitemapGeneratorViewProps {
  tool: ToolMeta;
}

export const SitemapGeneratorView: React.FC<SitemapGeneratorViewProps> = ({ tool }) => {
  const defaultPreset = SITEMAP_PRESETS[0].config;

  // View state
  const [activeTab, setActiveTab] = useState<"xml" | "nextjs" | "audit">("xml");
  const [sitemapType, setSitemapType] = useState<"urlset" | "sitemapindex">(defaultPreset.type);

  // URL Entries State
  const [urls, setUrls] = useState<SitemapUrlEntry[]>(defaultPreset.urls);
  const [indexEntries, setIndexEntries] = useState<SitemapIndexEntry[]>(defaultPreset.sitemaps);

  // Bulk Paste State
  const [bulkInput, setBulkInput] = useState<string>("");
  const [showBulkInput, setShowBulkInput] = useState<boolean>(false);

  // Copy Feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Consolidated Config
  const config: SitemapConfig = useMemo(() => {
    return {
      type: sitemapType,
      urls,
      sitemaps: indexEntries,
    };
  }, [sitemapType, urls, indexEntries]);

  // Generated Code
  const xmlOutput = useMemo(() => generateSitemapXml(config), [config]);
  const nextJsOutput = useMemo(() => generateNextJsSitemapCode(urls), [urls]);

  // Audit Report
  const auditReport: SitemapAuditReport = useMemo(() => auditSitemapConfig(config), [config]);

  // Active Code String
  const activeCode = useMemo(() => {
    switch (activeTab) {
      case "xml":
        return xmlOutput;
      case "nextjs":
        return nextJsOutput;
      default:
        return xmlOutput;
    }
  }, [activeTab, xmlOutput, nextJsOutput]);

  // Copy Code
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeCode]);

  // Download XML file
  const handleDownload = () => {
    const filename = sitemapType === "sitemapindex" ? "sitemap_index.xml" : "sitemap.xml";
    const blob = new Blob([xmlOutput], { type: "application/xml;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(u);
  };

  // Download Next.js sitemap.ts
  const handleDownloadNextJs = () => {
    const blob = new Blob([nextJsOutput], { type: "text/typescript;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "sitemap.ts";
    a.click();
    URL.revokeObjectURL(u);
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const p = SITEMAP_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setSitemapType(p.config.type);
      setUrls(p.config.urls);
      setIndexEntries(p.config.sitemaps);
    }
  };

  // Row Manipulation
  const handleAddUrlRow = () => {
    const newEntry: SitemapUrlEntry = {
      id: `url_${Date.now()}`,
      loc: "https://example.com/new-page",
      lastmod: formatDateIso(),
      changefreq: "weekly",
      priority: 0.8,
    };
    setUrls([...urls, newEntry]);
  };

  const handleRemoveUrlRow = (id: string) => {
    setUrls(urls.filter((u) => u.id !== id));
  };

  const handleUpdateUrlRow = (id: string, updates: Partial<SitemapUrlEntry>) => {
    setUrls(urls.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  // Set all to Today
  const handleSetAllDatesToday = () => {
    const today = formatDateIso();
    setUrls(urls.map((u) => ({ ...u, lastmod: today })));
  };

  // Bulk Import
  const handleImportBulkUrls = () => {
    if (!bulkInput.trim()) return;
    const parsed = parseBulkUrlsToEntries(bulkInput);
    setUrls([...urls, ...parsed]);
    setBulkInput("");
    setShowBulkInput(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <ToolHeader tool={tool} />

      {/* Main Studio Card */}
      <div className="bg-surface/80 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        {/* Preset Toolbar & Health Pill */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SITEMAP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset.id)}
                  title={preset.description}
                  className="px-2.5 py-1 text-xs rounded-lg border border-border bg-surface hover:bg-surface-secondary text-foreground hover:border-accent/40 transition-all font-medium"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Score Pill */}
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              auditReport.score >= 80
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : auditReport.score >= 50
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            {auditReport.score >= 80 ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>Sitemap Score: {auditReport.score}/100</span>
          </button>
        </div>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & URL Builder (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-5">
            {/* Mode Toggle Bar */}
            <div className="p-3 bg-surface-secondary/40 border border-border rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Sitemap Structure Type:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSitemapType("urlset")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    sitemapType === "urlset"
                      ? "bg-accent text-accent-foreground font-bold shadow-sm"
                      : "bg-surface border border-border text-muted hover:text-foreground"
                  }`}
                >
                  &lt;urlset&gt; (Standard Pages)
                </button>
                <button
                  onClick={() => setSitemapType("sitemapindex")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    sitemapType === "sitemapindex"
                      ? "bg-accent text-accent-foreground font-bold shadow-sm"
                      : "bg-surface border border-border text-muted hover:text-foreground"
                  }`}
                >
                  &lt;sitemapindex&gt; (Modular)
                </button>
              </div>
            </div>

            {/* URL List Manager */}
            {sitemapType === "urlset" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-foreground">
                      Canonical URLs ({urls.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowBulkInput(!showBulkInput)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border bg-surface hover:bg-surface-secondary text-foreground flex items-center gap-1 transition-colors"
                    >
                      <ListPlus className="w-3.5 h-3.5 text-accent" />
                      Bulk Paste
                    </button>
                    <button
                      type="button"
                      onClick={handleSetAllDatesToday}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border bg-surface hover:bg-surface-secondary text-foreground flex items-center gap-1 transition-colors"
                      title="Set all lastmod timestamps to today"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      All Today
                    </button>
                    <button
                      type="button"
                      onClick={handleAddUrlRow}
                      className="px-2.5 py-1 text-xs rounded-lg bg-accent text-accent-foreground font-semibold flex items-center gap-1 hover:bg-accent/90 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Bulk Paste Drawer */}
                {showBulkInput && (
                  <div className="p-4 bg-surface border border-border rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-foreground">Paste URLs (one per line):</label>
                      <span className="text-[11px] text-muted">Auto-formats https:// & root priority</span>
                    </div>
                    <textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder="https://example.com&#10;https://example.com/pricing&#10;https://example.com/docs"
                      rows={4}
                      className="w-full bg-surface-secondary/40 border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkInput(false)}
                        className="px-3 py-1 text-xs rounded-lg border border-border text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleImportBulkUrls}
                        className="px-3 py-1 text-xs rounded-lg bg-accent text-accent-foreground font-semibold"
                      >
                        Import Into Sitemap
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive URL Table */}
                <div className="overflow-x-auto rounded-xl border border-border max-h-[520px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-surface-secondary/90 backdrop-blur-sm border-b border-border text-muted">
                      <tr>
                        <th className="p-3 font-semibold min-w-[200px]">URL Location (loc)</th>
                        <th className="p-3 font-semibold w-28">Lastmod</th>
                        <th className="p-3 font-semibold w-24">Changefreq</th>
                        <th className="p-3 font-semibold w-20">Priority</th>
                        <th className="p-3 text-right font-semibold w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono">
                      {urls.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.loc}
                              onChange={(e) => handleUpdateUrlRow(item.id, { loc: e.target.value })}
                              className="w-full bg-transparent border-b border-transparent focus:border-accent text-foreground text-xs font-mono focus:outline-none"
                              placeholder="https://example.com/page"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.lastmod || ""}
                              onChange={(e) => handleUpdateUrlRow(item.id, { lastmod: e.target.value })}
                              className="w-full bg-transparent border-b border-transparent focus:border-accent text-foreground text-xs font-mono focus:outline-none"
                              placeholder="YYYY-MM-DD"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={item.changefreq || "weekly"}
                              onChange={(e) =>
                                handleUpdateUrlRow(item.id, {
                                  changefreq: e.target.value as ChangeFrequency,
                                })
                              }
                              className="bg-surface border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                            >
                              <option value="always">always</option>
                              <option value="hourly">hourly</option>
                              <option value="daily">daily</option>
                              <option value="weekly">weekly</option>
                              <option value="monthly">monthly</option>
                              <option value="yearly">yearly</option>
                              <option value="never">never</option>
                            </select>
                          </td>
                          <td className="p-2.5">
                            <select
                              value={item.priority !== undefined ? item.priority.toFixed(1) : "0.8"}
                              onChange={(e) =>
                                handleUpdateUrlRow(item.id, { priority: parseFloat(e.target.value) })
                              }
                              className="bg-surface border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                            >
                              <option value="1.0">1.0 (Highest)</option>
                              <option value="0.9">0.9</option>
                              <option value="0.8">0.8 (Normal)</option>
                              <option value="0.7">0.7</option>
                              <option value="0.6">0.6</option>
                              <option value="0.5">0.5</option>
                              <option value="0.3">0.3</option>
                              <option value="0.1">0.1</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveUrlRow(item.id)}
                              className="text-muted hover:text-destructive p-1 rounded transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Multi-Sitemap Index Manager */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Child Sitemaps ({indexEntries.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setIndexEntries([
                        ...indexEntries,
                        {
                          id: `idx_${Date.now()}`,
                          loc: "https://example.com/new-sitemap.xml",
                          lastmod: formatDateIso(),
                        },
                      ])
                    }
                    className="px-2.5 py-1 text-xs rounded-lg bg-accent text-accent-foreground font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Sitemap
                  </button>
                </div>

                <div className="space-y-2">
                  {indexEntries.map((idxItem) => (
                    <div
                      key={idxItem.id}
                      className="p-3 bg-surface-secondary/40 border border-border rounded-xl flex items-center gap-3 text-xs"
                    >
                      <input
                        type="text"
                        value={idxItem.loc}
                        onChange={(e) =>
                          setIndexEntries(
                            indexEntries.map((x) =>
                              x.id === idxItem.id ? { ...x, loc: e.target.value } : x
                            )
                          )
                        }
                        className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground font-mono"
                        placeholder="https://example.com/sitemaps/posts.xml"
                      />
                      <input
                        type="text"
                        value={idxItem.lastmod || ""}
                        onChange={(e) =>
                          setIndexEntries(
                            indexEntries.map((x) =>
                              x.id === idxItem.id ? { ...x, lastmod: e.target.value } : x
                            )
                          )
                        }
                        className="w-28 bg-surface border border-border rounded-lg px-2 py-1.5 text-foreground font-mono"
                        placeholder="YYYY-MM-DD"
                      />
                      <button
                        type="button"
                        onClick={() => setIndexEntries(indexEntries.filter((x) => x.id !== idxItem.id))}
                        className="text-muted hover:text-destructive p-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Code Exporter & Audit (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
                <button
                  onClick={() => setActiveTab("xml")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "xml"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  XML Output
                </button>
                <button
                  onClick={() => setActiveTab("nextjs")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "nextjs"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Next.js App Router (sitemap.ts)
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "audit"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SEO Audit
                  {auditReport.issues.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent-foreground/20 text-accent-foreground">
                      {auditReport.issues.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={activeTab === "nextjs" ? handleDownloadNextJs : handleDownload}
                  className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-secondary transition-colors text-xs font-medium flex items-center gap-1"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{activeTab === "nextjs" ? ".ts" : ".xml"}</span>
                </button>
              </div>
            </div>

            {/* TAB 1 & 2: CODE EXPORTER */}
            {(activeTab === "xml" || activeTab === "nextjs") && (
              <div className="space-y-3">
                <div className="relative">
                  <pre className="p-4 bg-surface border border-border rounded-xl font-mono text-xs text-foreground overflow-x-auto max-h-[500px] select-all leading-relaxed">
                    <code>{activeCode}</code>
                  </pre>
                </div>

                <div className="p-3 bg-surface-secondary/40 border border-border rounded-xl text-xs text-muted flex items-center justify-between">
                  <span>
                    {activeTab === "xml"
                      ? "File Location: Web Root (/sitemap.xml)"
                      : "File Location: app/sitemap.ts (Next.js App Router)"}
                  </span>
                  <span className="font-mono">
                    Size: {(auditReport.estimatedSizeBytes / 1024).toFixed(1)} KB • Lines:{" "}
                    {activeCode.split("\n").length}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: AUDIT CHECKLIST */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                {/* Score Banner */}
                <div className="p-4 bg-surface-secondary/40 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Google Search Console Compliance</h4>
                    <p className="text-[11px] text-muted">
                      Verifies sitemaps.org Protocol 0.9 and search engine crawler rules.
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-black font-mono ${
                        auditReport.score >= 80
                          ? "text-emerald-400"
                          : auditReport.score >= 50
                          ? "text-amber-400"
                          : "text-destructive"
                      }`}
                    >
                      {auditReport.score}
                    </span>
                    <span className="text-xs text-muted"> / 100</span>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-surface border border-border rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted">URLs Present</span>
                    <span className="text-sm font-bold text-foreground font-mono block">
                      {auditReport.totalUrls} / 50,000 max
                    </span>
                  </div>

                  <div className="p-3 bg-surface border border-border rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted">Estimated Size</span>
                    <span className="text-sm font-bold text-accent font-mono block">
                      {(auditReport.estimatedSizeBytes / 1024).toFixed(1)} KB / 50MB
                    </span>
                  </div>

                  <div className="p-3 bg-surface border border-border rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted">Duplicates</span>
                    <span
                      className={`text-sm font-bold font-mono block ${
                        auditReport.duplicateCount > 0 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {auditReport.duplicateCount}
                    </span>
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Checklist & Findings ({auditReport.issues.length})
                  </h4>

                  <div className="space-y-2">
                    {auditReport.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          issue.type === "success"
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                            : issue.type === "warning"
                            ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
                            : "bg-destructive/5 border-destructive/20 text-destructive"
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1.5">
                          {issue.type === "success" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : issue.type === "warning" ? (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{issue.message}</span>
                        </div>
                        <p className="text-[11px] text-muted pl-5 font-sans">
                          {issue.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEO Educational Content */}
      <SEOContent tool={tool} />

      {/* Related Tools */}
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
