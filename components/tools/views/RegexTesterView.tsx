"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Button } from "@/components/ui/Button";
import {
  evaluateRegex,
  generateRegexCodeSnippets,
  COMMON_PATTERNS,
  type CommonPattern,
  type RegexEvaluationResult,
  type RegexMatchItem,
} from "@/tools/developer/regexEngine";
import {
  Regex as RegexIcon,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Code2,
  Sparkles,
  Sliders,
  Trash2,
  BookOpen,
  ArrowRight,
  Replace,
  Search,
  Zap,
  Layers,
  HelpCircle,
} from "lucide-react";

export interface RegexTesterViewProps {
  tool: ToolMeta;
}

const REGEX_FLAGS = [
  { flag: "g", label: "Global", desc: "Don't return after first match" },
  { flag: "i", label: "Insensitive", desc: "Case-insensitive matching" },
  { flag: "m", label: "Multiline", desc: "^ and $ match start/end of line" },
  { flag: "s", label: "DotAll", desc: ". matches newlines as well" },
  { flag: "u", label: "Unicode", desc: "Full Unicode support" },
  { flag: "y", label: "Sticky", desc: "Match only from current lastIndex" },
];

const CHEAT_SHEET_CATEGORIES = [
  {
    title: "Character Classes",
    items: [
      { token: "\\d", desc: "Any digit (0-9)" },
      { token: "\\D", desc: "Any non-digit" },
      { token: "\\w", desc: "Word char (a-z, A-Z, 0-9, _)" },
      { token: "\\W", desc: "Non-word character" },
      { token: "\\s", desc: "Whitespace (space, tab, newline)" },
      { token: "\\S", desc: "Non-whitespace" },
      { token: ".", desc: "Any character (except newline)" },
      { token: "[abc]", desc: "Any character in set (a, b, or c)" },
      { token: "[^abc]", desc: "Any character NOT in set" },
      { token: "[a-z]", desc: "Character in range a to z" },
    ],
  },
  {
    title: "Quantifiers",
    items: [
      { token: "*", desc: "0 or more times (greedy)" },
      { token: "+", desc: "1 or more times (greedy)" },
      { token: "?", desc: "0 or 1 time (optional)" },
      { token: "{3}", desc: "Exactly 3 times" },
      { token: "{2,5}", desc: "Between 2 and 5 times" },
      { token: "{2,}", desc: "2 or more times" },
      { token: "*?", desc: "0 or more times (lazy / reluctant)" },
      { token: "+?", desc: "1 or more times (lazy)" },
    ],
  },
  {
    title: "Anchors & Boundaries",
    items: [
      { token: "^", desc: "Start of string or line" },
      { token: "$", desc: "End of string or line" },
      { token: "\\b", desc: "Word boundary" },
      { token: "\\B", desc: "Non-word boundary" },
    ],
  },
  {
    title: "Groups & Lookaround",
    items: [
      { token: "(abc)", desc: "Capturing group" },
      { token: "(?:abc)", desc: "Non-capturing group" },
      { token: "(?<name>abc)", desc: "Named capture group" },
      { token: "(?=abc)", desc: "Positive lookahead" },
      { token: "(?!abc)", desc: "Negative lookahead" },
      { token: "(?<=abc)", desc: "Positive lookbehind" },
      { token: "(?<!abc)", desc: "Negative lookbehind" },
      { token: "a|b", desc: "Alternation (match a OR b)" },
    ],
  },
];

