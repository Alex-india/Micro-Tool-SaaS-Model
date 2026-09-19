"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ALL_TOOLS } from "@/lib/constants";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  processJSON,
  repairJSONString,
  highlightJSONToHTML,
  validateJSON,
  validateJSONSchema,
  type JSONValidationReport,
  type JSONValidationIssue,
  type JSONSchemaValidationResult,
} from "@/tools/developer/jsonFormatter";
import {
  Copy,
  Check,
  Code,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  Wand2,
  ArrowUpDown,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Search,
  FileJson,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ListTree,
  FileCheck,
  Hash,
} from "lucide-react";

export interface JSONFormatterViewProps {
  tool: ToolMeta;
}

// Preset test samples
const SAMPLE_PRESETS: Record<
  string,
  { label: string; description: string; json: string }
> = {
  appConfig: {
    label: "Valid Config",
    description: "RFC 8259 compliant clean JSON with URLs and booleans",
    json: JSON.stringify(
      {
        appName: "ToolVerse Studio",
        version: "2.5.0",
        isProduction: true,
        environment: "cloud",
        toolsCount: ALL_TOOLS.length,
        apiUrl: "https://api.toolverse.app/v2/developer",
        features: {
          offlineMode: true,
          webAssembly: true,
          zeroDataCollection: true,
          supportedFormats: ["json", "csv", "pdf", "mp4", "mp3", "srt", "vtt"],
        },
        metadata: {
          owner: "ToolVerse Developer Team",
          license: "MIT",
          updatedAt: "2026-09-19T10:30:00Z",
        },
      },
      null,
      2
    ),
  },
  brokenJson: {
    label: "Broken Syntax",
    description: "Contains comments, single quotes, unquoted keys, and trailing commas",
    json: `{\n  // User API payload with multiple RFC 8259 violations\n  'serviceName': 'payment-gateway',\n  environment: 'staging',\n  enabled: True,\n  apiKey: None,\n  retryDelaysMs: [100, 250, 500,],\n  transactionId: 999999999999999999999,\n  "callbackUrl": "https://api.gateway.com/webhook",\n}`,
  },
  duplicateKeys: {
    label: "Duplicate Keys",
    description: "Contains repeated object keys to test RFC 8259 Section 4 warning",
    json: `{\n  "service": "auth-service",\n  "port": 8080,\n  "service": "duplicate-service",\n  "nested": {\n    "timeout": 30,\n    "timeout": 60\n  }\n}`,
  },
  pythonDict: {
    label: "Python Dict",
    description: "Python dictionary syntax with True, False, None, and single quotes",
    json: `{\n  'username': 'alex_coder',\n  'is_admin': True,\n  'is_banned': False,\n  'session_token': None,\n  'preferences': {\n    'theme': 'dark',\n    'email_notifications': True,\n  },\n}`,
  },
  urlPayload: {
    label: "URLs & Escapes",
    description: "Valid JSON with web URLs and quotes inside strings (no false positives)",
    json: JSON.stringify(
      {
        site: "https://toolverse.app",
        endpoints: [
          "https://api.toolverse.app/v1/auth/login",
          "https://api.toolverse.app/v1/tools/execute",
          "https://cdn.toolverse.app/assets/logo.png",
        ],
        quoteExample: "It's completely safe and doesn't fail on apostrophes",
        regexCode: "/* not a comment inside string */",
      },
      null,
      2
    ),
  },
};

// Default JSON Schema sample for the Schema Tab
const DEFAULT_SAMPLE_SCHEMA = JSON.stringify(
  {
    type: "object",
    required: ["appName", "version", "isProduction"],
    properties: {
      appName: { type: "string", minLength: 3 },
      version: { type: "string" },
      isProduction: { type: "boolean" },
      toolsCount: { type: "integer", minimum: 1 },
      apiUrl: { type: "string" },
    },
  },
  null,
  2
);

