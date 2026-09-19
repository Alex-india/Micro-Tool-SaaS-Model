"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  encodeHTMLEntities,
  decodeHTMLEntities,
  detectXSSVectors,
  formatHTMLMarkup,
  stripHTMLTags,
  HTML_ENTITY_CATALOG,
  type HTMLEntityFormat,
  type HTMLEscapeScope,
  type HTMLEntityReference,
} from "@/tools/developer/htmlEntityEngine";
import {
  Code2,
  Code,
  ArrowRightLeft,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  HelpCircle,
  Search,
  Eye,
  FileText,
  Lock,
  Plus,
  Wand2,
  RotateCcw,
} from "lucide-react";

export interface HTMLEntityViewProps {
  tool: ToolMeta;
}

const ENCODER_PRESETS = {
  xssVector: {
    label: "XSS Attack Vector",
    text: "<script>alert('XSS')</script><img src=\"x\" onerror=\"stealCookies()\">",
  },
  htmlSnippet: {
    label: "HTML5 Elements & Attrs",
    text: "<div class=\"user-card\" id=\"profile-42\" data-role=\"admin\">\n  <h2 style=\"color: #6C63FF;\">Alex & Friends</h2>\n  <p>Status: Active & Verified</p>\n</div>",
  },
  typographyCurrency: {
    label: "Typography & Currency",
    text: "Price: €49.99 • Special Offer: 20% off! Copyright © 2024 Acme Corp. All rights reserved — \"Guaranteed quality\" & 'Fast delivery'.",
  },
  accentsLatin: {
    label: "Accents & Latin",
    text: "Café de Flore à Paris: \"Crème brûlée\", naïve garçon, español señor & señorita. Düsseldorf, München, København.",
  },
  mathGreek: {
    label: "Math & Greek",
    text: "E = mc² • Δx × Δp ≥ ℏ/2 • π ≈ 3.14159 • α, β, γ, θ, λ, ω • ∑(x_i) = 100 • A ∩ B ⊆ C",
  },
};

const DECODER_PRESETS = {
  doubleEncoded: {
    label: "Double-Encoded Entities",
    text: "&amp;lt;div class=&amp;quot;user-card&amp;quot;&amp;gt;\n  &amp;lt;h2&amp;gt;Alex &amp;amp;amp; Friends&amp;lt;/h2&amp;gt;\n  &amp;lt;p&amp;gt;Price: &amp;amp;euro;49.99 &amp;amp;bull; &amp;amp;copy; 2024&amp;lt;/p&amp;gt;\n&amp;lt;/div&amp;gt;",
  },
  encodedXss: {
    label: "Encoded XSS Vector",
    text: "&lt;script&gt;alert(&apos;XSS&apos;)&lt;/script&gt;&lt;img src=&quot;x&quot; onerror=&quot;stealCookies()&quot;&gt;",
  },
  dirtyEmailNbsp: {
    label: "Email Markup with &nbsp;",
    text: "&lt;p&gt;Invoice&amp;nbsp;#9482&amp;nbsp;&amp;mdash;&amp;nbsp;Amount:&amp;nbsp;&amp;euro;149.99&amp;nbsp;&amp;bull;&amp;nbsp;Status:&amp;nbsp;Paid&lt;/p&gt;",
  },
  encodedHtml: {
    label: "Encoded HTML5 Markup",
    text: "&lt;article class=&quot;post&quot; id=&quot;art-1&quot;&gt;\n  &lt;h2&gt;Web Standards &amp;amp; Best Practices&lt;/h2&gt;\n  &lt;p&gt;Published by &copy; Jane Doe &mdash; All Rights Reserved.&lt;/p&gt;\n&lt;/article&gt;",
  },
  decimalEntities: {
    label: "Decimal Numeric Markup",
    text: "&#60;h1&#62;Hello &#38; Welcome &#169; 2024&#60;/h1&#62;\n&#60;p&#62;Price: &#8364;99.00 &#8212; &#34;Limited Stock&#34;&#60;/p&#62;",
  },
  hexEntities: {
    label: "Hexadecimal Markup",
    text: "&#x3C;div&#x3E;\n  &#x3C;span&#x3E;Copyright &#xA9; Acme&#x3C;/span&#x3E;\n  &#x3C;span&#x3E;Price: &#x20AC;50&#x3C;/span&#x3E;\n&#x3C;/div&#x3E;",
  },
  emojisAndUnicode: {
    label: "Unicode Surrogate / Emojis",
    text: "Hello World &#x1F600; &amp; &#128514; &copy; 2024 &#x1F680;",
  },
};

