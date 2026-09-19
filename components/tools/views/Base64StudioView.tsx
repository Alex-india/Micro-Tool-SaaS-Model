"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  encodeTextToBase64,
  encodeBytesToBase64,
  decodeBase64,
  formatByteSize,
  detectMimeType,
  sanitizeBase64,
  type Base64EncodeOptions,
  type Base64EncodeResult,
  type Base64DecodeResult,
} from "@/tools/developer/base64Engine";
import {
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  Binary,
  FileCode,
  FileText,
  ImageIcon,
  Sparkles,
  Link2,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowLeftRight,
  Eye,
  ShieldAlert,
  Wand2,
  Terminal,
  Music,
} from "lucide-react";

export interface Base64StudioViewProps {
  tool: ToolMeta;
}

// Encoder Presets
const ENCODER_PRESETS = {
  plainText: {
    label: "Plain Text",
    text: "Welcome to ToolVerse Studio! Fast, offline-first developer micro-tools.",
  },
  jsonPayload: {
    label: "JSON Payload",
    text: JSON.stringify(
      {
        service: "auth-gateway",
        active: true,
        scopes: ["read:users", "write:settings"],
        timestamp: 1789800000,
      },
      null,
      2
    ),
  },
  unicodeEmojis: {
    label: "Unicode & Emojis",
    text: "🚀 ToolVerse Web Dev 🛠️ • UTF-8: 日本語 • العربية • Español • ⚡",
  },
  svgGraphic: {
    label: "SVG Graphic",
    text: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#3b82f6"/><path d="M30 50 L45 65 L70 35" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  urlSafeBase64: {
    label: "URL-Safe String",
    text: "Subject with + and / characters >>> ???",
  },
};

// Decoder Presets
const DECODER_PRESETS = {
  textEncoded: {
    label: "Encoded Text",
    base64:
      "V2VsY29tZSB0byBUb29sVmVyc2UgU3R1ZGlvISBGYXN0LCBvZmZsaW5lLWZpcnN0IGRldmVsb3BlciBtaWNyby10b29scy4=",
  },
  jsonEncoded: {
    label: "Encoded JSON",
    base64:
      "ewogICJzZXJ2aWNlIjogImF1dGgtZ2F0ZXdheSIsCiAgImFjdGl2ZSI6IHRydWUsCiAgInNjb3BlcyI6IFsicmVhZDp1c2VycyIsICJ3cml0ZTpzZXR0aW5ncyJdLAogICJ0aW1lc3RhbXAiOiAxNzg5ODAwMDAwCn0=",
  },
  pngImageEncoded: {
    label: "PNG Image Data URI",
    base64:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWk0ndAAAAAElFTkSuQmCC",
  },
  svgIconEncoded: {
    label: "SVG Icon",
    base64:
      "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDUiIGZpbGw9IiMzYjgyZjYiLz48cGF0aCBkPSJNMzAgNTAgTDQ1IDY1IEw3MCAzNSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==",
  },
  urlSafeBase64Url: {
    label: "URL-Safe (Base64URL)",
    base64: "ZXhhbXBsZSB3aXRoICsgYW5kIC8gc3ltYm9scw",
  },
  pemChunked: {
    label: "PEM / Multiline",
    base64:
      "-----BEGIN CERTIFICATE-----\nU3ViamVjdCB3aXRoICsgYW5kIC8g\nY2hhcmFjdGVycyA+Pj4gPz8/\n-----END CERTIFICATE-----",
  },
};

