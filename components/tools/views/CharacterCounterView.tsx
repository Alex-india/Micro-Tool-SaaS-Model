"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Button } from "@/components/ui/Button";
import { 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Share2, 
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Server,
  Hash,
  Layers,
  Type
} from "lucide-react";

export interface CharacterCounterViewProps {
  tool: ToolMeta;
}

interface PlatformLimit {
  id: string;
  name: string;
  limit: number;
  icon: string;
  category: "social" | "seo" | "messaging";
}

const DEFAULT_PLATFORMS: PlatformLimit[] = [
  { id: "twitter", name: "Twitter / X Post", limit: 280, icon: "𝕏", category: "social" },
  { id: "threads", name: "Threads Post", limit: 500, icon: "🧵", category: "social" },
  { id: "sms", name: "SMS Segment", limit: 160, icon: "💬", category: "messaging" },
  { id: "instagram_bio", name: "Instagram Bio", limit: 150, icon: "📸", category: "social" },
  { id: "instagram_caption", name: "Instagram Caption", limit: 2200, icon: "📸", category: "social" },
  { id: "seo_title", name: "SEO Meta Title", limit: 60, icon: "🔍", category: "seo" },
  { id: "seo_desc", name: "SEO Meta Description", limit: 160, icon: "📝", category: "seo" },
  { id: "linkedin_post", name: "LinkedIn Post", limit: 3000, icon: "💼", category: "social" },
  { id: "linkedin_headline", name: "LinkedIn Headline", limit: 220, icon: "💼", category: "social" },
  { id: "youtube_title", name: "YouTube Title", limit: 100, icon: "▶️", category: "social" },
  { id: "tiktok_caption", name: "TikTok Caption", limit: 2200, icon: "🎵", category: "social" },
  { id: "pinterest_title", name: "Pinterest Title", limit: 100, icon: "📌", category: "social" },
  { id: "reddit_title", name: "Reddit Post Title", limit: 300, icon: "🤖", category: "social" },
];

