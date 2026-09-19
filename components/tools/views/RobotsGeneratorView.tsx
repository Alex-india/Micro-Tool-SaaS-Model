"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  generateRobotsTxt,
  testPathAgainstRobots,
  validateRobotsConfig,
  ROBOTS_PRESETS,
  POPULAR_BOTS,
  type RobotsConfig,
  type RobotsRuleGroup,
  type PathTestResult,
  type RobotsValidationReport,
} from "@/tools/web/robotsEngine";
import {
  Bot,
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
  Sliders,
  Shield,
  Search,
  Code2,
  HelpCircle,
} from "lucide-react";

export interface RobotsGeneratorViewProps {
  tool: ToolMeta;
}

export const RobotsGeneratorView: React.FC<RobotsGeneratorViewProps> = ({ tool }) => {
  const defaultPreset = ROBOTS_PRESETS[0].config;

  // View state
  const [activeTab, setActiveTab] = useState<"code" | "tester" | "audit">("code");

  // Configuration State
  const [ruleGroups, setRuleGroups] = useState<RobotsRuleGroup[]>(defaultPreset.ruleGroups);
  const [sitemapsInput, setSitemapsInput] = useState<string>((defaultPreset.sitemaps || []).join("\n"));
  const [hostInput, setHostInput] = useState<string>(defaultPreset.host || "");

  // AI Scraper Shield Quick Toggle
  const [blockAiCrawlers, setBlockAiCrawlers] = useState<boolean>(false);

  // Path Tester State
  const [testUserAgent, setTestUserAgent] = useState<string>("Googlebot");
  const [testPath, setTestPath] = useState<string>("/admin/settings");

  // Copy Feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Consolidated Config
  const config: RobotsConfig = useMemo(() => {
    let groups = [...ruleGroups];

    if (blockAiCrawlers) {
      // Check if AI group already exists
      const aiGroupExists = groups.some((g) => g.id === "ai_block");
      if (!aiGroupExists) {
        groups.push({
          id: "ai_block",
          name: "AI & LLM Training Scrapers (Blocked)",
          userAgents: [
            "GPTBot",
            "ChatGPT-User",
            "CCBot",
            "ClaudeBot",
            "Claude-Web",
            "Google-Extended",
            "Bytespider",
            "PerplexityBot",
            "cohere-ai",
          ],
          allows: [],
          disallows: ["/"],
        });
      }
    } else {
      groups = groups.filter((g) => g.id !== "ai_block");
    }

    const sitemaps = sitemapsInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      ruleGroups: groups,
      sitemaps,
      host: hostInput.trim() || undefined,
    };
  }, [ruleGroups, sitemapsInput, hostInput, blockAiCrawlers]);

  // Generated robots.txt text
  const robotsTxtContent = useMemo(() => generateRobotsTxt(config), [config]);

  // Validation Report
  const validationReport: RobotsValidationReport = useMemo(
    () => validateRobotsConfig(config),
    [config]
  );

  // Path Test Result
  const pathTestResult: PathTestResult = useMemo(
    () => testPathAgainstRobots(testPath, testUserAgent, config),
    [testPath, testUserAgent, config]
  );

  // Copy handler
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(robotsTxtContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [robotsTxtContent]);

  // Download robots.txt file
  const handleDownload = () => {
    const blob = new Blob([robotsTxtContent], { type: "text/plain;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(u);
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const p = ROBOTS_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setRuleGroups(p.config.ruleGroups);
      setSitemapsInput((p.config.sitemaps || []).join("\n"));
      setHostInput(p.config.host || "");
      setBlockAiCrawlers(p.id === "block_ai_scrapers");
    }
  };

  // Rule Group Helpers
  const handleAddRuleGroup = () => {
    const newGroup: RobotsRuleGroup = {
      id: `group_${Date.now()}`,
      name: "Custom Bot Group",
      userAgents: ["Googlebot"],
      allows: ["/"],
      disallows: ["/private/"],
    };
    setRuleGroups([...ruleGroups, newGroup]);
  };

  const handleRemoveRuleGroup = (id: string) => {
    setRuleGroups(ruleGroups.filter((g) => g.id !== id));
  };

  const handleUpdateGroup = (id: string, updates: Partial<RobotsRuleGroup>) => {
    setRuleGroups(
      ruleGroups.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <ToolHeader tool={tool} />

      {/* Main Studio Card */}
      <div className="bg-surface/80 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        {/* Preset Toolbar & AI Shield Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {ROBOTS_PRESETS.map((preset) => (
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

          {/* Validation Status Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                validationReport.isValid && !validationReport.hasTotalBlock
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : validationReport.hasTotalBlock
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              {validationReport.hasTotalBlock ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : validationReport.isValid ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              <span>
                {validationReport.hasTotalBlock
                  ? "Total Block Detected"
                  : validationReport.isValid
                  ? "Valid RFC 9309"
                  : "Review Warnings"}
              </span>
            </button>
          </div>
        </div>

        {/* Studio Dual Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Rules & Sitemaps Form (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6">
            {/* AI Scraper Shield Banner */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-foreground">AI Scraper Shield</span>
                </div>
                <p className="text-[11px] text-muted">
                  Block OpenAI (GPTBot), Anthropic (ClaudeBot), Common Crawl, and ByteDance from scraping site content.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockAiCrawlers}
                  onChange={(e) => setBlockAiCrawlers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Rule Groups Container */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-accent" />
                  Crawler Rule Groups ({ruleGroups.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddRuleGroup}
                  className="px-2.5 py-1 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-secondary text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Group
                </button>
              </div>

              {ruleGroups.map((group, groupIndex) => (
                <div
                  key={group.id}
                  className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-3.5 relative"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <input
                      type="text"
                      value={group.name || `Rule Group ${groupIndex + 1}`}
                      onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                      className="bg-transparent font-semibold text-xs text-foreground focus:outline-none border-b border-dashed border-border/70 hover:border-accent"
                    />
                    {ruleGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRuleGroup(group.id)}
                        className="text-muted hover:text-destructive p-1 rounded transition-colors"
                        title="Delete this rule group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* User-Agents */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-foreground">User-agents (comma-separated)</label>
                      <span className="text-[10px] text-muted">Use * for all search engines</span>
                    </div>
                    <input
                      type="text"
                      value={(group.userAgents || []).join(", ")}
                      onChange={(e) =>
                        handleUpdateGroup(group.id, {
                          userAgents: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. *, Googlebot, Bingbot"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                    />

                    {/* Quick Bot Chips */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["*", "Googlebot", "Bingbot", "Applebot", "DuckDuckBot"].map((bot) => (
                        <button
                          key={bot}
                          type="button"
                          onClick={() => {
                            if (!group.userAgents.includes(bot)) {
                              handleUpdateGroup(group.id, {
                                userAgents: [...group.userAgents, bot],
                              });
                            }
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-surface border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
                        >
                          +{bot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Disallow Paths */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Disallowed Paths (one path per line)
                    </label>
                    <textarea
                      value={(group.disallows || []).join("\n")}
                      onChange={(e) =>
                        handleUpdateGroup(group.id, {
                          disallows: e.target.value.split("\n"),
                        })
                      }
                      placeholder="/admin/&#10;/api/&#10;/cart/&#10;/*.json$"
                      rows={3}
                      className="w-full bg-surface border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                    />
                  </div>

                  {/* Allow Paths (Exceptions) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Allowed Path Exceptions (one path per line)
                    </label>
                    <textarea
                      value={(group.allows || []).join("\n")}
                      onChange={(e) =>
                        handleUpdateGroup(group.id, {
                          allows: e.target.value.split("\n"),
                        })
                      }
                      placeholder="/&#10;/public/&#10;/api/docs"
                      rows={2}
                      className="w-full bg-surface border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                    />
                  </div>

                  {/* Crawl-Delay */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-foreground">Crawl-delay (seconds, optional)</label>
                      <span className="text-[10px] text-muted">Supported by Bing and Yandex</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={group.crawlDelay || ""}
                      onChange={(e) =>
                        handleUpdateGroup(group.id, {
                          crawlDelay: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g. 2"
                      className="w-32 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Sitemaps & Host Directives */}
            <div className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-accent" />
                Sitemap & Host Directives
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  XML Sitemap URLs (one per line)
                </label>
                <textarea
                  value={sitemapsInput}
                  onChange={(e) => setSitemapsInput(e.target.value)}
                  placeholder="https://example.com/sitemap.xml&#10;https://example.com/blog-sitemap.xml"
                  rows={2}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                />
                <p className="text-[11px] text-muted">
                  Must be absolute URLs starting with <code>https://</code>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Host Directive (Optional mirror domain)</label>
                <input
                  type="text"
                  value={hostInput}
                  onChange={(e) => setHostInput(e.target.value)}
                  placeholder="e.g. toolverse.app"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Code Output & Testing Tools (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "code"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Robots.txt Output
                </button>
                <button
                  onClick={() => setActiveTab("tester")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "tester"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  URL Path Tester
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
                  {validationReport.issues.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400">
                      {validationReport.issues.length}
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
                  onClick={handleDownload}
                  className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-secondary transition-colors text-xs font-medium flex items-center gap-1"
                  title="Download robots.txt file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.txt</span>
                </button>
              </div>
            </div>

            {/* TAB 1: ROBOTS.TXT OUTPUT */}
            {activeTab === "code" && (
              <div className="space-y-3">
                <div className="relative">
                  <pre className="p-4 bg-surface border border-border rounded-xl font-mono text-xs text-foreground overflow-x-auto max-h-[500px] select-all leading-relaxed">
                    <code>{robotsTxtContent}</code>
                  </pre>
                </div>

                <div className="p-3 bg-surface-secondary/40 border border-border rounded-xl text-xs text-muted flex items-center justify-between">
                  <span>File Location: Place directly in web root (<code>/robots.txt</code>)</span>
                  <span className="font-mono">Lines: {robotsTxtContent.split("\n").length}</span>
                </div>
              </div>
            )}

            {/* TAB 2: URL PATH TESTER */}
            {activeTab === "tester" && (
              <div className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Interactive Path Tester (RFC 9309)</h4>
                  <p className="text-[11px] text-muted">
                    Test whether a specific search engine bot is allowed or blocked from crawling a URL path.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Crawler / User-agent</label>
                    <select
                      value={testUserAgent}
                      onChange={(e) => setTestUserAgent(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="Googlebot">Googlebot (Google Search)</option>
                      <option value="Googlebot-Image">Googlebot-Image (Google Images)</option>
                      <option value="Bingbot">Bingbot (Microsoft Bing)</option>
                      <option value="GPTBot">GPTBot (OpenAI ChatGPT)</option>
                      <option value="ClaudeBot">ClaudeBot (Anthropic)</option>
                      <option value="CCBot">CCBot (Common Crawl)</option>
                      <option value="Bytespider">Bytespider (ByteDance)</option>
                      <option value="facebookexternalhit">facebookexternalhit (Meta)</option>
                      <option value="Twitterbot">Twitterbot (X / Twitter)</option>
                      <option value="*">* (All Crawlers Wildcard)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">URL Path to Test</label>
                    <input
                      type="text"
                      value={testPath}
                      onChange={(e) => setTestPath(e.target.value)}
                      placeholder="/admin/settings or /blog/article-1"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Path Test Result Box */}
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    pathTestResult.isAllowed
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pathTestResult.isAllowed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <span className="font-bold text-sm">
                        {pathTestResult.isAllowed ? "CRAWL ALLOWED" : "CRAWL BLOCKED"}
                      </span>
                    </div>

                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface border border-border font-mono text-foreground">
                      Directive: {pathTestResult.matchedDirective}
                    </span>
                  </div>

                  <div className="text-xs font-mono pl-7 text-foreground/90">
                    {pathTestResult.reason}
                  </div>
                </div>

                {/* Test Presets */}
                <div className="pt-2 border-t border-border/50 text-xs">
                  <span className="text-muted block mb-1.5">Quick Test Paths:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["/", "/admin/dashboard", "/api/v1/users", "/checkout/pay", "/blog/my-post", "/wp-admin/admin-ajax.php"].map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTestPath(p)}
                          className="px-2 py-1 rounded bg-surface border border-border text-foreground hover:border-accent/40 font-mono text-[11px] transition-colors"
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SEO AUDIT */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                {/* Audit Summary Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    validationReport.hasTotalBlock
                      ? "bg-rose-500/10 border-rose-500/30"
                      : validationReport.isValid
                      ? "bg-surface-secondary/40 border-border"
                      : "bg-amber-500/10 border-amber-500/30"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Robots.txt SEO Health Check</h4>
                    <p className="text-[11px] text-muted">
                      Verifies crawler compliance and guards against catastrophic de-indexing.
                    </p>
                  </div>
                  <div>
                    {validationReport.hasTotalBlock ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        Critical Error
                      </span>
                    ) : validationReport.isValid ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        All Checks Passed
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        Review Warnings
                      </span>
                    )}
                  </div>
                </div>

                {/* Issue List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Checklist & Findings ({validationReport.issues.length})
                  </h4>

                  {validationReport.issues.length === 0 ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Zero SEO conflicts found. Your robots.txt conforms to RFC 9309 standards.</span>
                    </div>
                  ) : (
                    validationReport.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          issue.type === "error"
                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                            : issue.type === "warning"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-surface border-border text-muted"
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1.5">
                          {issue.type === "error" ? (
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{issue.message}</span>
                        </div>
                        <p className="text-[11px] text-muted pl-5 font-sans">
                          {issue.recommendation}
                        </p>
                      </div>
                    ))
                  )}
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
