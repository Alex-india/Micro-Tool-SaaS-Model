"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { ResultDisplay } from "../ResultDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { analyzeText } from "@/tools/text/wordCounter";
import { Button } from "@/components/ui/Button";
import { Trash2, Copy, Check } from "lucide-react";

export interface WordCounterViewProps {
  tool: ToolMeta;
}

export const WordCounterView: React.FC<WordCounterViewProps> = ({ tool }) => {
  const [textInput, setTextInput] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => analyzeText(textInput), [textInput]);

  const handleCopy = () => {
    navigator.clipboard.writeText(textInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Main Metric Cards Grid Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-5 rounded-xl shadow-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-tertiary uppercase">Words</span>
          <span className="text-3xl font-extrabold font-mono text-accent">{stats.words}</span>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl shadow-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-tertiary uppercase">Characters</span>
          <span className="text-3xl font-extrabold font-mono text-text-primary">{stats.characters}</span>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl shadow-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-tertiary uppercase">Reading Time</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-400">~{stats.readingTimeMinutes} m</span>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl shadow-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-tertiary uppercase">Speaking Time</span>
          <span className="text-3xl font-extrabold font-mono text-indigo-400">~{stats.speakingTimeMinutes} m</span>
        </div>
      </div>

      {/* Editor & Secondary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Text Area */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Type or Paste Text Below</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setTextInput("")} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                Clear
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCopy} leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}>
                {copied ? "Copied" : "Copy Text"}
              </Button>
            </div>
          </div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type or paste your text here to count words, characters, sentences, reading time..."
            rows={14}
            className="w-full bg-surface border border-border rounded-xl p-4 font-sans text-sm text-text-primary outline-none focus:border-accent resize-y leading-relaxed shadow-card"
          />
        </div>

        {/* Right Column Secondary Stats & Keyword Table */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3 text-xs">
            <h4 className="font-bold text-text-primary text-sm border-b border-border pb-2">Secondary Statistics</h4>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-secondary">Sentences</span>
              <span className="font-mono text-text-primary font-bold">{stats.sentences}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-secondary">Paragraphs</span>
              <span className="font-mono text-text-primary font-bold">{stats.paragraphs}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-secondary">Total Lines</span>
              <span className="font-mono text-text-primary font-bold">{stats.lines}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-secondary">Chars (no spaces)</span>
              <span className="font-mono text-text-primary font-bold">{stats.charactersNoSpaces}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-secondary">Avg Words / Sentence</span>
              <span className="font-mono text-text-primary font-bold">{stats.avgWordsPerSentence}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Avg Chars / Word</span>
              <span className="font-mono text-text-primary font-bold">{stats.avgCharPerWord}</span>
            </div>
          </div>

          {/* Top Keyword Density Table */}
          {stats.topWords.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3 text-xs">
              <h4 className="font-bold text-text-primary text-sm border-b border-border pb-2">Top Keywords Density</h4>
              <div className="flex flex-col gap-2">
                {stats.topWords.slice(0, 6).map((kw) => (
                  <div key={kw.word} className="flex items-center justify-between">
                    <span className="font-mono text-accent">{kw.word}</span>
                    <span className="text-text-tertiary font-mono">{kw.count} ({kw.frequency}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
