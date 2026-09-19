"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  formatSql,
  minifySql,
  analyzeSql,
  generateSqlCodeSnippet,
  SQL_PRESETS,
  type SqlDialect,
  type KeywordCasing,
  type IndentStyle,
  type CommaPosition,
  type SqlFormatOptions,
  type SqlAnalysisResult,
} from "@/tools/developer/sqlEngine";
import {
  Database,
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
  Table,
  Zap,
  RotateCcw,
  Minimize2,
  Maximize2,
  FileText,
} from "lucide-react";

export interface SQLFormatterViewProps {
  tool: ToolMeta;
}

export const SQLFormatterView: React.FC<SQLFormatterViewProps> = ({ tool }) => {
  // Mode & Options
  const [activeTab, setActiveTab] = useState<"formatter" | "codeSnippets">("formatter");
  const [mode, setMode] = useState<"beautify" | "minify">("beautify");
  const [dialect, setDialect] = useState<SqlDialect>("standard");
  const [keywordCase, setKeywordCase] = useState<KeywordCasing>("upper");
  const [indent, setIndent] = useState<IndentStyle>("2spaces");
  const [commaPosition, setCommaPosition] = useState<CommaPosition>("trailing");

  // Input & Output
  const [inputSql, setInputSql] = useState<string>(SQL_PRESETS[0].sql);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [selectedSnippetLang, setSelectedSnippetLang] = useState<
    "typescript" | "prisma" | "python" | "go" | "java" | "php" | "csharp" | "cli"
  >("typescript");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format options memo
  const formatOptions: SqlFormatOptions = useMemo(
    () => ({
      dialect,
      keywordCase,
      indent,
      commaPosition,
    }),
    [dialect, keywordCase, indent, commaPosition]
  );

  // Process SQL
  const { outputSql, analysis } = useMemo(() => {
    if (!inputSql.trim()) {
      return {
        outputSql: "",
        analysis: analyzeSql("", ""),
      };
    }

    if (mode === "minify") {
      const minified = minifySql(inputSql);
      const ana = analyzeSql(inputSql, minified);
      return { outputSql: minified, analysis: ana };
    }

    const res = formatSql(inputSql, formatOptions);
    return { outputSql: res.formattedSql, analysis: res.analysis };
  }, [inputSql, mode, formatOptions]);

  // Code Snippet output
  const activeSnippet = useMemo(() => {
    const targetSql = outputSql || inputSql || "SELECT * FROM users;";
    return generateSqlCodeSnippet(targetSql, selectedSnippetLang);
  }, [outputSql, inputSql, selectedSnippetLang]);

  // Copy handler
  const handleCopy = useCallback((text: string, isSnippet = false, snippetId = "") => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (isSnippet) {
        setCopiedSnippet(snippetId);
        setTimeout(() => setCopiedSnippet(null), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  }, []);

  // Download SQL handler
  const handleDownload = useCallback(() => {
    if (!outputSql) return;
    const blob = new Blob([outputSql], { type: "application/sql;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `query-${Date.now()}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  }, [outputSql]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputSql(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Preset selector
  const loadPreset = (presetId: string) => {
    const found = SQL_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setInputSql(found.sql);
    }
  };

  // Line count helpers
  const inputLineCount = useMemo(() => inputSql.split("\n").length, [inputSql]);
  const outputLineCount = useMemo(() => (outputSql ? outputSql.split("\n").length : 0), [outputSql]);

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
              onClick={() => setActiveTab("formatter")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "formatter"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Database className="w-4 h-4" />
              SQL Beautifier & Minifier
            </button>
            <button
              onClick={() => setActiveTab("codeSnippets")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "codeSnippets"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Terminal className="w-4 h-4" />
              SQL to Code Generator
            </button>
          </div>

          {/* Quick Presets Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted hidden sm:inline">Templates:</span>
            <select
              onChange={(e) => loadPreset(e.target.value)}
              defaultValue="analytics_cte"
              className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent focus:outline-none"
            >
              {SQL_PRESETS.map((p) => (
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

          {/* Dialect */}
          <div className="space-y-1">
            <label className="text-muted font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" /> Dialect
            </label>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as SqlDialect)}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-accent focus:outline-none"
            >
              <option value="standard">Standard SQL (ANSI)</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL / MariaDB</option>
              <option value="sqlite">SQLite</option>
              <option value="tsql">SQL Server (T-SQL)</option>
              <option value="bigquery">BigQuery / Snowflake</option>
            </select>
          </div>

          {/* Keyword Casing */}
          <div className="space-y-1">
            <label className="text-muted font-medium flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-amber-400" /> Keyword Case
            </label>
            <select
              value={keywordCase}
              onChange={(e) => setKeywordCase(e.target.value as KeywordCasing)}
              disabled={mode === "minify"}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-50"
            >
              <option value="upper">UPPERCASE (SELECT)</option>
              <option value="lower">lowercase (select)</option>
              <option value="preserve">Preserve Original</option>
            </select>
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

          {/* Comma Placement */}
          <div className="space-y-1">
            <label className="text-muted font-medium flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-purple-400" /> Comma Style
            </label>
            <select
              value={commaPosition}
              onChange={(e) => setCommaPosition(e.target.value as CommaPosition)}
              disabled={mode === "minify"}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-50"
            >
              <option value="trailing">Trailing (col1, \n col2)</option>
              <option value="leading">Leading (col1 \n , col2)</option>
            </select>
          </div>
        </div>

        {/* Tab 1: Formatter & Minifier Dual-Pane */}
        {activeTab === "formatter" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Pane: Input */}
              <div className="flex flex-col rounded-xl border border-border bg-surface-secondary/30 overflow-hidden">
                {/* Pane Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-surface-secondary/80 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Input SQL Query</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
                      {inputLineCount} lines · {analysis.stats.charCountBefore} chars
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                      title="Upload .sql file"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".sql,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => setInputSql("")}
                      className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Clear Query"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative flex-1 min-h-[380px]">
                  <textarea
                    value={inputSql}
                    onChange={(e) => setInputSql(e.target.value)}
                    placeholder="Paste your SQL statement here (SELECT, INSERT, UPDATE, CREATE TABLE, WITH CTE...)"
                    className="w-full h-full min-h-[380px] p-4 bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted focus:outline-none resize-y"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Right Pane: Output */}
              <div className="flex flex-col rounded-xl border border-border bg-surface-secondary/30 overflow-hidden">
                {/* Pane Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-surface-secondary/80 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {mode === "beautify" ? "Formatted SQL" : "Minified SQL"}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
                      {outputLineCount} lines · {analysis.stats.charCountAfter} chars
                    </span>
                    {mode === "minify" && analysis.stats.charCountBefore > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        {Math.round(
                          (1 - analysis.stats.charCountAfter / analysis.stats.charCountBefore) * 100
                        )}
                        % compressed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(outputSql)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-sm"
                      title="Copy SQL to Clipboard"
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
                      title="Download as .sql"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Formatted Display */}
                <div className="relative flex-1 min-h-[380px] bg-surface/50 overflow-auto">
                  <pre className="p-4 font-mono text-sm leading-relaxed text-emerald-400/90 whitespace-pre-wrap select-all selection:bg-accent/30 selection:text-white">
                    {outputSql || (
                      <span className="text-muted italic">Formatted SQL will appear here...</span>
                    )}
                  </pre>
                </div>
              </div>
            </div>

            {/* Analysis & Safety Drawer */}
            <div className="space-y-3">
              {/* Critical Safety Warning (e.g. UPDATE or DELETE without WHERE) */}
              {analysis.isDangerousQuery && (
                <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-destructive" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-sm block">Critical Query Safety Alert</span>
                    {analysis.warnings.map((w, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {w}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Syntax Errors */}
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

              {/* Real-time Query Stats & Structure Cards */}
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
                      {analysis.isValidSyntax ? "Balanced & Valid" : "Check Balance"}
                    </span>
                  </div>
                </div>

                {/* Statements */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      Statement
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">
                      {analysis.statementTypes.length > 0
                        ? analysis.statementTypes.join(", ")
                        : "Query"}
                    </span>
                  </div>
                </div>

                {/* Tables Referenced */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <Table className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      Tables
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">
                      {analysis.tableNames.length > 0
                        ? analysis.tableNames.join(", ")
                        : "None"}
                    </span>
                  </div>
                </div>

                {/* Joins */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      JOIN Clauses
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.joinCount} join{analysis.joinCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* CTEs */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      CTE Expressions
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.cteCount} with block{analysis.cteCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* WHERE Guard */}
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2.5">
                  <CheckCircle2
                    className={`w-4 h-4 flex-shrink-0 ${
                      analysis.hasWhereClause ? "text-emerald-400" : "text-muted"
                    }`}
                  />
                  <div>
                    <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">
                      WHERE Guard
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {analysis.hasWhereClause ? "Guarded" : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SQL to Code Generator */}
        {activeTab === "codeSnippets" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  Export SQL to Programming Language Code
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Copy query wrapped in native database drivers, prepared statements, and async execution blocks.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "typescript", label: "TypeScript (pg)" },
                  { id: "prisma", label: "Prisma ($queryRaw)" },
                  { id: "python", label: "Python (psycopg2)" },
                  { id: "go", label: "Go (database/sql)" },
                  { id: "java", label: "Java (JDBC)" },
                  { id: "php", label: "PHP (PDO)" },
                  { id: "csharp", label: "C# (.NET)" },
                  { id: "cli", label: "CLI (psql / mysql)" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedSnippetLang(lang.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedSnippetLang === lang.id
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "bg-surface-secondary text-muted hover:text-foreground hover:bg-surface"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Display Card */}
            <div className="rounded-xl border border-border bg-surface-secondary/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-surface-secondary/90 border-b border-border">
                <span className="font-mono text-xs text-muted">
                  Driver snippet: {selectedSnippetLang}
                </span>
                <button
                  onClick={() => handleCopy(activeSnippet, true, selectedSnippetLang)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-sm"
                >
                  {copiedSnippet === selectedSnippetLang ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied Snippet</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-5 font-mono text-xs leading-relaxed text-foreground overflow-x-auto select-all">
                {activeSnippet}
              </pre>
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
