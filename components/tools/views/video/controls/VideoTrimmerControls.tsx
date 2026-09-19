"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Scissors, RotateCcw, Clock, Sparkles } from "lucide-react";

interface Props {
  trimStart: number;
  setTrimStart: (v: number) => void;
  trimEnd: number;
  setTrimEnd: (v: number) => void;
  duration: number;
  preciseCut: boolean;
  setPreciseCut: (v: boolean) => void;
  onPreviewSelection?: () => void;
}

export const VideoTrimmerControls: React.FC<Props> = ({
  trimStart,
  setTrimStart,
  trimEnd,
  setTrimEnd,
  duration,
  preciseCut,
  setPreciseCut,
}) => {
  const formatTime = (sec: number): string => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toFixed(1).padStart(4, "0")}`;
  };

  const safeDuration = duration > 0 ? duration : 1;
  const safeStart = Math.max(0, Math.min(trimStart, safeDuration));
  const safeEnd = Math.max(safeStart + 0.1, Math.min(trimEnd || safeDuration, safeDuration));
  const trimDuration = Math.max(0, safeEnd - safeStart);
  const trimPercentage = Math.round((trimDuration / safeDuration) * 100);

  const setPresetRange = (start: number, end: number) => {
    const s = Math.max(0, Math.min(start, safeDuration - 0.1));
    const e = Math.max(s + 0.1, Math.min(end, safeDuration));
    setTrimStart(parseFloat(s.toFixed(2)));
    setTrimEnd(parseFloat(e.toFixed(2)));
  };

  return (
    <div className="flex flex-col gap-3.5 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-accent" /> Trim Range
        </span>
        <span className="text-xs font-mono text-text-tertiary">
          Total: {formatTime(duration)}
        </span>
      </div>

      {/* Quick Trim Range Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setPresetRange(0, safeDuration)}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors shrink-0 flex items-center gap-1"
          title="Reset to entire video length"
        >
          <RotateCcw className="w-3 h-3 text-accent" /> Full Video
        </button>

        {safeDuration > 5 && (
          <button
            type="button"
            onClick={() => setPresetRange(0, Math.min(5, safeDuration))}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors shrink-0"
          >
            First 5s
          </button>
        )}

        {safeDuration > 10 && (
          <button
            type="button"
            onClick={() => setPresetRange(0, Math.min(10, safeDuration))}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors shrink-0"
          >
            First 10s
          </button>
        )}

        {safeDuration > 15 && (
          <button
            type="button"
            onClick={() => setPresetRange(Math.max(0, safeDuration - 10), safeDuration)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors shrink-0"
          >
            Last 10s
          </button>
        )}
      </div>

      {/* Numerical Time Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            label="Start Time (sec)"
            type="number"
            min={0}
            max={safeEnd - 0.1}
            step={0.1}
            value={safeStart}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) {
                setTrimStart(Math.max(0, Math.min(v, safeEnd - 0.1)));
              }
            }}
          />
          <div className="flex items-center gap-1 mt-1">
            <button
              type="button"
              onClick={() => setTrimStart(Math.max(0, parseFloat((safeStart - 0.5).toFixed(2))))}
              className="flex-1 py-0.5 rounded text-[10px] bg-surface-raised border border-border text-text-tertiary hover:text-text-primary"
            >
              -0.5s
            </button>
            <button
              type="button"
              onClick={() => setTrimStart(Math.min(safeEnd - 0.1, parseFloat((safeStart + 0.5).toFixed(2))))}
              className="flex-1 py-0.5 rounded text-[10px] bg-surface-raised border border-border text-text-tertiary hover:text-text-primary"
            >
              +0.5s
            </button>
          </div>
        </div>

        <div>
          <Input
            label="End Time (sec)"
            type="number"
            min={safeStart + 0.1}
            max={safeDuration}
            step={0.1}
            value={safeEnd}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) {
                setTrimEnd(Math.max(safeStart + 0.1, Math.min(v, safeDuration)));
              }
            }}
          />
          <div className="flex items-center gap-1 mt-1">
            <button
              type="button"
              onClick={() => setTrimEnd(Math.max(safeStart + 0.1, parseFloat((safeEnd - 0.5).toFixed(2))))}
              className="flex-1 py-0.5 rounded text-[10px] bg-surface-raised border border-border text-text-tertiary hover:text-text-primary"
            >
              -0.5s
            </button>
            <button
              type="button"
              onClick={() => setTrimEnd(Math.min(safeDuration, parseFloat((safeEnd + 0.5).toFixed(2))))}
              className="flex-1 py-0.5 rounded text-[10px] bg-surface-raised border border-border text-text-tertiary hover:text-text-primary"
            >
              +0.5s
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Pill */}
      <div className="p-3 bg-surface-raised rounded-xl border border-border flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-accent" /> Selected Duration:
          </span>
          <span className="font-mono font-bold text-accent">
            {trimDuration.toFixed(2)}s ({trimPercentage}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-tertiary">
          <span>{formatTime(safeStart)}</span>
          <span>→</span>
          <span>{formatTime(safeEnd)}</span>
        </div>
      </div>

      {/* Frame-accurate Mode Toggle */}
      <div className="flex items-center justify-between text-xs pt-1 p-2.5 rounded-lg bg-surface-raised/40 border border-border">
        <div className="flex flex-col">
          <label className="text-text-primary font-medium cursor-pointer" htmlFor="precise-cut-toggle">
            Frame-Accurate Cut
          </label>
          <span className="text-[11px] text-text-tertiary">
            Exact cuts on non-keyframes (slower re-encode)
          </span>
        </div>
        <input
          id="precise-cut-toggle"
          type="checkbox"
          checked={preciseCut}
          onChange={(e) => setPreciseCut(e.target.checked)}
          className="w-4 h-4 rounded border-border accent-accent cursor-pointer"
          aria-label="Enable frame-accurate cut mode"
        />
      </div>
    </div>
  );
};
