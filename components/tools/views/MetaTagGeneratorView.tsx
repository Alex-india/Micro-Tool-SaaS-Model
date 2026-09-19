"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  generateHtmlMetaTags,
  generateNextJsAppRouterMetadata,
  generateNextJsPagesHead,
  generateNuxtHead,
  auditMetaTags,
  META_TAG_PRESETS,
  type MetaTagConfig,
  type OgType,
  type TwitterCardType,
  type MaxImagePreview,
  type MetaAuditReport,
} from "@/tools/web/metaTagEngine";
import {
  Code,
  Copy,
  Check,
  Download,
  ExternalLink,
  Eye,
  Share2,
  Twitter,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  Globe,
  Layers,
  Smartphone,
  Monitor,
  CheckCheck,
  FileCode,
} from "lucide-react";

export interface MetaTagGeneratorViewProps {
  tool: ToolMeta;
}

export const MetaTagGeneratorView: React.FC<MetaTagGeneratorViewProps> = ({ tool }) => {
  const defaultPreset = META_TAG_PRESETS[0].config;

  // View state
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "audit">("preview");
  const [activeCodeFormat, setActiveCodeFormat] = useState<"html" | "nextApp" | "nextPages" | "nuxt">("html");
  const [previewPlatform, setPreviewPlatform] = useState<"google" | "facebook" | "twitter" | "linkedin" | "discord">("google");
  const [googleDevice, setGoogleDevice] = useState<"desktop" | "mobile">("desktop");

  // Form Fields
  const [title, setTitle] = useState<string>(defaultPreset.title);
  const [description, setDescription] = useState<string>(defaultPreset.description);
  const [canonicalUrl, setCanonicalUrl] = useState<string>(defaultPreset.canonicalUrl || "");
  const [keywords, setKeywords] = useState<string>(defaultPreset.keywords || "");
  const [author, setAuthor] = useState<string>(defaultPreset.author || "");

  // Open Graph Fields
  const [ogType, setOgType] = useState<OgType>(defaultPreset.ogType || "website");
  const [ogTitle, setOgTitle] = useState<string>(defaultPreset.ogTitle || "");
  const [ogDescription, setOgDescription] = useState<string>(defaultPreset.ogDescription || "");
  const [ogImage, setOgImage] = useState<string>(defaultPreset.ogImage || "");
  const [ogSiteName, setOgSiteName] = useState<string>(defaultPreset.ogSiteName || "");

  // Twitter Fields
  const [twitterCard, setTwitterCard] = useState<TwitterCardType>(defaultPreset.twitterCard || "summary_large_image");
  const [twitterSite, setTwitterSite] = useState<string>(defaultPreset.twitterSite || "");
  const [twitterCreator, setTwitterCreator] = useState<string>(defaultPreset.twitterCreator || "");

  // Robots & Advanced
  const [index, setIndex] = useState<boolean>(true);
  const [follow, setFollow] = useState<boolean>(true);
  const [maxImagePreview, setMaxImagePreview] = useState<MaxImagePreview>("large");
  const [themeColor, setThemeColor] = useState<string>("#0f172a");

  // Copy state
  const [copied, setCopied] = useState<boolean>(false);

  // Consolidated Config
  const config: MetaTagConfig = useMemo(
    () => ({
      title,
      description,
      canonicalUrl,
      keywords,
      author,
      index,
      follow,
      maxImagePreview,
      ogType,
      ogTitle: ogTitle || title,
      ogDescription: ogDescription || description,
      ogImage,
      ogSiteName,
      twitterCard,
      twitterTitle: ogTitle || title,
      twitterDescription: ogDescription || description,
      twitterImage: ogImage,
      twitterSite,
      twitterCreator,
      themeColor,
    }),
    [
      title,
      description,
      canonicalUrl,
      keywords,
      author,
      index,
      follow,
      maxImagePreview,
      ogType,
      ogTitle,
      ogDescription,
      ogImage,
      ogSiteName,
      twitterCard,
      twitterSite,
      twitterCreator,
      themeColor,
    ]
  );

  // Audit Report
  const audit: MetaAuditReport = useMemo(() => auditMetaTags(config), [config]);

  // Code Outputs
  const generatedHtml = useMemo(() => generateHtmlMetaTags(config), [config]);
  const generatedNextApp = useMemo(() => generateNextJsAppRouterMetadata(config), [config]);
  const generatedNextPages = useMemo(() => generateNextJsPagesHead(config), [config]);
  const generatedNuxt = useMemo(() => generateNuxtHead(config), [config]);

  const activeCodeSnippet = useMemo(() => {
    switch (activeCodeFormat) {
      case "nextApp":
        return generatedNextApp;
      case "nextPages":
        return generatedNextPages;
      case "nuxt":
        return generatedNuxt;
      case "html":
      default:
        return generatedHtml;
    }
  }, [activeCodeFormat, generatedHtml, generatedNextApp, generatedNextPages, generatedNuxt]);

  // Copy handler
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // Download HTML handler
  const handleDownloadHtml = useCallback(() => {
    const blob = new Blob([generatedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meta-tags-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedHtml]);

  // Load preset
  const loadPreset = (presetId: string) => {
    const p = META_TAG_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setTitle(p.config.title);
    setDescription(p.config.description);
    setCanonicalUrl(p.config.canonicalUrl || "");
    setKeywords(p.config.keywords || "");
    setAuthor(p.config.author || "");
    setOgType(p.config.ogType || "website");
    setOgTitle(p.config.ogTitle || "");
    setOgDescription(p.config.ogDescription || "");
    setOgImage(p.config.ogImage || "");
    setOgSiteName(p.config.ogSiteName || "");
    setTwitterCard(p.config.twitterCard || "summary_large_image");
    setTwitterSite(p.config.twitterSite || "");
    setTwitterCreator(p.config.twitterCreator || "");
    setThemeColor(p.config.themeColor || "#0f172a");
  };

  // Extract display domain
  const displayDomain = useMemo(() => {
    try {
      if (!canonicalUrl) return "example.com";
      const u = new URL(canonicalUrl.startsWith("http") ? canonicalUrl : `https://${canonicalUrl}`);
      return u.hostname;
    } catch {
      return "example.com";
    }
  }, [canonicalUrl]);

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
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "preview"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Eye className="w-4 h-4" />
              Live SERP & Social Previews
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "code"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Code className="w-4 h-4" />
              Export Code (HTML & Next.js)
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "audit"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              SEO Health Score ({audit.score}/100)
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted hidden sm:inline">Presets:</span>
            <select
              onChange={(e) => loadPreset(e.target.value)}
              defaultValue="saas_landing"
              className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent focus:outline-none"
            >
              {META_TAG_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Inputs (5 Cols) */}
          <div className="lg:col-span-5 space-y-5 bg-surface-secondary/30 border border-border p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 flex items-center justify-between">
              <span>Meta Tag Specifications</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  audit.score >= 85
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : audit.score >= 60
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                SEO Score: {audit.score}%
              </span>
            </h3>

            {/* 1. Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-foreground">
                  Meta Title <span className="text-destructive">*</span>
                </label>
                <span
                  className={`font-mono text-[11px] ${
                    audit.titleLength > 60
                      ? "text-amber-400 font-bold"
                      : audit.titleLength >= 30
                      ? "text-emerald-400"
                      : "text-muted"
                  }`}
                >
                  {audit.titleLength}/60 chars
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page Title (Optimal: 45 - 60 characters)"
                className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* 2. Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-foreground">
                  Meta Description <span className="text-destructive">*</span>
                </label>
                <span
                  className={`font-mono text-[11px] ${
                    audit.descriptionLength > 160
                      ? "text-amber-400 font-bold"
                      : audit.descriptionLength >= 120
                      ? "text-emerald-400"
                      : "text-muted"
                  }`}
                >
                  {audit.descriptionLength}/160 chars
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summary snippet for search results (Optimal: 120 - 160 characters)"
                rows={3}
                className="w-full bg-surface border border-border rounded-lg p-3 text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* 3. Canonical URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Canonical URL</label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* 4. Social Preview Image */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Social Share Image (og:image)</span>
                <span className="text-[10px] text-muted">1200 x 630 px recommended</span>
              </label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://example.com/og-banner.png"
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* 5. Open Graph Type & Site Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Page Type</label>
                <select
                  value={ogType}
                  onChange={(e) => setOgType(e.target.value as OgType)}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="website">Website</option>
                  <option value="article">Article / Blog</option>
                  <option value="product">Product</option>
                  <option value="profile">Profile / Person</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Site Name</label>
                <input
                  type="text"
                  value={ogSiteName}
                  onChange={(e) => setOgSiteName(e.target.value)}
                  placeholder="e.g. ToolVerse"
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* 6. Twitter Card Type & Handles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Twitter Card Format</label>
                <select
                  value={twitterCard}
                  onChange={(e) => setTwitterCard(e.target.value as TwitterCardType)}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="summary_large_image">Large Image Card</option>
                  <option value="summary">Small Summary Card</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">X / Twitter @handle</label>
                <input
                  type="text"
                  value={twitterSite}
                  onChange={(e) => setTwitterSite(e.target.value)}
                  placeholder="@yourcompany"
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* 7. Crawlers & Robots */}
            <div className="p-3 bg-surface border border-border rounded-xl space-y-2 text-xs">
              <span className="font-semibold text-foreground block">Crawler Directives (Robots)</span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={index}
                    onChange={(e) => setIndex(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  Index (Searchable)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={follow}
                    onChange={(e) => setFollow(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  Follow Links
                </label>
                <label className="flex items-center gap-1.5 text-muted">
                  Max Image:
                  <select
                    value={maxImagePreview}
                    onChange={(e) => setMaxImagePreview(e.target.value as MaxImagePreview)}
                    className="bg-surface border border-border rounded px-1.5 py-0.5 text-[11px] text-foreground focus:outline-none"
                  >
                    <option value="large">Large</option>
                    <option value="standard">Standard</option>
                    <option value="none">None</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Previews & Code Generator (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tab 1: Live Previews */}
            {activeTab === "preview" && (
              <div className="space-y-5">
                {/* Platform Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-1.5 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
                    <button
                      onClick={() => setPreviewPlatform("google")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        previewPlatform === "google"
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      Google SERP
                    </button>
                    <button
                      onClick={() => setPreviewPlatform("facebook")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        previewPlatform === "facebook"
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Facebook / LinkedIn
                    </button>
                    <button
                      onClick={() => setPreviewPlatform("twitter")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        previewPlatform === "twitter"
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      <Twitter className="w-3.5 h-3.5" />
                      X / Twitter Card
                    </button>
                  </div>

                  {previewPlatform === "google" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setGoogleDevice("desktop")}
                        className={`p-1.5 rounded text-xs ${
                          googleDevice === "desktop" ? "bg-accent text-white" : "text-muted hover:text-foreground"
                        }`}
                        title="Desktop SERP"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setGoogleDevice("mobile")}
                        className={`p-1.5 rounded text-xs ${
                          googleDevice === "mobile" ? "bg-accent text-white" : "text-muted hover:text-foreground"
                        }`}
                        title="Mobile SERP"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 1. Google SERP Preview Card */}
                {previewPlatform === "google" && (
                  <div className="p-6 bg-white dark:bg-[#202124] border border-border/80 rounded-2xl shadow-md text-left font-sans transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                        {displayDomain[0]?.toUpperCase() || "T"}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[#202124] dark:text-[#bdc1c6] block">
                          {ogSiteName || displayDomain}
                        </span>
                        <span className="text-[11px] text-[#4d5156] dark:text-[#9aa0a6] block leading-none">
                          https://{displayDomain} {canonicalUrl.includes("/") ? "> " + canonicalUrl.split("/").slice(3).join(" > ") : ""}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-lg text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-snug mb-1 line-clamp-1">
                      {title || "Your Page Title Goes Here"}
                    </h4>
                    <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                      {description || "Add a meta description to preview how your page summary will look in Google search result snippets."}
                    </p>
                  </div>
                )}

                {/* 2. Facebook / LinkedIn Card Preview */}
                {previewPlatform === "facebook" && (
                  <div className="bg-[#18191a] text-[#e4e6eb] border border-[#393a3b] rounded-xl overflow-hidden shadow-lg font-sans max-w-lg mx-auto">
                    {ogImage ? (
                      <img
                        src={ogImage}
                        alt="OG Preview"
                        className="w-full h-56 object-cover bg-slate-900 border-b border-[#393a3b]"
                        onError={(e) => {
                          (e.target as any).src =
                            "https://placehold.co/1200x630/1e293b/white?text=1200x630+Social+Share+Image";
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                        No image specified (Add og:image)
                      </div>
                    )}
                    <div className="p-3 bg-[#242526]">
                      <span className="text-[11px] text-[#b0b3b8] uppercase tracking-wider font-semibold block mb-0.5">
                        {displayDomain}
                      </span>
                      <h4 className="text-sm font-bold text-[#e4e6eb] leading-snug line-clamp-2 mb-1">
                        {ogTitle || title}
                      </h4>
                      <p className="text-xs text-[#b0b3b8] line-clamp-2 leading-relaxed">
                        {ogDescription || description}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. X / Twitter Card Preview */}
                {previewPlatform === "twitter" && (
                  <div className="bg-black text-[#e7e9ea] border border-[#2f3336] rounded-2xl overflow-hidden shadow-lg font-sans max-w-lg mx-auto">
                    {ogImage ? (
                      <img
                        src={ogImage}
                        alt="Twitter Preview"
                        className="w-full h-56 object-cover bg-slate-900 border-b border-[#2f3336]"
                        onError={(e) => {
                          (e.target as any).src =
                            "https://placehold.co/1200x630/0f172a/white?text=Twitter+Card+1200x630";
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-slate-900 flex items-center justify-center text-xs text-slate-400">
                        No image specified
                      </div>
                    )}
                    <div className="p-3 bg-black">
                      <span className="text-xs text-[#71767b] block mb-0.5">{displayDomain}</span>
                      <h4 className="text-sm font-bold text-[#e7e9ea] leading-snug mb-1 line-clamp-1">
                        {ogTitle || title}
                      </h4>
                      <p className="text-xs text-[#71767b] line-clamp-2 leading-relaxed">
                        {ogDescription || description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Code Export */}
            {activeTab === "code" && (
              <div className="space-y-4">
                {/* Format Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
                    <button
                      onClick={() => setActiveCodeFormat("html")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeCodeFormat === "html" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                      }`}
                    >
                      HTML &lt;head&gt;
                    </button>
                    <button
                      onClick={() => setActiveCodeFormat("nextApp")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeCodeFormat === "nextApp" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Next.js App Router (metadata)
                    </button>
                    <button
                      onClick={() => setActiveCodeFormat("nextPages")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeCodeFormat === "nextPages" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Next.js Pages (&lt;Head&gt;)
                    </button>
                    <button
                      onClick={() => setActiveCodeFormat("nuxt")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeCodeFormat === "nuxt" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Nuxt 3 (useSeoMeta)
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(activeCodeSnippet)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied Code!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadHtml}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface border border-border"
                      title="Download HTML"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Code Box */}
                <div className="relative rounded-xl border border-border bg-surface-secondary/40 overflow-hidden">
                  <pre className="p-4 font-mono text-xs leading-relaxed text-foreground overflow-x-auto select-all max-h-[440px]">
                    {activeCodeSnippet}
                  </pre>
                </div>
              </div>
            )}

            {/* Tab 3: SEO Health Audit */}
            {activeTab === "audit" && (
              <div className="space-y-5">
                {/* Score Summary Banner */}
                <div className="p-5 bg-surface border border-border rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Meta Tag Completeness Score
                    </span>
                    <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
                      {audit.score} / 100
                      <span className="text-xs font-normal text-muted">
                        {audit.score >= 90 ? "Excellent" : audit.score >= 70 ? "Good" : "Needs Optimization"}
                      </span>
                    </h3>
                  </div>

                  <div className="w-16 h-16 rounded-full border-4 border-accent flex items-center justify-center text-base font-bold text-accent">
                    {audit.score}%
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-3">
                  {audit.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                        issue.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-foreground"
                          : issue.type === "warning"
                          ? "bg-amber-500/10 border-amber-500/20 text-foreground"
                          : "bg-destructive/10 border-destructive/20 text-foreground"
                      }`}
                    >
                      {issue.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : issue.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block text-sm">{issue.message}</span>
                        <p className="text-muted mt-0.5">{issue.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <SEOContent tool={tool} />

      {/* Related Tools */}
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