export const CharacterCounterView: React.FC<CharacterCounterViewProps> = ({ tool }) => {
  const [textInput, setTextInput] = useState<string>(
    "Supercharge your content workflow with ToolVerse. Instant character counts, social limit previews, and clean text utilities."
  );
  const [copied, setCopied] = useState(false);
  const [apiData, setApiData] = useState<any>(null);

  // Compute local character metrics instantly
  const localStats = useMemo(() => {
    const raw = textInput;
    const charsWithSpaces = raw.length;
    const charsNoSpaces = raw.replace(/\s/g, "").length;
    const words = raw.trim() === "" ? 0 : raw.trim().split(/\s+/).length;
    const sentences = raw.trim() === "" ? 0 : (raw.match(/[^.!?]+[.!?]+(\s|$)/g) || [1]).length;
    const lines = raw === "" ? 0 : raw.split("\n").length;
    
    const letters = (raw.match(/[a-zA-Z]/g) || []).length;
    const digits = (raw.match(/[0-9]/g) || []).length;
    const spaces = (raw.match(/[\s]/g) || []).length;
    const uppercaseLetters = (raw.match(/[A-Z]/g) || []).length;
    const lowercaseLetters = (raw.match(/[a-z]/g) || []).length;
    const punctuation = (raw.match(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g) || []).length;
    const specials = charsWithSpaces - letters - digits - spaces;

    return {
      charsWithSpaces,
      charsNoSpaces,
      words,
      sentences,
      lines,
      letters,
      digits,
      spaces,
      uppercaseLetters,
      lowercaseLetters,
      punctuation,
      specials,
    };
  }, [textInput]);

  // Debounced API sync
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/text/character-counter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textInput }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setApiData(json.data);
          }
        }
      } catch {
        // Fallback to local
      }
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [textInput]);

  const stats = apiData || localStats;
  const platformList = apiData?.platformStatus || DEFAULT_PLATFORMS;

  const handleCopy = () => {
    navigator.clipboard.writeText(textInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrimSpaces = () => {
    setTextInput(textInput.replace(/\s+/g, " ").trim());
  };

  const handleUpperCase = () => {
    setTextInput(textInput.toUpperCase());
  };

  const handleLowerCase = () => {
    setTextInput(textInput.toLowerCase());
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
          <span className="font-mono text-emerald-400">/api/text/character-counter</span>
        </div>
        <span className="text-[11px] text-text-tertiary hidden sm:inline">
          Live multi-platform character limit validation
        </span>
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-accent/40 p-5 rounded-2xl shadow-xl flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-accent/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-xs font-bold text-accent uppercase tracking-wider">With Spaces</span>
          <span className="text-3xl sm:text-4xl font-black font-mono text-text-primary">{stats.charsWithSpaces}</span>
          <span className="text-[11px] text-text-tertiary">Total character count</span>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-xl flex flex-col gap-1">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Without Spaces</span>
          <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">{stats.charsNoSpaces}</span>
          <span className="text-[11px] text-text-tertiary">Pure letters & symbols</span>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-xl flex flex-col gap-1">
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Total Words</span>
          <span className="text-3xl sm:text-4xl font-black font-mono text-indigo-400">{stats.words}</span>
          <span className="text-[11px] text-text-tertiary">Word count</span>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-xl flex flex-col gap-1">
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Lines / Sentences</span>
          <span className="text-3xl sm:text-4xl font-black font-mono text-text-primary">
            {stats.lines} <span className="text-lg text-text-tertiary font-normal">/ {stats.sentences}</span>
          </span>
          <span className="text-[11px] text-text-tertiary">Structure depth</span>
        </div>
      </div>

      {/* Editor & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Text Area & Quick Formatting Tools */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Type or Paste Text to Count
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleTrimSpaces}
                title="Remove extra spaces"
              >
                Trim Spaces
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleUpperCase}
              >
                UPPER
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLowerCase}
              >
                lower
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setTextInput("")} 
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
              >
                Clear
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleCopy} 
                leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type or paste your text here to track character limits for Twitter/X, SMS, SEO, and social platforms in real-time..."
            rows={12}
            className="w-full bg-surface border border-border/80 focus:border-accent rounded-2xl p-5 font-sans text-sm text-text-primary outline-none resize-y leading-relaxed shadow-xl transition-all"
          />

          {/* Character Composition Breakdown Bar */}
          <div className="bg-surface border border-border p-5 rounded-2xl shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-surface-raised border border-border">
              <span className="text-[10px] text-text-tertiary block uppercase font-bold">Letters (A-Z)</span>
              <span className="text-lg font-black font-mono text-text-primary mt-0.5 block">{stats.letters}</span>
              <span className="text-[10px] text-text-tertiary">
                {stats.uppercaseLetters || 0} Up / {stats.lowercaseLetters || 0} Low
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-raised border border-border">
              <span className="text-[10px] text-text-tertiary block uppercase font-bold">Numbers (0-9)</span>
              <span className="text-lg font-black font-mono text-accent mt-0.5 block">{stats.digits}</span>
              <span className="text-[10px] text-text-tertiary">Digits</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-raised border border-border">
              <span className="text-[10px] text-text-tertiary block uppercase font-bold">Spaces</span>
              <span className="text-lg font-black font-mono text-text-secondary mt-0.5 block">{stats.spaces}</span>
              <span className="text-[10px] text-text-tertiary">Whitespace</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-raised border border-border">
              <span className="text-[10px] text-text-tertiary block uppercase font-bold">Symbols & Punctuation</span>
              <span className="text-lg font-black font-mono text-amber-400 mt-0.5 block">{stats.specials}</span>
              <span className="text-[10px] text-text-tertiary">Special chars</span>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Limits Progress Grid */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-accent" />
                <h4 className="font-bold text-text-primary text-sm">Social & SEO Character Limits</h4>
              </div>
              <span className="text-[10px] font-mono bg-surface-raised px-2 py-0.5 rounded border border-border text-emerald-400">
                Live Sync
              </span>
            </div>

            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
              {platformList.map((platform: any) => {
                const current = stats.charsWithSpaces;
                const limit = platform.limit;
                const percentage = Math.min(100, Math.round((current / limit) * 100));
                const isOver = current > limit;
                const remaining = limit - current;

                let progressColor = "bg-accent";
                let badgeColor = "text-text-secondary";
                if (percentage > 90 && !isOver) {
                  progressColor = "bg-amber-400";
                  badgeColor = "text-amber-400";
                } else if (isOver) {
                  progressColor = "bg-rose-500";
                  badgeColor = "text-rose-400 font-bold";
                }

                const smsSegments = Math.ceil(Math.max(1, current) / 160);

                return (
                  <div 
                    key={platform.id} 
                    className={`p-3.5 rounded-xl border transition-all ${
                      isOver 
                        ? "border-rose-500/50 bg-rose-500/5" 
                        : "border-border/60 bg-surface-raised hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{platform.icon}</span>
                        <span className="font-semibold text-text-primary">{platform.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        {platform.id === "sms" && current > 0 && (
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            {smsSegments} {smsSegments > 1 ? "segments" : "segment"}
                          </span>
                        )}
                        <span className={badgeColor}>
                          {current} / {limit}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/40 relative">
                      <div
                        className={`h-full transition-all duration-150 rounded-full ${progressColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Subtext info */}
                    <div className="flex justify-between items-center mt-1.5 text-[10px] text-text-tertiary font-mono">
                      <span>
                        {isOver ? (
                          <span className="text-rose-400 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3" /> Exceeded by {Math.abs(remaining)} chars
                          </span>
                        ) : (
                          <span>{remaining} chars left</span>
                        )}
                      </span>
                      <span>{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
