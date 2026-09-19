"use client";

import React from "react";
import { Slider } from "@/components/ui/Slider";

interface Props {
  crf: number;
  setCrf: (v: number) => void;
  targetWidth: number;
  setTargetWidth: (v: number) => void;
  targetHeight: number;
  setTargetHeight: (v: number) => void;
  sourceWidth: number;
  sourceHeight: number;
}

const PRESETS = [
  { label: "High Quality", crf: 23, desc: "Best quality, larger file" },
  { label: "Balanced", crf: 28, desc: "Good quality, moderate size" },
  { label: "Small File", crf: 33, desc: "Smaller file, lower quality" },
];

export const VideoCompressorControls: React.FC<Props> = ({
  crf,
  setCrf,
  targetWidth,
  setTargetWidth,
  targetHeight,
  setTargetHeight,
  sourceWidth,
  sourceHeight,
}) => {
  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-border">
      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
        Quality Preset
      </span>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.crf}
            type="button"
            onClick={() => setCrf(p.crf)}
            className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 ${
              crf === p.crf
                ? "bg-accent/10 border-accent text-accent"
                : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
            }`}
            aria-label={`${p.label} compression preset, CRF ${p.crf}`}
          >
            <span>{p.label}</span>
            <span className="text-[10px] opacity-70 font-normal">{p.desc}</span>
          </button>
        ))}
      </div>

      <Slider
        label="CRF (Constant Rate Factor)"
        min={18}
        max={40}
        step={1}
        value={crf}
        onChangeValue={setCrf}
      />

      <span className="text-xs font-bold text-text-primary uppercase tracking-wider pt-2">
        Optional Resolution
      </span>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Original", w: sourceWidth, h: sourceHeight },
          { label: "720p", w: 1280, h: 720 },
          { label: "480p", w: 854, h: 480 },
          { label: "360p", w: 640, h: 360 },
        ].map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => {
              setTargetWidth(r.w);
              setTargetHeight(r.h);
            }}
            className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              targetWidth === r.w && targetHeight === r.h
                ? "bg-accent/10 border-accent text-accent"
                : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
            }`}
            aria-label={`Resize to ${r.label}`}
          >
            {r.label} {r.w > 0 ? `(${r.w}×${r.h})` : ""}
          </button>
        ))}
      </div>
      {sourceWidth > 1280 && (
        <p className="text-[11px] text-accent/80 bg-accent/5 p-2 rounded-lg border border-accent/20 leading-relaxed">
          💡 <strong>Tip for 1080p videos:</strong> Choosing <strong>720p</strong> or <strong>480p</strong> compresses 3× to 5× faster in browser while significantly reducing file size.
        </p>
      )}
    </div>
  );
};
