"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ALL_TOOLS } from "@/lib/constants";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { processJSON } from "@/tools/developer/jsonFormatter";
import { Copy, Check, Code, FileCode, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";

export interface JSONFormatterViewProps {
  tool: ToolMeta;
}

export const JSONFormatterView: React.FC<JSONFormatterViewProps> = ({ tool }) => {
  const [inputJSON, setInputJSON] = useState<string>("");
  const [indent, setIndent] = useState<number>(2);
  const [mode, setMode] = useState<"formatted" | "minified">("formatted");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return processJSON(inputJSON, indent);
  }, [inputJSON, indent]);

  const displayedOutput = mode === "formatted" ? result.formattedText : result.minifiedText;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputJSON("");
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border p-4 rounded-xl shadow-card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-text-secondary">Indentation:</span>
          <div className="flex gap-1">
            {[2, 4].map((spaces) => (
              <button
                key={spaces}
                onClick={() => {
                  setIndent(spaces);
                  setMode("formatted");
                }}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  indent === spaces && mode === "formatted"
                    ? "bg-accent border-accent text-white font-semibold"
                    : "bg-surface-raised border-border text-text-secondary hover:text-text-primary"
                }`}
              >
                {spaces} Spaces
              </button>
            ))}
          </div>

          <Button
            variant={mode === "minified" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("minified")}
          >
            Minify JSON
          </Button>

          <Button variant="ghost" size="sm" onClick={handleClear} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
            Clear
          </Button>

          <button
            type="button"
            onClick={() => setInputJSON(`{\n  "name": "ToolVerse",\n  "status": "production",\n  "toolsCount": ${ALL_TOOLS.length},\n  "categories": ["finance", "developer", "pdf", "image"],\n  "isFree": true\n}`)}
            className="text-xs text-text-tertiary hover:text-accent font-medium px-2 py-1 transition-colors"
          >
            Sample
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time Status Indicator */}
          {inputJSON.trim() ? (
            result.isValid ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid JSON
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-semibold bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                <AlertTriangle className="w-3.5 h-3.5" /> Line {result.lineError}: Syntax Error
              </span>
            )
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? "Copied!" : "Copy Output"}
          </Button>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Input Textarea */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Code className="w-4 h-4 text-accent" /> Input Raw JSON
          </label>
          <textarea
            value={inputJSON}
            onChange={(e) => setInputJSON(e.target.value)}
            placeholder="Paste your JSON string here..."
            rows={18}
            className="w-full bg-surface border border-border rounded-xl p-4 font-mono text-xs text-text-primary outline-none focus:border-accent resize-y leading-relaxed shadow-card"
          />
        </div>

        {/* Output Render Code Block */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-400" /> Formatted Output
            </span>
            {result.itemCount !== undefined && result.isValid && (
              <span className="text-[11px] font-mono text-text-tertiary">
                {result.itemCount} Root Keys/Items
              </span>
            )}
          </label>

          <div className="relative w-full h-full min-h-[380px] bg-surface-raised border border-border rounded-xl p-4 overflow-auto font-mono text-xs leading-relaxed shadow-card">
            {!result.isValid && result.error ? (
              <div className="text-red-400 p-2 font-mono text-xs">
                <span className="font-bold block mb-1">❌ Syntax Error on Line {result.lineError}:</span>
                {result.error}
              </div>
            ) : (
              <pre className="text-text-primary whitespace-pre-wrap break-all">{displayedOutput}</pre>
            )}
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