export const RegexTesterView: React.FC<RegexTesterViewProps> = ({ tool }) => {
  // Pattern & Flags State
  const [pattern, setPattern] = useState<string>("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
  const [flags, setFlags] = useState<string>("g");

  // Test String State
  const [testText, setTestText] = useState<string>(
    "Contact our engineering team at support@toolverse.app or developer.alex@company.co.uk.\nFor sales inquiries: sales-team@enterprise.org.\nInvalid addresses like user@.com or @nodomain should not match."
  );

  // Replacement State
  const [replacementText, setReplacementText] = useState<string>("[email protected]");
  const [showReplacement, setShowReplacement] = useState<boolean>(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"matches" | "replace" | "code" | "cheatsheet">("matches");
  const [activeCodeLang, setActiveCodeLang] = useState<string>("javascript");

  // Copy toast state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  const triggerCopy = (text: string, identifier: string, label = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    setToastMessage(label);
    setTimeout(() => {
      setCopiedKey(null);
      setToastMessage("");
    }, 2000);
  };

  // Toggle flag
  const toggleFlag = (flagChar: string) => {
    if (flags.includes(flagChar)) {
      setFlags(flags.replace(new RegExp(flagChar, "g"), ""));
    } else {
      setFlags(flags + flagChar);
    }
  };

  // Load common preset pattern
  const loadPreset = (preset: CommonPattern) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setTestText(preset.sampleText);
  };

  // Append cheat sheet token to pattern
  const appendToken = (token: string) => {
    setPattern((prev) => prev + token);
  };

  // Evaluation Result
  const evalResult: RegexEvaluationResult = useMemo(() => {
    return evaluateRegex(pattern, flags, testText, replacementText);
  }, [pattern, flags, testText, replacementText]);

  // Code snippets
  const snippets = useMemo(() => {
    return generateRegexCodeSnippets(pattern, flags, testText);
  }, [pattern, flags, testText]);

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

      {/* Top Bar: Preset Patterns Carousel */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-card flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Common Regex Library Presets
          </span>
          <span className="text-text-muted text-[11px]">Click to load pattern & test text</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {COMMON_PATTERNS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-semibold text-text-secondary hover:text-text-primary whitespace-nowrap transition-all shadow-sm"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pattern Bar */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <RegexIcon className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Regular Expression
            </h2>
          </div>

          {/* Status Indicator */}
          {pattern ? (
            evalResult.isValid ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valid Regex &bull; {evalResult.totalMatches} match{evalResult.totalMatches === 1 ? "" : "es"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Syntax Error</span>
              </div>
            )
          ) : (
            <span className="text-xs text-text-muted">Enter a pattern to test</span>
          )}
        </div>

        {/* Delimited Pattern Input */}
        <div className="flex items-center gap-2 bg-surface-raised border border-border focus-within:border-accent rounded-xl px-3 py-2 transition-all shadow-inner">
          <span className="text-base font-mono font-bold text-accent select-none">/</span>
          <input
            type="text"
            placeholder="Enter regex pattern (e.g. [a-z0-9]+)..."
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full bg-transparent text-sm md:text-base font-mono text-text-primary focus:outline-none placeholder:text-text-muted"
          />
          <span className="text-base font-mono font-bold text-accent select-none">/</span>
          <span className="text-xs font-mono font-bold text-text-secondary select-none px-1">
            {flags || <span className="text-text-muted font-normal">none</span>}
          </span>
          {pattern && (
            <button
              onClick={() => setPattern("")}
              className="p-1 text-text-muted hover:text-text-primary transition-colors"
              title="Clear pattern"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Syntax Error Notice if Invalid */}
        {!evalResult.isValid && evalResult.error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{evalResult.error}</span>
          </div>
        )}

        {/* Flags Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-text-muted mr-1">Flags:</span>
            {REGEX_FLAGS.map((f) => {
              const active = flags.includes(f.flag);
              return (
                <button
                  key={f.flag}
                  onClick={() => toggleFlag(f.flag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                    active
                      ? "bg-accent border-accent text-white shadow-sm"
                      : "bg-surface-raised border-border text-text-secondary hover:text-text-primary hover:border-border-hover"
                  }`}
                  title={`${f.label} (${f.flag}): ${f.desc}`}
                >
                  {f.flag}
                  <span className="font-sans font-normal text-[10px] ml-1 opacity-80">{f.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerCopy(`/${pattern}/${flags}`, "full-regex", "Copied regex with flags!")}
              className="px-3 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-xs font-semibold text-text-primary flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3 h-3 text-accent" />
              <span>Copy Pattern</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Testing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Test String Editor with Highlight Overlay */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Test String & Match Highlighter
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                <span>{testText.length} chars</span>
                <span>&bull;</span>
                <span>{testText.split("\n").length} lines</span>
              </div>
            </div>

            {/* Visual Match Highlight Backdrop */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted">Interactive Match Preview:</span>
              <div className="p-4 bg-surface-raised border border-border rounded-xl font-mono text-xs text-text-primary leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap break-all select-text">
                {evalResult.highlightSegments.map((segment, idx) => {
                  if (segment.isMatch) {
                    return (
                      <mark
                        key={idx}
                        className="bg-accent/25 text-blue-200 border-b-2 border-accent px-0.5 rounded font-bold hover:bg-accent/40 transition-colors"
                        title={`Match #${segment.matchNumber} at index ${segment.matchIndex}`}
                      >
                        {segment.text}
                      </mark>
                    );
                  }
                  return <span key={idx}>{segment.text}</span>;
                })}
              </div>
            </div>

            {/* Raw Text Input Editor */}
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-[11px] text-text-muted font-medium">Edit Test Input:</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={6}
                placeholder="Type or paste text to test your regular expression against..."
                className="w-full bg-surface-raised border border-border rounded-xl p-3 font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-y leading-relaxed"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-text-muted">
              <span>Matches update automatically as you type</span>
              <button
                onClick={() => setTestText("")}
                className="hover:text-text-primary transition-colors"
              >
                Clear Text
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Inspection Tabs (Matches, Replace, Code, Cheatsheet) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border text-xs">
              <button
                onClick={() => setActiveTab("matches")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === "matches"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Matches ({evalResult.totalMatches})
              </button>
              <button
                onClick={() => setActiveTab("replace")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === "replace"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Replace
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === "code"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab("cheatsheet")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === "cheatsheet"
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Cheat Sheet
              </button>
            </div>

            {/* TAB 1: MATCHES INSPECTOR */}
            {activeTab === "matches" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-text-muted border-b border-border pb-2 font-mono">
                  <span>Found {evalResult.totalMatches} matches</span>
                  <span>{evalResult.executionTimeMs} ms</span>
                </div>

                {evalResult.matches.length > 0 ? (
                  <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {evalResult.matches.map((m) => (
                      <div
                        key={m.matchNumber}
                        className="bg-surface-raised border border-border hover:border-accent/40 rounded-xl p-3 flex flex-col gap-2 transition-colors shadow-sm"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-accent/15 border border-accent/30 text-accent font-mono text-[10px] font-bold flex items-center justify-center">
                              #{m.matchNumber}
                            </span>
                            <span className="text-[11px] font-mono text-text-muted">
                              Index: {m.startIndex}..{m.endIndex}
                            </span>
                          </div>
                          <button
                            onClick={() => triggerCopy(m.fullMatch, `m-${m.matchNumber}`, `Copied match #${m.matchNumber}`)}
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                            title="Copy match text"
                          >
                            {copiedKey === `m-${m.matchNumber}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Full Match text */}
                        <div className="bg-surface border border-border rounded-lg p-2 font-mono text-xs text-text-primary break-all font-semibold">
                          {m.fullMatch}
                        </div>

                        {/* Groups breakdown if any */}
                        {m.groups.length > 0 && (
                          <div className="flex flex-col gap-1 pt-1 border-t border-border">
                            <span className="text-[10px] uppercase font-bold text-text-muted">
                              Capture Groups ({m.groups.length})
                            </span>
                            <div className="flex flex-col gap-1">
                              {m.groups.map((g) => (
                                <div
                                  key={g.number}
                                  className="flex items-center justify-between text-[11px] font-mono p-1 rounded bg-surface border border-border/60"
                                >
                                  <span className="text-accent font-bold">
                                    {g.name ? `$${g.name}` : `$${g.number}`}:
                                  </span>
                                  <span className="text-text-primary truncate ml-2 font-semibold">
                                    {g.value || <span className="text-text-muted italic">empty</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-text-muted gap-2">
                    <Search className="w-8 h-8 text-text-muted/40" />
                    <span className="text-xs">No matches found with current pattern and flags.</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REPLACEMENT PREVIEW */}
            {activeTab === "replace" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase">
                    Replacement String
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. [$1] or ***"
                    value={replacementText}
                    onChange={(e) => setReplacementText(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-xl p-2.5 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-text-muted">
                    Supports <code>$1</code>, <code>$2</code> (groups), <code>$&amp;</code> (full match), <code>$`</code> (before match).
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-secondary uppercase">
                      Replacement Result
                    </span>
                    <button
                      onClick={() => triggerCopy(evalResult.replacementResult || "", "replace-res", "Copied replacement result")}
                      className="text-accent hover:text-accent-hover font-semibold flex items-center gap-1 text-[11px]"
                    >
                      {copiedKey === "replace-res" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy Result
                    </button>
                  </div>
                  <pre className="bg-surface-raised border border-border rounded-xl p-3 font-mono text-xs text-text-primary overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap break-all">
                    {evalResult.replacementResult}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 3: CODE SNIPPETS */}
            {activeTab === "code" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-secondary uppercase">Language:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(snippets).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveCodeLang(lang)}
                        className={`px-2 py-0.5 rounded text-xs font-mono capitalize ${
                          activeCodeLang === lang
                            ? "bg-accent text-white font-bold"
                            : "bg-surface-raised text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="bg-surface-raised border border-border rounded-xl p-3.5 font-mono text-xs text-text-primary overflow-x-auto max-h-72 leading-relaxed">
                    {snippets[activeCodeLang]}
                  </pre>
                  <button
                    onClick={() => triggerCopy(snippets[activeCodeLang], "snip", "Copied code snippet!")}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-surface border border-border text-xs text-text-muted hover:text-text-primary shadow-sm"
                    title="Copy code snippet"
                  >
                    {copiedKey === "snip" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: CHEAT SHEET */}
            {activeTab === "cheatsheet" && (
              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                {CHEAT_SHEET_CATEGORIES.map((cat) => (
                  <div key={cat.title} className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                      {cat.title}
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {cat.items.map((item) => (
                        <button
                          key={item.token}
                          onClick={() => appendToken(item.token)}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border/70 hover:border-accent text-left text-xs transition-colors group"
                          title="Click to insert into regex"
                        >
                          <code className="font-mono text-text-primary font-bold px-1.5 py-0.5 rounded bg-surface border border-border group-hover:border-accent text-[11px]">
                            {item.token}
                          </code>
                          <span className="text-[11px] text-text-secondary truncate ml-2">
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
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
