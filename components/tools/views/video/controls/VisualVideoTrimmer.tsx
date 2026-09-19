"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Scissors,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Repeat,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface VisualVideoTrimmerProps {
  videoUrl: string;
  duration: number;
  trimStart: number;
  setTrimStart: (v: number) => void;
  trimEnd: number;
  setTrimEnd: (v: number) => void;
  preciseCut?: boolean;
  setPreciseCut?: (v: boolean) => void;
}

type DragMode = "start" | "end" | "window" | "seek" | null;

export const VisualVideoTrimmer: React.FC<VisualVideoTrimmerProps> = ({
  videoUrl,
  duration: propDuration,
  trimStart,
  setTrimStart,
  trimEnd,
  setTrimEnd,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [intrinsicDuration, setIntrinsicDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Playback boundary restriction (enabled by default so Play only plays the cut)
  const [restrictToTrim, setRestrictToTrim] = useState(true);
  const [isLooping, setIsLooping] = useState(true);

  // Drag interaction state
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const dragRef = useRef<{
    startX: number;
    initialStart: number;
    initialEnd: number;
    timelineRect: DOMRect;
    windowDuration: number;
  } | null>(null);

  const duration = propDuration > 0 ? propDuration : intrinsicDuration || 1;
  const safeStart = Math.max(0, Math.min(trimStart, duration));
  const safeEnd = Math.max(safeStart + 0.1, Math.min(trimEnd || duration, duration));
  const trimDuration = Math.max(0, safeEnd - safeStart);

  // Synchronized refs for 60fps frame-accurate boundary enforcement
  const safeStartRef = useRef(safeStart);
  safeStartRef.current = safeStart;

  const safeEndRef = useRef(safeEnd);
  safeEndRef.current = safeEnd;

  const isLoopingRef = useRef(isLooping);
  isLoopingRef.current = isLooping;

  const restrictToTrimRef = useRef(restrictToTrim);
  restrictToTrimRef.current = restrictToTrim;

  const animFrameRef = useRef<number | null>(null);

  // Format time mm:ss.ms
  const formatTime = (seconds: number, includeMs = true) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    if (includeMs) {
      return `${mins}:${secs < 10 ? "0" : ""}${secs}.${ms}`;
    }
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // High-precision boundary checker to prevent playback from ever leaking outside the trim range
  const checkTrimBoundary = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    const t = v.currentTime;
    setCurrentTime(t);

    if (!v.paused && restrictToTrimRef.current) {
      const sStart = safeStartRef.current;
      const sEnd = safeEndRef.current;
      const loop = isLoopingRef.current;

      if (t >= sEnd) {
        if (loop) {
          v.currentTime = sStart;
          setCurrentTime(sStart);
        } else {
          v.pause();
          v.currentTime = sStart;
          setCurrentTime(sStart);
          setIsPlaying(false);
          return;
        }
      } else if (t < sStart) {
        v.currentTime = sStart;
        setCurrentTime(sStart);
      }
    }
  }, []);

  // Frame monitor running on animation frames during playback for 0-latency boundary trapping
  const startMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    const monitor = () => {
      const v = videoRef.current;
      if (!v) return;
      if (!v.paused && !v.ended) {
        checkTrimBoundary();
        animFrameRef.current = requestAnimationFrame(monitor);
      }
    };
    animFrameRef.current = requestAnimationFrame(monitor);
  }, [checkTrimBoundary]);

  const stopMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Native video timeupdate fallback
  const handleTimeUpdate = () => {
    checkTrimBoundary();
  };

  // Toggle Play / Pause - Restricted to trimmed cut by default
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (!v.paused) {
      v.pause();
    } else {
      if (restrictToTrim) {
        // If playhead is outside the trimmed selection or already past/at the end, jump to safeStart
        if (v.currentTime < safeStart || v.currentTime >= safeEnd - 0.05) {
          v.currentTime = safeStart;
          setCurrentTime(safeStart);
        }
      }
      v.play().catch((err) => console.warn("Video playback was interrupted:", err));
    }
  };

  // Play Trimmed Selection explicitly from the start of the cut
  const playTrimmedFromStart = () => {
    const v = videoRef.current;
    if (!v) return;

    if (!v.paused) {
      v.pause();
    } else {
      setRestrictToTrim(true);
      v.currentTime = safeStart;
      setCurrentTime(safeStart);
      v.play().catch((err) => console.warn("Video playback was interrupted:", err));
    }
  };

  // Mark In (Set Start at current playhead)
  const handleMarkIn = () => {
    if (!videoRef.current) return;
    const now = parseFloat(videoRef.current.currentTime.toFixed(2));
    const newStart = Math.max(0, Math.min(now, safeEnd - 0.1));
    setTrimStart(newStart);
  };

  // Mark Out (Set End at current playhead)
  const handleMarkOut = () => {
    if (!videoRef.current) return;
    const now = parseFloat(videoRef.current.currentTime.toFixed(2));
    const newEnd = Math.min(duration, Math.max(now, safeStart + 0.1));
    setTrimEnd(newEnd);
  };

  // Step frames / seconds
  const stepTime = (delta: number) => {
    if (!videoRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  // Jump to In Point
  const jumpToStart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = safeStart;
    setCurrentTime(safeStart);
  };

  // Jump to Out Point
  const jumpToEnd = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = safeEnd;
    setCurrentTime(safeEnd);
  };

  // Reset to full video
  const resetToFull = () => {
    setTrimStart(0);
    setTrimEnd(duration);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Drag interaction handlers on timeline
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    mode: DragMode
  ) => {
    e.stopPropagation();
    if (!timelineRef.current || duration <= 0) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = timelineRef.current.getBoundingClientRect();

    setDragMode(mode);
    dragRef.current = {
      startX: e.clientX,
      initialStart: safeStart,
      initialEnd: safeEnd,
      timelineRect: rect,
      windowDuration: safeEnd - safeStart,
    };

    if (mode === "seek") {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const seekTime = clickRatio * duration;
      if (videoRef.current) {
        videoRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragMode || !dragRef.current || duration <= 0) return;

    const { startX, initialStart, initialEnd, timelineRect, windowDuration } =
      dragRef.current;

    const deltaX = e.clientX - startX;
    const deltaSec = (deltaX / timelineRect.width) * duration;

    if (dragMode === "start") {
      const newStart = Math.max(0, Math.min(initialStart + deltaSec, safeEnd - 0.1));
      const rounded = parseFloat(newStart.toFixed(2));
      setTrimStart(rounded);
      if (videoRef.current) {
        videoRef.current.currentTime = rounded;
        setCurrentTime(rounded);
      }
      return;
    }

    if (dragMode === "end") {
      const newEnd = Math.min(duration, Math.max(initialEnd + deltaSec, safeStart + 0.1));
      const rounded = parseFloat(newEnd.toFixed(2));
      setTrimEnd(rounded);
      if (videoRef.current) {
        videoRef.current.currentTime = rounded;
        setCurrentTime(rounded);
      }
      return;
    }

    if (dragMode === "window") {
      let nextStart = initialStart + deltaSec;
      let nextEnd = initialEnd + deltaSec;

      if (nextStart < 0) {
        nextStart = 0;
        nextEnd = windowDuration;
      } else if (nextEnd > duration) {
        nextEnd = duration;
        nextStart = Math.max(0, duration - windowDuration);
      }

      const rStart = parseFloat(nextStart.toFixed(2));
      const rEnd = parseFloat(nextEnd.toFixed(2));
      setTrimStart(rStart);
      setTrimEnd(rEnd);
      if (videoRef.current) {
        videoRef.current.currentTime = rStart;
        setCurrentTime(rStart);
      }
      return;
    }

    if (dragMode === "seek") {
      const clickRatio = Math.max(
        0,
        Math.min(1, (e.clientX - timelineRect.left) / timelineRect.width)
      );
      const seekTime = clickRatio * duration;
      if (videoRef.current) {
        videoRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragMode) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDragMode(null);
      dragRef.current = null;
    }
  };

  // Compute percentages for timeline elements
  const startPct = duration > 0 ? (safeStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (safeEnd / duration) * 100 : 100;
  const rangeWidthPct = Math.max(0, endPct - startPct);
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        handleMarkIn();
      } else if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        handleMarkOut();
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setIsLooping((l) => !l);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepTime(e.shiftKey ? -1.0 : -0.1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepTime(e.shiftKey ? 1.0 : 0.1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="flex flex-col gap-3.5">
      {/* Top Status & Controls Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20">
            <Scissors className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-accent">Precision Trimmer</span>
          </div>

          <span className="text-xs font-mono font-semibold text-text-primary bg-surface-raised px-2.5 py-1 rounded-lg border border-border">
            {formatTime(safeStart)} → {formatTime(safeEnd)}
          </span>

          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Trim Duration: {trimDuration.toFixed(2)}s
          </span>
        </div>

        {/* Quick Actions: Restrict Toggle & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setRestrictToTrim((r) => !r)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              restrictToTrim
                ? "bg-accent/15 border-accent/40 text-accent font-semibold"
                : "bg-surface-raised border-border text-text-tertiary hover:text-text-primary"
            }`}
            title={restrictToTrim ? "Playback is restricted strictly to the trimmed cut" : "Playback is unrestricted (full video)"}
          >
            <Scissors className="w-3 h-3" />
            <span>Restrict to Cut: {restrictToTrim ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={resetToFull}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors flex items-center gap-1.5"
            title="Reset trim to full duration"
          >
            <RotateCcw className="w-3 h-3 text-accent" /> Reset Range
          </button>
        </div>
      </div>

      {/* Video Viewport with Live Cut Watermark & Click-to-Play */}
      <div
        onClick={togglePlay}
        className="relative w-full aspect-video max-h-[420px] bg-black rounded-xl overflow-hidden border border-border flex items-center justify-center shadow-inner group cursor-pointer"
        title="Click to play / pause trimmed section"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.duration) setIntrinsicDuration(v.duration);
          }}
          onPlay={() => {
            setIsPlaying(true);
            startMonitor();
          }}
          onPause={() => {
            setIsPlaying(false);
            stopMonitor();
          }}
          onEnded={() => {
            setIsPlaying(false);
            stopMonitor();
          }}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Live Status Indicator when playing */}
        {isPlaying && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-accent/90 text-white text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 border border-white/20 animate-pulse pointer-events-none select-none">
            <span className="w-2 h-2 rounded-full bg-white" />
            {restrictToTrim
              ? `Playing Trim Cut (${formatTime(safeStart)} – {formatTime(safeEnd)})`
              : `Playing Full Video`}
          </div>
        )}

        {/* Floating Playhead Time Stamp */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white font-mono text-xs border border-white/10 pointer-events-none select-none">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PLAYBACK CONTROLS & TRIM CUT ACTION BAR (ABOVE TRIMMING TOOL)             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-surface-raised border border-border rounded-xl">
        {/* Play/Pause & Audio controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 rounded-lg bg-surface border border-border text-text-primary hover:border-accent hover:text-accent transition-colors"
            aria-label={isPlaying ? "Pause trimmed video" : "Play trimmed video"}
            title={isPlaying ? "Pause (Space)" : "Play Trimmed Selection (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="p-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5 ml-1 select-none">
            <span className="text-xs font-mono text-text-primary font-medium">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs font-mono text-text-tertiary">
              / {formatTime(duration)}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-accent hidden sm:inline">
              Cut: {trimDuration.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* PRIMARY ACTION BUTTON & LOOP TOGGLE */}
        <div className="flex items-center gap-2">
          {/* Loop cut toggle */}
          <button
            type="button"
            onClick={() => setIsLooping((l) => !l)}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              isLooping
                ? "bg-accent/15 border-accent text-accent"
                : "bg-surface border-border text-text-tertiary hover:text-text-primary"
            }`}
            title={isLooping ? "Continuous Loop Enabled" : "Play Once and Stop"}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold hidden md:inline">
              {isLooping ? "Loop Cut" : "Play Once"}
            </span>
          </button>

          {/* Play / Pause Trimmed Cut Button */}
          <button
            type="button"
            onClick={playTrimmedFromStart}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
              isPlaying
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25 animate-pulse"
                : "bg-accent hover:bg-accent/90 text-white shadow-accent/25 hover:shadow-md"
            }`}
            title="Play the trimmed selection from the start"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Cut ({trimDuration.toFixed(1)}s)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Play Trimmed Selection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL DUAL-HANDLE TIMELINE TRIMMER TRACK                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-1.5 p-3.5 bg-surface-raised border border-border rounded-xl">
        {/* Timeline Header with Timecodes */}
        <div className="flex items-center justify-between text-[11px] font-mono text-text-tertiary select-none">
          <span>0:00.0</span>
          <span className="text-accent font-semibold">
            Playhead: {formatTime(currentTime)}
          </span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Interactive Scrubbing & Trimming Track */}
        <div
          ref={timelineRef}
          onPointerDown={(e) => handlePointerDown(e, "seek")}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full h-14 bg-[#0a0d16] rounded-lg border border-border overflow-hidden select-none cursor-pointer touch-none shadow-inner"
        >
          {/* Subtle Ruler Grid / Filmstrip hash lines */}
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20 px-2">
            {Array.from({ length: 21 }).map((_, i) => (
              <div
                key={i}
                className={`w-px bg-white ${i % 5 === 0 ? "h-full" : "h-2"}`}
              />
            ))}
          </div>

          {/* Dimmed Outside Left Mask (Cut Out Footage Before Start) */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-black/75 pointer-events-none transition-[width]"
            style={{ width: `${startPct}%` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:6px_6px]" />
          </div>

          {/* Dimmed Outside Right Mask (Cut Out Footage After End) */}
          <div
            className="absolute right-0 top-0 bottom-0 bg-black/75 pointer-events-none transition-[width]"
            style={{ width: `${Math.max(0, 100 - endPct)}%` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:6px_6px]" />
          </div>

          {/* Active Trimmed Region (Highlight Bar & Draggable Window) */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "window")}
            style={{
              left: `${startPct}%`,
              width: `${rangeWidthPct}%`,
            }}
            className="absolute top-0 bottom-0 bg-accent/20 border-y-2 border-accent cursor-grab active:cursor-grabbing hover:bg-accent/25 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.2)] flex items-center justify-center overflow-hidden group/range"
            title="Click and drag to slide the trim window across video"
          >
            <span className="text-[10px] font-mono font-bold text-accent select-none opacity-80 group-hover/range:opacity-100 transition-opacity flex items-center gap-1">
              ↔ Slide Cut ({trimDuration.toFixed(1)}s)
            </span>
          </div>

          {/* Left Handle: Trim Start (Mark In) */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "start")}
            style={{ left: `${startPct}%` }}
            className="absolute top-0 bottom-0 -ml-2.5 w-5 bg-accent hover:bg-sky-400 cursor-ew-resize rounded-l-md flex flex-col items-center justify-center shadow-lg hover:scale-105 transition-transform z-20 group/handle"
            title={`Trim Start: ${formatTime(safeStart)} (Drag to adjust)`}
          >
            <div className="w-1 h-5 bg-white/90 rounded-full" />
            <span className="absolute -top-7 px-1.5 py-0.5 rounded bg-black/90 text-[10px] font-mono text-accent border border-accent/40 pointer-events-none opacity-0 group-hover/handle:opacity-100 transition-opacity whitespace-nowrap shadow-md">
              Start: {formatTime(safeStart)}
            </span>
          </div>

          {/* Right Handle: Trim End (Mark Out) */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "end")}
            style={{ left: `${endPct}%` }}
            className="absolute top-0 bottom-0 -ml-2.5 w-5 bg-accent hover:bg-sky-400 cursor-ew-resize rounded-r-md flex flex-col items-center justify-center shadow-lg hover:scale-105 transition-transform z-20 group/handle"
            title={`Trim End: ${formatTime(safeEnd)} (Drag to adjust)`}
          >
            <div className="w-1 h-5 bg-white/90 rounded-full" />
            <span className="absolute -top-7 px-1.5 py-0.5 rounded bg-black/90 text-[10px] font-mono text-accent border border-accent/40 pointer-events-none opacity-0 group-hover/handle:opacity-100 transition-opacity whitespace-nowrap shadow-md">
              End: {formatTime(safeEnd)}
            </span>
          </div>

          {/* Red Playhead / Current Time Needle */}
          <div
            style={{ left: `${playheadPct}%` }}
            className="absolute top-0 bottom-0 -ml-[1.5px] w-[3px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] pointer-events-none z-30"
          >
            {/* Playhead arrow head */}
            <div className="absolute -top-1 -left-[5px] w-0 h-0 border-x-[6px] border-x-transparent border-t-[7px] border-t-red-500" />
          </div>
        </div>

        {/* Trimmer Timeline Sub-Bar Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Real-time In/Out Mark Buttons ("Select Trim While Playing") */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkIn}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-primary hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
              title="Set current playhead frame as Trim Start (Key: I)"
            >
              <span className="font-bold text-accent">[</span>
              <span>Set Start [I]</span>
            </button>

            <button
              type="button"
              onClick={handleMarkOut}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-primary hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
              title="Set current playhead frame as Trim End (Key: O)"
            >
              <span>Set End [O]</span>
              <span className="font-bold text-accent">]</span>
            </button>

            {/* Jump buttons */}
            <div className="hidden sm:flex items-center gap-1 border-l border-border pl-2">
              <button
                type="button"
                onClick={jumpToStart}
                className="p-1.5 rounded-md hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
                title="Jump playhead to Trim Start"
                aria-label="Jump to start"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={jumpToEnd}
                className="p-1.5 rounded-md hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
                title="Jump playhead to Trim End"
                aria-label="Jump to end"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Step Controls (Frame Accuracy) */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepTime(-0.1)}
                className="px-2 py-1 rounded bg-surface border border-border text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-0.5"
                title="Step backward 0.1s (Left Arrow)"
              >
                <ChevronLeft className="w-3 h-3" /> -0.1s
              </button>
              <button
                type="button"
                onClick={() => stepTime(0.1)}
                className="px-2 py-1 rounded bg-surface border border-border text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-0.5"
                title="Step forward 0.1s (Right Arrow)"
              >
                +0.1s <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
