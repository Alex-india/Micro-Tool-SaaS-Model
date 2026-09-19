"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  decodeJWT,
  verifyHMACSignature,
  signJWT,
  type JWTDecoded,
} from "@/tools/developer/jwtDecoder";
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Unlock,
  Wand2,
  RefreshCw,
  Terminal,
  FileCode,
  Calendar,
  User,
  Hash,
  Eye,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface JWTDecoderViewProps {
  tool: ToolMeta;
}

// Preset test tokens
const JWT_PRESETS = {
  standardUser: {
    label: "Standard User (Active)",
    secret: "your-256-bit-secret",
    // Active token with exp in 2030
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfODQ5MDIiLCJuYW1lIjoiQWxleCBSaXZlcmEiLCJlbWFpbCI6ImFsZXhAY29kZXIuY29tIiwicm9sZSI6ImRldmVsb3BlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyfQ.N6O9D7Pz5V3l3L3sL7gI74E2m_bZ1L5Y8k3rO7qS8t4",
  },
  expiredAdmin: {
    label: "Admin Token (Expired)",
    secret: "secret-admin-key",
    // Expired in 2017
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl8wMDEiLCJuYW1lIjoiU3VwZXIgQWRtaW4iLCJpc19hZG1pbiI6dHJ1ZSwiaWF0IjoxNTEwMDAwMDAwLCJleHAiOjE1MTYyMzkwMjJ9.Nvh90e1m2Z4t8k2a1L7mP9w3k6b8t4r2v9w1q7t5y8o",
  },
  bearerToken: {
    label: "Bearer Auth Header",
    secret: "your-256-bit-secret",
    token:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  },
  oauthOpenID: {
    label: "OAuth2 / Auth0 Style",
    secret: "auth0-super-secret",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgudG9vbHZlcnNlLmFwcC8iLCJzdWIiOiJhdXRoMHw2NTQzMjEiLCJhdWQiOiJodHRwczovL2FwaS50b29sdmVyc2UuYXBwL3YyIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDAsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0.qY4zK_b1jK8d2s3a4L7mP9w3k6b8t4r2v9w1q7t5y8o",
  },
};

