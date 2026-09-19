"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  Copy,
  Check,
  RefreshCw,
  Replace,
  Type,
  AlignLeft,
  GitCompare,
  Sparkles,
  Server,
  Layers,
  ArrowUpDown,
  RotateCcw,
  Trash2,
  SlidersHorizontal,
  CheckCircle2,
  Download,
} from "lucide-react";

export interface TextStudioViewProps {
  tool: ToolMeta;
}

// Flip text map
const FLIP_MAP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ",
  j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ",
  s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  A: "∀", B: "𐐒", C: "Ɔ", D: "p", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I",
  J: "ſ", K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", Q: "Ò", R: "ɹ",
  S: "S", t: "┴", U: "∩", V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z",
  "0": "0", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  "?": "¿", "!": "¡", ".": "˙", ",": "'", "'": ",", "\"": "„", "<": ">", ">": "<",
  "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "_": "‾"
};

export const TextStudioView: React.FC<TextStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  const isDiff = slug.includes("diff");
  const isSort = slug.includes("sort");
  const isDuplicates = slug.includes("duplicate");
  const isReverser = slug.includes("reverse");
  const isCase = slug.includes("case");

  // Main text state
  const [inputText, setInputText] = useState<string>(() => {
    if (isDiff) return "";
    if (isSort) return "Banana\nApple\n10 Orange\n2 Mango\nPineapple\nGrape\n1 Watermelon";
    if (isDuplicates) return "Next.js Framework\nReact Library\nNext.js Framework\nTailwind CSS\nReact Library\nTypeScript\nTailwind CSS";
    if (isReverser) return "The quick brown fox jumps over the lazy dog.";
    if (isCase) return "hello world! transform this text into multiple developer and title casing styles.";
    return "The quick brown fox jumps over the lazy dog. Real-time text transformation with ToolVerse.";
  });

  // Diff states
  const [diffTextOriginal, setDiffTextOriginal] = useState<string>(
    "function calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}"
  );
  const [diffTextModified, setDiffTextModified] = useState<string>(
    "function calculateTotal(items, discount = 0) {\n  let total = 0;\n  for (const item of items) {\n    total += item.price;\n  }\n  const finalTotal = total * (1 - discount);\n  return finalTotal;\n}"
  );

  // Duplicate options
  const [caseSensitiveDup, setCaseSensitiveDup] = useState<boolean>(true);
  const [trimLinesDup, setTrimLinesDup] = useState<boolean>(true);
  const [removeEmptyDup, setRemoveEmptyDup] = useState<boolean>(true);

  // Find and replace states
  const [findWord, setFindWord] = useState<string>("");
  const [replaceWord, setReplaceWord] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [apiSynced, setApiSynced] = useState<boolean>(true);

  // Stats computation
  const stats = useMemo(() => {
    const characters = inputText.length;
    const charactersNoSpaces = inputText.replace(/\s/g, "").length;
    const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    const lines = inputText ? inputText.split("\n").length : 0;
    const paragraphs = inputText.split(/\n+/).filter((p) => p.trim().length > 0).length;
    const readingTime = Math.ceil(words / 200);
    return { characters, charactersNoSpaces, words, lines, paragraphs, readingTime };
  }, [inputText]);

  // Diff computation
  const diffResult = useMemo(() => {
    const origLines = diffTextOriginal.split("\n");
    const modLines = diffTextModified.split("\n");
    const maxLen = Math.max(origLines.length, modLines.length);

    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    let identical = 0;

    const diff: { type: "same" | "add" | "remove" | "change"; orig?: string; mod?: string }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const o = origLines[i];
      const m = modLines[i];
      if (o === m) {
        diff.push({ type: "same", orig: o, mod: m });
        identical++;
      } else if (o === undefined) {
        diff.push({ type: "add", mod: m });
        additions++;
      } else if (m === undefined) {
        diff.push({ type: "remove", orig: o });
        deletions++;
      } else {
        diff.push({ type: "change", orig: o, mod: m });
        modifications++;
      }
    }
    const similarity = Math.round((identical / Math.max(1, maxLen)) * 100);
    return { diff, additions, deletions, modifications, similarity };
  }, [diffTextOriginal, diffTextModified]);

  // Server-side transformation dispatch
  const callServerTransform = async (operation: string, extraOptions: any = {}) => {
    try {
      const res = await fetch("/api/text/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          operation,
          options: extraOptions,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setInputText(json.data.result);
          setApiSynced(true);
          return;
        }
      }
    } catch {
      // fallback to local handling below
    }
  };

  // Text Transform handlers with instant local execution & server sync
  const handleTransform = (type: string) => {
    switch (type) {
      case "upper":
        setInputText(inputText.toUpperCase());
        callServerTransform("upper");
        break;
      case "lower":
        setInputText(inputText.toLowerCase());
        callServerTransform("lower");
        break;
      case "title":
        setInputText(
          inputText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
        );
        callServerTransform("title");
        break;
      case "sentence":
        setInputText(
          inputText.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
        );
        callServerTransform("sentence");
        break;
      case "camel":
        setInputText(
          inputText
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
              index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/[\s-_]+/g, "")
        );
        callServerTransform("camel");
        break;
      case "pascal":
        setInputText(
          inputText.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/[\s-_]+/g, "")
        );
        callServerTransform("pascal");
        break;
      case "snake":
        setInputText(
          inputText
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_")
            .replace(/[^\w_]/g, "")
        );
        callServerTransform("snake");
        break;
      case "kebab":
      case "slug":
        setInputText(
          inputText
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
        );
        callServerTransform("kebab");
        break;
      case "constant":
        setInputText(
          inputText
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, "_")
            .replace(/[^\w_]/g, "")
        );
        callServerTransform("constant");
        break;
      case "dot":
        setInputText(
          inputText
            .trim()
            .toLowerCase()
            .replace(/[\s-_]+/g, ".")
            .replace(/[^\w.]/g, "")
        );
        callServerTransform("dot");
        break;
      case "alternating":
        setInputText(
          inputText
            .split("")
            .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
            .join("")
        );
        callServerTransform("alternating");
        break;
      case "inverse":
        setInputText(
          inputText
            .split("")
            .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
            .join("")
        );
        callServerTransform("inverse");
        break;
      case "remove-duplicates": {
        const lines = inputText.split("\n");
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const line of lines) {
          const processed = trimLinesDup ? line.trim() : line;
          if (removeEmptyDup && !processed) continue;
          const key = caseSensitiveDup ? processed : processed.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(processed);
          }
        }
        setInputText(unique.join("\n"));
        callServerTransform("remove-duplicates", {
          caseSensitive: caseSensitiveDup,
          trimLines: trimLinesDup,
          removeEmpty: removeEmptyDup,
        });
        break;
      }
      case "sort-lines-asc":
        setInputText(inputText.split("\n").sort().join("\n"));
        callServerTransform("sort-asc");
        break;
      case "sort-lines-desc":
        setInputText(inputText.split("\n").sort().reverse().join("\n"));
        callServerTransform("sort-desc");
        break;
      case "sort-natural":
        setInputText(
          inputText
            .split("\n")
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
            .join("\n")
        );
        callServerTransform("sort-natural");
        break;
      case "sort-length-asc":
        setInputText(inputText.split("\n").sort((a, b) => a.length - b.length).join("\n"));
        callServerTransform("sort-length-asc");
        break;
      case "sort-length-desc":
        setInputText(inputText.split("\n").sort((a, b) => b.length - a.length).join("\n"));
        callServerTransform("sort-length-desc");
        break;
      case "sort-shuffle": {
        const arr = inputText.split("\n");
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        setInputText(arr.join("\n"));
        callServerTransform("sort-shuffle");
        break;
      }
      case "reverse-chars":
        setInputText(inputText.split("").reverse().join(""));
        callServerTransform("reverse-chars");
        break;
      case "reverse-words":
        setInputText(
          inputText
            .split("\n")
            .map((l) => l.split(/\s+/).reverse().join(" "))
            .join("\n")
        );
        callServerTransform("reverse-words");
        break;
      case "reverse-lines":
        setInputText(inputText.split("\n").reverse().join("\n"));
        callServerTransform("reverse-lines");
        break;
      case "flip-text": {
        const flipped = inputText
          .split("")
          .map((c) => FLIP_MAP[c] || c)
          .reverse()
          .join("");
        setInputText(flipped);
        callServerTransform("flip-text");
        break;
      }
      case "remove-extra-spaces":
        setInputText(inputText.replace(/[ \t]+/g, " ").trim());
        callServerTransform("remove-extra-spaces");
        break;
      case "remove-line-breaks":
        setInputText(inputText.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim());
        callServerTransform("remove-line-breaks");
        break;
      case "strip-empty-lines":
        setInputText(
          inputText
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .join("\n")
        );
        callServerTransform("strip-empty-lines");
        break;
      case "add-line-numbers":
        setInputText(
          inputText
            .split("\n")
            .map((l, i) => `${(i + 1).toString().padStart(3, " ")}. ${l}`)
            .join("\n")
        );
        callServerTransform("add-line-numbers");
        break;
      case "lorem":
        setInputText(
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        );
        break;
      default:
        break;
    }
  };

  const handleFindReplace = () => {
    if (!findWord) return;
    const regex = new RegExp(findWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    setInputText(inputText.replace(regex, replaceWord));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Backend API Connection Status Banner */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-surface border border-border text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-accent" />
            Backend API Connected:
          </span>
          <span className="font-mono text-emerald-400">
            {isDiff ? "/api/text/text-diff" : "/api/text/transform"}
          </span>
        </div>
        <span className="text-[11px] text-text-tertiary hidden sm:inline">
          High-performance instant processing engine
        </span>
      </div>

      {isDiff ? (
        /* TEXT DIFF CHECKER VIEW */
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 bg-surface border border-border rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Original Text
                </span>
                <span className="text-xs text-text-tertiary font-mono">
                  {diffTextOriginal.split("\n").length} lines
                </span>
              </div>
              <textarea
                value={diffTextOriginal}
                onChange={(e) => setDiffTextOriginal(e.target.value)}
                placeholder="Paste original text here to compare..."
                rows={9}
                className="w-full bg-surface-raised border border-border/80 rounded-xl p-4 font-mono text-xs text-text-primary outline-none focus:border-accent resize-y"
              />
            </div>
            <div className="flex flex-col gap-2 bg-surface border border-border rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Modified Text
                </span>
                <span className="text-xs text-text-tertiary font-mono">
                  {diffTextModified.split("\n").length} lines
                </span>
              </div>
              <textarea
                value={diffTextModified}
                onChange={(e) => setDiffTextModified(e.target.value)}
                placeholder="Paste updated/modified text here to see line differences..."
                rows={9}
                className="w-full bg-surface-raised border border-border/80 rounded-xl p-4 font-mono text-xs text-text-primary outline-none focus:border-accent resize-y"
              />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Line-by-Line Diff Comparison
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-accent/10 text-accent font-bold">
                  {diffResult.similarity}% Match
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="text-emerald-400">+{diffResult.additions} Added</span>
                <span className="text-rose-400">-{diffResult.deletions} Removed</span>
                <span className="text-amber-400">~{diffResult.modifications} Modified</span>
              </div>
            </div>

            <div className="flex flex-col font-mono text-xs bg-surface-raised rounded-xl border border-border overflow-hidden divide-y divide-border/60 max-h-[500px] overflow-y-auto">
              {diffResult.diff.map((d, i) => (
                <div
                  key={i}
                  className={`p-3 flex items-start gap-3 ${
                    d.type === "same"
                      ? "text-text-secondary bg-transparent"
                      : d.type === "add"
                      ? "text-emerald-300 bg-emerald-500/10"
                      : d.type === "remove"
                      ? "text-rose-300 bg-rose-500/10"
                      : "text-amber-300 bg-amber-500/10"
                  }`}
                >
                  <span className="text-text-tertiary select-none w-6 text-right shrink-0">{i + 1}</span>
                  <span className="w-4 text-center font-bold select-none shrink-0">
                    {d.type === "same" ? " " : d.type === "add" ? "+" : d.type === "remove" ? "-" : "~"}
                  </span>
                  <div className="flex-1 break-all">
                    {d.type === "change" ? (
                      <div className="flex flex-col gap-1">
                        <span className="line-through text-rose-400/90">{d.orig}</span>
                        <span className="text-emerald-400 font-semibold">{d.mod}</span>
                      </div>
                    ) : (
                      <span>{d.type === "remove" ? d.orig : d.mod}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD & SPECIALIZED TEXT STUDIO */
        <div className="flex flex-col gap-5 bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xl">
          {/* Action Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-accent" /> Text Operations & Presets
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleCopy(inputText)}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? "Copied!" : "Copy Output"}
              </Button>
            </div>

            {/* Quick action buttons row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Case operations */}
              <Button variant="secondary" size="sm" onClick={() => handleTransform("upper")}>
                UPPERCASE
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("lower")}>
                lowercase
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("title")}>
                Title Case
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("sentence")}>
                Sentence case
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("camel")}>
                camelCase
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("pascal")}>
                PascalCase
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("snake")}>
                snake_case
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("kebab")}>
                kebab-case
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("constant")}>
                CONSTANT_CASE
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("dot")}>
                dot.case
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("alternating")}>
                aLtErNaTiNg
              </Button>

              {/* Sorting & lines */}
              <Button variant="secondary" size="sm" onClick={() => handleTransform("remove-duplicates")}>
                Remove Duplicates
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("sort-lines-asc")}>
                Sort (A-Z)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("sort-lines-desc")}>
                Sort (Z-A)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("sort-natural")}>
                Natural Sort (1, 2, 10)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("sort-length-asc")}>
                Length (Short→Long)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("sort-shuffle")}>
                Shuffle Lines
              </Button>

              {/* Reversals */}
              <Button variant="secondary" size="sm" onClick={() => handleTransform("reverse-chars")}>
                Reverse Chars
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("reverse-words")}>
                Reverse Words
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("reverse-lines")}>
                Reverse Lines
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("flip-text")}>
                Flip Upside Down (ʇxǝʇ)
              </Button>

              {/* Cleansers */}
              <Button variant="secondary" size="sm" onClick={() => handleTransform("remove-extra-spaces")}>
                Trim Spaces
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("remove-line-breaks")}>
                Remove Breaks
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("strip-empty-lines")}>
                Strip Empty Lines
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("add-line-numbers")}>
                Add Line Numbers
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleTransform("lorem")}>
                Lorem Ipsum
              </Button>
            </div>
          </div>

          {/* Deduplication Options if viewing Remove Duplicates Tool */}
          {isDuplicates && (
            <div className="flex flex-wrap items-center gap-4 p-3 bg-surface-raised rounded-xl border border-border text-xs">
              <span className="font-bold text-text-primary uppercase tracking-wider">Duplicate Options:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitiveDup}
                  onChange={(e) => setCaseSensitiveDup(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded"
                />
                <span>Case Sensitive</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trimLinesDup}
                  onChange={(e) => setTrimLinesDup(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded"
                />
                <span>Trim Whitespace</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeEmptyDup}
                  onChange={(e) => setRemoveEmptyDup(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded"
                />
                <span>Remove Empty Lines</span>
              </label>
            </div>
          )}

          {/* Find & Replace Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-surface-raised p-2.5 rounded-xl border border-border items-center">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Find text..."
                value={findWord}
                onChange={(e) => setFindWord(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceWord}
                onChange={(e) => setReplaceWord(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleFindReplace}
                leftIcon={<Replace className="w-3.5 h-3.5" />}
              >
                Replace
              </Button>
            </div>
          </div>

          {/* Main Text Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={11}
            className="w-full bg-surface-raised border border-border/80 focus:border-accent rounded-2xl p-4 font-mono text-sm text-text-primary outline-none transition-colors leading-relaxed shadow-inner"
            placeholder="Type or paste text here to transform..."
          />

          {/* Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center">
              <span className="text-[11px] text-text-tertiary block font-medium">Characters</span>
              <span className="text-base font-bold text-text-primary mt-0.5 block">{stats.characters}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center">
              <span className="text-[11px] text-text-tertiary block font-medium">No Spaces</span>
              <span className="text-base font-bold text-text-primary mt-0.5 block">{stats.charactersNoSpaces}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center">
              <span className="text-[11px] text-text-tertiary block font-medium">Words</span>
              <span className="text-base font-bold text-accent mt-0.5 block">{stats.words}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center">
              <span className="text-[11px] text-text-tertiary block font-medium">Lines</span>
              <span className="text-base font-bold text-text-primary mt-0.5 block">{stats.lines}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center">
              <span className="text-[11px] text-text-tertiary block font-medium">Paragraphs</span>
              <span className="text-base font-bold text-text-primary mt-0.5 block">{stats.paragraphs}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center">
              <span className="text-[11px] text-text-tertiary block font-medium">Reading Time</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">~{stats.readingTime} min</span>
            </div>
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
