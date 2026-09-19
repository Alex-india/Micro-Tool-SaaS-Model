"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Repeat, Sparkles, CheckCircle2, Film } from "lucide-react";

interface Props {
  loopCount: number;
  setLoopCount: (v: number) => void;
  crf: number;
  setCrf: (v: number) => void;
}

const LOOP_PRESETS = [1, 2, 3, 5, 10];

export const GifToVideoControls: React.FC<Props> = ({
  loopCount,
  setLoopCount,
  crf,
  setCrf,
}) => {
  return (
    <div className="flex flex-col gap-4 pt-2 border-t border-border">
      {/* Output Format Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-accent" /> Video Format
        </span>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> MP4 (H.264 / FastStart)
        </span>
      </div>

      {/* Quality Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Encoding Quality
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "High Quality", desc: "Crisp detail", value: 20 },
            { label: "Balanced", desc: "Recommended", value: 23 },
            { label: "Small File", desc: "Compressed", value: 28 },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setCrf(p.value)}
              className={`p-2 rounded-lg border text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 ${
                crf === p.value
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
              }`}
              aria-label={`${p.label} quality preset`}
            >
              <span>{p.label}</span>
              <span className="text-[10px] font-normal text-text-tertiary">
                {p.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loop Count Settings */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-accent" /> Loop Count
          </span>
          <span className="text-[11px] font-mono text-text-tertiary">
            {loopCount === 1 ? "Plays 1 time" : `Repeats ${loopCount} times`}
          </span>
        </div>

        {/* Quick loop presets */}
        <div className="grid grid-cols-5 gap-1.5">
          {LOOP_PRESETS.map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => setLoopCount(cnt)}
              className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                loopCount === cnt
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
              }`}
            >
              {cnt}x
            </button>
          ))}
        </div>

        <Input
          label="Custom Loop Count"
          type="number"
          min={1}
          max={50}
          step={1}
          value={loopCount}
          onChange={(e) => setLoopCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
        />
      </div>

      {/* Info Card */}
      <div className="p-3 bg-surface-raised rounded-xl border border-border flex flex-col gap-1 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5 text-text-primary font-medium">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> MP4 Video Advantages
        </div>
        <p className="text-[11px] text-text-tertiary leading-relaxed mt-0.5">
          MP4 videos use modern H.264 compression to reduce animated GIF file size by up to 90%, load instantly on mobile, and support smooth 60fps playback.
        </p>
      </div>
    </div>
  );
};
