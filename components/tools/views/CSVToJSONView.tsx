"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Copy, Check, Download, FileCode, Sparkles, Eye, EyeOff } from "lucide-react";

export interface CSVToJSONViewProps {
  tool: ToolMeta;
}

type ConversionMode =
  | "csv_to_json"
  | "json_to_csv"
  | "md_to_html"
  | "html_to_md"
  | "csv_to_excel"
  | "excel_to_csv";

// ─────────────────── pure conversion helpers (no xlsx needed at parse time) ───

function parseLine(line: string, delimiter: string): string[] {
  // RFC 4180 compliant CSV parser (handles quoted fields with embedded delimiters/newlines)
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function csvToJSON(csv: string, delimiter: string, hasHeader: boolean, indent: number): string {
  const lines = csv.trim().split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return "[]";
  if (hasHeader && lines.length > 1) {
    const headers = parseLine(lines[0], delimiter);
    const rows = lines.slice(1).map(line => {
      const vals = parseLine(line, delimiter);
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const v = vals[i] ?? "";
        obj[h || `col_${i + 1}`] =
          v === "true" ? true : v === "false" ? false :
          (v !== "" && !isNaN(Number(v))) ? Number(v) : v;
      });
      return obj;
    });
    return JSON.stringify(rows, null, indent);
  }
  return JSON.stringify(lines.map(l => parseLine(l, delimiter)), null, indent);
}

function jsonToCSV(json: string, delimiter: string): string {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed) || !parsed.length) return "Input must be a non-empty JSON array";
  if (typeof parsed[0] === "object" && parsed[0] !== null) {
    const headers = Object.keys(parsed[0]);
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return s.includes(delimiter) || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [
      headers.map(escape).join(delimiter),
      ...parsed.map(row => headers.map(h => escape((row as Record<string, unknown>)[h])).join(delimiter)),
    ].join("\n");
  }
  return parsed.map((r: unknown) => Array.isArray(r) ? r.join(delimiter) : String(r)).join("\n");
}

function mdToHTML(md: string): string {
  let html = md
    .replace(/^#{6}\s+(.*$)/gim, "<h6>$1</h6>")
    .replace(/^#{5}\s+(.*$)/gim, "<h5>$1</h5>")
    .replace(/^#{4}\s+(.*$)/gim, "<h4>$1</h4>")
    .replace(/^#{3}\s+(.*$)/gim, "<h3>$1</h3>")
    .replace(/^#{2}\s+(.*$)/gim, "<h2>$1</h2>")
    .replace(/^#{1}\s+(.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/~~(.*?)~~/gim, "<del>$1</del>")
    .replace(/`([^`]+)`/gim, "<code>$1</code>")
    .replace(/```[\w]*\n?([\s\S]*?)```/gim, "<pre><code>$1</code></pre>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2" />')
    .replace(/^---$/gim, "<hr />")
    .replace(/^\s*[-*+]\s+(.*$)/gim, "<li>$1</li>")
    .replace(/^\s*\d+\.\s+(.*$)/gim, "<li>$1</li>")
    .replace(/\n\n/gim, "\n</p>\n<p>\n")
    .replace(/^(?!<[a-z])/gim, "");
  // Wrap li groups
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
  return `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8" /><title>Converted</title></head>\n<body>\n<p>\n${html}\n</p>\n</body>\n</html>`;
}

function htmlToMD(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n")
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n")
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<del[^>]*>(.*?)<\/del>/gi, "~~$1~~")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "```\n$1\n```")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*/gi, "![$1]($2)")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .trim();
}

// Pure-JS CSV to XLSX using base64-encoded minimal xlsx format
// We use the xlsx library (loaded lazily) for real Excel parsing/generation
async function csvToExcelBlob(csv: string, delimiter: string): Promise<Blob> {
  const XLSX = await import("xlsx");
  const lines = csv.trim().split(/\r?\n/).filter(l => l.trim());
  const data = lines.map(l => parseLine(l, delimiter));
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function excelToCSV(buffer: ArrayBuffer, delimiter: string): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "array" });
  const firstSheet = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheet];
  return XLSX.utils.sheet_to_csv(ws, { FS: delimiter });
}

// ─────────────────── sample data ───────────────────────────────────────────

