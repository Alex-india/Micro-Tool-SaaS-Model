"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Button } from "@/components/ui/Button";
import {
  encodeURLString,
  decodeURLString,
  parseURLComponents,
  buildURLFromComponents,
  stripTrackingParameters,
  queryParamsToJSON,
  isTrackingParam,
  type URLEncodeMode,
  type URLQueryParam,
  type ParsedURLStructure,
} from "@/tools/developer/urlEngine";
import {
  Link as LinkIcon,
  Link2,
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
  Globe,
  ShieldCheck,
  Plus,
  HelpCircle,
  Search,
  Wand2,
  ExternalLink,
  FileJson,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface URLEncoderViewProps {
  tool: ToolMeta;
}

const ENCODER_PRESETS = {
  fullUrl: {
    label: "Full URL with Query",
    text: "https://example.com/search?category=running shoes&sort=price_asc&q=special offer 2024!#top-deals",
  },
  oauthRedirect: {
    label: "OAuth Redirect URI",
    text: "https://auth.provider.com/oauth/v2/authorize?client_id=app_98472&redirect_uri=https://toolverse.app/callback&response_type=code&scope=openid profile email&state=xyz123",
  },
  unicodeEmojis: {
    label: "UTF-8 & Emojis",
    text: "https://shop.com/search?q=café au lait ☕&tag=été 2024 ✨",
  },
  formData: {
    label: "Form Encoded String",
    text: "first_name=Alex&last_name=Rivera&email=alex@toolverse.app&message=Hello world! How are you?",
  },
};

const DECODER_PRESETS = {
  standardUrl: {
    label: "Percent-Encoded URL",
    text: "https://example.com/search?category=running%20shoes&sort=price_asc&q=special%20offer%202024%21#top-deals",
  },
  oauthCallback: {
    label: "OAuth Auth Callback",
    text: "https://auth.provider.com/oauth/v2/authorize?client_id=app_98472&redirect_uri=https%3A%2F%2Ftoolverse.app%2Fcallback%3Fmode%3Dpopup&scope=openid%20profile%20email&state=%7B%22nonce%22%3A%22xyz123%22%2C%22origin%22%3A%22web%22%7D",
  },
  doubleEncoded: {
    label: "Double-Encoded URL",
    text: "https%253A%252F%252Fapi.stripe.com%252Fv1%252Fcharges%253Fcustomer%253Dcus_123%2526currency%253Dusd",
  },
  formEncoded: {
    label: "Form URL Encoded (+)",
    text: "query=machine+learning+algorithms&filter=recent+updates&author=Dr.+Smith&department=R%26D",
  },
  unicodeEmojis: {
    label: "UTF-8 & Emojis",
    text: "https://shop.com/search?q=caf%C3%A9%20au%20lait%20%E2%98%95&tag=%C3%A9t%C3%A9%202024%20%E2%9C%A8",
  },
  dirtyHtml: {
    label: "HTML Link with &amp;",
    text: "https://example.com/search?q=developer&amp;utm_source=email&amp;target=https%3A%2F%2Fgithub.com%2Ftrending",
  },
};

export const URLEncoderView: React.FC<URLEncoderViewProps> = ({ tool }) => {
  const isDecoderSlug = tool.slug === "url-decoder";
  const [mode, setMode] = useState<"encode" | "decode">(isDecoderSlug ? "decode" : "encode");
  const [encodeMode, setEncodeMode] = useState<URLEncodeMode>("component");

  // Decoder specific toggles
  const [decodePlusAsSpace, setDecodePlusAsSpace] = useState<boolean>(true);
  const [recursiveDecode, setRecursiveDecode] = useState<boolean>(false);
  const [stripHtmlEntities, setStripHtmlEntities] = useState<boolean>(true);

  // Input & Output
  const [inputText, setInputText] = useState<string>(
    isDecoderSlug ? DECODER_PRESETS.standardUrl.text : ENCODER_PRESETS.fullUrl.text
  );

  // Query parameter table filtering
  const [paramSearch, setParamSearch] = useState<string>("");

  // JSON export modal state
  const [showJsonExport, setShowJsonExport] = useState<boolean>(false);

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

  // Compute Encode/Decode Result
  const result = useMemo(() => {
    if (mode === "encode") {
      return {
        isEncode: true,
        roundsDecoded: 0,
        isMultiRound: false,
        warning: undefined,
        ...encodeURLString(inputText, encodeMode),
      };
    } else {
      return {
        isEncode: false,
        ...decodeURLString(inputText, {
          decodePlusAsSpace,
          recursive: recursiveDecode,
          stripHtmlEntities,
        }),
      };
    }
  }, [inputText, mode, encodeMode, decodePlusAsSpace, recursiveDecode, stripHtmlEntities]);

  // Parse URL components from either input or output
  const parsedUrl: ParsedURLStructure = useMemo(() => {
    const target = mode === "encode" ? inputText : result.output;
    return parseURLComponents(target);
  }, [inputText, result.output, mode]);

  // Swap input and output
  const handleSwap = () => {
    if (result.output) {
      setInputText(result.output);
      setMode(mode === "encode" ? "decode" : "encode");
    }
  };

  // Modify query parameters directly from the inspector
  const updateQueryParam = (index: number, newKey: string, newVal: string) => {
    if (!parsedUrl.params) return;
    const updated = [...parsedUrl.params];
    updated[index] = { key: newKey, value: newVal };
    const reconstructed = buildURLFromComponents(
      parsedUrl.origin || "",
      parsedUrl.pathname || "/",
      updated,
      parsedUrl.hash || ""
    );
    if (mode === "encode") {
      setInputText(reconstructed);
    } else {
      setInputText(encodeURI(reconstructed));
    }
  };

  const addQueryParam = () => {
    const updated = [...(parsedUrl.params || []), { key: "new_param", value: "value" }];
    const reconstructed = buildURLFromComponents(
      parsedUrl.origin || "",
      parsedUrl.pathname || "/",
      updated,
      parsedUrl.hash || ""
    );
    if (mode === "encode") {
      setInputText(reconstructed);
    } else {
      setInputText(encodeURI(reconstructed));
    }
  };

  const removeQueryParam = (index: number) => {
    if (!parsedUrl.params) return;
    const updated = parsedUrl.params.filter((_, i) => i !== index);
    const reconstructed = buildURLFromComponents(
      parsedUrl.origin || "",
      parsedUrl.pathname || "/",
      updated,
      parsedUrl.hash || ""
    );
    if (mode === "encode") {
      setInputText(reconstructed);
    } else {
      setInputText(encodeURI(reconstructed));
    }
  };

  // Clean tracking parameters (UTM, etc.)
  const handleStripTracking = () => {
    const cleaned = stripTrackingParameters(mode === "encode" ? inputText : result.output);
    setInputText(cleaned);
    setToastMessage("Stripped all UTM and tracking parameters!");
    setTimeout(() => setToastMessage(""), 2000);
  };

  // Download Output
  const handleDownload = () => {
    if (!result.output) return;
    const blob = new Blob([result.output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "encode" ? "encoded-url.txt" : "decoded-url.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download JSON of params
  const handleDownloadParamsJson = () => {
    if (!parsedUrl.params || parsedUrl.params.length === 0) return;
    const jsonStr = queryParamsToJSON(parsedUrl.params);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "url-params.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered params
  const filteredParams = useMemo(() => {
    if (!parsedUrl.params) return [];
    if (!paramSearch.trim()) return parsedUrl.params;
    const q = paramSearch.toLowerCase();
    return parsedUrl.params.filter(
      (p) => p.key.toLowerCase().includes(q) || p.value.toLowerCase().includes(q)
    );
  }, [parsedUrl.params, paramSearch]);

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
            href="/developer/url-encoder"
            onClick={() => {
              setMode("encode");
              if (!inputText.includes("%") && inputText.trim()) {
                // Keep input
              } else {
                setInputText(ENCODER_PRESETS.fullUrl.text);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === "encode"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            URL Encoder
          </Link>
          <Link
            href="/developer/url-decoder"
            onClick={() => {
              setMode("decode");
              if (inputText.includes("%")) {
                // Keep encoded input
              } else {
                setInputText(DECODER_PRESETS.standardUrl.text);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === "decode"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            URL Decoder
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>RFC 3986 Standard &bull; Tolerant UTF-8 &bull; 100% Private Client-Side</span>
        </div>
      </div>

      {/* Encoding & Decoding Configuration Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-card flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span className="font-bold text-text-primary uppercase tracking-wider">
              {mode === "encode" ? "Encoding Standards & Options" : "Decoding Controls & Options"}
            </span>
            {mode === "decode" && result.isMultiRound && (
              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                Decoded {result.roundsDecoded} Rounds
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSwap}
              className="px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
              <span>Swap & {mode === "encode" ? "Decode" : "Encode"}</span>
            </button>
          </div>
        </div>

        {/* Encode Mode Selector */}
        {mode === "encode" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              {
                id: "component",
                label: "Query Component (Standard)",
                desc: "encodeURIComponent: Encodes all delimiters (&, =, ?, #)",
              },
              {
                id: "full-uri",
                label: "Full URI (Address Bar)",
                desc: "encodeURI: Preserves URL scheme, host, path, query syntax",
              },
              {
                id: "form-urlencoded",
                label: "Form URL Encoded",
                desc: "application/x-www-form-urlencoded: Spaces as +",
              },
              {
                id: "strict-rfc3986",
                label: "Strict RFC 3986",
                desc: "Percent-encodes all characters including ! ' ( ) *",
              },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setEncodeMode(opt.id as URLEncodeMode)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  encodeMode === opt.id
                    ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                    : "bg-surface-raised/60 border-border hover:border-border-hover text-text-secondary hover:text-text-primary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-text-primary">{opt.label}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      encodeMode === opt.id ? "border-accent bg-accent text-white" : "border-border"
                    }`}
                  >
                    {encodeMode === opt.id && <Check className="w-2 h-2" />}
                  </div>
                </div>
                <span className="text-[11px] text-text-muted leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        ) : (
          /* Decode Options Bar */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-raised/70 border border-border cursor-pointer hover:border-accent/40 transition-colors">
              <input
                type="checkbox"
                checked={decodePlusAsSpace}
                onChange={(e) => setDecodePlusAsSpace(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-text-primary">
                  Decode <code className="text-accent">+</code> as Space
                </span>
                <span className="text-[11px] text-text-muted">
                  Converts plus signs to spaces for form submissions
                </span>
              </div>
            </label>

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
                  Peels off multiple layers of double or triple percent-encoding
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-raised/70 border border-border cursor-pointer hover:border-accent/40 transition-colors">
              <input
                type="checkbox"
                checked={stripHtmlEntities}
                onChange={(e) => setStripHtmlEntities(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-text-primary">
                  Clean HTML Entities
                </span>
                <span className="text-[11px] text-text-muted">
                  Fixes <code className="text-accent">&amp;amp;</code> to <code className="text-accent">&amp;</code> from email links
                </span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Nested URL Detector Alert (if any query param contains an inner URL) */}
      {parsedUrl.nestedUrls && parsedUrl.nestedUrls.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-300">
            <ExternalLink className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>
              <strong>Nested URL detected in query params:</strong>{" "}
              <code className="bg-surface/80 px-2 py-0.5 rounded font-mono text-indigo-200">
                {parsedUrl.nestedUrls[0].key} = {parsedUrl.nestedUrls[0].url.slice(0, 60)}
                {parsedUrl.nestedUrls[0].url.length > 60 ? "..." : ""}
              </code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInputText(parsedUrl.nestedUrls![0].url);
                setMode("decode");
              }}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Load in Decoder
            </button>
            <button
              onClick={() =>
                triggerCopy(parsedUrl.nestedUrls![0].url, "nested-copy", "Copied nested URL!")
              }
              className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-raised border border-border text-text-secondary hover:text-text-primary transition-colors"
            >
              Copy
            </button>
          </div>
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
                {mode === "encode" ? "Plain URL / Query Text" : "Percent-Encoded URL String"}
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
                ? "Enter URL, query parameters, or string to percent-encode..."
                : "Enter percent-encoded URL (e.g. https%3A%2F%2Fexample.com or query params) to decode..."
            }
            rows={9}
            className="w-full bg-surface-raised border border-border rounded-xl p-3.5 font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-y leading-relaxed"
          />

          {/* File Upload Trigger */}
          <div className="flex items-center justify-between text-xs pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,.url"
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
              <span>Load file (.txt, .json)</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Output */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {mode === "encode" ? "Percent-Encoded Result" : "Decoded Human-Readable URL"}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted font-mono">
                {result.output.length} chars &bull; {result.byteCount} bytes
              </span>
              <button
                onClick={() => triggerCopy(result.output, "out-copy", "Copied URL to clipboard!")}
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
                title="Download text file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Output Textarea */}
          <textarea
            readOnly
            value={result.output || "Output will appear here..."}
            rows={9}
            className="w-full bg-surface-raised border border-border rounded-xl p-3.5 font-mono text-xs text-text-primary focus:outline-none resize-y leading-relaxed select-all"
          />

          {/* Warning Notice if decoding had malformed sequence */}
          {!result.isEncode && result.warning && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{result.warning}</span>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              {parsedUrl.hasTrackingParams && (
                <button
                  onClick={handleStripTracking}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Clean URL (Strip UTM Tracking)
                </button>
              )}
            </div>

            {parsedUrl.params && parsedUrl.params.length > 0 && (
              <button
                onClick={() => setShowJsonExport(!showJsonExport)}
                className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 font-medium"
              >
                <FileJson className="w-3.5 h-3.5 text-accent" />
                <span>{showJsonExport ? "Hide JSON" : "Export Params as JSON"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* JSON Export Drawer / Box (if toggled) */}
      {showJsonExport && parsedUrl.params && parsedUrl.params.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
              <FileJson className="w-4 h-4 text-accent" />
              <span>Extracted Query Parameters (JSON Object)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() =>
                  triggerCopy(queryParamsToJSON(parsedUrl.params), "json-copy", "Copied JSON params!")
                }
                className="px-3 py-1 rounded-lg bg-accent text-white font-semibold flex items-center gap-1"
              >
                {copiedKey === "json-copy" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy JSON</span>
              </button>
              <button
                onClick={handleDownloadParamsJson}
                className="p-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary"
                title="Download JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <pre className="p-3 bg-surface-raised border border-border rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-48">
            {queryParamsToJSON(parsedUrl.params)}
          </pre>
        </div>
      )}

      {/* Interactive URL Parameter Inspector & Live Editor */}
      {parsedUrl.params && parsedUrl.params.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Query Parameter Inspector & Live Editor ({parsedUrl.params.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Parameter search filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter parameters..."
                  value={paramSearch}
                  onChange={(e) => setParamSearch(e.target.value)}
                  className="pl-8 pr-2.5 py-1 bg-surface-raised border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent w-44"
                />
              </div>

              {parsedUrl.hasTrackingParams && (
                <button
                  onClick={handleStripTracking}
                  className="px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Strip Tracking
                </button>
              )}

              <button
                onClick={addQueryParam}
                className="px-3 py-1 rounded-lg bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Parameter
              </button>
            </div>
          </div>

          {/* URL Component Chips */}
          {parsedUrl.isValidURL && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-surface-raised border border-border flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-text-muted font-sans">Protocol</span>
                <span className="text-accent font-bold">{parsedUrl.protocol}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-raised border border-border flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-text-muted font-sans">Host</span>
                <span className="text-text-primary font-bold truncate">{parsedUrl.host}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-raised border border-border flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-text-muted font-sans">Path</span>
                <span className="text-text-primary font-bold truncate">{parsedUrl.pathname}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-raised border border-border flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-text-muted font-sans">Hash / Anchor</span>
                <span className="text-text-muted font-bold truncate">{parsedUrl.hash || "—"}</span>
              </div>
            </div>
          )}

          {/* Query Parameters Table */}
          <div className="bg-surface-raised border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface border-b border-border text-text-muted font-sans">
                <tr>
                  <th className="p-3 w-10">#</th>
                  <th className="p-3 w-1/3">Key (Param)</th>
                  <th className="p-3">Decoded Value</th>
                  <th className="p-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredParams.map((param, idx) => {
                  const originalIndex = parsedUrl.params.indexOf(param);
                  const isTracking = isTrackingParam(param.key);
                  return (
                    <tr key={idx} className="hover:bg-surface/50">
                      <td className="p-3 text-text-muted select-none text-[11px]">{idx + 1}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={param.key}
                            onChange={(e) =>
                              updateQueryParam(originalIndex, e.target.value, param.value)
                            }
                            className={`w-full bg-surface border rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent ${
                              isTracking
                                ? "border-amber-500/40 text-amber-300"
                                : "border-border text-accent"
                            }`}
                          />
                          {isTracking && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-amber-500/20 text-amber-300 uppercase shrink-0"
                              title="Analytics tracking tag"
                            >
                              UTM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) =>
                            updateQueryParam(originalIndex, param.key, e.target.value)
                          }
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              triggerCopy(
                                param.value,
                                `param-val-${idx}`,
                                `Copied "${param.key}" value!`
                              )
                            }
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                            title="Copy value"
                          >
                            {copiedKey === `param-val-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => removeQueryParam(originalIndex)}
                            className="p-1 rounded text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Guide Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <HelpCircle className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-text-primary">
            {mode === "decode" ? "URL Decoding Guide & Common Pitfalls" : "URL Encoding Standards Guide"}
          </h2>
        </div>

        {mode === "decode" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-text-secondary leading-relaxed">
            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Percent-Decoding Mechanics
              </h3>
              <p>
                Percent-encoding represents arbitrary byte values as <code className="text-accent">%XX</code>, where XX is hexadecimal. For example, <code className="text-accent">%20</code> becomes a space, <code className="text-accent">%2F</code> becomes a slash (<code className="text-accent">/</code>), and <code className="text-accent">%3F</code> becomes a question mark (<code className="text-accent">?</code>).
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Double & Recursive Encoding
              </h3>
              <p>
                APIs and redirect gateways often encode an already-encoded URL. In this scenario, <code className="text-purple-300">%2520</code> appears: <code className="text-purple-300">%25</code> is the percent sign itself! Our <strong>Recursive / Deep Decode</strong> mode strips all layers cleanly.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Tolerant Multi-Byte Recovery
              </h3>
              <p>
                Standard browser <code className="text-amber-300">decodeURIComponent()</code> crashes with a fatal error if a URL has an incomplete percent token (like <code className="text-amber-300">%9G</code>). Our engine uses byte-stream UTF-8 decoding to preserve invalid parts while safely decoding all valid characters and emojis.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-text-secondary leading-relaxed">
            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                encodeURIComponent (Query Components)
              </h3>
              <p>
                Encodes <strong>all</strong> punctuation characters, including <code className="text-accent">&</code>, <code className="text-accent">=</code>, <code className="text-accent">?</code>, <code className="text-accent">/</code>, <code className="text-accent">:</code>, and <code className="text-accent">#</code>. Use this whenever encoding individual query parameter values so they don't break the parent URL structure.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                encodeURI (Full URL Address Bar)
              </h3>
              <p>
                Encodes spaces and special Unicode characters, but <strong>preserves</strong> valid URL delimiters (<code className="text-emerald-300">https://</code>, <code className="text-emerald-300">/</code>, <code className="text-emerald-300">?</code>, <code className="text-emerald-300">&</code>, <code className="text-emerald-300">#</code>). Use this when you have a complete URL and only want to make it valid for address bar navigation.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Form URL Encoded (+ for spaces)
              </h3>
              <p>
                Defined by HTML form specifications (<code className="text-amber-300">application/x-www-form-urlencoded</code>). Spaces are represented by <code className="text-amber-300">+</code> instead of <code className="text-amber-300">%20</code>. Essential when constructing OAuth POST bodies or mimicking legacy HTML form submissions.
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
