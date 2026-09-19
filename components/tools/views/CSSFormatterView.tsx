"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  formatCss,
  minifyCss,
  analyzeCss,
  CSS_PRESETS,
  type IndentStyle,
  type SelectorStyle,
  type PropertySort,
  type CssFormatOptions,
  type CssMinifyOptions,
  type CssAnalysisResult,
} from "@/tools/developer/cssEngine";
import {
  Palette,
  Copy,
  Check,
  Code2,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Settings2,
  Zap,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  Sliders,
  Type,
  Maximize2,
} from "lucide-react";

export interface CSSFormatterViewProps {
  tool: ToolMeta;
}

export const CSSFormatterView: React.FC<CSSFormatterViewProps> = ({ tool }) => {
  // Tabs & Modes
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [mode, setMode] = useState<"beautify" | "minify">("beautify");

  // Options
  const [indent, setIndent] = useState<IndentStyle>("2spaces");
  const [selectorStyle, setSelectorStyle] = useState<SelectorStyle>("singleline");
  const [propertySort, setPropertySort] = useState<PropertySort>("none");
  const [optimizeColors, setOptimizeColors] = useState<boolean>(true);
  const [stripZeroUnits, setStripZeroUnits] = useState<boolean>(true);

  // Preview viewport
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Input & Copy State
  const [inputCss, setInputCss] = useState<string>(CSS_PRESETS[0].css);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized Format Options
  const formatOptions: CssFormatOptions = useMemo(
    () => ({
      indent,
      selectorStyle,
      propertySort,
      preserveComments: true,
    }),
    [indent, selectorStyle, propertySort]
  );

  const minifyOptions: CssMinifyOptions = useMemo(
    () => ({
      preserveLicenseComments: true,
      optimizeColors,
      stripZeroUnits,
    }),
    [optimizeColors, stripZeroUnits]
  );

  // Process CSS
  const { outputCss, analysis } = useMemo(() => {
    if (!inputCss.trim()) {
      return {
        outputCss: "",
        analysis: analyzeCss("", ""),
      };
    }

    if (mode === "minify") {
      const minified = minifyCss(inputCss, minifyOptions);
      const ana = analyzeCss(inputCss, minified);
      return { outputCss: minified, analysis: ana };
    }

    const res = formatCss(inputCss, formatOptions);
    return { outputCss: res.formattedCss, analysis: res.analysis };
  }, [inputCss, mode, formatOptions, minifyOptions]);

  // Copy handler
  const handleCopy = useCallback((text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    if (!outputCss) return;
    const blob = new Blob([outputCss], { type: "text/css;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stylesheet-${mode}-${Date.now()}.css`;
    link.click();
    URL.revokeObjectURL(url);
  }, [outputCss, mode]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputCss(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Preset loader
  const loadPreset = (presetId: string) => {
    const found = CSS_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setInputCss(found.css);
    }
  };

  const inputLineCount = useMemo(() => inputCss.split("\n").length, [inputCss]);
  const outputLineCount = useMemo(() => (outputCss ? outputCss.split("\n").length : 0), [outputCss]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <ToolHeader tool={tool} />

      {/* Main Container Card */}
      <div className="bg-surface/80 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        {/* Navigation & Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "editor"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Palette className="w-4 h-4" />
              CSS Beautifier & Minifier
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "preview"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Eye className="w-4 h-4" />
              Live Sandbox Preview
            </button>
          </div>

          {/* Quick Presets Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted hidden sm:inline">Templates:</span>
            <select
              onChange={(e) => loadPreset(e.target.value)}
              defaultValue="glassmorphic_card"
              className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent focus:outline-none"
            >
              {CSS_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-surface-secondary/40 border border-border/60 rounded-xl text-xs">
          {/* Operation Mode */}
          <div className="space-y-1">
            <label className="text-muted font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" /> Mode
            </label>
            <div className="flex rounded-lg border border-border overflow-hidden bg-surface">
              <button
                onClick={() => setMode("beautify")}
                className={`flex-1 py-1.5 font-medium transition-colors ${
                  mode === "beautify" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                Beautify
              </button>
              <button
                onClick={() => setMode("minify")}
                className={`flex-1 py-1.5 font-medium transition-colors ${
                  mode === "minify" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                Minify
              </button>
            </div>
          </div>

          {/* Indent Width */}
          <div className="space-y-1">
            <label className="text-muted font-medium flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-emerald-400" /> Indent Width
            </label>
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value as IndentStyle)}
              disabled={mode === "minify"}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-50"
            >
              <option value="2spaces">2 Spaces</option>
              <option value="4spaces">4 Spaces</option>
              <option value="tab">Tabs (\t)</option>
            </select>
          </div>

          {/* Selector Style */}
          <div className="space-y-1">
            <label className="text-muted font-medium flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-400" /> Selector Layout
            </label>
            <select
              value={selectorStyle}
              onChange={(e) => setSelectorStyle(e.target.value as SelectorStyle)}
              disabled={mode === "minify"}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-50"
            >
              <option value="singleline">Single Line (h1, h2)</option>
              <option value="multiline">Multi Line (h1,\nh2)</option>
            </select>
          </div>

          {/* Property Sorting */}
          <div className="space-y-1">
            <label className="text-muted font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" /> Property Sort
            </label>
            <select
              value={propertySort}
              onChange={(e) => setPropertySort(e.target.value as PropertySort)}
              disabled={mode === "minify"}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-50"
            >
              <option value="none">None (Author Order)</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="concentric">Concentric (Box Model)</option>
            </select>
          </div>

          {/* Minify Optimizations Toggle */}
          <div className="space-y-1">
            <label className="text-muted font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Optimizations
            </label>
            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={optimizeColors}
                  onChange={(e) => setOptimizeColors(e.target.checked)}
                  disabled={mode === "beautify"}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                Hex (#fff)
              </label>
              <label className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={stripZeroUnits}
                  onChange={(e) => setStripZeroUnits(e.target.checked)}
                  disabled={mode === "beautify"}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                Zero (0px $\rightarrow$ 0)
              </label>
            </div>
          </div>
        </div>

        {/* Tab 1: Editor & Formatter Dual Pane */}
        {activeTab === "editor" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Pane: Input */}
              <div className="flex flex-col rounded-xl border border-border bg-surface-secondary/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-surface-secondary/80 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Input Stylesheet</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
                      {inputLineCount} lines · {analysis.stats.charCountBefore} chars
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                      title="Upload .css file"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".css,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => setInputCss("")}
                      className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Clear CSS"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 min-h-[380px]">
                  <textarea
                    value={inputCss}
                    onChange={(e) => setInputCss(e.target.value)}
                    placeholder="Paste CSS code here (rules, media queries, keyframes, custom properties)..."
                    className="w-full h-full min-h-[380px] p-4 bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted focus:outline-none resize-y"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Right Pane: Output */}
              <div className="flex flex-col rounded-xl border border-border bg-surface-secondary/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-surface-secondary/80 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {mode === "beautify" ? "Formatted CSS" : "Minified CSS"}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
                      {outputLineCount} lines · {analysis.stats.charCountAfter} chars
                    </span>
                    {analysis.stats.compressionRatio > 0 && mode === "minify" && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        -{analysis.stats.compressionRatio}% smaller
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(outputCss)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-sm"
                      title="Copy to Clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                      title="Download .css"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 min-h-[380px] bg-surface/50 overflow-auto">
                  <pre className="p-4 font-mono text-sm leading-relaxed text-pink-400/90 whitespace-pre-wrap select-all selection:bg-accent/30 selection:text-white">
                    {outputCss || (
                      <span className="text-muted italic">Formatted CSS will appear here...</span>
                    )}
                  </pre>
                </div>
              </div>
            </div>

            {/* Analysis & Diagnostics Drawer */}
            <div className="space-y-3">
              {!analysis.isValidSyntax && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-sm block">Potential Syntax Issue Detected</span>
                    {analysis.syntaxErrors.map((err, idx) => (
                      <p key={idx} className="leading-relaxed">
                        • {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Syntax Health */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  {analysis.isValidSyntax ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      Syntax
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.isValidSyntax ? "Balanced & Valid" : "Check Braces"}
                    </span>
                  </div>
                </div>

                {/* Rules Count */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      Rules
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.ruleCount} rule{analysis.ruleCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Declarations Count */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      Properties
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.declarationCount} decl{analysis.declarationCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Media Queries */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <Monitor className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      Media Queries
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.mediaQueryCount} breakpoint{analysis.mediaQueryCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Keyframes */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      Keyframes
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.keyframeCount} animation{analysis.keyframeCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* CSS Variables */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      Custom Props
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.customVariableCount} variable{analysis.customVariableCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Sandbox Preview */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            {/* Viewport Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" />
                  Live CSS Sandbox Preview
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Your custom CSS stylesheet is injected live below to preview styling across UI elements.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-surface-secondary/70 border border-border/50 p-1 rounded-xl">
                <button
                  onClick={() => setPreviewViewport("desktop")}
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    previewViewport === "desktop"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Desktop (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewViewport("tablet")}
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    previewViewport === "tablet"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  onClick={() => setPreviewViewport("mobile")}
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    previewViewport === "mobile"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Mobile (390px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>

            {/* Sandbox Container */}
            <div className="flex justify-center w-full overflow-x-auto p-4 bg-surface-secondary/20 border border-border rounded-xl">
              <div
                className={`transition-all duration-300 w-full rounded-xl border border-border/80 bg-background/95 p-6 shadow-2xl relative overflow-hidden ${
                  previewViewport === "mobile"
                    ? "max-w-[390px]"
                    : previewViewport === "tablet"
                    ? "max-w-[768px]"
                    : "max-w-full"
                }`}
              >
                {/* Injected Style Tag */}
                <style dangerouslySetInnerHTML={{ __html: outputCss || inputCss }} />

                {/* Sandbox Sample Components */}
                <div className="space-y-8">
                  {/* Glass Card Component */}
                  <div className="glass-card">
                    <h3 className="glass-card-title">Live Preview Card</h3>
                    <p className="glass-card-text">
                      This element uses the classes <code className="text-accent">.glass-card</code>,{" "}
                      <code className="text-accent">.glass-card-title</code>, and{" "}
                      <code className="text-accent">.glass-card-text</code>.
                    </p>
                    <div className="mt-4">
                      <button className="btn-glow">Interactive Button</button>
                    </div>
                  </div>

                  {/* Responsive Grid Component */}
                  <div className="grid-container">
                    <div className="grid-item">
                      <h4 className="font-bold text-sm mb-1">Feature Alpha</h4>
                      <p className="text-xs opacity-75">Targeted via .grid-container and .grid-item.</p>
                    </div>
                    <div className="grid-item">
                      <h4 className="font-bold text-sm mb-1">Feature Beta</h4>
                      <p className="text-xs opacity-75">Automatically responsive via grid columns.</p>
                    </div>
                    <div className="grid-item">
                      <h4 className="font-bold text-sm mb-1">Feature Gamma</h4>
                      <p className="text-xs opacity-75">Styled live by your custom CSS rules.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEO Content */}
      <SEOContent tool={tool} />

      {/* Related Tools */}
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
