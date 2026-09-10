"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Copy, Check, RefreshCw, Replace, Type, AlignLeft, GitCompare, Sparkles } from "lucide-react";

export interface TextStudioViewProps {
  tool: ToolMeta;
}

export const TextStudioView: React.FC<TextStudioViewProps> = ({ tool }) => {
  const isDiff = tool.slug.includes("diff");

  const [inputText, setInputText] = useState<string>("");
  const [diffTextOriginal, setDiffTextOriginal] = useState<string>("");
  const [diffTextModified, setDiffTextModified] = useState<string>("");

  const [findWord, setFindWord] = useState<string>("");
  const [replaceWord, setReplaceWord] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

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

    const diff: { type: "same" | "add" | "remove" | "change"; orig?: string; mod?: string }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const o = origLines[i];
      const m = modLines[i];
      if (o === m) {
        diff.push({ type: "same", orig: o, mod: m });
      } else if (o === undefined) {
        diff.push({ type: "add", mod: m });
      } else if (m === undefined) {
        diff.push({ type: "remove", orig: o });
      } else {
        diff.push({ type: "change", orig: o, mod: m });
      }
    }
    return diff;
  }, [diffTextOriginal, diffTextModified]);

  // Text Transform handlers
  const handleTransform = (type: string) => {
    switch (type) {
      case "upper":
        setInputText(inputText.toUpperCase());
        break;
      case "lower":
        setInputText(inputText.toLowerCase());
        break;
      case "title":
        setInputText(
          inputText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        );
        break;
      case "sentence":
        setInputText(
          inputText.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
        );
        break;
      case "camel":
        setInputText(
          inputText
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
              index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/[\s-_]+/g, "")
        );
        break;
      case "snake":
        setInputText(
          inputText
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_")
            .replace(/[^\w_]/g, "")
        );
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
        break;
      case "pascal":
        setInputText(
          inputText.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/[\s-_]+/g, "")
        );
        break;
      case "remove-duplicates":
        const uniqueLines = Array.from(new Set(inputText.split("\n"))).join("\n");
        setInputText(uniqueLines);
        break;
      case "sort-lines-asc":
        const sortedAsc = inputText.split("\n").sort().join("\n");
        setInputText(sortedAsc);
        break;
      case "sort-lines-desc":
        const sortedDesc = inputText.split("\n").sort().reverse().join("\n");
        setInputText(sortedDesc);
        break;
      case "remove-extra-spaces":
        setInputText(inputText.replace(/[ \t]+/g, " ").trim());
        break;
      case "remove-line-breaks":
        setInputText(inputText.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " "));
        break;
      case "reverse-text":
        setInputText(inputText.split("").reverse().join(""));
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

      {isDiff ? (
        /* TEXT DIFF CHECKER */
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-4 shadow-card">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Original Text</span>
              <textarea
                value={diffTextOriginal}
                onChange={(e) => setDiffTextOriginal(e.target.value)}
                placeholder="Paste original text here to compare..."
                rows={8}
                className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-4 shadow-card">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Modified Text</span>
              <textarea
                value={diffTextModified}
                onChange={(e) => setDiffTextModified(e.target.value)}
                placeholder="Paste updated/modified text here to see line differences..."
                rows={8}
                className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-accent" />
                Line-by-Line Diff Output
              </span>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="text-emerald-400">+ Added</span>
                <span className="text-rose-400">- Removed</span>
                <span className="text-amber-400">~ Modified</span>
              </div>
            </div>

            <div className="flex flex-col font-mono text-xs bg-surface-raised rounded-lg border border-border overflow-hidden divide-y divide-border/60">
              {diffResult.map((d, i) => (
                <div
                  key={i}
                  className={`p-2.5 flex items-start gap-3 ${
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
                      <div className="flex flex-col gap-0.5">
                        <span className="line-through text-rose-400/80">{d.orig}</span>
                        <span className="text-emerald-400">{d.mod}</span>
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
        /* STANDARD TEXT STUDIO */
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-wrap items-center gap-1.5">
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
              <Button variant="secondary" size="sm" onClick={() => handleTransform("snake")}>
                snake_case
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("kebab")}>
                kebab-case
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("slug")}>
                Generate Slug
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("remove-duplicates")}>
                Remove Duplicates
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("sort-lines-asc")}>
                Sort (A-Z)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("sort-lines-desc")}>
                Sort (Z-A)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("remove-extra-spaces")}>
                Trim Spaces
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("remove-line-breaks")}>
                Remove Breaks
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleTransform("reverse-text")}>
                Reverse Text
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleTransform("lorem")}>
                Lorem Ipsum
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCopy(inputText)}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? "Copied!" : "Copy Output"}
            </Button>
          </div>

          {/* Find & Replace Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-surface-raised p-2.5 rounded-lg border border-border items-center">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Find text..."
                value={findWord}
                onChange={(e) => setFindWord(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceWord}
                onChange={(e) => setReplaceWord(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div className="sm:col-span-2">
              <Button variant="secondary" size="sm" className="w-full" onClick={handleFindReplace} leftIcon={<Replace className="w-3 h-3" />}>
                Replace
              </Button>
            </div>
          </div>

          {/* Main Text Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={10}
            className="w-full bg-surface-raised border border-border rounded-xl p-4 font-mono text-sm text-text-primary outline-none focus:border-accent transition-colors leading-relaxed"
            placeholder="Type or paste text here to transform..."
          />

          {/* Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-surface-raised border border-border p-3 rounded-lg text-center">
              <span className="text-[11px] text-text-tertiary block">Characters</span>
              <span className="text-base font-bold text-text-primary mt-0.5 block">{stats.characters}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3 rounded-lg text-center">
              <span className="text-[11px] text-text-tertiary block">No Spaces</span>
              <span className="text-base font-bold text-text-primary mt-0.5 block">{stats.charactersNoSpaces}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3 rounded-lg text-center">
              <span className="text-[11px] text-text-tertiary block">Words</span>
              <span className="text-base font-bold text-accent mt-0.5 block">{stats.words}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3 rounded-lg text-center">
              <span className="text-[11px] text-text-tertiary block">Lines</span>
              <span className="text-base font-bold text-text-primary mt-0.5 block">{stats.lines}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3 rounded-lg text-center">
              <span className="text-[11px] text-text-tertiary block">Paragraphs</span>
              <span className="text-base font-bold text-text-primary mt-0.5 block">{stats.paragraphs}</span>
            </div>
            <div className="bg-surface-raised border border-border p-3 rounded-lg text-center">
              <span className="text-[11px] text-text-tertiary block">Reading Time</span>
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
