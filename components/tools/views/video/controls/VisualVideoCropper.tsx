"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Crop,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlignCenter,
  Sparkles,
} from "lucide-react";

export interface VisualVideoCropperProps {
  videoUrl: string;
  sourceWidth: number;
  sourceHeight: number;
  cropX: number;
  setCropX: (v: number) => void;
  cropY: number;
  setCropY: (v: number) => void;
  cropWidth: number;
  setCropWidth: (v: number) => void;
  cropHeight: number;
  setCropHeight: (v: number) => void;
  aspectLock: string;
  setAspectLock: (v: string) => void;
}

type DragAction =
  | "move"
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"
  | "draw"
  | null;

import { ASPECT_PRESETS } from "./VideoCropperControls";

export const VisualVideoCropper: React.FC<VisualVideoCropperProps> = ({
  videoUrl,
  sourceWidth,
  sourceHeight,
  cropX,
  setCropX,
  cropY,
  setCropY,
  cropWidth,
  setCropWidth,
  cropHeight,
  setCropHeight,
  aspectLock,
  setAspectLock,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Stage measurement for letterbox-free 1:1 overlay alignment
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Track video intrinsic dimensions fallback
  const [intrinsicDims, setIntrinsicDims] = useState<{
    width: number;
    height: number;
  }>({
    width: sourceWidth || 0,
    height: sourceHeight || 0,
  });

  const effWidth = sourceWidth > 0 ? sourceWidth : intrinsicDims.width;
  const effHeight = sourceHeight > 0 ? sourceHeight : intrinsicDims.height;

  // Responsive stage observer
  useEffect(() => {
    if (!stageRef.current) return;
    const updateStage = () => {
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        // Allow 16px padding inside stage
        const availW = Math.max(0, rect.width - 24);
        const availH = Math.max(0, rect.height - 24);
        setStageSize({ width: availW, height: availH });
      }
    };

    updateStage();
    const ro = new ResizeObserver(updateStage);
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute exact pixel dimensions for containerRef to eliminate letterboxing
  let fittedW = 0;
  let fittedH = 0;
  if (
    stageSize.width > 0 &&
    stageSize.height > 0 &&
    effWidth > 0 &&
    effHeight > 0
  ) {
    const videoRatio = effWidth / effHeight;
    const stageRatio = stageSize.width / stageSize.height;

    if (videoRatio > stageRatio) {
      // Width-constrained
      fittedW = stageSize.width;
      fittedH = Math.round(stageSize.width / videoRatio);
    } else {
      // Height-constrained
      fittedH = stageSize.height;
      fittedW = Math.round(stageSize.height * videoRatio);
    }
  }

  // Force even integers for FFmpeg compatibility
  const makeEven = (n: number) => Math.floor(Math.max(2, n) / 2) * 2;

  // Drag interaction state
  const [dragAction, setDragAction] = useState<DragAction>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
    containerRect: DOMRect;
    originX: number;
    originY: number;
  } | null>(null);

  // Toggle playback
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  // Seek video
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Reset to full frame
  const handleResetFull = () => {
    if (!effWidth || !effHeight) return;
    setCropX(0);
    setCropY(0);
    setCropWidth(effWidth);
    setCropHeight(effHeight);
    setAspectLock("free");
  };

  // Center the current crop
  const handleCenterCrop = () => {
    if (!effWidth || !effHeight) return;
    const newX = makeEven(Math.max(0, Math.floor((effWidth - cropWidth) / 2)));
    const newY = makeEven(Math.max(0, Math.floor((effHeight - cropHeight) / 2)));
    setCropX(newX);
    setCropY(newY);
  };

  // Apply aspect ratio preset
  const applyAspect = useCallback(
    (aspect: string) => {
      setAspectLock(aspect);
      if (aspect === "free" || !effWidth || !effHeight) return;

      const [aw, ah] = aspect.split(":").map(Number);
      const ratio = aw / ah;

      let newW = cropWidth > 0 ? cropWidth : effWidth;
      let newH = Math.round(newW / ratio);

      if (newH > effHeight) {
        newH = effHeight;
        newW = Math.round(newH * ratio);
      }
      if (newW > effWidth) {
        newW = effWidth;
        newH = Math.round(newW / ratio);
      }

      newW = makeEven(newW);
      newH = makeEven(newH);

      // Re-center around current center
      const currentCenterX = cropX + cropWidth / 2;
      const currentCenterY = cropY + cropHeight / 2;

      let newX = Math.round(currentCenterX - newW / 2);
      let newY = Math.round(currentCenterY - newH / 2);

      newX = Math.max(0, Math.min(newX, effWidth - newW));
      newY = Math.max(0, Math.min(newY, effHeight - newH));

      setCropWidth(newW);
      setCropHeight(newH);
      setCropX(makeEven(newX));
      setCropY(makeEven(newY));
    },
    [
      cropHeight,
      cropWidth,
      cropX,
      cropY,
      effHeight,
      effWidth,
      setAspectLock,
      setCropHeight,
      setCropWidth,
      setCropX,
      setCropY,
    ]
  );

  // Pointer down handler
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    action: DragAction
  ) => {
    e.stopPropagation();
    if (!containerRef.current || !effWidth || !effHeight) return;

    const rect = containerRef.current.getBoundingClientRect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const scaleX = rect.width / effWidth;
    const scaleY = rect.height / effHeight;

    const originX = Math.max(
      0,
      Math.min(effWidth, Math.round((e.clientX - rect.left) / scaleX))
    );
    const originY = Math.max(
      0,
      Math.min(effHeight, Math.round((e.clientY - rect.top) / scaleY))
    );

    setDragAction(action);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      cropX,
      cropY,
      cropW: cropWidth,
      cropH: cropHeight,
      containerRect: rect,
      originX,
      originY,
    };
  };

  // Pointer move handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragAction || !dragStartRef.current || !effWidth || !effHeight) return;

    const {
      clientX,
      clientY,
      cropX: sX,
      cropY: sY,
      cropW: sW,
      cropH: sH,
      containerRect,
      originX,
      originY,
    } = dragStartRef.current;

    const scaleX = containerRect.width / effWidth;
    const scaleY = containerRect.height / effHeight;

    const deltaX = Math.round((e.clientX - clientX) / scaleX);
    const deltaY = Math.round((e.clientY - clientY) / scaleY);

    // 1. Move Mode
    if (dragAction === "move") {
      let nextX = Math.max(0, Math.min(sX + deltaX, effWidth - sW));
      let nextY = Math.max(0, Math.min(sY + deltaY, effHeight - sH));
      setCropX(makeEven(nextX));
      setCropY(makeEven(nextY));
      return;
    }

    // 2. Draw / Snip Mode
    if (dragAction === "draw") {
      const currentX = Math.max(
        0,
        Math.min(effWidth, Math.round((e.clientX - containerRect.left) / scaleX))
      );
      const currentY = Math.max(
        0,
        Math.min(effHeight, Math.round((e.clientY - containerRect.top) / scaleY))
      );

      let boxX = Math.min(originX, currentX);
      let boxY = Math.min(originY, currentY);
      let boxW = Math.max(20, Math.abs(currentX - originX));
      let boxH = Math.max(20, Math.abs(currentY - originY));

      if (aspectLock !== "free") {
        const [aw, ah] = aspectLock.split(":").map(Number);
        const ratio = aw / ah;
        boxH = Math.round(boxW / ratio);
        if (boxY + boxH > effHeight) {
          boxH = effHeight - boxY;
          boxW = Math.round(boxH * ratio);
        }
      }

      boxW = makeEven(Math.min(boxW, effWidth - boxX));
      boxH = makeEven(Math.min(boxH, effHeight - boxY));

      setCropX(makeEven(boxX));
      setCropY(makeEven(boxY));
      setCropWidth(boxW);
      setCropHeight(boxH);
      return;
    }

    // 3. Resize Handle Mode
    let newX = sX;
    let newY = sY;
    let newW = sW;
    let newH = sH;

    if (dragAction.includes("e")) {
      newW = Math.max(20, Math.min(sW + deltaX, effWidth - sX));
    }
    if (dragAction.includes("s")) {
      newH = Math.max(20, Math.min(sH + deltaY, effHeight - sY));
    }
    if (dragAction.includes("w")) {
      const maxW = sX + sW;
      newW = Math.max(20, Math.min(sW - deltaX, maxW));
      newX = sX + sW - newW;
    }
    if (dragAction.includes("n")) {
      const maxH = sY + sH;
      newH = Math.max(20, Math.min(sH - deltaY, maxH));
      newY = sY + sH - newH;
    }

    if (aspectLock !== "free") {
      const [aw, ah] = aspectLock.split(":").map(Number);
      const ratio = aw / ah;

      if (dragAction === "e" || dragAction === "w") {
        newH = Math.round(newW / ratio);
        if (newY + newH > effHeight) {
          newH = effHeight - newY;
          newW = Math.round(newH * ratio);
        }
      } else {
        newW = Math.round(newH * ratio);
        if (newX + newW > effWidth) {
          newW = effWidth - newX;
          newH = Math.round(newW / ratio);
        }
      }
    }

    newW = makeEven(newW);
    newH = makeEven(newH);
    newX = makeEven(Math.max(0, Math.min(newX, effWidth - newW)));
    newY = makeEven(Math.max(0, Math.min(newY, effHeight - newH)));

    setCropX(newX);
    setCropY(newY);
    setCropWidth(newW);
    setCropHeight(newH);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragAction) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDragAction(null);
      dragStartRef.current = null;
    }
  };

  // Convert crop rect to percentages for responsive CSS positioning
  const leftPct = effWidth > 0 ? (cropX / effWidth) * 100 : 0;
  const topPct = effHeight > 0 ? (cropY / effHeight) * 100 : 0;
  const widthPct = effWidth > 0 ? (cropWidth / effWidth) * 100 : 100;
  const heightPct = effHeight > 0 ? (cropHeight / effHeight) * 100 : 100;

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Visual Cropper Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20">
            <Crop className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-accent">Visual Snip Tool</span>
          </div>
          <span className="text-xs font-mono font-semibold text-text-primary bg-surface-raised px-2.5 py-1 rounded-lg border border-border">
            {cropWidth} × {cropHeight} px
          </span>
          {effWidth > 0 && effHeight > 0 && (
            <span className="text-[11px] text-text-tertiary">
              ({Math.round((cropWidth / effWidth) * 100)}% of source)
            </span>
          )}
        </div>

        {/* Quick Align & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCenterCrop}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors flex items-center gap-1.5"
            title="Center crop box in frame"
          >
            <AlignCenter className="w-3 h-3 text-accent" /> Center
          </button>
          <button
            type="button"
            onClick={handleResetFull}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors flex items-center gap-1.5"
            title="Reset to full frame"
          >
            <RotateCcw className="w-3 h-3 text-accent" /> Full Frame
          </button>
        </div>
      </div>

      {/* Aspect Ratio Preset Selector Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider shrink-0 mr-1">
          Ratio:
        </span>
        {ASPECT_PRESETS.map((p) => {
          const isActive = aspectLock === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => applyAspect(p.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? "bg-accent text-white shadow-xs border border-accent"
                  : "bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-border-hover"
              }`}
              title={`${p.name} - ${p.desc}`}
            >
              {p.label}
            </button>
          );
        })}
        {aspectLock !== "free" && !ASPECT_PRESETS.some((p) => p.value === aspectLock) && (
          <button
            type="button"
            className="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 bg-accent text-white shadow-xs border border-accent"
          >
            Custom ({aspectLock})
          </button>
        )}
      </div>

      {/* Video & Interactive Snip Stage */}
      <div
        ref={stageRef}
        className="relative w-full h-[400px] sm:h-[440px] bg-[#07090e] rounded-xl border border-border flex items-center justify-center p-3 select-none overflow-hidden shadow-inner"
      >
        {/* Responsive, Letterbox-Free Video & Overlay Container */}
        <div
          ref={containerRef}
          onPointerDown={(e) => handlePointerDown(e, "draw")}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: fittedW > 0 ? `${fittedW}px` : "100%",
            height: fittedH > 0 ? `${fittedH}px` : "100%",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          className="relative bg-black rounded-lg overflow-hidden border border-white/10 select-none cursor-crosshair touch-none shadow-2xl"
        >
          {/* Underlying HTML5 Video */}
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            muted={isMuted}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.duration) setDuration(v.duration);
              if ((!sourceWidth || !sourceHeight) && v.videoWidth && v.videoHeight) {
                setIntrinsicDims({ width: v.videoWidth, height: v.videoHeight });
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full block object-fill pointer-events-none"
          />

          {/* Shaded Mask Area Outside Active Crop Box */}
          {/* Top Mask */}
          <div
            className="absolute left-0 right-0 top-0 bg-black/70 backdrop-blur-[0.5px] pointer-events-none transition-opacity"
            style={{ height: `${topPct}%` }}
          />
          {/* Bottom Mask */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-black/70 backdrop-blur-[0.5px] pointer-events-none transition-opacity"
            style={{ height: `${Math.max(0, 100 - (topPct + heightPct))}%` }}
          />
          {/* Left Mask */}
          <div
            className="absolute left-0 bg-black/70 backdrop-blur-[0.5px] pointer-events-none transition-opacity"
            style={{
              top: `${topPct}%`,
              height: `${heightPct}%`,
              width: `${leftPct}%`,
            }}
          />
          {/* Right Mask */}
          <div
            className="absolute right-0 bg-black/70 backdrop-blur-[0.5px] pointer-events-none transition-opacity"
            style={{
              top: `${topPct}%`,
              height: `${heightPct}%`,
              width: `${Math.max(0, 100 - (leftPct + widthPct))}%`,
            }}
          />

          {/* Active Snipping Box */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "move")}
            className="absolute border-2 border-accent cursor-move shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_0_20px_rgba(56,189,248,0.25)] transition-[border-color]"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
            }}
          >
            {/* Rule of Thirds Guidelines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-white/40" />
              <div className="border-r border-white/40" />
              <div />
            </div>

            {/* Dimension Badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md text-[11px] font-mono text-white pointer-events-none border border-white/20 select-none shadow-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {cropWidth} × {cropHeight}
            </div>

            {/* 4 Corner Resize Handles */}
            {/* NW */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "nw")}
              className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-accent rounded-sm cursor-nwse-resize shadow-lg hover:scale-125 transition-transform"
              title="Resize Top-Left"
            />
            {/* NE */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "ne")}
              className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-accent rounded-sm cursor-nesw-resize shadow-lg hover:scale-125 transition-transform"
              title="Resize Top-Right"
            />
            {/* SW */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "sw")}
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-accent rounded-sm cursor-nesw-resize shadow-lg hover:scale-125 transition-transform"
              title="Resize Bottom-Left"
            />
            {/* SE */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "se")}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-accent rounded-sm cursor-nwse-resize shadow-lg hover:scale-125 transition-transform"
              title="Resize Bottom-Right"
            />

            {/* 4 Edge Resize Handles */}
            {/* N */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "n")}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white border border-accent rounded-full cursor-ns-resize shadow-lg hover:scale-110 transition-transform"
              title="Resize Top"
            />
            {/* S */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "s")}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white border border-accent rounded-full cursor-ns-resize shadow-lg hover:scale-110 transition-transform"
              title="Resize Bottom"
            />
            {/* W */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "w")}
              className="absolute top-1/2 -translate-y-1/2 -left-1.5 h-8 w-2.5 bg-white border border-accent rounded-full cursor-ew-resize shadow-lg hover:scale-110 transition-transform"
              title="Resize Left"
            />
            {/* E */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "e")}
              className="absolute top-1/2 -translate-y-1/2 -right-1.5 h-8 w-2.5 bg-white border border-accent rounded-full cursor-ew-resize shadow-lg hover:scale-110 transition-transform"
              title="Resize Right"
            />
          </div>

          {/* Quick Snip Instruction Bar */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none select-none">
            <div className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] text-text-secondary border border-border/50">
              ✂ Drag inside box to reposition • Drag handles to resize • Drag shaded area to snip new box
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Video Playback & Frame Scrubber */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-surface-raised border border-border rounded-xl">
        <button
          type="button"
          onClick={togglePlay}
          className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors shrink-0"
          aria-label={isPlaying ? "Pause video" : "Play video"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <span className="text-[11px] font-mono text-text-secondary shrink-0 select-none">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Timeline Scrubber */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
          aria-label="Seek video frame"
        />

        <button
          type="button"
          onClick={() => setIsMuted((m) => !m)}
          className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors shrink-0"
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