export const JWTDecoderView: React.FC<JWTDecoderViewProps> = ({ tool }) => {
  const [tokenInput, setTokenInput] = useState<string>(
    JWT_PRESETS.standardUser.token
  );
  const [secretInput, setSecretInput] = useState<string>(
    JWT_PRESETS.standardUser.secret
  );
  const [isBase64Secret, setIsBase64Secret] = useState<boolean>(false);

  // Verification state
  const [signatureStatus, setSignatureStatus] = useState<
    "idle" | "verifying" | "valid" | "invalid"
  >("idle");
  const [sigError, setSigError] = useState<string>("");

  // Copy feedback
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Editable Header & Payload state for live re-signing
  const [editMode, setEditMode] = useState<boolean>(false);
  const [headerEditText, setHeaderEditText] = useState<string>("");
  const [payloadEditText, setPayloadEditText] = useState<string>("");

  // Decode the token
  const decoded: JWTDecoded = useMemo(() => {
    return decodeJWT(tokenInput);
  }, [tokenInput]);

  // Synchronize edit buffers when token changes
  useEffect(() => {
    if (decoded.isValid) {
      setHeaderEditText(JSON.stringify(decoded.header, null, 2));
      setPayloadEditText(JSON.stringify(decoded.payload, null, 2));
    }
  }, [decoded.isValid, decoded.header, decoded.payload]);

  // Live signature verification when token or secret changes
  useEffect(() => {
    if (!decoded.isValid || !secretInput.trim() || !decoded.signature) {
      setSignatureStatus("idle");
      setSigError("");
      return;
    }

    let isCancelled = false;
    setSignatureStatus("verifying");

    verifyHMACSignature(decoded.cleanToken, secretInput, isBase64Secret)
      .then((res) => {
        if (isCancelled) return;
        if (res.isValid) {
          setSignatureStatus("valid");
          setSigError("");
        } else {
          setSignatureStatus("invalid");
          setSigError(res.error || "Signature mismatch with provided secret key.");
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setSignatureStatus("invalid");
        setSigError(err.message || "Verification failed");
      });

    return () => {
      isCancelled = true;
    };
  }, [decoded.cleanToken, decoded.isValid, decoded.signature, secretInput, isBase64Secret]);

  // Re-sign token when edited
  const handleReSign = async () => {
    try {
      const parsedHeader = JSON.parse(headerEditText);
      const parsedPayload = JSON.parse(payloadEditText);
      const newToken = await signJWT(
        parsedHeader,
        parsedPayload,
        secretInput || "secret",
        isBase64Secret
      );
      setTokenInput(newToken);
      setToastMessage("Token re-signed successfully with updated claims!");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (e: any) {
      setToastMessage(`Cannot re-sign: ${e.message}`);
      setTimeout(() => setToastMessage(""), 3500);
    }
  };

  const copyToClipboard = (section: string, data: any) => {
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const loadPreset = (presetKey: keyof typeof JWT_PRESETS) => {
    const p = JWT_PRESETS[presetKey];
    setTokenInput(p.token);
    setSecretInput(p.secret);
    setToastMessage(`Loaded preset "${p.label}".`);
    setTimeout(() => setToastMessage(""), 2500);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Sibling Developer Tools Quick Navigator */}
      <div className="flex items-center gap-2 text-xs text-text-muted overflow-x-auto pb-1">
        <span className="font-medium text-text-primary">Related Developer Tools:</span>
        <Link
          href="/developer/jwt-decoder"
          className="px-2.5 py-1 rounded-lg border bg-accent/10 border-accent/30 text-accent font-semibold transition-colors flex items-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" />
          JWT Decoder
        </Link>
        <Link
          href="/developer/base64-decoder"
          className="px-2.5 py-1 rounded-lg border bg-surface border-border hover:border-accent/40 text-text-muted transition-colors flex items-center gap-1.5"
        >
          <FileCode className="w-3.5 h-3.5" />
          Base64 Decoder
        </Link>
        <Link
          href="/developer/json-validator"
          className="px-2.5 py-1 rounded-lg border bg-surface border-border hover:border-accent/40 text-text-muted transition-colors flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          JSON Validator
        </Link>
      </div>

      {/* Security Banner Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center gap-3 text-xs text-amber-300 shadow-card">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <span>
          <strong>100% Client-Side Privacy:</strong> Tokens and secrets are processed entirely inside your browser using the native Web Crypto API. Never sent across any network.
        </span>
      </div>

      {/* Presets Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-3.5 rounded-xl shadow-card">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Test Samples:
          </span>
          <button
            type="button"
            onClick={() => loadPreset("standardUser")}
            className="px-2.5 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium"
          >
            Active User
          </button>
          <button
            type="button"
            onClick={() => loadPreset("expiredAdmin")}
            className="px-2.5 py-1 text-xs bg-red-500/10 border border-red-500/30 hover:border-red-500/50 rounded text-red-400 transition-colors font-medium flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            Expired Token
          </button>
          <button
            type="button"
            onClick={() => loadPreset("bearerToken")}
            className="px-2.5 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium hidden sm:inline"
          >
            Bearer Header
          </button>
          <button
            type="button"
            onClick={() => loadPreset("oauthOpenID")}
            className="px-2.5 py-1 text-xs bg-accent/10 border border-accent/20 rounded text-accent hover:bg-accent/20 transition-colors font-medium hidden md:inline"
          >
            OAuth2 / Auth0
          </button>
        </div>

        <div className="flex items-center gap-2">
          {tokenInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTokenInput("");
                setSecretInput("");
              }}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
            >
              Clear
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => copyToClipboard("fullToken", tokenInput)}
            disabled={!tokenInput}
            leftIcon={
              copiedSection === "fullToken" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )
            }
          >
            {copiedSection === "fullToken" ? "Copied Token!" : "Copy Token"}
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encoded Token Input Panel with Color-Coding Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
          <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-text-primary text-[11px]">
            <KeyRound className="w-4 h-4 text-accent" /> Encoded JWT Token
          </label>
          <span className="text-[11px] font-mono text-text-muted">
            Format:{" "}
            <strong className="text-rose-400">Header</strong>.
            <strong className="text-purple-400">Payload</strong>.
            <strong className="text-sky-400">Signature</strong>
          </span>
        </div>

        <div className="relative w-full bg-[#0c1017] border border-border rounded-xl shadow-card overflow-hidden focus-within:border-accent transition-colors">
          <textarea
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste encoded JWT token (header.payload.signature or Bearer eyJ...)..."
            rows={4}
            className="w-full bg-transparent p-4 font-mono text-xs text-text-primary outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Color-Coded Token Segment Pill Display */}
        {decoded.isValid && (
          <div className="p-3 bg-surface border border-border rounded-xl font-mono text-xs break-all leading-relaxed shadow-card">
            <span className="text-rose-400 font-bold" title="Header segment">
              {decoded.parts.rawHeader}
            </span>
            <span className="text-text-muted">.</span>
            <span className="text-purple-400 font-bold" title="Payload claims segment">
              {decoded.parts.rawPayload}
            </span>
            <span className="text-text-muted">.</span>
            <span className="text-sky-400 font-bold" title="Signature segment">
              {decoded.parts.rawSignature || "(unsigned)"}
            </span>
          </div>
        )}
      </div>

      {/* Error state */}
      {!decoded.isValid && decoded.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <strong className="font-bold text-sm">Failed to Parse JWT:</strong>
            <span className="font-mono">{decoded.error}</span>
          </div>
        </div>
      )}

      {/* Live Status Metric Bar */}
      {decoded.isValid && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface border border-border rounded-xl shadow-card text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {decoded.isExpired === false && (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Token Active ({decoded.expiresInText})
              </span>
            )}
            {decoded.isExpired === true && (
              <span className="inline-flex items-center gap-1.5 font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <Clock className="w-4 h-4" /> Token Expired ({decoded.expiresInText})
              </span>
            )}
            {decoded.isExpired === null && (
              <span className="inline-flex items-center gap-1.5 font-bold text-text-muted bg-surface-raised px-3 py-1 rounded-full border border-border">
                No Expiry Claim (<code>exp</code>)
              </span>
            )}

            {/* Signature Status Badge */}
            {signatureStatus === "valid" && (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" /> Signature Verified
              </span>
            )}
            {signatureStatus === "invalid" && (
              <span className="inline-flex items-center gap-1.5 font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <ShieldAlert className="w-4 h-4" /> Invalid Signature
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted flex-wrap">
            <span>
              Algorithm: <strong className="text-accent">{decoded.algorithm}</strong>
            </span>
            <span>•</span>
            <span>
              Type: <strong className="text-text-primary">{decoded.tokenType}</strong>
            </span>
            <span>•</span>
            <span>
              Claims: <strong className="text-text-primary">{decoded.payload ? Object.keys(decoded.payload).length : 0}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3 Core Interactive Panels */}
      {decoded.isValid && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* 1. HEADER PANEL */}
          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                1. Header (Algorithm & Typ)
              </span>
              <button
                onClick={() => copyToClipboard("header", headerEditText)}
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                title="Copy Header JSON"
              >
                {copiedSection === "header" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <textarea
              value={headerEditText}
              onChange={(e) => setHeaderEditText(e.target.value)}
              rows={8}
              className="w-full bg-[#0c1017] border border-border rounded-lg p-3 font-mono text-xs text-rose-300 leading-relaxed outline-none focus:border-rose-400 resize-y"
              spellCheck={false}
            />

            <div className="mt-auto pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-text-muted">
              <span>Alg: <strong>{decoded.algorithm}</strong></span>
              <span>Typ: <strong>{decoded.tokenType}</strong></span>
            </div>
          </div>

          {/* 2. PAYLOAD PANEL */}
          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                2. Payload (Claims & Data)
              </span>
              <button
                onClick={() => copyToClipboard("payload", payloadEditText)}
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                title="Copy Payload JSON"
              >
                {copiedSection === "payload" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <textarea
              value={payloadEditText}
              onChange={(e) => setPayloadEditText(e.target.value)}
              rows={8}
              className="w-full bg-[#0c1017] border border-border rounded-lg p-3 font-mono text-xs text-purple-300 leading-relaxed outline-none focus:border-purple-400 resize-y"
              spellCheck={false}
            />

            <div className="mt-auto pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-text-muted">
              <span>{decoded.payload ? Object.keys(decoded.payload).length : 0} claims detected</span>
              <button
                onClick={handleReSign}
                className="text-accent hover:underline font-medium flex items-center gap-1"
                title="Re-sign token with edited payload"
              >
                <RefreshCw className="w-3 h-3" /> Re-Sign Token
              </button>
            </div>
          </div>

          {/* 3. SIGNATURE & VERIFICATION PANEL */}
          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                3. Verify Signature
              </span>
              <button
                onClick={() => copyToClipboard("sig", decoded.signature)}
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                title="Copy Signature String"
              >
                {copiedSection === "sig" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium text-text-secondary">
                HMAC Secret Key (for {decoded.algorithm}):
              </label>
              <input
                type="text"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="Enter 256-bit secret key to verify..."
                className="w-full bg-[#0c1017] border border-border rounded-lg p-2.5 font-mono text-xs text-text-primary outline-none focus:border-sky-400"
              />

              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-muted mt-1">
                <input
                  type="checkbox"
                  checked={isBase64Secret}
                  onChange={(e) => setIsBase64Secret(e.target.checked)}
                  className="accent-accent w-3.5 h-3.5 rounded"
                />
                <span>Secret is base64 encoded</span>
              </label>
            </div>

            {/* Signature status message */}
            <div className="mt-2">
              {signatureStatus === "valid" ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Signature Verified! The token has not been tampered with.</span>
                </div>
              ) : signatureStatus === "invalid" ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-1 text-xs text-red-400">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Signature Verification Failed</span>
                  </div>
                  <span className="text-[11px] text-red-300/80">{sigError}</span>
                </div>
              ) : (
                <div className="p-3 bg-surface-raised border border-border rounded-lg text-xs text-text-muted">
                  Enter secret key above to verify HMAC-SHA256 signature in real time.
                </div>
              )}
            </div>

            <div className="mt-auto pt-2 border-t border-border/50">
              <Button
                variant="primary"
                size="sm"
                onClick={handleReSign}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Sign Token with Secret
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Claims Inspector Table */}
      {decoded.isValid && decoded.payload && (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" /> Standard Registered Claims (RFC 7519)
            </span>
            <span className="text-[11px] text-text-muted font-mono">
              Auto-converted human dates & security checks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Expiry Claim */}
            <div className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-text-muted flex items-center justify-between">
                <span>Expiration Time (<code>exp</code>)</span>
                {decoded.expiresAtInfo && (
                  <span
                    className={`font-bold ${
                      decoded.isExpired ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {decoded.isExpired ? "Expired" : "Active"}
                  </span>
                )}
              </span>
              {decoded.expiresAtInfo ? (
                <div className="flex flex-col gap-0.5 mt-1 font-mono text-[11px]">
                  <span className="text-text-primary font-bold">
                    {decoded.expiresAtInfo.utc}
                  </span>
                  <span className="text-text-muted">
                    Local: {decoded.expiresAtInfo.local}
                  </span>
                  <span className="text-accent font-semibold">
                    {decoded.expiresAtInfo.relative}
                  </span>
                </div>
              ) : (
                <span className="text-text-muted italic text-[11px] mt-1">
                  Not set in token
                </span>
              )}
            </div>

            {/* Issued At Claim */}
            <div className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-text-muted">
                Issued At (<code>iat</code>)
              </span>
              {decoded.issuedAtInfo ? (
                <div className="flex flex-col gap-0.5 mt-1 font-mono text-[11px]">
                  <span className="text-text-primary font-bold">
                    {decoded.issuedAtInfo.utc}
                  </span>
                  <span className="text-text-muted">
                    Local: {decoded.issuedAtInfo.local}
                  </span>
                  <span className="text-accent font-semibold">
                    {decoded.issuedAtInfo.relative}
                  </span>
                </div>
              ) : (
                <span className="text-text-muted italic text-[11px] mt-1">
                  Not set in token
                </span>
              )}
            </div>

            {/* Subject Claim */}
            <div className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-text-muted">
                Subject (<code>sub</code>)
              </span>
              <span className="text-text-primary font-mono text-[11px] mt-1 break-all font-bold">
                {decoded.payload.sub || (
                  <span className="text-text-muted italic font-normal">Not specified</span>
                )}
              </span>
            </div>

            {/* Issuer Claim */}
            <div className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-text-muted">
                Issuer (<code>iss</code>)
              </span>
              <span className="text-text-primary font-mono text-[11px] mt-1 break-all font-bold">
                {decoded.payload.iss || (
                  <span className="text-text-muted italic font-normal">Not specified</span>
                )}
              </span>
            </div>

            {/* Audience Claim */}
            <div className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-text-muted">
                Audience (<code>aud</code>)
              </span>
              <span className="text-text-primary font-mono text-[11px] mt-1 break-all font-bold">
                {Array.isArray(decoded.payload.aud)
                  ? decoded.payload.aud.join(", ")
                  : decoded.payload.aud || (
                      <span className="text-text-muted italic font-normal">Not specified</span>
                    )}
              </span>
            </div>

            {/* Not Before Claim */}
            <div className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-text-muted">
                Not Before (<code>nbf</code>)
              </span>
              {decoded.notBeforeInfo ? (
                <div className="flex flex-col gap-0.5 mt-1 font-mono text-[11px]">
                  <span className="text-text-primary font-bold">
                    {decoded.notBeforeInfo.utc}
                  </span>
                  <span className="text-text-muted">
                    {decoded.notBeforeInfo.relative}
                  </span>
                </div>
              ) : (
                <span className="text-text-muted italic text-[11px] mt-1">
                  Not set in token
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
