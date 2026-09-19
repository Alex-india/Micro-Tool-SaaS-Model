"use client";

import React from "react";
import { Input } from "@/components/ui/Input";

interface Props {
  trimStart: number;
  setTrimStart: (v: number) => void;
  trimEnd: number;
  setTrimEnd: (v: number) => void;
  duration: number;
  fadeIn: number;
  setFadeIn: (v: number) => void;
  fadeOut: number;
  setFadeOut: (v: number) => void;
}

export const AudioTrimmerControls: React.FC<Props> = ({
  trimStart,
  setTrimStart,
  trimEnd,
  setTrimEnd,
  duration,
  fadeIn,
  setFadeIn,
  fadeOut,
  setFadeOut,
}) => {
  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toFixed(1).padStart(4, "0")}`;
  };

  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [dragMode, setDragMode] = React.useState<"start" | "end" | "window" | null>(null);
  const dragInfoRef = React.useRef<{
    startX: number;
    initialStart: number;
    initialEnd: number;
    trackWidth: number;
  } | null>(null);

  const startPct = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (trimEnd / duration) * 100 : 100;
  const widthPct = Math.max(0, endPct - startPct);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    mode: "start" | "end" | "window"
  ) => {
    e.stopPropagation();
    if (!trackRef.current || duration <= 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const rect = trackRef.current.getBoundingClientRect();
    setDragMode(mode);
    dragInfoRef.current = {
      startX: e.clientX,
      initialStart: trimStart,
      initialEnd: trimEnd,
      trackWidth: rect.width,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragMode || !dragInfoRef.current || duration <= 0) return;

    const { startX, initialStart, initialEnd, trackWidth } = dragInfoRef.current;
    const deltaX = e.clientX - startX;
    const deltaSec = (deltaX / trackWidth) * duration;

    if (dragMode === "start") {
      const next = Math.max(0, Math.min(initialStart + deltaSec, trimEnd - 0.1));
      setTrimStart(parseFloat(next.toFixed(1)));
    } else if (dragMode === "end") {
      const next = Math.min(duration, Math.max(initialEnd + deltaSec, trimStart + 0.1));
      setTrimEnd(parseFloat(next.toFixed(1)));
    } else if (dragMode === "window") {
      const windowDur = initialEnd - initialStart;
      let nextStart = initialStart + deltaSec;
      let nextEnd = initialEnd + deltaSec;
      if (nextStart < 0) {
        nextStart = 0;
        nextEnd = windowDur;
      } else if (nextEnd > duration) {
        nextEnd = duration;
        nextStart = Math.max(0, duration - windowDur);
      }
      setTrimStart(parseFloat(nextStart.toFixed(1)));
      setTrimEnd(parseFloat(nextEnd.toFixed(1)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragMode) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDragMode(null);
      dragInfoRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Trim Range (Total: {formatTime(duration)})
        </span>
        <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
          Cut: {(trimEnd - trimStart).toFixed(1)}s
        </span>
      </div>

      {/* Interactive Draggable Range Bar */}
      <div
        ref={trackRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-8 bg-surface-raised rounded-lg border border-border overflow-hidden select-none touch-none shadow-inner"
      >
        {/* Dimmed Left */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-black/50 pointer-events-none"
          style={{ width: `${startPct}%` }}
        />

        {/* Dimmed Right */}
        <div
          className="absolute right-0 top-0 bottom-0 bg-black/50 pointer-events-none"
          style={{ width: `${Math.max(0, 100 - endPct)}%` }}
        />

        {/* Draggable Active Window */}
        <div
          onPointerDown={(e) => handlePointerDown(e, "window")}
          className="absolute top-0 bottom-0 bg-accent/25 border-y-2 border-accent cursor-grab active:cursor-grabbing hover:bg-accent/30 transition-colors flex items-center justify-center overflow-hidden"
          style={{
            left: `${startPct}%`,
            width: `${widthPct}%`,
          }}
          title="Drag to move trim window"
        >
          <span className="text-[10px] font-mono font-bold text-accent select-none pointer-events-none">
            ↔ Slide Cut
          </span>
        </div>

        {/* Start Handle */}
        <div
          onPointerDown={(e) => handlePointerDown(e, "start")}
          style={{ left: `${startPct}%` }}
          className="absolute top-0 bottom-0 -ml-2 w-4 bg-accent hover:bg-sky-400 cursor-ew-resize rounded-l flex items-center justify-center shadow-md z-10"
          title={`Start: ${formatTime(trimStart)} (Drag to adjust)`}
        >
          <div className="w-0.5 h-3.5 bg-white/90 rounded-full pointer-events-none" />
        </div>

        {/* End Handle */}
        <div
          onPointerDown={(e) => handlePointerDown(e, "end")}
          style={{ left: `${endPct}%` }}
          className="absolute top-0 bottom-0 -ml-2 w-4 bg-accent hover:bg-sky-400 cursor-ew-resize rounded-r flex items-center justify-center shadow-md z-10"
          title={`End: ${formatTime(trimEnd)} (Drag to adjust)`}
        >
          <div className="w-0.5 h-3.5 bg-white/90 rounded-full pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Time (sec)"
          type="number"
          min={0}
          max={trimEnd - 0.1}
          step={0.5}
          value={trimStart}
          onChange={(e) => {
            const v = parseFloat(e.target.value) || 0;
            setTrimStart(Math.max(0, Math.min(v, trimEnd - 0.1)));
          }}
        />
        <Input
          label="End Time (sec)"
          type="number"
          min={trimStart + 0.1}
          max={duration}
          step={0.5}
          value={trimEnd}
          onChange={(e) => {
            const v = parseFloat(e.target.value) || duration;
            setTrimEnd(Math.max(trimStart + 0.1, Math.min(v, duration)));
          }}
        />
      </div>

      <div className="p-2 bg-surface-raised rounded-lg border border-border text-xs text-text-tertiary">
        Selected: {formatTime(trimStart)} → {formatTime(trimEnd)} ({(trimEnd - trimStart).toFixed(1)}s)
      </div>

      <span className="text-xs font-bold text-text-primary uppercase tracking-wider pt-2">
        Fade Effects
      </span>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fade In (sec)"
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={fadeIn}
          onChange={(e) => setFadeIn(Math.max(0, parseFloat(e.target.value) || 0))}
        />
        <Input
          label="Fade Out (sec)"
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={fadeOut}
          onChange={(e) => setFadeOut(Math.max(0, parseFloat(e.target.value) || 0))}
        />
      </div>
    </div>
  );
};
