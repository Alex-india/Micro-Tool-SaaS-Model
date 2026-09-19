"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Button } from "@/components/ui/Button";
import {
  computeAllHashes,
  detectHashAlgorithm,
  verifyHash,
  generateChecksumFile,
  type HashAlgorithm,
  type HashResult,
  type AllHashesResult,
  type InputEncoding,
  type DigestFormat,
} from "@/tools/developer/hashEngine";
import {
  Fingerprint,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  KeyRound,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  FileText,
  Binary,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Layers,
  Cpu,
  FileCode,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export interface HashGeneratorViewProps {
  tool: ToolMeta;
}

const PRESET_TEXTS = {
  helloWorld: {
    label: "Hello World",
    text: "Hello, World!",
  },
  quickFox: {
    label: "Quick Brown Fox",
    text: "The quick brown fox jumps over the lazy dog",
  },
  jsonSample: {
    label: "JSON Payload",
    text: JSON.stringify({ user: "alex", role: "admin", active: true }, null, 2),
  },
  empty: {
    label: "Empty String",
    text: "",
  },
};

const ALGORITHM_CONFIG: Record<
  HashAlgorithm,
  { label: string; badge: string; badgeColor: string; description: string }
> = {
  sha256: {
    label: "SHA-256",
    badge: "Industry Standard",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    description: "NIST FIPS 180-4 standard. Universally used in TLS/SSL, Bitcoin, and code signing.",
  },
  sha512: {
    label: "SHA-512",
    badge: "High Security",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    description: "512-bit digest. Ideal for 64-bit architectures, maximum collision resistance.",
  },
  md5: {
    label: "MD5",
    badge: "Legacy / Checksum",
    badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    description: "128-bit RFC 1321 digest. Fast file verification, Gravatar hashes, and legacy ETag.",
  },
  sha1: {
    label: "SHA-1",
    badge: "Legacy / Git",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    description: "160-bit digest. Historically used in Git commit object IDs and legacy certs.",
  },
  sha384: {
    label: "SHA-384",
    badge: "NIST Suite B",
    badgeColor: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    description: "Truncated 384-bit SHA-512 variant used in government and enterprise TLS.",
  },
  crc32: {
    label: "CRC-32",
    badge: "Error Checksum",
    badgeColor: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    description: "32-bit cyclic redundancy check used in ZIP files, PNG chunks, and network frames.",
  },
};

export const HashGeneratorView: React.FC<HashGeneratorViewProps> = ({ tool }) => {
  // Determine default tab based on tool slug
  const defaultTab = tool.slug === "file-hash-generator" ? "file" : "text";
  const [activeTab, setActiveTab] = useState<"text" | "file" | "verify">(defaultTab);

  // --- Text Hashing State ---
  const [inputText, setInputText] = useState<string>("The quick brown fox jumps over the lazy dog");
  const [encoding, setEncoding] = useState<InputEncoding>("utf8");
  const [format, setFormat] = useState<"lower" | "upper" | "base64">("lower");
  const [enableHmac, setEnableHmac] = useState<boolean>(false);
  const [hmacKey, setHmacKey] = useState<string>("");
  const [showHmacKey, setShowHmacKey] = useState<boolean>(false);

  const [textHashes, setTextHashes] = useState<AllHashesResult | null>(null);
  const [isComputingText, setIsComputingText] = useState<boolean>(false);

  // --- File Hashing State ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHashes, setFileHashes] = useState<AllHashesResult | null>(null);
  const [isFileComputing, setIsFileComputing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Verify / Compare State ---
  const [verifyExpected, setVerifyExpected] = useState<string>("");
  const [verifySource, setVerifySource] = useState<"text" | "file">("text");

  // --- Copy Toast State ---
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

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

  // 1. Compute Text Hashes
  useEffect(() => {
    let isCancelled = false;
    setIsComputingText(true);

    computeAllHashes(inputText, {
      encoding,
      hmacKey: enableHmac ? hmacKey : undefined,
    })
      .then((res) => {
        if (!isCancelled) {
          setTextHashes(res);
          setIsComputingText(false);
        }
      })
      .catch((e) => {
        if (!isCancelled) setIsComputingText(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [inputText, encoding, enableHmac, hmacKey]);

  // 2. Compute File Hashes
  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFileHashes(null);
      return;
    }

    setSelectedFile(file);
    setIsFileComputing(true);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const res = await computeAllHashes(bytes);
      setFileHashes(res);
    } catch (err) {
      console.error("File hash error:", err);
    } finally {
      setIsFileComputing(false);
    }
  };

  // Helper to format hash based on selected casing/base64
  const getDisplayHash = (h: HashResult | undefined): string => {
    if (!h) return "";
    if (format === "upper") return h.hexUpper;
    if (format === "base64") return h.base64;
    return h.hexLower;
  };

  // Verification results for the active target
  const activeHashesForVerify = verifySource === "file" ? fileHashes : textHashes;
  const verificationReport = useMemo(() => {
    if (!activeHashesForVerify || !verifyExpected.trim()) return null;
    return verifyHash(activeHashesForVerify, verifyExpected);
  }, [activeHashesForVerify, verifyExpected]);

  // Download checksum file
  const downloadChecksum = (algo: HashAlgorithm, sourceName = "hash") => {
    const activeResult = activeTab === "file" && fileHashes ? fileHashes : textHashes;
    if (!activeResult) return;
    const targetHash = activeResult[algo].hexLower;
    const content = generateChecksumFile(sourceName, targetHash);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sourceName}.${algo}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Bulk copy all hashes
  const handleCopyAllHashes = (source: AllHashesResult | null) => {
    if (!source) return;
    const prefix = source.isHmac ? "Keyed HMAC Digests" : "Cryptographic Hashes";
    const lines = [
      `=== ${prefix} ===`,
      `SHA-256: ${source.sha256.hexLower}`,
      `SHA-512: ${source.sha512.hexLower}`,
      `MD5:     ${source.md5.hexLower}`,
      `SHA-1:   ${source.sha1.hexLower}`,
      `SHA-384: ${source.sha384.hexLower}`,
      `CRC-32:  ${source.crc32.hexLower}`,
    ];
    triggerCopy(lines.join("\n"), "all", "Copied all hashes to clipboard!");
  };

  // Quick compare bridge from text/file card to verify tab
  const bridgeToVerify = (hashVal: string, source: "text" | "file") => {
    setVerifyExpected(hashVal);
    setVerifySource(source);
    setActiveTab("verify");
    window.scrollTo({ top: 140, behavior: "smooth" });
  };

  // Human readable file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

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

      {/* Navigation Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === "text"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <FileText className="w-4 h-4" />
            Text Hashing
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === "file"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            File Checksum
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === "verify"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Search className="w-4 h-4" />
            Verify & Compare
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Client-Side Web Crypto &bull; Zero Server Transmission &bull; FIPS 180-4 / RFC 1321</span>
        </div>
      </div>

      {/* TAB 1: TEXT HASHING */}
      {activeTab === "text" && (
        <div className="flex flex-col gap-6">
          {/* Input Controls Card */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Text Input & Encoding Options
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Format:</span>
                <div className="flex bg-surface-raised p-0.5 rounded-lg border border-border">
                  <button
                    onClick={() => setFormat("lower")}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                      format === "lower" ? "bg-accent text-white" : "text-text-secondary"
                    }`}
                  >
                    hex (lower)
                  </button>
                  <button
                    onClick={() => setFormat("upper")}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                      format === "upper" ? "bg-accent text-white" : "text-text-secondary"
                    }`}
                  >
                    HEX (UPPER)
                  </button>
                  <button
                    onClick={() => setFormat("base64")}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                      format === "base64" ? "bg-accent text-white" : "text-text-secondary"
                    }`}
                  >
                    Base64
                  </button>
                </div>
              </div>
            </div>

            {/* Input Text Area */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <label className="font-semibold uppercase tracking-wider">String or Raw Data</label>
                <div className="flex items-center gap-3 text-text-muted font-mono">
                  <span>{inputText.length} chars</span>
                  <span>&bull;</span>
                  <span>{new TextEncoder().encode(inputText).length} bytes</span>
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to compute cryptographic hashes..."
                rows={3}
                className="w-full bg-surface-raised border border-border rounded-xl p-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent resize-y leading-relaxed"
              />
            </div>

            {/* Quick Test Presets & Encoding Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-text-muted font-medium">Presets:</span>
                {Object.entries(PRESET_TEXTS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setInputText(item.text)}
                    className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent/50 text-text-secondary hover:text-text-primary text-xs transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Encoding */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted font-medium">Input Encoding:</span>
                <select
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value as InputEncoding)}
                  className="bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="utf8">UTF-8 Text</option>
                  <option value="hex">Hex Bytes</option>
                  <option value="base64">Base64 Bytes</option>
                </select>
              </div>
            </div>

            {/* Keyed HMAC Settings Toggle */}
            <div className="pt-3 border-t border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enableHmac}
                    onChange={(e) => setEnableHmac(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary flex items-center gap-1.5 transition-colors">
                    <KeyRound className="w-3.5 h-3.5 text-accent" />
                    Keyed HMAC (Hash-based Message Authentication Code)
                  </span>
                </label>
                {enableHmac && (
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    HMAC Active
                  </span>
                )}
              </div>

              {enableHmac && (
                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                  <div className="relative flex-1">
                    <input
                      type={showHmacKey ? "text" : "password"}
                      placeholder="Enter secret HMAC signing key..."
                      value={hmacKey}
                      onChange={(e) => setHmacKey(e.target.value)}
                      className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowHmacKey(!showHmacKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showHmacKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={() => setHmacKey("super-secret-key-32-chars-long")}
                    className="px-2.5 py-2 rounded-lg bg-surface-raised hover:bg-surface border border-border text-xs text-text-secondary whitespace-nowrap"
                  >
                    Sample Key
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-2xl px-5 py-3 shadow-card">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-text-primary">
                {enableHmac ? "Keyed HMAC Digests" : "Cryptographic Hashes"}
              </span>
              <span className="text-xs text-text-muted font-mono">
                ({format.toUpperCase()} format)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyAllHashes(textHashes)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all shadow-sm"
              >
                {copiedKey === "all" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied All</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-accent" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
              <button
                onClick={() => downloadChecksum("sha256", "text-checksum")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-text-muted" />
                <span>Export .sha256</span>
              </button>
            </div>
          </div>

          {/* Hashes Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["sha256", "sha512", "md5", "sha1", "sha384", "crc32"] as HashAlgorithm[]).map((algo) => {
              const cfg = ALGORITHM_CONFIG[algo];
              const hashObj = textHashes ? textHashes[algo] : undefined;
              const displayVal = getDisplayHash(hashObj);

              return (
                <div
                  key={algo}
                  className={`bg-surface border rounded-2xl p-4 shadow-card flex flex-col justify-between gap-3 transition-all ${
                    algo === "sha256"
                      ? "border-accent/50 bg-gradient-to-br from-surface to-accent/5"
                      : "border-border hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">{cfg.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${cfg.badgeColor}`}>
                        {cfg.badge}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">
                      {hashObj?.bitLength || 0} bits &bull; {hashObj?.hexLower.length || 0} hex
                    </span>
                  </div>

                  {/* Hash Value Box */}
                  <div className="relative group">
                    <div className="bg-surface-raised border border-border rounded-xl p-3 font-mono text-xs text-text-primary break-all selection:bg-accent selection:text-white leading-relaxed min-h-[46px] flex items-center">
                      {displayVal || <span className="text-text-muted italic">Computing...</span>}
                    </div>
                  </div>

                  {/* Actions & Description */}
                  <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                    <span className="text-[11px] text-text-muted truncate max-w-[200px]">
                      {cfg.description}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Compare bridge */}
                      <button
                        onClick={() => bridgeToVerify(displayVal, "text")}
                        className="px-2 py-1 rounded bg-surface-raised hover:bg-surface border border-border text-[11px] text-text-secondary hover:text-accent flex items-center gap-1 transition-colors"
                        title="Verify / Compare this hash"
                      >
                        <Search className="w-3 h-3" />
                        <span>Verify</span>
                      </button>

                      {/* Copy button */}
                      <button
                        onClick={() => triggerCopy(displayVal, algo, `Copied ${cfg.label} hash`)}
                        className="p-1.5 rounded bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
                        title="Copy hash to clipboard"
                      >
                        {copiedKey === algo ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FILE CHECKSUM HASHING */}
      {activeTab === "file" && (
        <div className="flex flex-col gap-6">
          {/* File Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-border hover:border-accent bg-surface/60 hover:bg-surface-raised/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group shadow-card"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-text-primary">
              {selectedFile ? selectedFile.name : "Drag & Drop any file here to compute checksums"}
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-md leading-relaxed">
              100% Client-Side. Your file is processed directly in browser memory and never uploaded to any remote server.
            </p>
            {selectedFile && (
              <div className="flex items-center gap-3 mt-3 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-mono text-accent">
                <span>{formatFileSize(selectedFile.size)}</span>
                <span>&bull;</span>
                <span>{selectedFile.type || "binary"}</span>
              </div>
            )}
          </div>

          {/* Computing indicator */}
          {isFileComputing && (
            <div className="flex items-center justify-center gap-3 p-6 bg-surface border border-border rounded-2xl text-xs font-semibold text-accent animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Computing cryptographic file checksums (SHA-256, MD5, SHA-512)...</span>
            </div>
          )}

          {/* File Hashes Display */}
          {fileHashes && !isFileComputing && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-2xl px-5 py-3.5 shadow-card">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{selectedFile?.name}</h3>
                    <p className="text-xs text-text-muted font-mono mt-0.5">
                      {formatFileSize(selectedFile?.size || 0)} &bull; Integrity Checksums Generated
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyAllHashes(fileHashes)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5 text-accent" />
                    <span>Copy All</span>
                  </button>
                  <button
                    onClick={() => downloadChecksum("sha256", selectedFile?.name || "file")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-text-muted" />
                    <span>Download .sha256</span>
                  </button>
                  <button
                    onClick={() => downloadChecksum("md5", selectedFile?.name || "file")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-text-muted" />
                    <span>Download .md5</span>
                  </button>
                </div>
              </div>

              {/* Grid of Checksums */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["sha256", "md5", "sha512", "sha1", "crc32"] as HashAlgorithm[]).map((algo) => {
                  const cfg = ALGORITHM_CONFIG[algo];
                  const hashObj = fileHashes[algo];
                  return (
                    <div
                      key={algo}
                      className="bg-surface border border-border hover:border-border-hover rounded-2xl p-4 shadow-card flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary">{cfg.label}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${cfg.badgeColor}`}>
                            {cfg.badge}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">
                          {hashObj.bitLength} bits
                        </span>
                      </div>

                      <div className="bg-surface-raised border border-border rounded-xl p-3 font-mono text-xs text-text-primary break-all selection:bg-accent selection:text-white leading-relaxed">
                        {hashObj.hexLower}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                        <span className="text-[11px] text-text-muted truncate max-w-[200px]">
                          {cfg.description}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => bridgeToVerify(hashObj.hexLower, "file")}
                            className="px-2 py-1 rounded bg-surface-raised hover:bg-surface border border-border text-[11px] text-text-secondary hover:text-accent flex items-center gap-1 transition-colors"
                          >
                            <Search className="w-3 h-3" />
                            <span>Verify</span>
                          </button>
                          <button
                            onClick={() => triggerCopy(hashObj.hexLower, `file-${algo}`, `Copied file ${cfg.label}`)}
                            className="p-1.5 rounded bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
                          >
                            {copiedKey === `file-${algo}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERIFY & COMPARE INTEGRITY */}
      {activeTab === "verify" && (
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Checksum Verification & Integrity Comparison
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Target Source:</span>
                <div className="flex bg-surface-raised p-0.5 rounded-lg border border-border">
                  <button
                    onClick={() => setVerifySource("text")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      verifySource === "text" ? "bg-accent text-white" : "text-text-secondary"
                    }`}
                  >
                    Current Text
                  </button>
                  <button
                    onClick={() => setVerifySource("file")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      verifySource === "file" ? "bg-accent text-white" : "text-text-secondary"
                    }`}
                  >
                    Uploaded File ({selectedFile ? "Selected" : "None"})
                  </button>
                </div>
              </div>
            </div>

            {/* Expected Hash Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                <span>Expected Checksum / Hash</span>
                <span className="text-[10px] text-text-muted font-normal">
                  Paste hash from release page, vendor site, or sha256sum file
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste expected MD5, SHA-1, SHA-256, or SHA-512 hash..."
                  value={verifyExpected}
                  onChange={(e) => setVerifyExpected(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent pr-20"
                />
                {verifyExpected && (
                  <button
                    onClick={() => setVerifyExpected("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded bg-surface border border-border"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Test Samples */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-text-muted font-medium">Quick Verify Samples:</span>
              <button
                onClick={() => {
                  if (textHashes) setVerifyExpected(textHashes.sha256.hexLower);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold"
              >
                Match Current SHA-256
              </button>
              <button
                onClick={() => {
                  if (textHashes) setVerifyExpected(textHashes.md5.hexLower);
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold"
              >
                Match Current MD5
              </button>
              <button
                onClick={() => setVerifyExpected("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")}
                className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary"
              >
                Empty SHA-256
              </button>
              <button
                onClick={() => setVerifyExpected("0000000000000000000000000000000000000000000000000000000000000000")}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold"
              >
                Mismatched Hash
              </button>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verificationReport && (
            <div className="flex flex-col gap-4">
              {verificationReport.match ? (
                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-5 flex flex-col gap-3 shadow-lg shadow-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-emerald-400">
                        Integrity Verified: Perfect Match!
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5 font-medium">
                        The calculated {verificationReport.detectedAlgorithm?.toUpperCase()} hash matches the expected value byte-for-byte. The data is genuine and uncorrupted.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-surface rounded-xl border border-emerald-500/30 font-mono text-xs text-emerald-300 break-all">
                    {verificationReport.computedHash}
                  </div>
                </div>
              ) : (
                <div className="bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-5 flex flex-col gap-3 shadow-lg shadow-rose-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-rose-400">
                        Checksum Mismatch: Hash Does Not Match
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {verificationReport.message}
                      </p>
                    </div>
                  </div>

                  {verificationReport.computedHash && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 bg-surface rounded-xl border border-border flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-text-muted">
                          Computed ({verificationReport.detectedAlgorithm?.toUpperCase()})
                        </span>
                        <span className="text-text-primary break-all">
                          {verificationReport.computedHash}
                        </span>
                      </div>
                      <div className="p-3 bg-surface rounded-xl border border-rose-500/30 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-rose-400">
                          Expected Hash
                        </span>
                        <span className="text-rose-300 break-all">
                          {verificationReport.expectedHash}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Educational Guide & Security Reference */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-text-primary">
            Cryptographic Hash Function Standards & Use Cases
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-text-secondary leading-relaxed">
          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              SHA-256 & SHA-512 (Secure)
            </h3>
            <p>
              Part of the SHA-2 family defined in NIST FIPS 180-4. Currently collision-resistant with zero known practical collision attacks. Used in TLS, code signatures, blockchain proofs, and secure password hashing pipelines.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              MD5 & SHA-1 (Legacy / Non-Cryptographic)
            </h3>
            <p>
              Both MD5 and SHA-1 have known theoretical and practical collision attacks. They should <strong>never</strong> be used for digital signatures or password hashing. However, they remain excellent, fast checksums for verifying download integrity.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              HMAC (Keyed Authentication)
            </h3>
            <p>
              Hash-based Message Authentication Code (RFC 2104) combines a cryptographic hash with a secret shared key. It guarantees both data integrity and authentication (proving the message originated from a party with the secret key).
            </p>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
