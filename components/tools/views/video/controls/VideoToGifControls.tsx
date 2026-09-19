"use client";

import React from "react";
import { Slider } from "@/components/ui/Slider";
import { Input } from "@/components/ui/Input";
import { RotateCcw, Film, CheckCircle2, Info } from "lucide-react";

interface Props {
  startTime: number;
  setStartTime: (v: number) => void;
  gifDuration: number;
  setGifDuration: (v: number) => void;
  fps: number;
  setFps: (v: number) => void;
  width: number;
  setWidth: (v: number) => void;
  dithering: boolean;
  setDithering: (v: boolean) => void;
  videoDuration: number;
}

const FPS_OPTIONS = [8, 10, 12, 15, 20];

export const VideoToGifControls: React.FC<Props> = ({
  startTime,
  setStartTime,
  gifDuration,
  setGifDuration,
  fps,
  setFps,
  width,
  setWidth,
  dithering,
  setDithering,
  videoDuration,
}) => {
  const safeDuration = videoDuration > 0 ? videoDuration : 1;
  const isEntireVideo =
    startTime === 0 &&
    (gifDuration <= 0 || gifDuration >= safeDuration - 0.05);

  const formatTime = (sec: number): string => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`;
  };

  const setFullVideo = () => {
    setStartTime(0);
    setGifDuration(safeDuration);
  };

  const currentDuration = isEntireVideo ? safeDuration : Math.min(gifDuration, Math.max(0.1, safeDuration - startTime));

  return (
    <div className="flex flex-col gap-3.5 pt-2 border-t border-border">
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-accent" /> Conversion Range
        </span>
        {isEntireVideo ? (
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Entire Video ({safeDuration.toFixed(1)}s)
          </span>
        ) : (
          <span className="text-[11px] font-mono text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
            Clip: {currentDuration.toFixed(1)}s
          </span>
        )}
      </div>

      {/* Quick Range Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={setFullVideo}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 flex items-center gap-1 ${
            isEntireVideo
              ? "bg-accent/15 border-accent text-accent font-semibold"
              : "bg-surface-raised border-border text-text-secondary hover:text-text-primary hover:border-accent/40"
          }`}
          title="Convert the full duration of the video to GIF"
        >
          <RotateCcw className="w-3 h-3" /> Entire Video ({safeDuration.toFixed(1)}s)
        </button>

        {safeDuration > 3 && (
          <button
            type="button"
            onClick={() => {
              setStartTime(0);
              setGifDuration(Math.min(3, safeDuration));
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
              !isEntireVideo && startTime === 0 && Math.abs(gifDuration - 3) < 0.1
                ? "bg-accent/15 border-accent text-accent font-semibold"
                : "bg-surface-raised border-border text-text-secondary hover:text-text-primary hover:border-accent/40"
            }`}
          >
            First 3s
          </button>
        )}

        {safeDuration > 5 && (
          <button
            type="button"
            onClick={() => {
              setStartTime(0);
              setGifDuration(Math.min(5, safeDuration));
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
              !isEntireVideo && startTime === 0 && Math.abs(gifDuration - 5) < 0.1
                ? "bg-accent/15 border-accent text-accent font-semibold"
                : "bg-surface-raised border-border text-text-secondary hover:text-text-primary hover:border-accent/40"
            }`}
          >
            First 5s
          </button>
        )}

        {safeDuration > 10 && (
          <button
            type="button"
            onClick={() => {
              setStartTime(0);
              setGifDuration(Math.min(10, safeDuration));
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
              !isEntireVideo && startTime === 0 && Math.abs(gifDuration - 10) < 0.1
                ? "bg-accent/15 border-accent text-accent font-semibold"
                : "bg-surface-raised border-border text-text-secondary hover:text-text-primary hover:border-accent/40"
            }`}
          >
            First 10s
          </button>
        )}
      </div>

      {/* Start Time and Duration Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Time (sec)"
          type="number"
          min={0}
          max={Math.max(0, safeDuration - 0.1)}
          step={0.1}
          value={startTime}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            const val = isNaN(v) ? 0 : Math.max(0, Math.min(v, safeDuration - 0.1));
            setStartTime(val);
            if (val + gifDuration > safeDuration) {
              setGifDuration(Math.max(0.1, safeDuration - val));
            }
          }}
        />
        <Input
          label="Duration (sec)"
          type="number"
          min={0.1}
          max={safeDuration}
          step={0.1}
          value={parseFloat(currentDuration.toFixed(2))}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            const maxAllowed = Math.max(0.1, safeDuration - startTime);
            const val = isNaN(v) ? maxAllowed : Math.min(maxAllowed, Math.max(0.1, v));
            setGifDuration(val);
          }}
        />
      </div>

      {/* Summary / Large File Notice */}
      {currentDuration > 10 ? (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Converting a {currentDuration.toFixed(1)}s GIF may yield a larger file. For smaller sizes, 10–12 FPS and 480px width work best.
          </span>
        </div>
      ) : (
        <div className="p-2.5 bg-surface-raised rounded-lg border border-border flex items-center justify-between text-xs text-text-secondary">
          <span>Selected Range:</span>
          <span className="font-mono text-text-primary">
            {formatTime(startTime)} → {formatTime(startTime + currentDuration)} ({currentDuration.toFixed(1)}s)
          </span>
        </div>
      )}

      {/* Frame Rate */}
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Frame Rate
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {FPS_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFps(f)}
              className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                fps === f
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
              }`}
              aria-label={`Set GIF frame rate to ${f} FPS`}
            >
              {f} FPS
            </button>
          ))}
        </div>
      </div>

      {/* GIF Width Slider */}
      <Slider
        label="GIF Width"
        min={240}
        max={720}
        step={20}
        value={width}
        unit="px"
        onChangeValue={setWidth}
      />

      {/* Dithering toggle */}
      <div className="flex items-center justify-between text-xs pt-1 p-2.5 rounded-lg bg-surface-raised/40 border border-border">
        <div className="flex flex-col">
          <label className="text-text-primary font-medium cursor-pointer" htmlFor="dithering-toggle">
            Dithering (Smoother Color Gradients)
          </label>
          <span className="text-[11px] text-text-tertiary">
            Improves color reproduction and reduces banding
          </span>
        </div>
        <input
          id="dithering-toggle"
          type="checkbox"
          checked={dithering}
          onChange={(e) => setDithering(e.target.checked)}
          className="w-4 h-4 rounded border-border accent-accent cursor-pointer"
          aria-label="Enable dithering for smoother gradients"
        />
      </div>
    </div>
  );
};
