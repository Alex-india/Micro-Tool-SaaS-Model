"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  generateHtmlOgTags,
  generateNextJsAppRouterOgCode,
  generateNextJsPagesHeadOgCode,
  generateNuxtOgCode,
  auditOpenGraph,
  OPEN_GRAPH_PRESETS,
  type OpenGraphConfig,
  type OpenGraphType,
  type OgAuditReport,
} from "@/tools/web/openGraphEngine";
import {
  Share2,
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
  Globe,
  MessageSquare,
  Hash,
  User,
  BookOpen,
} from "lucide-react";

export interface OpenGraphGeneratorViewProps {
  tool: ToolMeta;
}

export const OpenGraphGeneratorView: React.FC<OpenGraphGeneratorViewProps> = ({ tool }) => {
  const defaultPreset = OPEN_GRAPH_PRESETS[0].config;

  // View state
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "audit">("preview");
  const [activeCodeFormat, setActiveCodeFormat] = useState<"html" | "nextApp" | "nextPages" | "nuxt">("html");
  const [previewPlatform, setPreviewPlatform] = useState<"facebook" | "linkedin" | "whatsapp" | "discord" | "slack">("facebook");

  // Form Fields: Core
  const [title, setTitle] = useState<string>(defaultPreset.title);
  const [ogType, setOgType] = useState<OpenGraphType>(defaultPreset.type);
  const [url, setUrl] = useState<string>(defaultPreset.url);
  const [description, setDescription] = useState<string>(defaultPreset.description || "");
  const [siteName, setSiteName] = useState<string>(defaultPreset.siteName || "");
  const [locale, setLocale] = useState<string>(defaultPreset.locale || "en_US");
  const [fbAppId, setFbAppId] = useState<string>("");

  // Form Fields: Image
  const [imageUrl, setImageUrl] = useState<string>(defaultPreset.image?.url || "");
  const [imageAlt, setImageAlt] = useState<string>(defaultPreset.image?.alt || "");
  const [imageWidth, setImageWidth] = useState<number>(defaultPreset.image?.width || 1200);
  const [imageHeight, setImageHeight] = useState<number>(defaultPreset.image?.height || 630);
  const [imageType, setImageType] = useState<string>(defaultPreset.image?.type || "image/jpeg");

  // Form Fields: Article Extension
  const [articleAuthor, setArticleAuthor] = useState<string>("");
  const [articlePublishedTime, setArticlePublishedTime] = useState<string>("");
  const [articleModifiedTime, setArticleModifiedTime] = useState<string>("");
  const [articleSection, setArticleSection] = useState<string>("");
  const [articleTags, setArticleTags] = useState<string>("");

  // Form Fields: Profile Extension
  const [profileFirstName, setProfileFirstName] = useState<string>("");
  const [profileLastName, setProfileLastName] = useState<string>("");
  const [profileUsername, setProfileUsername] = useState<string>("");
  const [profileGender, setProfileGender] = useState<"male" | "female" | "">("");

  // Twitter Fallback
  const [includeTwitterCard, setIncludeTwitterCard] = useState<boolean>(true);
  const [twitterCardType, setTwitterCardType] = useState<"summary_large_image" | "summary">("summary_large_image");
  const [twitterSite, setTwitterSite] = useState<string>("@toolverse_app");

  // Copy State
  const [copied, setCopied] = useState<boolean>(false);

  // Consolidated Config
  const config: OpenGraphConfig = useMemo(() => {
    return {
      title,
      type: ogType,
      url,
      description,
      siteName,
      locale,
      fbAppId: fbAppId.trim() || undefined,
      image: {
        url: imageUrl,
        width: imageWidth || 1200,
        height: imageHeight || 630,
        alt: imageAlt,
        type: imageType,
      },
      article:
        ogType === "article"
          ? {
              author: articleAuthor.trim() || undefined,
              publishedTime: articlePublishedTime || undefined,
              modifiedTime: articleModifiedTime || undefined,
              section: articleSection.trim() || undefined,
              tags: articleTags
                ? articleTags.split(",").map((t) => t.trim()).filter(Boolean)
                : undefined,
            }
          : undefined,
      profile:
        ogType === "profile"
          ? {
              firstName: profileFirstName.trim() || undefined,
              lastName: profileLastName.trim() || undefined,
              username: profileUsername.trim() || undefined,
              gender: (profileGender as "male" | "female") || undefined,
            }
          : undefined,
      includeTwitterCard,
      twitterCardType,
      twitterSite: twitterSite.trim() || undefined,
    };
  }, [
    title,
    ogType,
    url,
    description,
    siteName,
    locale,
    fbAppId,
    imageUrl,
    imageWidth,
    imageHeight,
    imageAlt,
    imageType,
    articleAuthor,
    articlePublishedTime,
    articleModifiedTime,
    articleSection,
    articleTags,
    profileFirstName,
    profileLastName,
    profileUsername,
    profileGender,
    includeTwitterCard,
    twitterCardType,
    twitterSite,
  ]);

  // Generated Outputs
  const htmlOutput = useMemo(() => generateHtmlOgTags(config), [config]);
  const nextAppOutput = useMemo(() => generateNextJsAppRouterOgCode(config), [config]);
  const nextPagesOutput = useMemo(() => generateNextJsPagesHeadOgCode(config), [config]);
  const nuxtOutput = useMemo(() => generateNuxtOgCode(config), [config]);

  // Audit Report
  const auditReport: OgAuditReport = useMemo(() => auditOpenGraph(config), [config]);

  // Active Code Output
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

  // Copy handler
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeCode]);

  // Download HTML
  const handleDownloadHtml = () => {
    const fullHtmlDoc = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
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
    a.download = `open-graph-tags-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(u);
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const p = OPEN_GRAPH_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setTitle(p.config.title);
      setOgType(p.config.type);
      setUrl(p.config.url);
      setDescription(p.config.description || "");
      setSiteName(p.config.siteName || "");
      setLocale(p.config.locale || "en_US");
      setImageUrl(p.config.image?.url || "");
      setImageAlt(p.config.image?.alt || "");
      setImageWidth(p.config.image?.width || 1200);
      setImageHeight(p.config.image?.height || 630);
      setImageType(p.config.image?.type || "image/jpeg");

      if (p.config.article) {
        setArticleAuthor(p.config.article.author || "");
        setArticlePublishedTime(p.config.article.publishedTime || "");
        setArticleModifiedTime(p.config.article.modifiedTime || "");
        setArticleSection(p.config.article.section || "");
        setArticleTags((p.config.article.tags || []).join(", "));
      } else {
        setArticleAuthor("");
        setArticlePublishedTime("");
        setArticleModifiedTime("");
        setArticleSection("");
        setArticleTags("");
      }

      if (p.config.profile) {
        setProfileFirstName(p.config.profile.firstName || "");
        setProfileLastName(p.config.profile.lastName || "");
        setProfileUsername(p.config.profile.username || "");
        setProfileGender(p.config.profile.gender || "");
      } else {
        setProfileFirstName("");
        setProfileLastName("");
        setProfileUsername("");
        setProfileGender("");
      }
    }
  };

  // Extract hostname for preview
  const displayHost = useMemo(() => {
    try {
      if (url) {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname;
      }
      return "toolverse.app";
    } catch {
      return "toolverse.app";
    }
  }, [url]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <ToolHeader tool={tool} />

      {/* Main Studio Card */}
      <div className="bg-surface/80 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        {/* Preset Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              Templates:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {OPEN_GRAPH_PRESETS.map((preset) => (
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

          {/* Health Score Pill */}
          <div className="flex items-center gap-2">
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
              <span>OG Score: {auditReport.score}/100</span>
            </button>
          </div>
        </div>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6">
            {/* Core Open Graph Properties */}
            <div className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-accent" />
                Core Open Graph Metadata
              </h3>

              {/* Title Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">
                    og:title <span className="text-destructive">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      title.length > 88
                        ? "text-destructive"
                        : title.length >= 30 && title.length <= 65
                        ? "text-emerald-400"
                        : "text-muted"
                    }`}
                  >
                    {title.length} / 65 optimal
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ToolVerse - 100+ Free Online Developer Tools"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* URL & Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    og:url <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/page"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    og:type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={ogType}
                    onChange={(e) => setOgType(e.target.value as OpenGraphType)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="website">website (Standard Page)</option>
                    <option value="article">article (Blog / News)</option>
                    <option value="product">product (E-Commerce)</option>
                    <option value="profile">profile (Author / Bio)</option>
                    <option value="book">book</option>
                    <option value="video.other">video.other</option>
                  </select>
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">og:description</label>
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
                  placeholder="One to two sentences summarizing the webpage for Facebook, WhatsApp, and LinkedIn feeds..."
                  rows={3}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                />
              </div>

              {/* Site Name & Locale */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">og:site_name</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. ToolVerse"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">og:locale</label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="en_US">en_US (English - United States)</option>
                    <option value="en_GB">en_GB (English - United Kingdom)</option>
                    <option value="es_ES">es_ES (Spanish - Spain)</option>
                    <option value="fr_FR">fr_FR (French - France)</option>
                    <option value="de_DE">de_DE (German - Germany)</option>
                    <option value="ja_JP">ja_JP (Japanese - Japan)</option>
                    <option value="pt_BR">pt_BR (Portuguese - Brazil)</option>
                    <option value="hi_IN">hi_IN (Hindi - India)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Open Graph Image Configuration */}
            <div className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-accent" />
                  og:image Properties (1200x630 Banner)
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-surface border border-border text-emerald-400 font-mono">
                  1.91:1 Ratio
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  og:image URL <span className="text-destructive">*</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/banner-1200x630.jpg"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">og:image:width</label>
                  <input
                    type="number"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(parseInt(e.target.value) || 0)}
                    placeholder="1200"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">og:image:height</label>
                  <input
                    type="number"
                    value={imageHeight}
                    onChange={(e) => setImageHeight(parseInt(e.target.value) || 0)}
                    placeholder="630"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">og:image:type</label>
                  <select
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="image/jpeg">image/jpeg</option>
                    <option value="image/png">image/png</option>
                    <option value="image/webp">image/webp</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  og:image:alt (Accessibility Description)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Descriptive text for visually impaired users and screen readers"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* Article Extensions (Conditional) */}
            {ogType === "article" && (
              <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-4 animate-in fade-in">
                <h3 className="text-xs font-bold text-purple-400 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Article Protocol Extensions (<code className="text-purple-300">article:*</code>)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">article:author</label>
                    <input
                      type="text"
                      value={articleAuthor}
                      onChange={(e) => setArticleAuthor(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">article:section</label>
                    <input
                      type="text"
                      value={articleSection}
                      onChange={(e) => setArticleSection(e.target.value)}
                      placeholder="e.g. Engineering & Software"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">article:published_time</label>
                    <input
                      type="text"
                      value={articlePublishedTime}
                      onChange={(e) => setArticlePublishedTime(e.target.value)}
                      placeholder="e.g. 2025-04-10T08:00:00Z"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">article:modified_time</label>
                    <input
                      type="text"
                      value={articleModifiedTime}
                      onChange={(e) => setArticleModifiedTime(e.target.value)}
                      placeholder="e.g. 2025-04-12T14:30:00Z"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">article:tag (comma-separated)</label>
                  <input
                    type="text"
                    value={articleTags}
                    onChange={(e) => setArticleTags(e.target.value)}
                    placeholder="TypeScript, Performance, Next.js"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              </div>
            )}

            {/* Profile Extensions (Conditional) */}
            {ogType === "profile" && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-4 animate-in fade-in">
                <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Profile Protocol Extensions (<code className="text-blue-300">profile:*</code>)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">profile:first_name</label>
                    <input
                      type="text"
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      placeholder="Elena"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">profile:last_name</label>
                    <input
                      type="text"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      placeholder="Rostova"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">profile:username</label>
                    <input
                      type="text"
                      value={profileUsername}
                      onChange={(e) => setProfileUsername(e.target.value)}
                      placeholder="erostova"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">profile:gender</label>
                    <select
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value as any)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="">Unspecified</option>
                      <option value="male">male</option>
                      <option value="female">female</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced & Twitter Fallback */}
            <div className="p-4 bg-surface-secondary/30 border border-border rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-accent" />
                Social Fallbacks & App ID
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">fb:app_id (Optional)</label>
                  <input
                    type="text"
                    value={fbAppId}
                    onChange={(e) => setFbAppId(e.target.value)}
                    placeholder="e.g. 123456789012345"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">twitter:site handle</label>
                  <input
                    type="text"
                    value={twitterSite}
                    onChange={(e) => setTwitterSite(e.target.value)}
                    placeholder="@toolverse_app"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={includeTwitterCard}
                  onChange={(e) => setIncludeTwitterCard(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Include Twitter Card fallback tags (<code className="text-accent">twitter:card</code>)</span>
              </label>
            </div>
          </div>

          {/* Right Column: Previews & Code Exporter (5 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            {/* View Switcher Tabs */}
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
                  Live Preview
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
                  Health Audit
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

            {/* TAB 1: LIVE SOCIAL PREVIEWS */}
            {activeTab === "preview" && (
              <div className="space-y-4">
                {/* Platform Selector */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setPreviewPlatform("facebook")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewPlatform === "facebook"
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Facebook Feed
                  </button>
                  <button
                    onClick={() => setPreviewPlatform("linkedin")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewPlatform === "linkedin"
                        ? "bg-blue-700 text-white font-bold shadow-sm"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    LinkedIn Post
                  </button>
                  <button
                    onClick={() => setPreviewPlatform("whatsapp")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewPlatform === "whatsapp"
                        ? "bg-emerald-600 text-white font-bold shadow-sm"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    WhatsApp Chat
                  </button>
                  <button
                    onClick={() => setPreviewPlatform("discord")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewPlatform === "discord"
                        ? "bg-indigo-600 text-white font-bold shadow-sm"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Discord Embed
                  </button>
                  <button
                    onClick={() => setPreviewPlatform("slack")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewPlatform === "slack"
                        ? "bg-amber-600 text-white font-bold shadow-sm"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Slack Unfurl
                  </button>
                </div>

                {/* 1. FACEBOOK CARD SIMULATION */}
                {previewPlatform === "facebook" && (
                  <div className="bg-[#18191a] border border-slate-700 rounded-xl overflow-hidden shadow-2xl text-slate-100 font-sans max-w-lg mx-auto">
                    {/* FB Header */}
                    <div className="p-3 flex items-center gap-2 border-b border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        FB
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{siteName || "Page Name"}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          Just now • <Globe className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>

                    {/* FB Image Banner */}
                    <div className="aspect-[1.91/1] w-full bg-slate-800 overflow-hidden relative flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={imageAlt || title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-slate-500 text-xs flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6" />
                          <span>No Image Specified</span>
                        </div>
                      )}
                    </div>

                    {/* FB Content Box */}
                    <div className="p-3 bg-[#242526] space-y-1">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                        {displayHost}
                      </div>
                      <div className="font-bold text-sm text-slate-100 line-clamp-2 leading-snug">
                        {title || "Untitled Page"}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {description || "No description provided for link preview."}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LINKEDIN CARD SIMULATION */}
                {previewPlatform === "linkedin" && (
                  <div className="bg-[#1b1f23] border border-slate-700 rounded-xl overflow-hidden shadow-2xl text-slate-100 font-sans max-w-lg mx-auto">
                    {/* Image */}
                    <div className="aspect-[1.91/1] w-full bg-slate-800 overflow-hidden relative flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={imageAlt || title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-500 text-xs flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6" />
                          <span>Image Required</span>
                        </div>
                      )}
                    </div>

                    {/* LinkedIn Footer */}
                    <div className="p-3 bg-[#283038] space-y-1">
                      <div className="font-semibold text-xs text-slate-100 line-clamp-2 leading-snug">
                        {title || "Untitled Page"}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {displayHost}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. WHATSAPP CHAT BUBBLE SIMULATION */}
                {previewPlatform === "whatsapp" && (
                  <div className="bg-[#0b141a] p-4 rounded-xl max-w-md mx-auto">
                    <div className="bg-[#005c4b] text-slate-100 p-2.5 rounded-2xl rounded-tr-none shadow-md space-y-2">
                      <div className="rounded-xl overflow-hidden bg-[#025144] border border-[#026c5b]">
                        <div className="aspect-[1.91/1] w-full bg-slate-900 overflow-hidden">
                          {imageUrl && (
                            <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2.5 space-y-1">
                          <div className="text-[11px] text-emerald-200 uppercase font-mono">{displayHost}</div>
                          <div className="font-bold text-xs line-clamp-1">{title || "Untitled"}</div>
                          <div className="text-[11px] text-slate-200 line-clamp-2">{description}</div>
                        </div>
                      </div>
                      <div className="text-xs text-emerald-100 break-all underline">{url || `https://${displayHost}`}</div>
                    </div>
                  </div>
                )}

                {/* 4. DISCORD EMBED SIMULATION */}
                {previewPlatform === "discord" && (
                  <div className="bg-[#313338] p-4 rounded-xl text-slate-100 font-sans max-w-lg mx-auto">
                    <div className="text-xs text-slate-400 mb-1 underline">{url}</div>
                    <div className="border-l-4 border-[#5865f2] bg-[#2b2d31] p-3.5 rounded-r-lg space-y-2">
                      <div className="text-[11px] text-slate-400">{siteName || "ToolVerse"}</div>
                      <div className="text-sm font-bold text-[#00a8fc] hover:underline cursor-pointer">
                        {title || "Untitled Link"}
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">{description}</div>
                      {imageUrl && (
                        <div className="aspect-[1.91/1] w-full rounded-lg overflow-hidden mt-2">
                          <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. SLACK UNFURL SIMULATION */}
                {previewPlatform === "slack" && (
                  <div className="bg-[#1a1d21] p-4 rounded-xl text-slate-100 font-sans max-w-lg mx-auto space-y-2">
                    <div className="text-xs text-sky-400 underline">{url}</div>
                    <div className="border-l-4 border-slate-600 pl-3 space-y-1.5">
                      <div className="text-xs font-bold text-slate-300">{siteName || "ToolVerse"}</div>
                      <div className="text-sm font-bold text-sky-400 hover:underline">{title}</div>
                      <div className="text-xs text-slate-400">{description}</div>
                      {imageUrl && (
                        <div className="w-48 aspect-[1.91/1] rounded-lg overflow-hidden border border-slate-700 mt-2">
                          <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* External Debugger Shortcuts */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-border/50">
                  <span className="text-muted">Test live URL in official debuggers:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-surface border border-border text-foreground hover:border-accent/40 flex items-center gap-1 transition-colors"
                    >
                      <span>Facebook Debugger</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(url || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-surface border border-border text-foreground hover:border-accent/40 flex items-center gap-1 transition-colors"
                    >
                      <span>LinkedIn Inspector</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CODE EXPORTER */}
            {activeTab === "code" && (
              <div className="space-y-3">
                {/* Code Format Switcher */}
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

                {/* Code Output Textarea */}
                <div className="relative">
                  <pre className="p-4 bg-surface border border-border rounded-xl font-mono text-xs text-foreground overflow-x-auto max-h-[420px] select-all leading-relaxed">
                    <code>{activeCode}</code>
                  </pre>
                </div>

                <div className="text-[11px] text-muted flex items-center justify-between">
                  <span>Standard OGP Specification 1.0 (https://ogp.me)</span>
                  <span>Lines: {activeCode.split("\n").length}</span>
                </div>
              </div>
            )}

            {/* TAB 3: HEALTH AUDIT */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                {/* Score Banner */}
                <div className="p-4 bg-surface-secondary/40 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Open Graph Optimization Score</h4>
                    <p className="text-[11px] text-muted">
                      Evaluates Facebook, LinkedIn, Discord, and Slack preview readiness.
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

                {/* Image Specs Check */}
                <div className="p-3.5 bg-surface border border-border rounded-xl space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Image Resolution & Ratio:</span>
                    <span className="font-mono text-accent">{auditReport.imageAspectRatio}</span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Facebook & LinkedIn enforce a standard 1.91:1 ratio. 1200x630 px guarantees crisp rendering across all mobile and high-DPI retina displays.
                  </p>
                </div>

                {/* Audit Checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">Audit Checklist ({auditReport.issues.length})</h4>
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