// Interactive Collapsible Tree Node Component
const JSONTreeNode: React.FC<{
  keyName?: string;
  value: any;
  depth?: number;
  searchFilter?: string;
}> = ({ keyName, value, depth = 0, searchFilter = "" }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(depth < 2);
  const [copiedVal, setCopiedVal] = useState(false);

  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);

  const handleCopyVal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const str = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(str);
    setCopiedVal(true);
    setTimeout(() => setCopiedVal(false), 1500);
  };

  const filterMatch = useMemo(() => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    if (keyName && keyName.toLowerCase().includes(q)) return true;
    if (!isObject && String(value).toLowerCase().includes(q)) return true;
    if (isObject) {
      try {
        return JSON.stringify(value).toLowerCase().includes(q);
      } catch {
        return true;
      }
    }
    return false;
  }, [keyName, value, isObject, searchFilter]);

  if (!filterMatch) return null;

  if (isObject) {
    const keys = Object.keys(value);
    const count = keys.length;
    const badgeText = isArray ? `[${count} items]` : `{${count} keys}`;

    return (
      <div className="flex flex-col text-xs font-mono select-none my-0.5">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-surface-raised/80 cursor-pointer group transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
          )}

          {keyName !== undefined && (
            <span className="text-sky-400 font-semibold">{keyName}:</span>
          )}

          <span className="text-text-muted text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border">
            {badgeText}
          </span>

          <button
            onClick={handleCopyVal}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-accent ml-auto transition-opacity"
            title="Copy branch"
          >
            {copiedVal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {isExpanded && (
          <div className="pl-4 border-l border-border/50 ml-2.5 flex flex-col">
            {keys.map((k) => (
              <JSONTreeNode
                key={k}
                keyName={isArray ? undefined : k}
                value={value[k]}
                depth={depth + 1}
                searchFilter={searchFilter}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Primitive value
  let valueColor = "text-amber-400"; // number
  let displayValue = String(value);

  if (typeof value === "string") {
    valueColor = "text-emerald-400";
    displayValue = `"${value}"`;
  } else if (typeof value === "boolean") {
    valueColor = "text-purple-400 font-medium";
  } else if (value === null) {
    valueColor = "text-rose-400 font-medium";
    displayValue = "null";
  }

  return (
    <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-surface-raised/60 text-xs font-mono group transition-colors">
      <span className="w-3.5" />
      {keyName !== undefined && (
        <span className="text-sky-400 font-semibold">{keyName}:</span>
      )}
      <span className={`${valueColor} break-all select-text`}>{displayValue}</span>

      <button
        onClick={handleCopyVal}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-accent ml-auto transition-opacity"
        title="Copy value"
      >
        {copiedVal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
};

export const JSONFormatterView: React.FC<JSONFormatterViewProps> = ({ tool }) => {
  const isValidatorSlug = tool.slug === "json-validator";
  const isMinifierSlug = tool.slug === "json-minifier";

  const [inputJSON, setInputJSON] = useState<string>("");
  const [indent, setIndent] = useState<number | "tab">(2);
  const [mode, setMode] = useState<"formatted" | "minified">(
    isMinifierSlug ? "minified" : "formatted"
  );
  const [viewTab, setViewTab] = useState<"diagnostics" | "code" | "tree" | "schema">(
    isValidatorSlug ? "diagnostics" : "code"
  );
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [treeSearch, setTreeSearch] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [repairNotice, setRepairNotice] = useState<string>("");
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  // Schema Validation States
  const [schemaText, setSchemaText] = useState<string>(DEFAULT_SAMPLE_SCHEMA);
  const [schemaResult, setSchemaResult] = useState<JSONSchemaValidationResult | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Process JSON for formatting/minifying
  const result = useMemo(() => {
    return processJSON(inputJSON, {
      indent,
      sortKeys,
    });
  }, [inputJSON, indent, sortKeys]);

  // Run deep validation
  const validationReport: JSONValidationReport = useMemo(() => {
    return validateJSON(inputJSON);
  }, [inputJSON]);

  // Synchronize Schema Validation
  useEffect(() => {
    if (!validationReport.isValid || !validationReport.parsedData || !schemaText.trim()) {
      setSchemaResult(null);
      return;
    }
    try {
      const parsedSchema = JSON.parse(schemaText);
      const res = validateJSONSchema(validationReport.parsedData, parsedSchema);
      setSchemaResult(res);
    } catch {
      setSchemaResult({
        isValid: false,
        errors: [{ path: "$schema", keyword: "syntax", message: "Invalid JSON Schema syntax" }],
      });
    }
  }, [validationReport.isValid, validationReport.parsedData, schemaText]);

  const displayedOutput =
    mode === "formatted" ? result.formattedText : result.minifiedText;

  // Syntax highlighted HTML for the code block
  const highlightedCodeHtml = useMemo(() => {
    if (!result.isValid || !displayedOutput) return "";
    return highlightJSONToHTML(displayedOutput);
  }, [displayedOutput, result.isValid]);

  // Lines calculation
  const linesArray = useMemo(() => {
    if (!inputJSON) return [1];
    return inputJSON.split("\n").map((_, i) => i + 1);
  }, [inputJSON]);

  // Error lines set for gutter highlight
  const errorLinesSet = useMemo(() => {
    const set = new Set<number>();
    validationReport.issues.forEach((i) => {
      if (i.type === "error") set.add(i.line);
    });
    return set;
  }, [validationReport.issues]);

  // Warning lines set for gutter highlight
  const warningLinesSet = useMemo(() => {
    const set = new Set<number>();
    validationReport.issues.forEach((i) => {
      if (i.type === "warning") set.add(i.line);
    });
    return set;
  }, [validationReport.issues]);

  // Synchronize gutter scrolling with textarea
  const handleTextareaScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Jump to specific error line in editor
  const handleJumpToLine = (lineNumber: number) => {
    setHighlightedLine(lineNumber);
    if (textareaRef.current) {
      const lines = inputJSON.split("\n");
      let charIndex = 0;
      for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
        charIndex += lines[i].length + 1;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(charIndex, charIndex + (lines[lineNumber - 1]?.length || 0));

      // Scroll line into view
      const lineHeight = 19.5; // approx px per line
      textareaRef.current.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
    }
    setTimeout(() => setHighlightedLine(null), 3000);
  };

  const handleCopy = () => {
    if (!displayedOutput) return;
    navigator.clipboard.writeText(displayedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputJSON("");
    setRepairNotice("");
    setHighlightedLine(null);
  };

  const handleAutoRepair = () => {
    if (!inputJSON.trim()) return;
    const repaired = repairJSONString(inputJSON);
    setInputJSON(repaired);
    setRepairNotice("JSON syntax repaired (comments, quotes, keys, trailing commas, and Python literals fixed).");
    setTimeout(() => setRepairNotice(""), 3500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputJSON(text);
        setRepairNotice(`Loaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
        setTimeout(() => setRepairNotice(""), 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = () => {
    if (!displayedOutput) return;
    const blob = new Blob([displayedOutput], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "minified" ? "minified.json" : "formatted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const loadPreset = (presetKey: string) => {
    const item = SAMPLE_PRESETS[presetKey];
    if (item) {
      setInputJSON(item.json);
      setRepairNotice(`Loaded "${item.label}" sample.`);
      setTimeout(() => setRepairNotice(""), 2500);
    }
  };

  const inputLineCount = linesArray.length;
  const outputLineCount = useMemo(() => {
    if (!displayedOutput) return 1;
    return displayedOutput.split("\n").length;
  }, [displayedOutput]);

  const errorCount = validationReport.issues.filter((i) => i.type === "error").length;
  const warningCount = validationReport.issues.filter((i) => i.type === "warning").length;

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Sibling Developer Tools Quick Navigator */}
      <div className="flex items-center gap-2 text-xs text-text-muted overflow-x-auto pb-1">
        <span className="font-medium text-text-primary">Related Modes:</span>
        <Link
          href="/developer/json-validator"
          className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
            tool.slug === "json-validator"
              ? "bg-accent/10 border-accent/30 text-accent font-semibold"
              : "bg-surface border-border hover:border-accent/40 text-text-muted"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          JSON Validator
        </Link>
        <Link
          href="/developer/json-formatter"
          className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
            tool.slug === "json-formatter"
              ? "bg-accent/10 border-accent/30 text-accent font-semibold"
              : "bg-surface border-border hover:border-accent/40 text-text-muted"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          JSON Formatter
        </Link>
        <Link
          href="/developer/json-minifier"
          className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
            tool.slug === "json-minifier"
              ? "bg-accent/10 border-accent/30 text-accent font-semibold"
              : "bg-surface border-border hover:border-accent/40 text-text-muted"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          JSON Minifier
        </Link>
      </div>

      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border p-4 rounded-xl shadow-card">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Indentation Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Indent:
            </span>
            <div className="flex items-center bg-surface-raised border border-border rounded-lg p-0.5 text-xs">
              {[2, 4].map((spaces) => (
                <button
                  key={spaces}
                  onClick={() => {
                    setIndent(spaces);
                    setMode("formatted");
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    indent === spaces && mode === "formatted"
                      ? "bg-accent text-white shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {spaces} Sp
                </button>
              ))}
              <button
                onClick={() => {
                  setIndent("tab");
                  setMode("formatted");
                }}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  indent === "tab" && mode === "formatted"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Tab
              </button>
              <button
                onClick={() => setMode("minified")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  mode === "minified"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Minify
              </button>
            </div>
          </div>

          {/* Sort Keys Toggle */}
          <Button
            variant={sortKeys ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSortKeys(!sortKeys)}
            leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
            title="Sort object keys alphabetically A-Z"
          >
            Sort Keys A-Z
          </Button>

          {/* Auto-Repair Button */}
          {inputJSON.trim() && !validationReport.isValid && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAutoRepair}
              leftIcon={<Wand2 className="w-3.5 h-3.5 text-amber-300" />}
              className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500 animate-pulse"
              title="Automatically fix comments, quotes, keys, trailing commas, and Python literals"
            >
              Auto-Fix Syntax
            </Button>
          )}

          {/* Preset Samples */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-text-muted mr-0.5 hidden sm:inline">Samples:</span>
            <button
              type="button"
              onClick={() => loadPreset("appConfig")}
              className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium"
              title="Clean valid JSON sample"
            >
              Valid Config
            </button>
            <button
              type="button"
              onClick={() => loadPreset("brokenJson")}
              className="px-2 py-1 text-xs bg-red-500/10 border border-red-500/30 hover:border-red-500/50 rounded text-red-400 transition-colors font-medium flex items-center gap-1"
              title="Broken JSON sample with multiple RFC 8259 syntax errors"
            >
              <AlertTriangle className="w-3 h-3" />
              Broken Syntax
            </button>
            <button
              type="button"
              onClick={() => loadPreset("duplicateKeys")}
              className="px-2 py-1 text-xs bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 rounded text-amber-400 transition-colors font-medium"
              title="Sample with duplicate keys to test RFC 8259 Section 4"
            >
              Duplicate Keys
            </button>
            <button
              type="button"
              onClick={() => loadPreset("urlPayload")}
              className="px-2 py-1 text-xs bg-surface-raised border border-border hover:border-accent/40 rounded text-text-primary transition-colors font-medium hidden md:inline"
              title="Sample with web URLs and quotes inside strings"
            >
              URLs & Strings
            </button>
          </div>
        </div>

        {/* Right side toolbar actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt,application/json"
            onChange={handleFileUpload}
            className="hidden"
            id="json-file-upload"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            title="Upload JSON file"
          >
            Upload
          </Button>

          {inputJSON && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
              title="Clear editor"
            >
              Clear
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={!displayedOutput}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={!displayedOutput || !validationReport.isValid}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download
          </Button>
        </div>
      </div>

      {/* Repair Notification Toast */}
      {repairNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{repairNotice}</span>
        </div>
      )}

      {/* Validation Banner & Stats Chips */}
      {inputJSON.trim() ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface border border-border rounded-xl shadow-card text-xs">
          <div className="flex items-center gap-2">
            {validationReport.isValid ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Valid JSON (RFC 8259 Compliant)
              </span>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  <AlertTriangle className="w-4 h-4" />
                  {errorCount} Syntax Error{errorCount === 1 ? "" : "s"} Detected
                </span>
                <button
                  onClick={handleAutoRepair}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" /> Auto-Fix syntax errors
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          {validationReport.isValid && (
            <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted flex-wrap">
              <span>
                Root: <strong className="text-text-primary capitalize">{validationReport.stats.rootType}</strong>
              </span>
              <span>•</span>
              <span>
                Items: <strong className="text-text-primary">{validationReport.stats.itemCount}</strong>
              </span>
              <span>•</span>
              <span>
                Depth: <strong className="text-text-primary">{validationReport.stats.depth} levels</strong>
              </span>
              <span>•</span>
              <span>
                Formatted: <strong className="text-text-primary">{result.formattedSize.toLocaleString()} B</strong>
              </span>
              <span>•</span>
              <span>
                Minified: <strong className="text-emerald-400">{result.minifiedSize.toLocaleString()} B</strong>
                {result.savingsPercent ? ` (-${result.savingsPercent}%)` : ""}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {/* Main Two-Column Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT COLUMN: Input Textarea with Line Numbers Gutter */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
            <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-text-primary text-[11px]">
              <Code className="w-4 h-4 text-accent" /> Input Raw JSON
            </label>
            <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
              {errorCount > 0 && (
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                  {errorCount} Error{errorCount === 1 ? "" : "s"}
                </span>
              )}
              <span>
                {inputLineCount} lines • {inputJSON.length.toLocaleString()} chars
              </span>
            </div>
          </div>

          {/* Code Editor Container with Synchronized Line Gutter */}
          <div className="relative w-full h-full min-h-[520px] bg-[#0c1017] border border-border rounded-xl shadow-card flex flex-row overflow-hidden focus-within:border-accent transition-colors">
            {/* Synchronized Line Numbers Gutter */}
            <div
              ref={gutterRef}
              className="w-12 shrink-0 select-none py-3.5 bg-[#080c12] border-r border-border/60 text-right pr-2 font-mono text-[11px] text-text-muted/40 overflow-hidden leading-[19.5px]"
              aria-hidden="true"
            >
              {linesArray.map((lineNum) => {
                const hasError = errorLinesSet.has(lineNum);
                const hasWarning = warningLinesSet.has(lineNum);
                const isTarget = highlightedLine === lineNum;

                let cls = "text-text-muted/40";
                let marker = null;

                if (hasError) {
                  cls = "text-red-400 font-bold bg-red-500/20 px-0.5 rounded";
                  marker = <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1" />;
                } else if (hasWarning) {
                  cls = "text-amber-400 font-bold bg-amber-500/20 px-0.5 rounded";
                  marker = <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />;
                } else if (isTarget) {
                  cls = "text-accent font-bold bg-accent/20 px-0.5 rounded";
                }

                return (
                  <div key={lineNum} className={`flex items-center justify-end ${cls}`}>
                    {marker}
                    <span>{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={inputJSON}
              onChange={(e) => setInputJSON(e.target.value)}
              onScroll={handleTextareaScroll}
              placeholder="Paste raw, unformatted, or broken JSON to validate, lint, and repair..."
              rows={24}
              className="flex-1 w-full h-full bg-transparent p-3.5 font-mono text-xs text-text-primary leading-[19.5px] outline-none resize-none placeholder:text-text-muted/40 overflow-y-auto whitespace-pre"
              aria-label="Input raw JSON text"
              spellCheck={false}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Output Render (Diagnostics / Code / Tree / Schema Tabs) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold uppercase tracking-wider text-text-primary text-[11px]">
                {viewTab === "diagnostics"
                  ? "Validation Diagnostics"
                  : viewTab === "code"
                  ? mode === "formatted"
                    ? "Formatted Code"
                    : "Minified Code"
                  : viewTab === "tree"
                  ? "Interactive Tree"
                  : "JSON Schema Validator"}
              </span>
            </div>

            {/* View Tab Switcher */}
            <div className="flex items-center bg-surface-raised border border-border rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setViewTab("diagnostics")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  viewTab === "diagnostics"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Diagnostics
                {errorCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                )}
              </button>

              <button
                onClick={() => setViewTab("code")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  viewTab === "code"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Code ({outputLineCount}L)
              </button>

              <button
                onClick={() => setViewTab("tree")}
                disabled={!validationReport.isValid || !inputJSON.trim()}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  viewTab === "tree"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <ListTree className="w-3.5 h-3.5" />
                Tree
              </button>

              <button
                onClick={() => setViewTab("schema")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  viewTab === "schema"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                Schema
              </button>
            </div>
          </div>

          {/* Right Pane Body */}
          <div className="relative w-full h-full min-h-[520px] bg-surface-raised border border-border rounded-xl shadow-card flex flex-col overflow-hidden">
            {/* 1. DIAGNOSTICS TAB */}
            {viewTab === "diagnostics" && (
              <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[600px]">
                {!inputJSON.trim() ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted gap-3">
                    <FileJson className="w-10 h-10 text-text-muted/40" />
                    <div>
                      <p className="font-semibold text-text-primary text-xs">Ready for Validation</p>
                      <p className="text-[11px] text-text-muted mt-1">
                        Paste JSON on the left or choose a preset sample above to run RFC 8259 syntax validation.
                      </p>
                    </div>
                  </div>
                ) : validationReport.isValid ? (
                  /* VALID STATE */
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-emerald-400 text-xs">
                          ✓ Valid JSON (RFC 8259 Standard Compliant)
                        </span>
                        <p className="text-xs text-text-primary/90 leading-relaxed">
                          The JSON structure is strictly valid. It can be safely parsed by standard JSON parsers across all APIs, databases, and microservices.
                        </p>
                      </div>
                    </div>

                    {/* Warnings (Duplicate Keys, Precision Loss) */}
                    {validationReport.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-amber-400 font-semibold flex-wrap">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Advisory: {issue.code}</span>
                          </div>
                          <button
                            onClick={() => handleJumpToLine(issue.line)}
                            className="text-[11px] font-mono text-amber-400/90 underline hover:text-amber-300"
                          >
                            Line {issue.line}, Column {issue.column}
                          </button>
                        </div>
                        <p className="text-amber-300/90 leading-relaxed">{issue.message}</p>
                        {issue.suggestion && (
                          <span className="text-[11px] text-text-muted">
                            💡 Recommendation: {issue.suggestion}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* RFC 8259 Specification Checklist */}
                    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        RFC 8259 Specification Checklist
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-text-primary">Double-quoted keys & strings</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-text-primary">No trailing commas</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-text-primary">No illegal comments</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-text-primary">Lowercase true / false / null</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-text-primary">Valid bracket & brace hierarchy</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-text-primary">
                            {validationReport.duplicateKeys.length === 0
                              ? "No duplicate object keys"
                              : "Unique object keys (Advisory)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Structure Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-3 bg-surface border border-border rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-text-muted block">Root Type</span>
                        <span className="font-mono font-bold text-accent capitalize">{validationReport.stats.rootType}</span>
                      </div>
                      <div className="p-3 bg-surface border border-border rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-text-muted block">Total Items</span>
                        <span className="font-mono font-bold text-text-primary">{validationReport.stats.itemCount}</span>
                      </div>
                      <div className="p-3 bg-surface border border-border rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-text-muted block">Nesting Depth</span>
                        <span className="font-mono font-bold text-text-primary">{validationReport.stats.depth} Levels</span>
                      </div>
                      <div className="p-3 bg-surface border border-border rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-text-muted block">Total Nodes</span>
                        <span className="font-mono font-bold text-emerald-400">{validationReport.stats.nodeCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* INVALID STATE: ISSUE BREAKDOWN */
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                          <ShieldAlert className="w-5 h-5 shrink-0" />
                          <span>Invalid JSON Syntax ({validationReport.issues.length} issue{validationReport.issues.length === 1 ? "" : "s"} found)</span>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleAutoRepair}
                          leftIcon={<Wand2 className="w-3.5 h-3.5" />}
                          className="bg-red-600 hover:bg-red-500 text-white"
                        >
                          Auto-Fix All Issues
                        </Button>
                      </div>

                      <p className="text-xs text-red-300/90 leading-relaxed">
                        This payload violates RFC 8259 syntax specifications and will fail JSON.parse across programming languages and web services.
                      </p>
                    </div>

                    {/* Detected Issue Cards */}
                    <div className="flex flex-col gap-2.5">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Detected Syntax Issues
                      </span>

                      {validationReport.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-surface border border-red-500/20 rounded-xl flex flex-col gap-2 shadow-card"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-[10px] font-bold font-mono uppercase">
                                {issue.code}
                              </span>
                              <button
                                onClick={() => handleJumpToLine(issue.line)}
                                className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1"
                                title="Click to jump to line in editor"
                              >
                                Line {issue.line}, Column {issue.column}
                              </button>
                            </div>

                            {issue.suggestion && (
                              <button
                                onClick={handleAutoRepair}
                                className="text-[11px] text-accent hover:text-accent/80 font-medium underline flex items-center gap-1"
                              >
                                <Wand2 className="w-3 h-3" /> Quick Fix
                              </button>
                            )}
                          </div>

                          <p className="text-xs font-mono text-text-primary">
                            {issue.message}
                          </p>

                          {issue.snippet && (
                            <div
                              onClick={() => handleJumpToLine(issue.line)}
                              className="p-2.5 bg-black/40 border border-red-500/20 rounded-lg font-mono text-xs overflow-x-auto text-text-primary cursor-pointer hover:border-red-500/40 transition-colors"
                              title="Click to jump to line"
                            >
                              <span className="text-red-400 font-bold mr-2">Line {issue.line}:</span>
                              <span className="text-red-300 underline decoration-wavy decoration-red-500">
                                {issue.snippet}
                              </span>
                            </div>
                          )}

                          {issue.suggestion && (
                            <div className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                              💡 <strong>Suggestion:</strong> {issue.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. CODE TAB */}
            {viewTab === "code" && (
              <div className="relative w-full h-full p-4 overflow-auto font-mono text-xs leading-relaxed max-h-[560px]">
                {!validationReport.isValid && result.error ? (
                  <div className="text-red-400 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Cannot format invalid JSON:
                    </span>
                    <span className="text-xs">{result.error}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAutoRepair}
                      leftIcon={<Wand2 className="w-3.5 h-3.5" />}
                      className="w-fit mt-1"
                    >
                      Auto-Repair to Format
                    </Button>
                  </div>
                ) : displayedOutput ? (
                  <pre
                    className="whitespace-pre font-mono"
                    dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }}
                  />
                ) : (
                  <span className="text-text-muted/50 italic">
                    Formatted JSON stream will appear here in real time...
                  </span>
                )}
              </div>
            )}

            {/* 3. TREE VIEW TAB */}
            {viewTab === "tree" && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-border bg-surface/50 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search keys or values in JSON tree..."
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>

                <div className="p-4 overflow-auto flex-1 max-h-[500px]">
                  {validationReport.parsedData !== undefined ? (
                    <JSONTreeNode
                      value={validationReport.parsedData}
                      depth={0}
                      searchFilter={treeSearch}
                    />
                  ) : (
                    <div className="text-xs text-text-muted p-4 text-center">
                      No valid JSON data available to render tree.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. JSON SCHEMA VALIDATION TAB */}
            {viewTab === "schema" && (
              <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[580px]">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                    JSON Schema (Draft-07 Specification)
                  </span>
                  <button
                    onClick={() => setSchemaText(DEFAULT_SAMPLE_SCHEMA)}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Reset Sample Schema
                  </button>
                </div>

                {/* Schema Editor Textarea */}
                <textarea
                  value={schemaText}
                  onChange={(e) => setSchemaText(e.target.value)}
                  placeholder="Paste JSON Schema definition here..."
                  rows={8}
                  className="w-full bg-[#0c1017] p-3 font-mono text-xs text-text-primary leading-relaxed border border-border rounded-xl outline-none focus:border-accent resize-y"
                />

                {/* Schema Validation Status */}
                {!validationReport.isValid ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                    ⚠️ The input payload must be valid JSON before schema validation can run.
                  </div>
                ) : schemaResult ? (
                  schemaResult.isValid ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-400 text-xs">
                          ✓ Payload matches JSON Schema specifications
                        </span>
                        <span className="text-[11px] text-text-muted mt-0.5">
                          All required properties and type constraints passed successfully.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Schema Validation Failed ({schemaResult.errors.length} issue{schemaResult.errors.length === 1 ? "" : "s"})</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {schemaResult.errors.map((err, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-surface border border-red-500/20 rounded-xl flex flex-col gap-1 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-mono text-[10px] font-bold">
                                {err.keyword}
                              </span>
                              <span className="font-mono text-accent text-[11px] font-bold">
                                {err.path}
                              </span>
                            </div>
                            <span className="text-text-primary text-xs mt-0.5 font-mono">
                              {err.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : null}
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