export const Base64StudioView: React.FC<Base64StudioViewProps> = ({ tool }) => {
  const isDecoderSlug = tool.slug === "base64-decoder";

  // Mode: "encode" or "decode"
  const [mode, setMode] = useState<"encode" | "decode">(
    isDecoderSlug ? "decode" : "encode"
  );

  // Input source: "text" or "file"
  const [inputType, setInputType] = useState<"text" | "file">("text");

  // Text inputs
  const [inputText, setInputText] = useState<string>("");

  // Decode view sub-tab: "decoded" | "hex" | "json"
  const [decodeViewTab, setDecodeViewTab] = useState<"decoded" | "hex" | "json">("decoded");

  // Charset for decoding
  const [charset, setCharset] = useState<"utf-8" | "ascii" | "iso-8859-1" | "utf-16le">("utf-8");

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    mime: string;
    bytes: Uint8Array;
    previewUrl?: string;
  } | null>(null);

  // Encoding Options
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [padding, setPadding] = useState<boolean>(true);
  const [dataUriPrefix, setDataUriPrefix] = useState<boolean>(false);
  const [lineBreaks, setLineBreaks] = useState<0 | 64 | 76>(0);

  // Feedback states
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Encode computation
  const encodeResult: Base64EncodeResult | null = useMemo(() => {
    if (mode !== "encode") return null;

    const options: Base64EncodeOptions = {
      urlSafe,
      padding,
      lineBreaks,
      dataUriPrefix,
      mimeType: uploadedFile?.mime || (dataUriPrefix ? "text/plain;charset=utf-8" : undefined),
    };

    if (inputType === "file" && uploadedFile) {
      return encodeBytesToBase64(uploadedFile.bytes, options);
    }

    if (inputType === "text" && inputText) {
      return encodeTextToBase64(inputText, options);
    }

    return null;
  }, [mode, inputType, inputText, uploadedFile, urlSafe, padding, lineBreaks, dataUriPrefix]);

  // Decode computation
  const decodeResult: Base64DecodeResult | null = useMemo(() => {
    if (mode !== "decode") return null;
    if (!inputText.trim()) return null;

    return decodeBase64(inputText, { charset });
  }, [mode, inputText, charset]);

  // Handle Drag & Drop
  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  }, [mode]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processUploadedFile = (file: File) => {
    if (mode === "decode") {
      // In decode mode, read as text
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setInputText(text);
          setInputType("text");
          setToastMessage(`Loaded Base64 file "${file.name}" (${formatByteSize(file.size)})`);
          setTimeout(() => setToastMessage(""), 3000);
        }
      };
      reader.readAsText(file);
    } else {
      // In encode mode, read as binary array buffer
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          const bytes = new Uint8Array(buffer);
          const detected = detectMimeType(bytes);
          const mime = file.type || detected?.mime || "application/octet-stream";

          let previewUrl: string | undefined = undefined;
          if (mime.startsWith("image/")) {
            previewUrl = URL.createObjectURL(file);
          }

          setUploadedFile({
            name: file.name,
            size: file.size,
            mime,
            bytes,
            previewUrl,
          });
          setInputType("file");
          setToastMessage(`Loaded file "${file.name}" (${formatByteSize(file.size)})`);
          setTimeout(() => setToastMessage(""), 3000);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleClear = () => {
    setInputText("");
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);
    setInputType("text");
    setToastMessage("");
  };

  const handleSanitize = () => {
    if (!inputText.trim()) return;
    const { clean, fixes } = sanitizeBase64(inputText);
    setInputText(clean);
    if (fixes.length > 0) {
      setToastMessage(`Sanitized Base64: ${fixes.join(", ")}`);
    } else {
      setToastMessage("Base64 string was already clean!");
    }
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleCopy = () => {
    let textToCopy = "";
    if (mode === "encode") {
      textToCopy = encodeResult?.encodedText || "";
    } else {
      if (decodeViewTab === "json" && decodeResult?.formattedJson) {
        textToCopy = decodeResult.formattedJson;
      } else if (decodeViewTab === "hex" && decodeResult?.hexDump) {
        textToCopy = decodeResult.hexDump;
      } else {
        textToCopy = decodeResult?.decodedText || "";
      }
    }

    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (mode === "encode") {
      if (!encodeResult?.encodedText) return;
      const blob = new Blob([encodeResult.encodedText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = uploadedFile ? `${uploadedFile.name}.b64.txt` : "encoded.b64.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      if (!decodeResult || !decodeResult.isValid) return;

      if (decodeResult.isBinary && decodeResult.uint8Array) {
        // Download binary file
        const detected = detectMimeType(decodeResult.uint8Array);
        const ext = detected ? detected.ext : "bin";
        const blob = new Blob([decodeResult.uint8Array as unknown as BlobPart], {
          type: decodeResult.mimeType,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `decoded_file.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else if (decodeResult.decodedText) {
        // Download decoded text
        const isJsonExt = decodeResult.isJson;
        const blob = new Blob(
          [decodeResult.isJson && decodeResult.formattedJson ? decodeResult.formattedJson : decodeResult.decodedText],
          { type: isJsonExt ? "application/json;charset=utf-8" : "text/plain;charset=utf-8" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = isJsonExt ? "decoded_data.json" : "decoded_text.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
  };

  const loadEncoderPreset = (presetKey: keyof typeof ENCODER_PRESETS) => {
    setMode("encode");
    setInputType("text");
    setUploadedFile(null);
    setInputText(ENCODER_PRESETS[presetKey].text);
    setToastMessage(`Loaded sample "${ENCODER_PRESETS[presetKey].label}".`);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const loadDecoderPreset = (presetKey: keyof typeof DECODER_PRESETS) => {
    setMode("decode");
    setInputType("text");
    setUploadedFile(null);
    setInputText(DECODER_PRESETS[presetKey].base64);
    setToastMessage(`Loaded Base64 sample "${DECODER_PRESETS[presetKey].label}".`);
    setTimeout(() => setToastMessage(""), 2500);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Sibling Developer Tools Quick Navigator */}
      <div className="flex items-center gap-2 text-xs text-text-muted overflow-x-auto pb-1">
        <span className="font-medium text-text-primary">Related Developer Tools:</span>
        <Link
          href="/developer/base64-decoder"
          className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
            tool.slug === "base64-decoder"
              ? "bg-accent/10 border-accent/30 text-accent font-semibold"
              : "bg-surface border-border hover:border-accent/40 text-text-muted"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Base64 Decoder
        </Link>
        <Link
          href="/developer/base64-encoder"
          className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
            tool.slug === "base64-encoder"
              ? "bg-accent/10 border-accent/30 text-accent font-semibold"
              : "bg-surface border-border hover:border-accent/40 text-text-muted"
          }`}
        >
          <Binary className="w-3.5 h-3.5" />
          Base64 Encoder
        </Link>
        <Link
          href="/developer/url-decoder"
          className="px-2.5 py-1 rounded-lg border bg-surface border-border hover:border-accent/40 text-text-muted transition-colors flex items-center gap-1.5"
        >
          <Link2 className="w-3.5 h-3.5" />
          URL Decoder
        </Link>
        <Link
          href="/developer/jwt-decoder"
          className="px-2.5 py-1 rounded-lg border bg-surface border-border hover:border-accent/40 text-text-muted transition-colors flex items-center gap-1.5"
        >
          <FileCheck className="w-3.5 h-3.5" />
          JWT Decoder
        </Link>
      </div>

      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border p-4 rounded-xl shadow-card">
        {/* Mode Switcher & Presets */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-surface-raised border border-border rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMode("decode")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                mode === "decode"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Decode
            </button>
            <button
              onClick={() => setMode("encode")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                mode === "encode"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              Encode
            </button>
          </div>

          {/* Clean / Sanitize Button in Decode Mode */}
          {mode === "decode" && inputText.trim() && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSanitize}
              leftIcon={<Wand2 className="w-3.5 h-3.5 text-accent" />}
              title="Strip whitespace, newlines, PEM headers, and fix padding"
            >
              Sanitize / Clean Input
            </Button>
          )}

          {/* Presets Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-text-muted mr-1 hidden sm:inline">Presets:</span>
            {mode === "decode" ? (
              <>
                <button
                  type="button"
                  onClick={() => loadDecoderPreset("textEncoded")}
                  className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium"
                >
                  Encoded Text
                </button>
                <button
                  type="button"
                  onClick={() => loadDecoderPreset("jsonEncoded")}
                  className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium"
                >
                  Encoded JSON
                </button>
                <button
                  type="button"
                  onClick={() => loadDecoderPreset("pngImageEncoded")}
                  className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium"
                >
                  PNG Image
                </button>
                <button
                  type="button"
                  onClick={() => loadDecoderPreset("svgIconEncoded")}
                  className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium hidden md:inline"
                >
                  SVG Icon
                </button>
                <button
                  type="button"
                  onClick={() => loadDecoderPreset("urlSafeBase64Url")}
                  className="px-2 py-1 text-xs bg-accent/10 border border-accent/20 rounded text-accent hover:bg-accent/20 transition-colors font-medium"
                >
                  Base64URL
                </button>
                <button
                  type="button"
                  onClick={() => loadDecoderPreset("pemChunked")}
                  className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium hidden lg:inline"
                >
                  PEM Block
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => loadEncoderPreset("plainText")}
                  className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium"
                >
                  Plain Text
                </button>
                <button
                  type="button"
                  onClick={() => loadEncoderPreset("jsonPayload")}
                  className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium"
                >
                  JSON Payload
                </button>
                <button
                  type="button"
                  onClick={() => loadEncoderPreset("svgGraphic")}
                  className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium"
                >
                  SVG Graphic
                </button>
                <button
                  type="button"
                  onClick={() => loadEncoderPreset("urlSafeBase64")}
                  className="px-2 py-1 text-xs bg-accent/10 border border-accent/20 rounded text-accent hover:bg-accent/20 transition-colors font-medium"
                >
                  URL-Safe
                </button>
              </>
            )}
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {(inputText || uploadedFile) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
              title="Clear current input"
            >
              Clear
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={mode === "encode" ? !encodeResult : !decodeResult?.isValid || !decodeResult?.decodedText}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={
              mode === "encode"
                ? !encodeResult
                : !decodeResult || !decodeResult.isValid
            }
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download
          </Button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metrics Banner */}
      {mode === "encode" && encodeResult && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface border border-border rounded-xl shadow-card text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Ready to copy or download
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted flex-wrap">
            <span>
              Raw Input: <strong className="text-text-primary">{formatByteSize(encodeResult.rawBytesCount)}</strong>
            </span>
            <span>•</span>
            <span>
              Base64 Output: <strong className="text-text-primary">{formatByteSize(encodeResult.encodedBytesCount)}</strong>
            </span>
            <span>•</span>
            <span>
              Overhead: <strong className="text-amber-400">+{encodeResult.expansionPercent}%</strong> (standard 4:3 6-bit ratio)
            </span>
          </div>
        </div>
      )}

      {mode === "decode" && decodeResult && decodeResult.isValid && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface border border-border rounded-xl shadow-card text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Valid Base64 Decoded
            </span>
            {decodeResult.fixesApplied.length > 0 && (
              <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded text-[10px] font-medium">
                Auto-Sanitized
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted flex-wrap">
            <span>
              Content: <strong className="text-text-primary capitalize">{decodeResult.isBinary ? "Binary Data" : decodeResult.isJson ? "JSON Document" : "Plain Text"}</strong>
            </span>
            <span>•</span>
            <span>
              MIME: <strong className="text-accent">{decodeResult.mimeType}</strong>
            </span>
            <span>•</span>
            <span>
              Decoded Size: <strong className="text-text-primary">{formatByteSize(decodeResult.decodedBytesCount)}</strong>
            </span>
          </div>
        </div>
      )}

      {mode === "decode" && decodeResult && !decodeResult.isValid && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs flex items-center justify-between gap-3 text-red-400 flex-wrap">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div className="flex flex-col">
              <strong className="font-bold">Base64 Decode Error:</strong>
              <span>{decodeResult.error}</span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSanitize}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
          >
            Attempt Auto-Repair
          </Button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT COLUMN: Input Area */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-text-primary text-[11px]">
                {mode === "encode" ? "Source to Encode" : "Base64 to Decode"}
              </span>

              {/* Input Mode Toggle (Text vs File) */}
              <div className="flex items-center bg-surface-raised border border-border rounded-md p-0.5 text-[11px]">
                <button
                  onClick={() => setInputType("text")}
                  className={`px-2 py-0.5 rounded transition-all font-medium flex items-center gap-1 ${
                    inputType === "text"
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <FileText className="w-3 h-3" /> Text
                </button>
                <button
                  onClick={() => setInputType("file")}
                  className={`px-2 py-0.5 rounded transition-all font-medium flex items-center gap-1 ${
                    inputType === "file"
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <Upload className="w-3 h-3" /> File
                </button>
              </div>
            </div>

            <span className="text-[11px] font-mono text-text-muted">
              {inputType === "file" && uploadedFile
                ? `${uploadedFile.name} (${formatByteSize(uploadedFile.size)})`
                : `${inputText.length.toLocaleString()} chars`}
            </span>
          </div>

          {/* Left Input Box */}
          {inputType === "text" ? (
            <div className="relative w-full h-full min-h-[460px] bg-[#0c1017] border border-border rounded-xl shadow-card flex flex-col overflow-hidden focus-within:border-accent transition-colors">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "Type or paste UTF-8 text, JSON, code, or SVG to encode into Base64..."
                    : "Paste Base64 string, Base64URL, or Data URI (e.g. data:image/png;base64,...) to decode..."
                }
                rows={20}
                className="w-full h-full bg-transparent p-4 font-mono text-xs text-text-primary leading-relaxed outline-none resize-none placeholder:text-text-muted/40"
                spellCheck={false}
              />
            </div>
          ) : (
            /* File Upload / Dropzone */
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative w-full h-full min-h-[460px] bg-[#0c1017] border-2 border-dashed border-border rounded-xl shadow-card p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-accent/60 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
                id="base64-file-input"
              />

              {uploadedFile ? (
                <div className="flex flex-col items-center gap-3 max-w-sm">
                  {uploadedFile.previewUrl ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border bg-black/40 flex items-center justify-center p-1">
                      <img
                        src={uploadedFile.previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <FileCode className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex flex-col text-center">
                    <span className="font-bold text-text-primary text-xs break-all">
                      {uploadedFile.name}
                    </span>
                    <span className="text-[11px] font-mono text-text-muted mt-0.5">
                      {formatByteSize(uploadedFile.size)} • {uploadedFile.mime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      Change File
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-xs">
                      {mode === "decode"
                        ? "Drag and drop a .txt or .b64 file containing Base64"
                        : "Drag and drop any binary file or image here"}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1 max-w-xs">
                      {mode === "decode"
                        ? "Supports raw Base64 files, Data URIs, and PEM formatted blocks."
                        : "Supports images (PNG, JPG, SVG, WebP, GIF), PDFs, audio, documents, and binaries."}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Configuration Options */}
          {mode === "encode" ? (
            <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-2.5 text-xs">
              <span className="font-bold uppercase tracking-wider text-text-primary text-[10px]">
                RFC 4648 Encoding Configuration
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                  <input
                    type="checkbox"
                    checked={urlSafe}
                    onChange={(e) => setUrlSafe(e.target.checked)}
                    className="accent-accent w-4 h-4 rounded"
                  />
                  <span>
                    URL-Safe (RFC 4648 §5: <code>-</code> and <code>_</code>)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                  <input
                    type="checkbox"
                    checked={padding}
                    onChange={(e) => setPadding(e.target.checked)}
                    className="accent-accent w-4 h-4 rounded"
                  />
                  <span>Include Padding (<code>=</code>)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                  <input
                    type="checkbox"
                    checked={dataUriPrefix}
                    onChange={(e) => setDataUriPrefix(e.target.checked)}
                    className="accent-accent w-4 h-4 rounded"
                  />
                  <span>Data URI format (<code>data:mime;base64,</code>)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-[11px]">Wrap:</span>
                  <select
                    value={lineBreaks}
                    onChange={(e) => setLineBreaks(Number(e.target.value) as 0 | 64 | 76)}
                    className="bg-surface-raised border border-border rounded p-1 text-xs text-text-primary outline-none"
                  >
                    <option value={0}>No Line Breaks</option>
                    <option value={64}>64 Chars (MIME RFC 2045)</option>
                    <option value={76}>76 Chars (PEM RFC 1421)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Decoder Options */
            <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold uppercase tracking-wider text-text-primary text-[10px]">
                  Decoder Character Encoding
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-[11px]">Charset:</span>
                  <select
                    value={charset}
                    onChange={(e) => setCharset(e.target.value as any)}
                    className="bg-surface-raised border border-border rounded px-2 py-1 text-xs text-text-primary outline-none"
                  >
                    <option value="utf-8">UTF-8 (Standard Unicode)</option>
                    <option value="ascii">ASCII</option>
                    <option value="iso-8859-1">ISO-8859-1 (Latin-1)</option>
                    <option value="utf-16le">UTF-16LE</option>
                  </select>
                </div>
              </div>

              {decodeResult?.fixesApplied && decodeResult.fixesApplied.length > 0 && (
                <div className="text-[11px] text-accent/90 bg-accent/5 p-2 rounded border border-accent/20 flex items-start gap-1.5 mt-1">
                  <Wand2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" />
                  <span>
                    <strong>Sanitizer Active:</strong> {decodeResult.fixesApplied.join(", ")}.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Output Area */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-text-primary text-[11px]">
                {mode === "encode" ? "Base64 Encoded Output" : "Decoded Result"}
              </span>

              {/* Sub-tab view buttons in decode mode */}
              {mode === "decode" && decodeResult?.isValid && (
                <div className="flex items-center bg-surface-raised border border-border rounded-md p-0.5 text-[11px]">
                  <button
                    onClick={() => setDecodeViewTab("decoded")}
                    className={`px-2 py-0.5 rounded transition-all font-medium ${
                      decodeViewTab === "decoded"
                        ? "bg-accent text-white"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {decodeResult.isBinary ? "Preview" : "Text"}
                  </button>

                  {decodeResult.isJson && (
                    <button
                      onClick={() => setDecodeViewTab("json")}
                      className={`px-2 py-0.5 rounded transition-all font-medium ${
                        decodeViewTab === "json"
                          ? "bg-accent text-white"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      JSON
                    </button>
                  )}

                  <button
                    onClick={() => setDecodeViewTab("hex")}
                    className={`px-2 py-0.5 rounded transition-all font-medium flex items-center gap-1 ${
                      decodeViewTab === "hex"
                        ? "bg-accent text-white"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <Terminal className="w-3 h-3" /> Hex
                  </button>
                </div>
              )}
            </div>

            <span className="text-[11px] font-mono text-text-muted">
              {mode === "encode" && encodeResult
                ? `${encodeResult.encodedText.length.toLocaleString()} characters`
                : mode === "decode" && decodeResult?.isValid
                ? `${formatByteSize(decodeResult.decodedBytesCount)}`
                : ""}
            </span>
          </div>

          <div className="relative w-full h-full min-h-[460px] bg-[#0c1017] border border-border rounded-xl shadow-card p-4 overflow-auto flex flex-col justify-between">
            {/* ENCODE OUTPUT */}
            {mode === "encode" && (
              <div className="flex flex-col gap-3 h-full">
                {encodeResult ? (
                  <pre className="font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap break-all select-all flex-1">
                    {encodeResult.encodedText}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-center text-text-muted gap-2">
                    <Binary className="w-8 h-8 text-text-muted/40" />
                    <p className="text-xs">
                      Enter text or drop a file on the left to generate Base64 output.
                    </p>
                  </div>
                )}

                {/* Quick copy data URI shortcut */}
                {encodeResult && !dataUriPrefix && (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-text-muted">
                    <span className="text-[11px]">Need HTML/CSS Data URI?</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(encodeResult.dataUri);
                        setToastMessage("Copied as Data URI (data:...;base64,...)!");
                        setTimeout(() => setToastMessage(""), 2500);
                      }}
                      className="text-xs text-accent hover:underline font-medium flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy as Data URI
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DECODE OUTPUT */}
            {mode === "decode" && (
              <div className="flex flex-col gap-3 h-full">
                {decodeResult?.isValid ? (
                  decodeViewTab === "hex" ? (
                    /* Hex Dump View */
                    <pre className="font-mono text-xs text-amber-300/90 leading-relaxed whitespace-pre select-all overflow-x-auto flex-1">
                      {decodeResult.hexDump}
                    </pre>
                  ) : decodeViewTab === "json" && decodeResult.formattedJson ? (
                    /* Formatted JSON View */
                    <pre className="font-mono text-xs text-sky-300 leading-relaxed whitespace-pre-wrap break-all select-all flex-1">
                      {decodeResult.formattedJson}
                    </pre>
                  ) : decodeResult.isBinary ? (
                    /* Binary File / Image / Audio Preview */
                    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-4">
                      {decodeResult.dataUrl && decodeResult.mimeType.startsWith("image/") ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative max-w-[320px] max-h-[240px] rounded-lg overflow-hidden border border-border bg-black/60 p-2 shadow-card flex items-center justify-center">
                            <img
                              src={decodeResult.dataUrl}
                              alt="Decoded Image Preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <span className="text-xs font-bold text-emerald-400">
                            ✓ Decoded Image ({decodeResult.mimeType})
                          </span>
                        </div>
                      ) : decodeResult.dataUrl && decodeResult.mimeType.startsWith("audio/") ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                            <Music className="w-8 h-8" />
                          </div>
                          <audio controls className="w-full max-w-sm mt-2" src={decodeResult.dataUrl} />
                          <span className="text-xs font-bold text-emerald-400">
                            ✓ Decoded Audio Stream ({decodeResult.mimeType})
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                            <FileCheck className="w-8 h-8" />
                          </div>
                          <span className="font-bold text-text-primary text-xs">
                            Decoded Binary File ({decodeResult.mimeType})
                          </span>
                          <span className="text-xs font-mono text-text-muted">
                            {formatByteSize(decodeResult.decodedBytesCount)}
                          </span>
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDownload}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download Decoded File
                      </Button>
                    </div>
                  ) : (
                    /* Plain text decoded */
                    <pre className="font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap break-all select-all flex-1">
                      {decodeResult.decodedText}
                    </pre>
                  )
                ) : decodeResult?.error ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center text-red-400 gap-2 p-4">
                    <ShieldAlert className="w-8 h-8" />
                    <p className="font-bold text-xs">Invalid Base64 Input</p>
                    <p className="text-[11px] text-text-muted max-w-xs">{decodeResult.error}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSanitize}
                      leftIcon={<Wand2 className="w-3.5 h-3.5" />}
                      className="mt-2"
                    >
                      Clean & Sanitize Base64
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-center text-text-muted gap-2">
                    <FileCode className="w-8 h-8 text-text-muted/40" />
                    <p className="text-xs">
                      Paste Base64 or Base64URL on the left to decode into text, images, or files.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