const SAMPLES: Record<ConversionMode, string> = {
  csv_to_json: `id,name,category,price,inStock\n1,Wireless Mouse,Electronics,29.99,true\n2,Ergonomic Chair,Furniture,199.50,true\n3,Mechanical Keyboard,Electronics,89.00,false`,
  json_to_csv: `[\n  {"id":1,"name":"Alice","role":"Engineer","salary":95000},\n  {"id":2,"name":"Bob","role":"Designer","salary":80000},\n  {"id":3,"name":"Carol","role":"PM","salary":105000}\n]`,
  md_to_html: `# Welcome to ToolVerse\n\nThis is a **high-performance** conversion tool.\n\n## Features\n\n- 🔒 Zero cloud uploads\n- ⚡ 100% private in-browser execution\n- 🌐 Supports [Markdown](https://toolverse.app) and HTML\n\n### Usage\n\nSimply paste your *Markdown* text and get clean HTML instantly.`,
  html_to_md: `<!DOCTYPE html>\n<html>\n<body>\n<h1>Hello World</h1>\n<p>This is a <strong>sample</strong> HTML document with a <a href="https://example.com">link</a>.</p>\n<ul><li>Item one</li><li>Item two</li></ul>\n</body>\n</html>`,
  csv_to_excel: `Product,Q1,Q2,Q3,Q4\nLaptops,1200,1350,1100,1800\nPhones,800,920,750,1200\nTablets,400,450,380,620`,
  excel_to_csv: `(Upload an .xlsx or .xls file to convert)`,
};

