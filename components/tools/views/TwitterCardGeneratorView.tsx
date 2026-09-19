"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  generateHtmlTwitterTags,
  generateNextJsAppRouterTwitterCode,
  generateNextJsPagesHeadTwitterCode,
  generateNuxtTwitterCode,
  auditTwitterCard,
  formatTwitterHandle,
  TWITTER_CARD_PRESETS,
  type TwitterCardConfig,
  type TwitterCardType,
  type TwitterCardAuditReport,
} from "@/tools/web/twitterCardEngine";
import {
  Twitter,
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
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Smartphone,
  Monitor,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share,
  Play,
  DownloadCloud,
  Globe,
  Sliders,
} from "lucide-react";

export interface TwitterCardGeneratorViewProps {
  tool: ToolMeta;
}

export const TwitterCardGeneratorView: React.FC<TwitterCardGeneratorViewProps> = ({ tool }) => {
  const defaultPreset = TWITTER_CARD_PRESETS[0].config;

  // Tabs
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "audit">("preview");
  const [activeCodeFormat, setActiveCodeFormat] = useState<"html" | "nextApp" | "nextPages" | "nuxt">("html");

  // Tweet Simulator Controls
  const [simulatorTheme, setSimulatorTheme] = useState<"dark" | "light">("dark");
  const [simulatorDevice, setSimulatorDevice] = useState<"desktop" | "mobile">("desktop");

  // Form Fields: Core
  const [cardType, setCardType] = useState<TwitterCardType>(defaultPreset.cardType);
  const [title, setTitle] = useState<string>(defaultPreset.title);
  const [description, setDescription] = useState<string>(defaultPreset.description || "");
  const [image, setImage] = useState<string>(defaultPreset.image || "");
  const [imageAlt, setImageAlt] = useState<string>(defaultPreset.imageAlt || "");
  const [site, setSite] = useState<string>(defaultPreset.site || "@toolverse_app");
  const [creator, setCreator] = useState<string>(defaultPreset.creator || "@alexmercer");
  const [canonicalUrl, setCanonicalUrl] = useState<string>(defaultPreset.canonicalUrl || "https://toolverse.app");
  const [includeOpenGraphFallback, setIncludeOpenGraphFallback] = useState<boolean>(true);

  // Form Fields: App Card
  const [iphoneName, setIphoneName] = useState<string>("");
  const [iphoneId, setIphoneId] = useState<string>("");
  const [iphoneUrl, setIphoneUrl] = useState<string>("");
  const [googlePlayName, setGooglePlayName] = useState<string>("");
  const [googlePlayId, setGooglePlayId] = useState<string>("");
  const [googlePlayUrl, setGooglePlayUrl] = useState<string>("");
  const [appCountry, setAppCountry] = useState<string>("US");

  // Form Fields: Player Card
  const [playerUrl, setPlayerUrl] = useState<string>("");
  const [playerWidth, setPlayerWidth] = useState<number>(1280);
  const [playerHeight, setPlayerHeight] = useState<number>(720);
  const [playerStreamUrl, setPlayerStreamUrl] = useState<string>("");

  // Copy Feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Consolidated Config
  const config: TwitterCardConfig = useMemo(() => {
    return {
      cardType,
      title,
      description,
      image,
      imageAlt,
      site,
      creator,
      canonicalUrl,
      includeOpenGraphFallback,
      app:
        cardType === "app"
          ? {
              iphoneName: iphoneName.trim() || undefined,
              iphoneId: iphoneId.trim() || undefined,
              iphoneUrl: iphoneUrl.trim() || undefined,
              googlePlayName: googlePlayName.trim() || undefined,
              googlePlayId: googlePlayId.trim() || undefined,
              googlePlayUrl: googlePlayUrl.trim() || undefined,
              country: appCountry.trim() || undefined,
            }
          : undefined,
      player:
        cardType === "player"
          ? {
              url: playerUrl.trim() || undefined,
              width: playerWidth || 1280,
              height: playerHeight || 720,
              streamUrl: playerStreamUrl.trim() || undefined,
            }
          : undefined,
    };
  }, [
    cardType,
    title,
    description,
    image,
    imageAlt,
    site,
    creator,
    canonicalUrl,
    includeOpenGraphFallback,
    iphoneName,
    iphoneId,
    iphoneUrl,
    googlePlayName,
    googlePlayId,
    googlePlayUrl,
    appCountry,
    playerUrl,
    playerWidth,
    playerHeight,
    playerStreamUrl,
  ]);

  // Generated Code
  const htmlOutput = useMemo(() => generateHtmlTwitterTags(config), [config]);
  const nextAppOutput = useMemo(() => generateNextJsAppRouterTwitterCode(config), [config]);
  const nextPagesOutput = useMemo(() => generateNextJsPagesHeadTwitterCode(config), [config]);
  const nuxtOutput = useMemo(() => generateNuxtTwitterCode(config), [config]);

  // Audit Report
  const auditReport: TwitterCardAuditReport = useMemo(() => auditTwitterCard(config), [config]);

  // Active Code String
  const activeCode = useMemo(() => {
    switch (activeCodeFormat) {
      case "html":
        return htmlOutput;
      case "nextApp":
        return nextAppOutput;
      case "nextPages":
        return nextPagesOutput;
      case "nuxt":
        return nuxtOutput;
      default:
        return htmlOutput;
    }
  }, [activeCodeFormat, htmlOutput, nextAppOutput, nextPagesOutput, nuxtOutput]);

  // Copy Code
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeCode]);

  // Download HTML
  const handleDownloadHtml = () => {
    const fullHtmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${config.title || "Document"}</title>
  ${htmlOutput
    .split("\n")
    .map((line) => (line ? `  ${line}` : ""))
    .join("\n")}
</head>
<body>
  <h1>${config.title || "Web Page"}</h1>
  <p>${config.description || ""}</p>
</body>
</html>`;

    const blob = new Blob([fullHtmlDoc], { type: "text/html;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `twitter-card-tags-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(u);
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const p = TWITTER_CARD_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setCardType(p.config.cardType);
      setTitle(p.config.title);
      setDescription(p.config.description || "");
      setImage(p.config.image || "");
      setImageAlt(p.config.imageAlt || "");
      setSite(p.config.site || "");
      setCreator(p.config.creator || "");
      setCanonicalUrl(p.config.canonicalUrl || "");
      setIncludeOpenGraphFallback(p.config.includeOpenGraphFallback ?? true);

      if (p.config.app) {
        setIphoneName(p.config.app.iphoneName || "");
        setIphoneId(p.config.app.iphoneId || "");
        setIphoneUrl(p.config.app.iphoneUrl || "");
        setGooglePlayName(p.config.app.googlePlayName || "");
        setGooglePlayId(p.config.app.googlePlayId || "");
        setGooglePlayUrl(p.config.app.googlePlayUrl || "");
        setAppCountry(p.config.app.country || "US");
      } else {
        setIphoneName("");
        setIphoneId("");
        setIphoneUrl("");
        setGooglePlayName("");
        setGooglePlayId("");
        setGooglePlayUrl("");
      }

      if (p.config.player) {
        setPlayerUrl(p.config.player.url || "");
        setPlayerWidth(p.config.player.width || 1280);
        setPlayerHeight(p.config.player.height || 720);
        setPlayerStreamUrl(p.config.player.streamUrl || "");
      } else {
        setPlayerUrl("");
        setPlayerStreamUrl("");
      }
    }
  };

  // Extract hostname
  const displayHost = useMemo(() => {
    try {
      if (canonicalUrl) {
        const u = new URL(canonicalUrl.startsWith("http") ? canonicalUrl : `https://${canonicalUrl}`);
        return u.hostname;
      }
      return "toolverse.app";
    } catch {
      return "toolverse.app";
    }
  }, [canonicalUrl]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <ToolHeader tool={tool} />

      {/* Main Card */}
      <div className="bg-surface/80 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        {/* Preset Toolbar & Score Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {TWITTER_CARD_PRESETS.map((preset) => (
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
            <span>Twitter Card Score: {auditReport.score}/100</span>
          </button>
        </div>

        {/* Studio Dual Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Controls (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6">
            {/* Card Type Selector */}
            <div className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-3">
              <label className="text-xs font-bold text-foreground block">
                Twitter Card Type (<code className="text-accent">twitter:card</code>)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setCardType("summary_large_image")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    cardType === "summary_large_image"
                      ? "bg-accent/15 border-accent text-accent shadow-sm"
                      : "bg-surface border-border text-muted hover:text-foreground"
                  }`}
                >
                  <div className="font-bold text-xs">Large Image</div>
                  <div className="text-[10px] text-muted">2:1 Banner</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType("summary")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    cardType === "summary"
                      ? "bg-accent/15 border-accent text-accent shadow-sm"
                      : "bg-surface border-border text-muted hover:text-foreground"
                  }`}
                >
                  <div className="font-bold text-xs">Summary</div>
                  <div className="text-[10px] text-muted">1:1 Square</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType("app")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    cardType === "app"
                      ? "bg-accent/15 border-accent text-accent shadow-sm"
                      : "bg-surface border-border text-muted hover:text-foreground"
                  }`}
                >
                  <div className="font-bold text-xs">Mobile App</div>
                  <div className="text-[10px] text-muted">Store Direct</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType("player")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    cardType === "player"
                      ? "bg-accent/15 border-accent text-accent shadow-sm"
                      : "bg-surface border-border text-muted hover:text-foreground"
                  }`}
                >
                  <div className="font-bold text-xs">Player</div>
                  <div className="text-[10px] text-muted">Video / Audio</div>
                </button>
              </div>
            </div>

            {/* Core Card Content */}
            <div className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
                Card Content & Text
              </h3>

              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">
                    twitter:title <span className="text-destructive">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      title.length > 70
                        ? "text-destructive"
                        : title.length >= 25 && title.length <= 60
                        ? "text-emerald-400"
                        : "text-muted"
                    }`}
                  >
                    {title.length} / 70 max
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next.js 15 Full Feature Breakdown"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">twitter:description</label>
                  <span
                    className={`text-[11px] font-mono ${
                      description.length > 200 ? "text-amber-400" : "text-muted"
                    }`}
                  >
                    {description.length} / 200 max
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the tweet content in 1 to 2 sentences..."
                  rows={3}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                />
              </div>

              {/* Image URL & Alt */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    twitter:image URL{" "}
                    {cardType === "summary_large_image" && <span className="text-destructive">*</span>}
                  </label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/social-card.jpg"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="text-[11px] text-muted">
                    {cardType === "summary_large_image"
                      ? "Recommended: 1200x600 or 1200x628 px (2:1 ratio, max 5MB)"
                      : "Recommended: 400x400 to 600x600 px (1:1 square ratio, max 5MB)"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">twitter:image:alt (Accessibility)</label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Description of the image for screen readers"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Attribution & Site Handles */}
            <div className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-accent" />
                Attribution & Destinations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">twitter:site (@handle)</label>
                  <input
                    type="text"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="@company_account"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">twitter:creator (@handle)</label>
                  <input
                    type="text"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    placeholder="@author_handle"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Canonical Destination Link</label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={includeOpenGraphFallback}
                  onChange={(e) => setIncludeOpenGraphFallback(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Include Open Graph fallbacks (<code className="text-accent">og:title, og:image</code>)</span>
              </label>
            </div>

            {/* App Card Fields (Conditional) */}
            {cardType === "app" && (
              <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl space-y-4 animate-in fade-in">
                <h3 className="text-xs font-bold text-sky-400 flex items-center gap-2">
                  <DownloadCloud className="w-3.5 h-3.5" />
                  App Store Deep Link Directives
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">iPhone App Name</label>
                    <input
                      type="text"
                      value={iphoneName}
                      onChange={(e) => setIphoneName(e.target.value)}
                      placeholder="ToolVerse iOS"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">iPhone App ID (Apple ID)</label>
                    <input
                      type="text"
                      value={iphoneId}
                      onChange={(e) => setIphoneId(e.target.value)}
                      placeholder="e.g. 149817234"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Google Play App Name</label>
                    <input
                      type="text"
                      value={googlePlayName}
                      onChange={(e) => setGooglePlayName(e.target.value)}
                      placeholder="ToolVerse Android"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Google Play Package ID</label>
                    <input
                      type="text"
                      value={googlePlayId}
                      onChange={(e) => setGooglePlayId(e.target.value)}
                      placeholder="e.g. com.toolverse.app"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Player Card Fields (Conditional) */}
            {cardType === "player" && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4 animate-in fade-in">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5" />
                  Embedded Player Directives
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Player HTTPS Embed URL <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="url"
                    value={playerUrl}
                    onChange={(e) => setPlayerUrl(e.target.value)}
                    placeholder="https://example.com/embed/video-123"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Player Width (px)</label>
                    <input
                      type="number"
                      value={playerWidth}
                      onChange={(e) => setPlayerWidth(parseInt(e.target.value) || 0)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Player Height (px)</label>
                    <input
                      type="number"
                      value={playerHeight}
                      onChange={(e) => setPlayerHeight(parseInt(e.target.value) || 0)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Raw Stream URL (.mp4 / .m3u8)</label>
                  <input
                    type="url"
                    value={playerStreamUrl}
                    onChange={(e) => setPlayerStreamUrl(e.target.value)}
                    placeholder="https://example.com/media/stream.mp4"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Previews & Exporter (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  X / Tweet Preview
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "code"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  Export Code
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
                  Card Health Audit
                </button>
              </div>

              {activeTab === "code" && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleDownloadHtml}
                    className="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-foreground transition-colors"
                    title="Download .html file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: TWEET SIMULATOR */}
            {activeTab === "preview" && (
              <div className="space-y-4">
                {/* Simulator Theme & Device Toggles */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSimulatorTheme("dark")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        simulatorTheme === "dark"
                          ? "bg-slate-800 text-white border border-slate-700 font-bold"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Dark (Dim)
                    </button>
                    <button
                      onClick={() => setSimulatorTheme("light")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        simulatorTheme === "light"
                          ? "bg-white text-black border border-slate-300 font-bold shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Light Mode
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-muted">
                    <button
                      onClick={() => setSimulatorDevice("desktop")}
                      className={`p-1.5 rounded-md ${
                        simulatorDevice === "desktop" ? "bg-surface text-foreground" : "hover:text-foreground"
                      }`}
                      title="Desktop View"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSimulatorDevice("mobile")}
                      className={`p-1.5 rounded-md ${
                        simulatorDevice === "mobile" ? "bg-surface text-foreground" : "hover:text-foreground"
                      }`}
                      title="Mobile View"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Twitter / X Tweet Container */}
                <div
                  className={`rounded-2xl border p-4 font-sans transition-colors shadow-2xl mx-auto ${
                    simulatorDevice === "mobile" ? "max-w-sm" : "max-w-lg"
                  } ${
                    simulatorTheme === "dark"
                      ? "bg-[#000000] border-slate-800 text-white"
                      : "bg-[#ffffff] border-slate-200 text-slate-900"
                  }`}
                >
                  {/* Tweet Author Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                        TV
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">ToolVerse</span>
                          <span className="text-[10px] bg-sky-500 text-white rounded-full px-1">✓</span>
                          <span
                            className={`text-xs ${
                              simulatorTheme === "dark" ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            {formatTwitterHandle(site || "@toolverse_app")} · 2m
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-0.5 ${
                            simulatorTheme === "dark" ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          Check out the latest release! Built with speed and privacy in mind. 👇
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rendered Twitter Card Embed */}
                  <div className="mt-3">
                    {/* 1. LARGE IMAGE CARD */}
                    {cardType === "summary_large_image" && (
                      <div
                        className={`rounded-2xl overflow-hidden border transition-all ${
                          simulatorTheme === "dark"
                            ? "border-slate-800 bg-[#16181c] hover:bg-[#1a1d22]"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="aspect-[2/1] w-full bg-slate-800 relative overflow-hidden flex items-center justify-center">
                          {image ? (
                            <img
                              src={image}
                              alt={imageAlt || title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="text-slate-500 text-xs flex flex-col items-center gap-1">
                              <ImageIcon className="w-6 h-6" />
                              <span>Image Required (2:1 Ratio)</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 space-y-1">
                          <div
                            className={`text-[11px] truncate font-mono ${
                              simulatorTheme === "dark" ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {displayHost}
                          </div>
                          <div className="font-bold text-xs line-clamp-2 leading-snug">
                            {title || "Untitled Card Title"}
                          </div>
                          {description && (
                            <div
                              className={`text-[11px] line-clamp-2 leading-relaxed ${
                                simulatorTheme === "dark" ? "text-slate-400" : "text-slate-600"
                              }`}
                            >
                              {description}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2. SUMMARY (SQUARE THUMBNAIL) CARD */}
                    {cardType === "summary" && (
                      <div
                        className={`rounded-2xl overflow-hidden border flex items-center ${
                          simulatorTheme === "dark"
                            ? "border-slate-800 bg-[#16181c]"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="w-32 h-32 shrink-0 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                          {image ? (
                            <img src={image} alt={imageAlt} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-500" />
                          )}
                        </div>
                        <div className="p-3 flex-1 min-w-0 space-y-1">
                          <div
                            className={`text-[10px] truncate font-mono ${
                              simulatorTheme === "dark" ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {displayHost}
                          </div>
                          <div className="font-bold text-xs line-clamp-2 leading-snug">
                            {title || "Untitled Card Title"}
                          </div>
                          <div
                            className={`text-[11px] line-clamp-2 ${
                              simulatorTheme === "dark" ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {description || "No description provided"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. APP CARD */}
                    {cardType === "app" && (
                      <div
                        className={`rounded-2xl overflow-hidden border p-3.5 flex items-center justify-between ${
                          simulatorTheme === "dark"
                            ? "border-slate-800 bg-[#16181c]"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                            {image ? (
                              <img src={image} alt={title} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              "App"
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs">{title || "Mobile App"}</div>
                            <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                              <span>★★★★★</span>
                              <span
                                className={`text-[10px] ${
                                  simulatorTheme === "dark" ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                (4.9 • Utilities)
                              </span>
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                simulatorTheme === "dark" ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              Free in App Store & Google Play
                            </div>
                          </div>
                        </div>

                        <button className="px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-slate-200 transition-colors shadow">
                          Install
                        </button>
                      </div>
                    )}

                    {/* 4. PLAYER CARD */}
                    {cardType === "player" && (
                      <div
                        className={`rounded-2xl overflow-hidden border ${
                          simulatorTheme === "dark"
                            ? "border-slate-800 bg-[#16181c]"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                          {image && (
                            <img src={image} alt={title} className="w-full h-full object-cover opacity-75" />
                          )}
                          <div className="absolute w-12 h-12 rounded-full bg-sky-500/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                            <Play className="w-5 h-5 ml-0.5 fill-white" />
                          </div>
                        </div>
                        <div className="p-3 space-y-1">
                          <div
                            className={`text-[10px] font-mono ${
                              simulatorTheme === "dark" ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {displayHost}
                          </div>
                          <div className="font-bold text-xs">{title || "Media Player Card"}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tweet Interaction Footer */}
                  <div
                    className={`flex items-center justify-between mt-4 px-2 pt-2 border-t text-xs ${
                      simulatorTheme === "dark"
                        ? "border-slate-900 text-slate-500"
                        : "border-slate-100 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 hover:text-sky-400 cursor-pointer">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>18</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-emerald-400 cursor-pointer">
                      <Repeat2 className="w-3.5 h-3.5" />
                      <span>42</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-rose-400 cursor-pointer">
                      <Heart className="w-3.5 h-3.5" />
                      <span>256</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-sky-400 cursor-pointer">
                      <Bookmark className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-sky-400 cursor-pointer">
                      <Share className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CODE EXPORTER */}
            {activeTab === "code" && (
              <div className="space-y-3">
                {/* Format Switcher */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveCodeFormat("html")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeCodeFormat === "html"
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    HTML &lt;meta&gt;
                  </button>
                  <button
                    onClick={() => setActiveCodeFormat("nextApp")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeCodeFormat === "nextApp"
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Next.js App Router
                  </button>
                  <button
                    onClick={() => setActiveCodeFormat("nextPages")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeCodeFormat === "nextPages"
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Next.js &lt;Head&gt;
                  </button>
                  <button
                    onClick={() => setActiveCodeFormat("nuxt")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeCodeFormat === "nuxt"
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Nuxt 3 useSeoMeta
                  </button>
                </div>

                {/* Preformatted Code Block */}
                <div className="relative">
                  <pre className="p-4 bg-surface border border-border rounded-xl font-mono text-xs text-foreground overflow-x-auto max-h-[420px] select-all leading-relaxed">
                    <code>{activeCode}</code>
                  </pre>
                </div>

                <div className="text-[11px] text-muted flex items-center justify-between">
                  <span>Standard Twitter Cards Specification (developer.x.com)</span>
                  <span>Lines: {activeCode.split("\n").length}</span>
                </div>
              </div>
            )}

            {/* TAB 3: AUDIT CHECKLIST */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                {/* Score Banner */}
                <div className="p-4 bg-surface-secondary/40 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">X / Twitter Card Health</h4>
                    <p className="text-[11px] text-muted">
                      Evaluates robot crawler compliance, character lengths, and asset resolutions.
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

                {/* Length Overview */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted">Title Length</span>
                    <div className="font-bold text-foreground flex items-center justify-between">
                      <span>{auditReport.titleLength} / 70 characters</span>
                      {auditReport.isTitleOptimal ? (
                        <span className="text-emerald-400 text-[10px]">Optimal</span>
                      ) : (
                        <span className="text-amber-400 text-[10px]">Review</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted">Description Length</span>
                    <div className="font-bold text-foreground flex items-center justify-between">
                      <span>{auditReport.descriptionLength} / 200 characters</span>
                      {auditReport.isDescriptionOptimal ? (
                        <span className="text-emerald-400 text-[10px]">Optimal</span>
                      ) : (
                        <span className="text-amber-400 text-[10px]">Review</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Checklist & Recommendations ({auditReport.issues.length})
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
                          <span>
                            <code className="font-mono">{issue.property}</code>: {issue.message}
                          </span>
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