export const HTMLEntityView: React.FC<HTMLEntityViewProps> = ({ tool }) => {
  const isDecoderSlug = tool.slug === "html-decoder";
  const [mode, setMode] = useState<"encode" | "decode">(isDecoderSlug ? "decode" : "encode");

  // Encoding Options
  const [format, setFormat] = useState<HTMLEntityFormat>("named");
  const [scope, setScope] = useState<HTMLEscapeScope>("special");
  const [encodeQuotes, setEncodeQuotes] = useState<boolean>(true);

  // Decoder Specific Options
  const [recursiveDecode, setRecursiveDecode] = useState<boolean>(false);
  const [convertNbspToSpace, setConvertNbspToSpace] = useState<boolean>(true);
  const [stripTags, setStripTags] = useState<boolean>(false);

  // Input & View Tabs
  const [inputText, setInputText] = useState<string>(
    isDecoderSlug ? DECODER_PRESETS.doubleEncoded.text : ENCODER_PRESETS.xssVector.text
  );
  const [activeTab, setActiveTab] = useState<"raw" | "preview">("raw");

  // Cheatsheet Catalog States
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [catalogCategory, setCatalogCategory] = useState<string>("all");

  // Copy feedback state
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

  // Compute conversion result
  const result = useMemo(() => {
    if (mode === "encode") {
      const res = encodeHTMLEntities(inputText, { format, scope, encodeQuotes });
      return {
        isEncode: true,
        output: res.output,
        charCount: res.charCount,
        byteCount: res.byteCount,
        entityCount: res.entitiesGenerated,
        namedCount: 0,
        decimalCount: 0,
        hexCount: 0,
        roundsDecoded: 0,
        isMultiRound: false,
        xssNeutralized: res.xssNeutralized,
        detectedXssVectors: res.detectedXssVectors,
      };
    } else {
      const res = decodeHTMLEntities(inputText, {
        recursive: recursiveDecode,
        stripTags,
        convertNbspToSpace,
      });
      return {
        isEncode: false,
        output: res.output,
        charCount: res.charCount,
        byteCount: res.byteCount,
        entityCount: res.entitiesDecoded,
        namedCount: res.namedCount,
        decimalCount: res.decimalCount,
        hexCount: res.hexCount,
        roundsDecoded: res.roundsDecoded,
        isMultiRound: res.isMultiRound,
        xssNeutralized: false,
        detectedXssVectors: res.detectedXssVectors,
      };
    }
  }, [
    inputText,
    mode,
    format,
    scope,
    encodeQuotes,
    recursiveDecode,
    stripTags,
    convertNbspToSpace,
  ]);

  // Swap input and output
  const handleSwap = () => {
    if (result.output) {
      setInputText(result.output);
      setMode(mode === "encode" ? "decode" : "encode");
    }
  };

  // Beautify / Indent Decoded HTML
  const handleBeautifyHTML = () => {
    if (!result.output) return;
    const formatted = formatHTMLMarkup(result.output);
    setInputText(formatted);
    triggerCopy(formatted, "beautify-copy", "Formatted HTML and updated editor!");
  };

  // Download Output
  const handleDownload = () => {
    if (!result.output) return;
    const blob = new Blob([result.output], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "encode" ? "encoded-entities.html" : "decoded-markup.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered Cheatsheet Catalog
  const filteredCatalog = useMemo(() => {
    return HTML_ENTITY_CATALOG.filter((item) => {
      const matchesCategory = catalogCategory === "all" || item.category === catalogCategory;
      if (!matchesCategory) return false;
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase();
      return (
        item.char.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.dec.toLowerCase().includes(q) ||
        item.hex.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      );
    });
  }, [catalogSearch, catalogCategory]);

  const activePresets = mode === "decode" ? DECODER_PRESETS : ENCODER_PRESETS;

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

      {/* Suite Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border">
          <Link
            href="/developer/html-encoder"
            onClick={() => {
              setMode("encode");
              if (!inputText.includes("&") && inputText.trim()) {
                // Keep input
              } else {
                setInputText(ENCODER_PRESETS.xssVector.text);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === "encode"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            HTML Entity Encoder
          </Link>
          <Link
            href="/developer/html-decoder"
            onClick={() => {
              setMode("decode");
              if (inputText.includes("&")) {
                // Keep encoded input
              } else {
                setInputText(DECODER_PRESETS.doubleEncoded.text);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === "decode"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            HTML Entity Decoder
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>HTML5 Standard &bull; Multi-Round Decoding &bull; 100% Client-Side Private</span>
        </div>
      </div>

      {/* Configuration & Options Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-card flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span className="font-bold text-text-primary uppercase tracking-wider">
              {mode === "encode" ? "Encoding Format & Escape Scope" : "Decoding Controls & Options"}
            </span>
            {mode === "decode" && result.isMultiRound && (
              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                Decoded {result.roundsDecoded} Rounds
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === "decode" && !stripTags && (
              <button
                onClick={handleBeautifyHTML}
                className="px-2.5 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary flex items-center gap-1.5 transition-colors shadow-sm"
                title="Format & indent HTML markup"
              >
                <Wand2 className="w-3.5 h-3.5 text-accent" />
                <span>Beautify HTML</span>
              </button>
            )}
            <button
              onClick={handleSwap}
              className="px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
              <span>Swap & {mode === "encode" ? "Decode" : "Encode"}</span>
            </button>
          </div>
        </div>

        {mode === "encode" ? (
          <div className="flex flex-col gap-3">
            {/* Format Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                {
                  id: "named",
                  label: "Named Entities (&lt;, &gt;, &copy;)",
                  desc: "Standard HTML5 human-readable entity names with numeric fallback",
                },
                {
                  id: "decimal",
                  label: "Decimal Numeric (&#60;, &#169;)",
                  desc: "Base-10 character code point representation",
                },
                {
                  id: "hex",
                  label: "Hexadecimal (&#x3C;, &#xA9;)",
                  desc: "Base-16 hexadecimal character code point representation",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id as HTMLEntityFormat)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    format === opt.id
                      ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                      : "bg-surface-raised/60 border-border hover:border-border-hover text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-primary">{opt.label}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        format === opt.id ? "border-accent bg-accent text-white" : "border-border"
                      }`}
                    >
                      {format === opt.id && <Check className="w-2 h-2" />}
                    </div>
                  </div>
                  <span className="text-[11px] text-text-muted leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Scope & Quotes Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-text-muted font-medium">Escape Scope:</span>
                <div className="flex items-center gap-1.5 bg-surface-raised p-1 rounded-lg border border-border">
                  {[
                    { id: "special", label: "Special (< > & \" ')" },
                    { id: "extended", label: "Special + Non-ASCII" },
                    { id: "all", label: "All Characters" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setScope(s.id as HTMLEscapeScope)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        scope === s.id
                          ? "bg-accent text-white shadow-xs"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={encodeQuotes}
                  onChange={(e) => setEncodeQuotes(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                />
                <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                  Encode Quotes (<code className="text-accent">&quot;</code> and{" "}
                  <code className="text-accent">&apos;</code>)
                </span>
              </label>
            </div>
          </div>
        ) : (
          /* Decoder Options Bar */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-raised/70 border border-border cursor-pointer hover:border-accent/40 transition-colors">
              <input
                type="checkbox"
                checked={recursiveDecode}
                onChange={(e) => setRecursiveDecode(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-text-primary">
                  Recursive / Deep Decode
                </span>
                <span className="text-[11px] text-text-muted">
                  Peels off multiple layers of double or triple encoded entities (&amp;amp;lt;)
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-raised/70 border border-border cursor-pointer hover:border-accent/40 transition-colors">
              <input
                type="checkbox"
                checked={convertNbspToSpace}
                onChange={(e) => setConvertNbspToSpace(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-text-primary">
                  Convert &amp;nbsp; to Space
                </span>
                <span className="text-[11px] text-text-muted">
                  Replaces invisible non-breaking spaces (\u00A0) with standard spaces
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-raised/70 border border-border cursor-pointer hover:border-accent/40 transition-colors">
              <input
                type="checkbox"
                checked={stripTags}
                onChange={(e) => setStripTags(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-text-primary">
                  Strip HTML Markup Tags
                </span>
                <span className="text-[11px] text-text-muted">
                  Removes all &lt;tags&gt; leaving clean plain text
                </span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Security Analysis Banner */}
      {result.detectedXssVectors.length > 0 && (
        <div
          className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
            mode === "encode"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {mode === "encode" ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <strong>
                {mode === "encode"
                  ? "XSS Attack Vectors Detected in Input → Successfully Neutralized in Output!"
                  : "Security Alert: Decoded markup contains executable HTML tags or event handlers!"}
              </strong>
              <div className="text-[11px] opacity-80 mt-0.5">
                Matched patterns: {result.detectedXssVectors.join(", ")}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-surface/60 font-mono text-[10px] font-bold uppercase tracking-wider">
            {mode === "encode" ? "Safe For Rendering" : "Exercise Caution"}
          </span>
        </div>
      )}

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: Input */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {mode === "encode" ? "Raw HTML / Text Input" : "Encoded HTML Entities Input"}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted font-mono">
                {inputText.length} chars &bull; {new Blob([inputText]).size} bytes
              </span>
              <button
                onClick={() => setInputText("")}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-text-muted font-medium shrink-0">Presets:</span>
            {Object.entries(activePresets).map(([k, p]) => (
              <button
                key={k}
                onClick={() => setInputText(p.text)}
                className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary text-[11px] whitespace-nowrap transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Textarea */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "encode"
                ? "Paste HTML code, text, or script to encode entities..."
                : "Paste HTML entity string (e.g. &lt;div&gt; or &#60;div&#62;) to decode..."
            }
            rows={10}
            className="w-full bg-surface-raised border border-border rounded-xl p-3.5 font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-y leading-relaxed"
          />

          {/* File Upload Trigger */}
          <div className="flex items-center justify-between text-xs pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.txt,.js,.jsx,.tsx,.svg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const content = ev.target?.result as string;
                    if (content) setInputText(content);
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Load file (.html, .txt, .js)</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Output */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border text-xs">
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === "raw"
                      ? "bg-accent text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Raw Code</span>
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === "preview"
                      ? "bg-accent text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Safe Browser Preview</span>
                </button>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/30 text-[10px] font-bold">
                {mode === "encode"
                  ? `${result.entityCount} Entities Generated`
                  : `${result.entityCount} Decoded (${result.namedCount} Named, ${result.decimalCount} Dec, ${result.hexCount} Hex)`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted font-mono">
                {result.charCount} chars &bull; {result.byteCount} bytes
              </span>
              <button
                onClick={() => triggerCopy(result.output, "out-copy", "Copied output to clipboard!")}
                disabled={!result.output}
                className="px-3 py-1.5 rounded-lg bg-accent text-white font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                {copiedKey === "out-copy" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!result.output}
                className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Output Display */}
          {activeTab === "raw" ? (
            <textarea
              readOnly
              value={result.output || "Output will appear here..."}
              rows={10}
              className="w-full bg-surface-raised border border-border rounded-xl p-3.5 font-mono text-xs text-text-primary focus:outline-none resize-y leading-relaxed select-all"
            />
          ) : (
            <div className="w-full h-64 overflow-hidden rounded-xl border border-border bg-white shadow-inner">
              {/* Sandboxed Iframe Preview (Zero Script Execution Risk) */}
              <iframe
                title="Rendered HTML Preview"
                sandbox=""
                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;line-height:1.5;color:#111;margin:14px;background:#fff;}h1,h2,h3{margin-top:0;}pre,code{background:#f3f4f6;padding:2px 4px;border-radius:4px;font-family:monospace;}</style></head><body>${result.output}</body></html>`}
                className="w-full h-full border-0"
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-text-muted pt-1">
            <span>
              {mode === "encode"
                ? `Format: ${format.toUpperCase()} • Scope: ${scope.toUpperCase()}`
                : `Decoded to standard UTF-8 text • Non-breaking space: ${convertNbspToSpace ? "Space" : "Preserved"}`}
            </span>
            {mode === "decode" && !stripTags && (
              <button
                onClick={handleBeautifyHTML}
                className="text-accent hover:underline font-semibold flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" />
                <span>Format Output Markup</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive HTML Entity Cheatsheet Catalog */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              HTML Entity Cheatsheet & Quick Insert Catalog ({filteredCatalog.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border text-xs">
              {[
                { id: "all", label: "All" },
                { id: "special", label: "Special" },
                { id: "typography", label: "Typography" },
                { id: "currency", label: "Currency" },
                { id: "math", label: "Math" },
                { id: "latin", label: "Latin" },
                { id: "greek", label: "Greek" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCatalogCategory(c.id)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    catalogCategory === c.id
                      ? "bg-accent text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search entity..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1 bg-surface-raised border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent w-40"
              />
            </div>
          </div>
        </div>

        {/* Entity Catalog Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs font-mono">
          {filteredCatalog.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-surface-raised border border-border hover:border-accent/40 transition-colors flex flex-col justify-between gap-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-text-primary font-sans w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center group-hover:border-accent transition-colors">
                  {item.char}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setInputText((prev) => prev + item.char);
                      triggerCopy(item.char, `ins-${idx}`, `Inserted "${item.char}"`);
                    }}
                    className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                    title="Insert into editor"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => triggerCopy(item.name, `cat-${idx}`, `Copied ${item.name}`)}
                    className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                    title="Copy named code"
                  >
                    {copiedKey === `cat-${idx}` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-accent font-bold truncate">{item.name}</span>
                <div className="flex items-center justify-between text-[10px] text-text-muted">
                  <span>{item.dec}</span>
                  <span>{item.hex}</span>
                </div>
                <span className="text-[10px] text-text-muted/80 truncate font-sans">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Guide Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <HelpCircle className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-text-primary">
            {mode === "decode"
              ? "HTML Entity Decoding Guide & Common Traps"
              : "Understanding HTML Entities & Cross-Site Scripting (XSS) Prevention"}
          </h2>
        </div>

        {mode === "decode" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-text-secondary leading-relaxed">
            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Double & Recursive Entities
              </h3>
              <p>
                CMS databases and web scrapers often encode text that was already encoded, producing <code className="text-accent">&amp;amp;lt;</code> instead of <code className="text-accent">&amp;lt;</code>. Turning on <strong>Recursive / Deep Decode</strong> peels off all layers automatically.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                The Non-Breaking Space (\u00A0) Trap
              </h3>
              <p>
                The entity <code className="text-emerald-300">&amp;nbsp;</code> represents Unicode character <code className="text-emerald-300">\u00A0</code>. When copied into programming code (JavaScript, Python, JSON), it appears visually as a space but causes unexpected compiler syntax errors. Our decoder converts it into a standard ASCII space by default.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                XSS Vector Detection
              </h3>
              <p>
                When decoding untrusted data from user submissions, decoded output may contain raw executable tags like <code className="text-amber-300">&lt;script&gt;</code> or event handlers. Always inspect the security alert banner before using decoded markup directly in your DOM.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-text-secondary leading-relaxed">
            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                What are HTML Entities?
              </h3>
              <p>
                HTML entities are code sequences used to represent characters that have special syntactic meaning in HTML (such as <code className="text-accent">&lt;</code>, <code className="text-accent">&gt;</code>, and <code className="text-accent">&amp;</code>) or cannot be typed easily on a keyboard (like <code className="text-accent">&copy;</code> and <code className="text-accent">&euro;</code>).
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Named vs Numeric vs Hex
              </h3>
              <p>
                <strong>Named entities</strong> (<code className="text-emerald-300">&amp;quot;</code>) are human-readable and standard in HTML5. <strong>Decimal</strong> (<code className="text-emerald-300">&amp;#34;</code>) and <strong>Hexadecimal</strong> (<code className="text-emerald-300">&amp;#x22;</code>) are universal across XML, XHTML, SVG, and strict parsers that lack full HTML5 DTD dictionaries.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                OWASP Defense Against XSS
              </h3>
              <p>
                When user input is injected into an HTML document, malicious actors can insert <code className="text-amber-300">&lt;script&gt;</code> tags or <code className="text-amber-300">onerror=</code> handlers. By escaping characters to <code className="text-amber-300">&amp;lt;</code> and <code className="text-amber-300">&amp;gt;</code>, browsers render the characters as text without executing arbitrary scripts.
              </p>
            </div>
          </div>
        )}
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