const MODE_CONFIG: Record<ConversionMode, { inputLabel: string; outputLabel: string; outputExt: string; outputMime: string }> = {
  csv_to_json:   { inputLabel: "CSV Input",       outputLabel: "JSON Output",     outputExt: "json", outputMime: "application/json" },
  json_to_csv:   { inputLabel: "JSON Input",       outputLabel: "CSV Output",      outputExt: "csv",  outputMime: "text/csv" },
  md_to_html:    { inputLabel: "Markdown Input",   outputLabel: "HTML Output",     outputExt: "html", outputMime: "text/html" },
  html_to_md:    { inputLabel: "HTML Input",        outputLabel: "Markdown Output", outputExt: "md",   outputMime: "text/markdown" },
  csv_to_excel:  { inputLabel: "CSV Input",         outputLabel: "Excel Preview",   outputExt: "xlsx", outputMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  excel_to_csv:  { inputLabel: "Excel File Upload", outputLabel: "CSV Output",      outputExt: "csv",  outputMime: "text/csv" },
};

// ─────────────────── component ─────────────────────────────────────────────

export const CSVToJSONView: React.FC<CSVToJSONViewProps> = ({ tool }) => {
  const slug = tool.slug;

  let defaultMode: ConversionMode = "csv_to_json";
  if (slug.includes("json-to-csv"))      defaultMode = "json_to_csv";
  else if (slug.includes("markdown-to")) defaultMode = "md_to_html";
  else if (slug.includes("html-to-mark"))defaultMode = "html_to_md";
  else if (slug.includes("csv-to-excel"))defaultMode = "csv_to_excel";
  else if (slug.includes("excel-to-csv"))defaultMode = "excel_to_csv";

  const [mode, setMode] = useState<ConversionMode>(defaultMode);
  const [inputText, setInputText] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(true);
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);
  const [showHTMLPreview, setShowHTMLPreview] = useState(false);
  const [excelBlobUrl, setExcelBlobUrl] = useState<string | null>(null);
  const [excelStatus, setExcelStatus] = useState("");

  const cfg = MODE_CONFIG[mode];
  const isExcelMode = mode === "csv_to_excel" || mode === "excel_to_csv";
  const isReadOnly = mode === "excel_to_csv"; // upload-only, textarea disabled

  // ── conversion ──
  const outputResult = useMemo(() => {
    if (!inputText.trim() || isExcelMode) return "";
    try {
      switch (mode) {
        case "csv_to_json": return csvToJSON(inputText, delimiter, hasHeader, indent);
        case "json_to_csv": return jsonToCSV(inputText, delimiter);
        case "md_to_html":  return mdToHTML(inputText);
        case "html_to_md":  return htmlToMD(inputText);
        default:            return "";
      }
    } catch (e: unknown) {
      return `⚠️ Error: ${e instanceof Error ? e.message : "Conversion failed"}`;
    }
  }, [inputText, mode, delimiter, hasHeader, indent, isExcelMode]);

  // ── Excel: CSV → Excel blob generation ──
  const handleCSVtoExcel = useCallback(async () => {
    if (!inputText.trim()) return;
    setExcelStatus("⏳ Generating Excel...");
    try {
      const blob = await csvToExcelBlob(inputText, delimiter);
      const url = URL.createObjectURL(blob);
      setExcelBlobUrl(url);
      setExcelStatus("✅ Excel file ready — click Download below");
    } catch (e: unknown) {
      setExcelStatus(`❌ ${e instanceof Error ? e.message : "Failed to generate Excel"}`);
    }
  }, [inputText, delimiter]);

  // ── File upload handler ──
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];

    if (file.name.match(/\.(xlsx|xls|ods)$/i)) {
      // Excel file → read as ArrayBuffer and convert
      setMode("excel_to_csv");
      setExcelStatus("⏳ Parsing Excel file...");
      const buf = await file.arrayBuffer();
      try {
        const csv = await excelToCSV(buf, delimiter);
        setInputText(csv);
        setExcelStatus(`✅ Parsed "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
      } catch (e: unknown) {
        setExcelStatus(`❌ ${e instanceof Error ? e.message : "Failed to parse Excel"}`);
      }
    } else {
      const text = await file.text();
      setInputText(text);
      if (file.name.endsWith(".json") && mode === "csv_to_json") setMode("json_to_csv");
      if (file.name.endsWith(".csv")  && mode === "json_to_csv") setMode("csv_to_json");
      if (file.name.endsWith(".html") || file.name.endsWith(".htm")) setMode("html_to_md");
      if (file.name.endsWith(".md"))  setMode("md_to_html");
    }
  }, [delimiter, mode]);

  // ── Copy ──
  const handleCopy = () => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Download ──
  const handleDownload = async () => {
    if (mode === "csv_to_excel") {
      // If blob already generated use it, otherwise generate now
      if (excelBlobUrl) {
        const a = document.createElement("a");
        a.href = excelBlobUrl;
        a.download = "toolverse-converted.xlsx";
        a.click();
        return;
      }
      await handleCSVtoExcel();
      return;
    }
    if (!outputResult) return;
    const blob = new Blob([outputResult], { type: cfg.outputMime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `toolverse-converted.${cfg.outputExt}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSample = () => {
    setInputText(SAMPLES[mode]);
    setExcelBlobUrl(null);
    setExcelStatus("");
  };

  const charCount = inputText.length;
  const lineCount = inputText ? inputText.split("\n").length : 0;

  const displayOutput = isExcelMode
    ? (mode === "excel_to_csv" && inputText ? inputText : "")
    : outputResult;

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface border border-border rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-secondary">Mode:</span>
          <select
            value={mode}
            onChange={e => { setMode(e.target.value as ConversionMode); setInputText(""); setExcelBlobUrl(null); setExcelStatus(""); }}
            className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-semibold outline-none focus:border-accent"
          >
            <option value="csv_to_json">CSV → JSON</option>
            <option value="json_to_csv">JSON → CSV</option>
            <option value="md_to_html">Markdown → HTML</option>
            <option value="html_to_md">HTML → Markdown</option>
            <option value="csv_to_excel">CSV → Excel (.xlsx)</option>
            <option value="excel_to_csv">Excel → CSV</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Delimiter control */}
          {(mode.includes("csv") || mode.includes("excel")) && (
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Delimiter:</span>
              <select value={delimiter} onChange={e => setDelimiter(e.target.value)}
                className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none">
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value={"\t"}>Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
          )}
          {/* Header toggle for CSV→JSON */}
          {mode === "csv_to_json" && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={hasHeader} onChange={e => setHasHeader(e.target.checked)}
                className="w-3.5 h-3.5 accent-accent" />
              <span className="text-text-secondary">Has Header Row</span>
            </label>
          )}
          {/* Indent for JSON output */}
          {(mode === "csv_to_json") && (
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Indent:</span>
              <select value={indent} onChange={e => setIndent(parseInt(e.target.value))}
                className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none">
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={0}>Minified</option>
              </select>
            </div>
          )}
          {/* HTML Preview toggle */}
          {mode === "md_to_html" && (
            <button onClick={() => setShowHTMLPreview(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-raised border border-border text-text-secondary hover:text-accent hover:border-accent transition-all">
              {showHTMLPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showHTMLPreview ? "Hide Preview" : "Live Preview"}
            </button>
          )}
        </div>
      </div>

      {/* Dual Panels */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-start ${showHTMLPreview && mode === "md_to_html" ? "lg:grid-cols-1" : ""}`}>
        {/* Input Panel */}
        <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{cfg.inputLabel}</span>
            <div className="flex items-center gap-3">
              <button onClick={loadSample}
                className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent font-medium transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Load Sample
              </button>
              <span className="text-xs font-mono text-text-tertiary">{charCount.toLocaleString()} chars · {lineCount} lines</span>
            </div>
          </div>

          {/* Excel upload info banner */}
          {mode === "excel_to_csv" && (
            <div className="p-3 rounded-lg bg-blue-400/5 border border-blue-400/30 text-xs text-blue-400">
              📎 Drop or select an <strong>.xlsx</strong> or <strong>.xls</strong> file below. The first sheet will be extracted as CSV.
            </div>
          )}

          <textarea
            value={inputText}
            onChange={e => { if (!isReadOnly || mode !== "excel_to_csv") setInputText(e.target.value); }}
            readOnly={mode === "excel_to_csv" && !!inputText}
            rows={mode === "excel_to_csv" ? 6 : 14}
            className="w-full bg-surface-raised border border-border rounded-lg p-3.5 font-mono text-xs text-text-primary outline-none focus:border-accent resize-none"
            placeholder={mode === "excel_to_csv" ? "Parsed CSV will appear here after uploading..." : "Paste your content here or drop a file below..."}
          />

          <Dropzone
            accept={mode === "excel_to_csv" ? ".xlsx,.xls,.ods" : "*/*"}
            maxFiles={1}
            onDrop={handleFileUpload}
            helperText={
              mode === "excel_to_csv"
                ? "Upload .xlsx or .xls file — parsed instantly in-browser, zero cloud upload"
                : "Upload any CSV, JSON, Markdown, HTML, or Excel file"
            }
          />

          {excelStatus && (
            <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-xs text-text-secondary">
              {excelStatus}
            </div>
          )}
        </div>

        {/* Output Panel (or HTML preview) */}
        {showHTMLPreview && mode === "md_to_html" ? (
          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Live HTML Preview</span>
              <button onClick={() => setShowHTMLPreview(false)} className="text-xs text-text-tertiary hover:text-accent transition-colors">Hide</button>
            </div>
            <div
              className="prose prose-invert max-w-none p-4 bg-surface-raised border border-border rounded-lg text-text-primary text-sm leading-relaxed min-h-[280px]"
              dangerouslySetInnerHTML={{ __html: outputResult }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{cfg.outputLabel}</span>
              <div className="flex items-center gap-2">
                {mode === "csv_to_excel" && (
                  <Button variant="secondary" size="sm" onClick={handleCSVtoExcel} leftIcon={<FileCode className="w-4 h-4" />}>
                    Generate Excel
                  </Button>
                )}
                <Button
                  variant="secondary" size="sm" onClick={handleCopy}
                  leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  disabled={!displayOutput}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="primary" size="sm" onClick={handleDownload}
                  leftIcon={<Download className="w-4 h-4" />}
                  disabled={mode === "excel_to_csv" ? !inputText : !outputResult}
                >
                  Download {cfg.outputExt.toUpperCase()}
                </Button>
              </div>
            </div>

            {/* Excel table preview for CSV→Excel */}
            {mode === "csv_to_excel" && inputText ? (
              <div className="flex flex-col gap-3">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="text-xs w-full">
                    <tbody>
                      {inputText.trim().split(/\r?\n/).filter(l => l.trim()).slice(0, 12).map((line, ri) => (
                        <tr key={ri} className={ri === 0 ? "bg-accent/10 font-bold text-accent" : "even:bg-surface-raised text-text-primary hover:bg-accent/5 transition-colors"}>
                          {parseLine(line, delimiter).map((cell, ci) => (
                            <td key={ci} className="px-3 py-2 border-r border-b border-border whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {inputText.split("\n").length > 12 && (
                    <div className="p-2 text-center text-xs text-text-tertiary border-t border-border">
                      + {inputText.split("\n").length - 12} more rows
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-tertiary">Preview above — click <strong>Generate Excel</strong> to create the .xlsx file, then <strong>Download</strong>.</p>
              </div>
            ) : (
              <textarea
                readOnly
                value={displayOutput}
                rows={14}
                className={`w-full bg-surface-raised border border-border rounded-lg p-3.5 font-mono text-xs outline-none resize-none ${displayOutput.startsWith("⚠️") ? "text-red-400" : "text-emerald-400"}`}
                placeholder="Converted output will appear here instantly..."
              />
            )}

            <div className="p-3 bg-surface-raised border border-border rounded-lg flex items-center justify-between text-xs text-text-secondary">
              <span>Conversion: <strong className="text-text-primary">Instant • Client-Side Only</strong></span>
              <span className="text-emerald-400 font-mono font-semibold">🔒 100% Private</span>
            </div>
          </div>
        )}
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
