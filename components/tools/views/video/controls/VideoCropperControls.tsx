"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";

interface Props {
  cropX: number;
  setCropX: (v: number) => void;
  cropY: number;
  setCropY: (v: number) => void;
  cropWidth: number;
  setCropWidth: (v: number) => void;
  cropHeight: number;
  setCropHeight: (v: number) => void;
  sourceWidth: number;
  sourceHeight: number;
  aspectLock: string;
  setAspectLock: (v: string) => void;
}

export interface AspectPreset {
  label: string;
  value: string;
  name: string;
  category: "all" | "social" | "cinema" | "photo";
  desc: string;
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { label: "Free", value: "free", name: "Freeform", category: "all", desc: "Unconstrained custom crop" },
  // Social Media & Web
  { label: "16:9", value: "16:9", name: "YouTube", category: "social", desc: "Standard widescreen HD & 4K" },
  { label: "9:16", value: "9:16", name: "TikTok / Reels", category: "social", desc: "Vertical Shorts & Stories" },
  { label: "1:1", value: "1:1", name: "Square", category: "social", desc: "Instagram feed & profile" },
  { label: "4:5", value: "4:5", name: "IG Portrait", category: "social", desc: "Instagram feed portrait" },
  // Cinema & Displays
  { label: "21:9", value: "21:9", name: "Ultrawide", category: "cinema", desc: "Ultrawide monitor & cinema" },
  { label: "2.39:1", value: "2.39:1", name: "Anamorphic", category: "cinema", desc: "Theatrical cinematic scope" },
  { label: "2.35:1", value: "2.35:1", name: "Cinema 35", category: "cinema", desc: "Classic widescreen movie" },
  { label: "2:1", value: "2:1", name: "Univisium", category: "cinema", desc: "Netflix & modern streaming 18:9" },
  { label: "16:10", value: "16:10", name: "MacBook / PC", category: "cinema", desc: "Laptop display aspect ratio" },
  // Photography & Classic
  { label: "4:3", value: "4:3", name: "Classic TV", category: "photo", desc: "Standard TV & iPad format" },
  { label: "3:4", value: "3:4", name: "Tablet Portrait", category: "photo", desc: "Vertical tablet & document" },
  { label: "3:2", value: "3:2", name: "35mm Photo", category: "photo", desc: "DSLR landscape photography" },
  { label: "2:3", value: "2:3", name: "Pinterest Pin", category: "photo", desc: "DSLR vertical photography" },
  { label: "5:4", value: "5:4", name: "Medium Format", category: "photo", desc: "Classic 8x10 print format" },
];

