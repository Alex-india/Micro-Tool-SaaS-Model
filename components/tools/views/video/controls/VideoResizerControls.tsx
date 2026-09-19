"use client";

import React from "react";
import { Input } from "@/components/ui/Input";

interface Props {
  targetWidth: number;
  setTargetWidth: (v: number) => void;
  targetHeight: number;
  setTargetHeight: (v: number) => void;
  fitMode: "contain" | "cover" | "stretch";
  setFitMode: (v: "contain" | "cover" | "stretch") => void;
}

const RESOLUTION_PRESETS = [
  { label: "Full HD 1080p", w: 1920, h: 1080, aspect: "16:9" },
  { label: "HD 720p", w: 1280, h: 720, aspect: "16:9" },
  { label: "SD 480p", w: 854, h: 480, aspect: "16:9" },
  { label: "SD 360p", w: 640, h: 360, aspect: "16:9" },
  { label: "Shorts / Reels", w: 1080, h: 1920, aspect: "9:16" },
  { label: "Square", w: 1080, h: 1080, aspect: "1:1" },
  { label: "Portrait 4:5", w: 1080, h: 1350, aspect: "4:5" },
];

const FIT_MODES: { value: "contain" | "cover" | "stretch"; label: string; desc: string }[] = [
  { value: "contain", label: "Contain", desc: "Letterbox, no crop" },
  { value: "cover", label: "Cover", desc: "Fill, may crop" },
  { value: "stretch", label: "Stretch", desc: "Distort to fit" },
];

export const VideoResizerControls: React.FC<Props> = ({
  targetWidth,
  setTargetWidth,
  targetHeight,
  setTargetHeight,
  fitMode,
  setFitMode,
}) => {
  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-border">
      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
        Target Resolution
      </span>
      <div className="grid grid-cols-2 gap-2">
        {RESOLUTION_PRESETS.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => {
              setTargetWidth(r.w);
              setTargetHeight(r.h);
            }}
            className={`p-2 rounded-lg border text-xs font-semibold text-left transition-colors ${
              targetWidth === r.w && targetHeight === r.h
                ? "bg-accent/10 border-accent text-accent"
                : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
            }`}
            aria-label={`Resize to ${r.label} (${r.w}×${r.h})`}
          >
            <div>{r.label}</div>
            <div className="text-[10px] opacity-70 font-normal">{r.w}×{r.h} ({r.aspect})</div>
          </button>
        ))}
      </div>

      <span className="text-xs font-bold text-text-primary uppercase tracking-wider pt-2">
        Custom Dimensions
      </span>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Width (px)"
          type="number"
          min={2}
          step={2}
          value={targetWidth}
          onChange={(e) => setTargetWidth(parseInt(e.target.value) || 640)}
        />
        <Input
          label="Height (px)"
          type="number"
          min={2}
          step={2}
          value={targetHeight}
          onChange={(e) => setTargetHeight(parseInt(e.target.value) || 480)}
        />
      </div>

      <span className="text-xs font-bold text-text-primary uppercase tracking-wider pt-2">
        Fit Mode
      </span>
      <div className="grid grid-cols-3 gap-2">
        {FIT_MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setFitMode(m.value)}
            className={`py-2 rounded-lg border text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 ${
              fitMode === m.value
                ? "bg-accent/10 border-accent text-accent"
                : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
            }`}
            aria-label={`Fit mode: ${m.label} — ${m.desc}`}
          >
            <span>{m.label}</span>
            <span className="text-[10px] opacity-70 font-normal">{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
