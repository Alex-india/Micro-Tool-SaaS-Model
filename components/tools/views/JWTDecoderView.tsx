"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { decodeJWT } from "@/tools/developer/jwtDecoder";
import { ShieldAlert, KeyRound, CheckCircle2, Clock, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface JWTDecoderViewProps {
  tool: ToolMeta;
}

export const JWTDecoderView: React.FC<JWTDecoderViewProps> = ({ tool }) => {
  const sampleToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  const [tokenInput, setTokenInput] = useState<string>("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const decoded = useMemo(() => decodeJWT(tokenInput), [tokenInput]);

  const copyToClipboard = (section: string, data: any) => {
    navigator.clipboard.writeText(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Security Banner Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-300">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <span>
          <strong>Client-Side Security Notice:</strong> JSON Web Tokens are decoded entirely inside your browser. Production tokens or credentials are never uploaded to any external server.
        </span>
      </div>

      {/* Token Input Panel */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-accent" /> Encoded JWT Token
          </span>
          <button
            onClick={() => setTokenInput(sampleToken)}
            className="text-xs text-accent hover:underline font-mono"
          >
            Load Sample Token
          </button>
        </label>
        <textarea
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Paste encoded JWT token (header.payload.signature)..."
          rows={3}
          className="w-full bg-surface border border-border rounded-xl p-4 font-mono text-xs text-text-primary outline-none focus:border-accent resize-y leading-relaxed shadow-card"
        />
      </div>

      {/* Error state */}
      {decoded.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono">
          ❌ {decoded.error}
        </div>
      )}

      {/* Decoded 3 Panels Side-by-Side */}
      {!decoded.error && decoded.header && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Header Panel */}
          <div className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                1. Header (Algorithm & Type)
              </span>
              <button
                onClick={() => copyToClipboard("header", decoded.header)}
                className="text-xs text-text-tertiary hover:text-text-primary flex items-center gap-1"
              >
                {copiedSection === "header" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="font-mono text-xs text-text-primary bg-surface-raised p-3 rounded-lg overflow-auto max-h-60 mt-2">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>

          {/* Payload Panel */}
          <div className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                2. Payload (Claims)
              </span>
              <button
                onClick={() => copyToClipboard("payload", decoded.payload)}
                className="text-xs text-text-tertiary hover:text-text-primary flex items-center gap-1"
              >
                {copiedSection === "payload" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {decoded.isExpired !== null && (
              <div
                className={`flex items-center gap-2 p-2 rounded text-xs font-medium ${
                  decoded.isExpired
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{decoded.expiresInText}</span>
              </div>
            )}

            <pre className="font-mono text-xs text-text-primary bg-surface-raised p-3 rounded-lg overflow-auto max-h-60 mt-2">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>

          {/* Signature Panel */}
          <div className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                3. Signature
              </span>
              <button
                onClick={() => copyToClipboard("sig", decoded.signature)}
                className="text-xs text-text-tertiary hover:text-text-primary flex items-center gap-1"
              >
                {copiedSection === "sig" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="font-mono text-xs text-text-secondary bg-surface-raised p-3 rounded-lg break-all max-h-60 mt-2">
              {decoded.signature || "Verified Signature String"}
            </div>
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