export const VideoCropperControls: React.FC<Props> = ({
  cropX,
  setCropX,
  cropY,
  setCropY,
  cropWidth,
  setCropWidth,
  cropHeight,
  setCropHeight,
  sourceWidth,
  sourceHeight,
  aspectLock,
  setAspectLock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "social" | "cinema" | "photo">("all");
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  const handleAspectChange = (aspect: string) => {
    setAspectLock(aspect);
    if (aspect === "free" || !sourceWidth || !sourceHeight) return;

    const [aw, ah] = aspect.split(":").map(Number);
    if (!aw || !ah || isNaN(aw) || isNaN(ah)) return;
    const ratio = aw / ah;

    // Adjust crop to match aspect ratio, keeping within bounds
    let newW = cropWidth > 0 ? cropWidth : sourceWidth;
    let newH = Math.round(newW / ratio);

    if (newH > sourceHeight) {
      newH = sourceHeight;
      newW = Math.round(newH * ratio);
    }
    if (newW > sourceWidth) {
      newW = sourceWidth;
      newH = Math.round(newW / ratio);
    }

    // Force even
    newW = Math.max(2, Math.floor(newW / 2) * 2);
    newH = Math.max(2, Math.floor(newH / 2) * 2);

    // Re-center around current crop center
    const curCenterX = cropX + (cropWidth > 0 ? cropWidth : newW) / 2;
    const curCenterY = cropY + (cropHeight > 0 ? cropHeight : newH) / 2;

    let newX = Math.round(curCenterX - newW / 2);
    let newY = Math.round(curCenterY - newH / 2);

    newX = Math.max(0, Math.min(newX, sourceWidth - newW));
    newY = Math.max(0, Math.min(newY, sourceHeight - newH));

    setCropWidth(newW);
    setCropHeight(newH);
    setCropX(Math.floor(newX / 2) * 2);
    setCropY(Math.floor(newY / 2) * 2);
  };

  const handleApplyCustom = () => {
    const w = parseFloat(customW);
    const h = parseFloat(customH);
    if (!w || !h || w <= 0 || h <= 0) return;
    const customRatioStr = `${w}:${h}`;
    handleAspectChange(customRatioStr);
  };

  const clampAndSet = (setter: (v: number) => void, value: number, max: number) => {
    setter(Math.max(0, Math.min(value, max)));
  };

  const filteredPresets = ASPECT_PRESETS.filter((p) => {
    if (selectedCategory === "all") return true;
    if (p.value === "free") return true;
    return p.category === selectedCategory;
  });

  const isCustomActive =
    aspectLock !== "free" &&
    !ASPECT_PRESETS.some((p) => p.value === aspectLock);

  return (
    <div className="flex flex-col gap-3.5 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Aspect Ratio Lock
        </span>
        {aspectLock !== "free" && (
          <button
            type="button"
            onClick={() => handleAspectChange("free")}
            className="text-[11px] text-accent hover:underline font-medium"
          >
            Reset (Free)
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-surface-raised rounded-lg border border-border text-[11px]">
        {[
          { id: "all", label: "All" },
          { id: "social", label: "Social" },
          { id: "cinema", label: "Cinema" },
          { id: "photo", label: "Photo" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`py-1 rounded font-medium text-center transition-colors ${
              selectedCategory === cat.id
                ? "bg-accent text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-3 gap-1.5 max-h-[190px] overflow-y-auto pr-0.5 scrollbar-thin">
        {filteredPresets.map((a) => {
          const isSelected = aspectLock === a.value;
          return (
            <button
              key={a.value}
              type="button"
              onClick={() => handleAspectChange(a.value)}
              title={a.desc}
              className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                isSelected
                  ? "bg-accent/15 border-accent text-accent shadow-xs"
                  : "bg-surface-raised border-border text-text-secondary hover:border-accent/40 hover:text-text-primary"
              }`}
              aria-label={`Lock aspect ratio to ${a.label} (${a.name})`}
            >
              <span className="text-xs font-bold font-mono leading-none">{a.label}</span>
              <span className="text-[10px] text-text-tertiary truncate max-w-full leading-tight">
                {a.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Aspect Ratio Entry */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-surface-raised/60 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-text-secondary">Custom Ratio:</span>
          {isCustomActive && (
            <span className="text-[10px] font-mono text-accent font-semibold">
              Active: {aspectLock}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            step="any"
            placeholder="W"
            value={customW}
            onChange={(e) => setCustomW(e.target.value)}
            className="w-full px-2 py-1 text-xs font-mono bg-surface border border-border rounded text-text-primary placeholder:text-text-tertiary focus:border-accent outline-none"
            aria-label="Custom width ratio"
          />
          <span className="text-xs font-bold text-text-tertiary">:</span>
          <input
            type="number"
            min={1}
            step="any"
            placeholder="H"
            value={customH}
            onChange={(e) => setCustomH(e.target.value)}
            className="w-full px-2 py-1 text-xs font-mono bg-surface border border-border rounded text-text-primary placeholder:text-text-tertiary focus:border-accent outline-none"
            aria-label="Custom height ratio"
          />
          <button
            type="button"
            onClick={handleApplyCustom}
            disabled={!customW || !customH || parseFloat(customW) <= 0 || parseFloat(customH) <= 0}
            className="px-3 py-1 text-xs font-semibold bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            Lock
          </button>
        </div>
      </div>

      {/* Manual Pixel Coordinates */}
      <span className="text-xs font-bold text-text-primary uppercase tracking-wider pt-1">
        Crop Region (pixels)
      </span>
      <div className="grid grid-cols-2 gap-2.5">
        <Input
          label="X Position"
          type="number"
          min={0}
          max={sourceWidth - 2}
          step={2}
          value={cropX}
          onChange={(e) => clampAndSet(setCropX, parseInt(e.target.value) || 0, sourceWidth - cropWidth)}
        />
        <Input
          label="Y Position"
          type="number"
          min={0}
          max={sourceHeight - 2}
          step={2}
          value={cropY}
          onChange={(e) => clampAndSet(setCropY, parseInt(e.target.value) || 0, sourceHeight - cropHeight)}
        />
        <Input
          label="Width"
          type="number"
          min={2}
          max={sourceWidth}
          step={2}
          value={cropWidth}
          onChange={(e) => {
            const v = Math.max(2, parseInt(e.target.value) || 2);
            setCropWidth(Math.min(v, sourceWidth - cropX));
          }}
        />
        <Input
          label="Height"
          type="number"
          min={2}
          max={sourceHeight}
          step={2}
          value={cropHeight}
          onChange={(e) => {
            const v = Math.max(2, parseInt(e.target.value) || 2);
            setCropHeight(Math.min(v, sourceHeight - cropY));
          }}
        />
      </div>

      {sourceWidth > 0 && (
        <div className="p-2 bg-surface-raised rounded-lg border border-border text-xs text-text-tertiary leading-relaxed">
          Source: {sourceWidth}×{sourceHeight} px • Crop: {cropWidth}×{cropHeight} px at ({cropX}, {cropY})
          {cropX + cropWidth > sourceWidth && (
            <span className="text-amber-400 ml-2 block">⚠ Crop exceeds source width</span>
          )}
          {cropY + cropHeight > sourceHeight && (
            <span className="text-amber-400 ml-2 block">⚠ Crop exceeds source height</span>
          )}
        </div>
      )}
    </div>
  );
};
