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
  Sparkles,
  Music,
} from "lucide-react";

export interface VisualAudioTrimmerProps {
  audioUrl: string;
  audioBuffer: AudioBuffer | null;
  duration: number;
  trimStart: number;
  setTrimStart: (v: number) => void;
  trimEnd: number;
  setTrimEnd: (v: number) => void;
  fadeIn?: number;
  setFadeIn?: (v: number) => void;
  fadeOut?: number;
  setFadeOut?: (v: number) => void;
}

type DragMode = "start" | "end" | "window" | "seek" | null;

export const VisualAudioTrimmer: React.FC<VisualAudioTrimmerProps> = ({
  audioUrl,
  audioBuffer,
  duration: propDuration,
  trimStart,
  setTrimStart,
  trimEnd,
  setTrimEnd,
  fadeIn = 0,
  fadeOut = 0,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [intrinsicDuration, setIntrinsicDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Boundary restriction & looping
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

  // High-precision boundary checker to prevent playback from leaking outside the trim cut
  const checkTrimBoundary = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;

    const t = a.currentTime;
    setCurrentTime(t);

    if (!a.paused && restrictToTrimRef.current) {
      const sStart = safeStartRef.current;
      const sEnd = safeEndRef.current;
      const loop = isLoopingRef.current;

      if (t >= sEnd) {
        if (loop) {
          a.currentTime = sStart;
          setCurrentTime(sStart);
        } else {
          a.pause();
          a.currentTime = sStart;
          setCurrentTime(sStart);
          setIsPlaying(false);
          return;
        }
      } else if (t < sStart) {
        a.currentTime = sStart;
        setCurrentTime(sStart);
      }
    }
  }, []);

  // Frame monitor running on animation frames during playback
  const startMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    const monitor = () => {
      const a = audioRef.current;
      if (!a) return;
      if (!a.paused && !a.ended) {
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

  // Native audio timeupdate fallback
  const handleTimeUpdate = () => {
    checkTrimBoundary();
  };

  // Toggle Play / Pause - Restricted to trimmed cut by default
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;

    if (!a.paused) {
      a.pause();
    } else {
      if (restrictToTrim) {
        if (a.currentTime < safeStart || a.currentTime >= safeEnd - 0.05) {
          a.currentTime = safeStart;
          setCurrentTime(safeStart);
        }
      }
      a.play().catch((err) => console.warn("Audio playback notice:", err));
    }
  };

  // Play Trimmed Selection explicitly from the start of the cut
  const playTrimmedFromStart = () => {
    const a = audioRef.current;
    if (!a) return;

    if (!a.paused) {
      a.pause();
    } else {
      setRestrictToTrim(true);
      a.currentTime = safeStart;
      setCurrentTime(safeStart);
      a.play().catch((err) => console.warn("Audio playback notice:", err));
    }
  };

  // Mark In (Set Start at current playhead)
  const handleMarkIn = () => {
    if (!audioRef.current) return;
    const now = parseFloat(audioRef.current.currentTime.toFixed(2));
    const newStart = Math.max(0, Math.min(now, safeEnd - 0.1));
    setTrimStart(newStart);
  };

  // Mark Out (Set End at current playhead)
  const handleMarkOut = () => {
    if (!audioRef.current) return;
    const now = parseFloat(audioRef.current.currentTime.toFixed(2));
    const newEnd = Math.min(duration, Math.max(now, safeStart + 0.1));
    setTrimEnd(newEnd);
  };

  // Step seconds
  const stepTime = (delta: number) => {
    if (!audioRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  // Jump to In Point
  const jumpToStart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = safeStart;
    setCurrentTime(safeStart);
  };

  // Jump to Out Point
  const jumpToEnd = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = safeEnd;
    setCurrentTime(safeEnd);
  };

  // Reset to full duration
  const resetToFull = () => {
    setTrimStart(0);
    setTrimEnd(duration);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
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
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const seekTime = clickRatio * duration;
      if (audioRef.current) {
        audioRef.current.currentTime = seekTime;
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
      if (audioRef.current) {
        audioRef.current.currentTime = rounded;
        setCurrentTime(rounded);
      }
      return;
    }

    if (dragMode === "end") {
      const newEnd = Math.min(duration, Math.max(initialEnd + deltaSec, safeStart + 0.1));
      const rounded = parseFloat(newEnd.toFixed(2));
      setTrimEnd(rounded);
      if (audioRef.current) {
        audioRef.current.currentTime = rounded;
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
      if (audioRef.current) {
        audioRef.current.currentTime = rStart;
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
      if (audioRef.current) {
        audioRef.current.currentTime = seekTime;
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

  // Draw background waveform on timeline track
  const drawTimelineWaveform = useCallback((ab: AudioBuffer, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const data = ab.getChannelData(0);
    const step = Math.ceil(data.length / w);
    const centerY = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
    for (let i = 0; i < w; i++) {
      let peak = 0;
      const start = i * step;
      const end = Math.min(start + step, data.length);
      for (let j = start; j < end; j++) {
        const val = Math.abs(data[j] || 0);
        if (val > peak) peak = val;
      }
      const barHeight = Math.max(2, peak * (h - 6));
      const y = centerY - barHeight / 2;
      ctx.fillRect(i, y, 1.2, barHeight);
    }
  }, []);

  useEffect(() => {
    if (audioBuffer && waveformCanvasRef.current) {
      drawTimelineWaveform(audioBuffer, waveformCanvasRef.current);
    }
  }, [audioBuffer, drawTimelineWaveform]);

  // Compute percentages for timeline elements
  const startPct = duration > 0 ? (safeStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (safeEnd / duration) * 100 : 100;
  const rangeWidthPct = Math.max(0, endPct - startPct);
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      {/* Hidden native audio element for sound output & monitoring */}
      <audio
        ref={audioRef}
        src={audioUrl}
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          if (a.duration && isFinite(a.duration)) setIntrinsicDuration(a.duration);
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
      />

      {/* Top Status & Controls Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20">
            <Scissors className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-accent">Audio Trimmer</span>
          </div>

          <span className="text-xs font-mono font-semibold text-text-primary bg-surface-raised px-2.5 py-1 rounded-lg border border-border">
            {formatTime(safeStart)} → {formatTime(safeEnd)}
          </span>

          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Cut Duration: {trimDuration.toFixed(2)}s
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
            title={restrictToTrim ? "Playback is restricted strictly to the trimmed cut" : "Playback is unrestricted (full audio)"}
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

      {/* Audio Workstation Player Deck */}
      <div className="relative w-full bg-gradient-to-b from-[#101422] to-[#0a0d16] rounded-xl border border-border p-5 flex flex-col items-center justify-center gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Music className={`w-6 h-6 text-accent ${isPlaying ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              Interactive Audio Workspace
              {isPlaying && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </span>
            <span className="text-[11px] font-mono text-text-tertiary">
              {formatTime(currentTime)} / {formatTime(duration)} • {trimDuration.toFixed(1)}s Selected
            </span>
          </div>
        </div>

        {/* Live Play Status Chip */}
        {isPlaying && (
          <div className="px-3 py-1 rounded-full bg-accent/90 text-white text-[11px] font-bold shadow-lg flex items-center gap-2 border border-white/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            {restrictToTrim
              ? `Playing Trim Cut: ${formatTime(safeStart)} – ${formatTime(safeEnd)}`
              : "Playing Full Track"}
          </div>
        )}
      </div>

      {/* Playback Controls & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-surface-raised border border-border rounded-xl">
        {/* Play/Pause & Mute */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 rounded-lg bg-surface border border-border text-text-primary hover:border-accent hover:text-accent transition-colors"
            aria-label={isPlaying ? "Pause audio cut" : "Play audio cut"}
            title={isPlaying ? "Pause (Space)" : "Play Cut (Space)"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
          </div>
        </div>

        {/* Primary Action Button & Loop Toggle */}
        <div className="flex items-center gap-2">
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

      {/* Draggable Dual-Handle Waveform Timeline Track */}
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
          className="relative w-full h-20 bg-[#080b13] rounded-lg border border-border overflow-hidden select-none cursor-pointer touch-none shadow-inner"
        >
          {/* Waveform Canvas inside track */}
          <canvas
            ref={(el) => {
              waveformCanvasRef.current = el;
              if (el && audioBuffer) {
                drawTimelineWaveform(audioBuffer, el);
              }
            }}
            width={800}
            height={80}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Ruler Grid marks */}
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20 px-2">
            {Array.from({ length: 21 }).map((_, i) => (
              <div
                key={i}
                className={`w-px bg-white ${i % 5 === 0 ? "h-full" : "h-2"}`}
              />
            ))}
          </div>

          {/* Dimmed Outside Left Mask */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-black/75 pointer-events-none transition-[width]"
            style={{ width: `${startPct}%` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:6px_6px]" />
          </div>

          {/* Dimmed Outside Right Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 bg-black/75 pointer-events-none transition-[width]"
            style={{ width: `${Math.max(0, 100 - endPct)}%` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:6px_6px]" />
          </div>

          {/* Fade in / Fade out overlays on active region */}
          {fadeIn > 0 && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none bg-gradient-to-r from-emerald-500/20 to-transparent"
              style={{
                left: `${startPct}%`,
                width: `${Math.min(rangeWidthPct, (fadeIn / duration) * 100)}%`,
              }}
            />
          )}

          {fadeOut > 0 && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none bg-gradient-to-l from-rose-500/20 to-transparent"
              style={{
                left: `${Math.max(startPct, endPct - (fadeOut / duration) * 100)}%`,
                width: `${Math.min(rangeWidthPct, (fadeOut / duration) * 100)}%`,
              }}
            />
          )}

          {/* Active Trimmed Region (Highlight Bar & Draggable Window) */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "window")}
            style={{
              left: `${startPct}%`,
              width: `${rangeWidthPct}%`,
            }}
            className="absolute top-0 bottom-0 bg-accent/20 border-y-2 border-accent cursor-grab active:cursor-grabbing hover:bg-accent/25 transition-colors shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center justify-center overflow-hidden group/range"
            title="Click and drag to slide the audio trim window"
          >
            <span className="text-[10px] font-mono font-bold text-accent select-none opacity-80 group-hover/range:opacity-100 transition-opacity flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-accent/20">
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
            <div className="w-1 h-6 bg-white/90 rounded-full" />
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
            <div className="w-1 h-6 bg-white/90 rounded-full" />
            <span className="absolute -top-7 px-1.5 py-0.5 rounded bg-black/90 text-[10px] font-mono text-accent border border-accent/40 pointer-events-none opacity-0 group-hover/handle:opacity-100 transition-opacity whitespace-nowrap shadow-md">
              End: {formatTime(safeEnd)}
            </span>
          </div>

          {/* Scrubber Playhead Needle */}
          <div
            style={{ left: `${playheadPct}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-30 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          >
            <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-accent" />
          </div>
        </div>

        {/* Timeline Bottom Legend */}
        <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent border border-accent" />
              <span>Trimmed Region</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-black/80 border border-white/20" />
              <span>Cut Out (Discarded)</span>
            </span>
          </div>
          <span className="text-[10px] font-mono">
            Drag handles or slide window • Click timeline to seek
          </span>
        </div>
      </div>

      {/* Precision Transport Bar (Micro-stepping & Cue Points) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-lg p-1.5">
          <button
            type="button"
            onClick={() => stepTime(-1.0)}
            className="flex-1 py-1 rounded text-xs font-mono hover:bg-surface text-text-secondary hover:text-text-primary transition-colors text-center"
            title="Step back 1.0s"
          >
            -1.0s
          </button>
          <button
            type="button"
            onClick={() => stepTime(-0.1)}
            className="flex-1 py-1 rounded text-xs font-mono hover:bg-surface text-text-secondary hover:text-text-primary transition-colors text-center"
            title="Step back 0.1s"
          >
            -0.1s
          </button>
          <button
            type="button"
            onClick={() => stepTime(0.1)}
            className="flex-1 py-1 rounded text-xs font-mono hover:bg-surface text-text-secondary hover:text-text-primary transition-colors text-center"
            title="Step forward 0.1s"
          >
            +0.1s
          </button>
          <button
            type="button"
            onClick={() => stepTime(1.0)}
            className="flex-1 py-1 rounded text-xs font-mono hover:bg-surface text-text-secondary hover:text-text-primary transition-colors text-center"
            title="Step forward 1.0s"
          >
            +1.0s
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-raised border border-border rounded-lg p-1.5">
          <button
            type="button"
            onClick={handleMarkIn}
            className="flex-1 py-1 rounded text-xs font-semibold hover:bg-surface text-accent hover:border hover:border-accent/40 transition-colors text-center"
            title="Set trim start to current playhead (Key: I)"
          >
            [ Set In
          </button>
          <button
            type="button"
            onClick={handleMarkOut}
            className="flex-1 py-1 rounded text-xs font-semibold hover:bg-surface text-accent hover:border hover:border-accent/40 transition-colors text-center"
            title="Set trim end to current playhead (Key: O)"
          >
            Set Out ]
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-raised border border-border rounded-lg p-1.5">
          <button
            type="button"
            onClick={jumpToStart}
            className="flex-1 py-1 rounded text-xs font-medium hover:bg-surface text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
            title="Jump playhead to trim start"
          >
            <SkipBack className="w-3 h-3" />
            <span>To In</span>
          </button>
          <button
            type="button"
            onClick={jumpToEnd}
            className="flex-1 py-1 rounded text-xs font-medium hover:bg-surface text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
            title="Jump playhead to trim end"
          >
            <span>To Out</span>
            <SkipForward className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center justify-center bg-surface-raised border border-border rounded-lg p-1.5">
          <span className="text-[10px] font-mono text-text-tertiary">
            Shortcuts: Space=Play • I=In • O=Out
          </span>
        </div>
      </div>
    </div>
  );
};
