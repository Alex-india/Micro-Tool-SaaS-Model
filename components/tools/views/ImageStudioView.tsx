"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Input } from "@/components/ui/Input";
import { Dropzone } from "@/components/ui/Dropzone";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Download, Sparkles, Sliders, RefreshCw, Lock, Unlock, Palette, Copy, Check } from "lucide-react";

export interface ImageStudioViewProps {
  tool: ToolMeta;
}

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Auto detect format from slug
  let initialFormat = "image/jpeg";
  if (slug.includes("to-png") || slug.includes("png")) initialFormat = "image/png";
  else if (slug.includes("to-webp") || slug.includes("webp")) initialFormat = "image/webp";
  else if (slug.includes("to-jpg") || slug.includes("jpg")) initialFormat = "image/jpeg";

  const isColorTool = slug.includes("color") || slug.includes("palette");
  const isDimensions = slug.includes("dimension");
  const isFavicon = slug.includes("favicon");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [processedUrl, setProcessedUrl] = useState<string>("");
  const [quality, setQuality] = useState<number>(85);
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [targetHeight, setTargetHeight] = useState<number>(800);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1.5);
  const [outputFormat, setOutputFormat] = useState<string>(initialFormat);
  const [filterMode, setFilterMode] = useState<string>("none");
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [copiedColor, setCopiedColor] = useState<string>("");

  const imgElementRef = useRef<HTMLImageElement | null>(null);

  const processImage = useCallback(
    (q: number, w: number, h: number, fmt: string, filter: string) => {
      if (!imgElementRef.current) return;
      setIsProcessing(true);

      const img = imgElementRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(10, Math.round(w));
      canvas.height = Math.max(10, Math.round(h));
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Apply CSS filters on canvas context if selected
      if (filter === "grayscale") {
        ctx.filter = "grayscale(100%)";
      } else if (filter === "sepia") {
        ctx.filter = "sepia(100%)";
      } else if (filter === "invert") {
        ctx.filter = "invert(100%)";
      } else if (filter === "high-contrast") {
        ctx.filter = "contrast(150%) brightness(110%)";
      } else {
        ctx.filter = "none";
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCompressedSize(blob.size);
            if (processedUrl) URL.revokeObjectURL(processedUrl);
            const processed = URL.createObjectURL(blob);
            setProcessedUrl(processed);
          }
          setIsProcessing(false);
        },
        fmt,
        q / 100
      );
    },
    [processedUrl]
  );

  const extractDominantColors = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, 100, 100);
    const data = ctx.getImageData(0, 0, 100, 100).data;
    const colors: string[] = [];

    for (let i = 0; i < data.length; i += 400) {
      const r = data[i].toString(16).padStart(2, "0");
      const g = data[i + 1].toString(16).padStart(2, "0");
      const b = data[i + 2].toString(16).padStart(2, "0");
      const hex = `#${r}${g}${b}`.toUpperCase();
      if (!colors.includes(hex) && colors.length < 8) {
        colors.push(hex);
      }
    }
    setExtractedColors(colors);
  };

  const handleFilesDropped = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setOriginalSize(file.size);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        imgElementRef.current = img;
        const ar = img.width / (img.height || 1);
        setOriginalAspectRatio(ar);
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        extractDominantColors(img);
        processImage(quality, img.width, img.height, outputFormat, filterMode);
      };
      img.src = url;
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (aspectRatioLocked && originalAspectRatio > 0) {
      const h = Math.round(val / originalAspectRatio);
      setTargetHeight(h);
      processImage(quality, val, h, outputFormat, filterMode);
    } else {
      processImage(quality, val, targetHeight, outputFormat, filterMode);
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (aspectRatioLocked && originalAspectRatio > 0) {
      const w = Math.round(val * originalAspectRatio);
      setTargetWidth(w);
      processImage(quality, w, val, outputFormat, filterMode);
    } else {
      processImage(quality, targetWidth, val, outputFormat, filterMode);
    }
  };

  const handleQualityChange = (val: number) => {
    setQuality(val);
    processImage(val, targetWidth, targetHeight, outputFormat, filterMode);
  };

  const handleFormatChange = (fmt: string) => {
    setOutputFormat(fmt);
    processImage(quality, targetWidth, targetHeight, fmt, filterMode);
  };

  const handleFilterChange = (flt: string) => {
    setFilterMode(flt);
    processImage(quality, targetWidth, targetHeight, outputFormat, flt);
  };

  const handleDownload = () => {
    if (!processedUrl && !previewUrl) return;
    const a = document.createElement("a");
    a.href = processedUrl || previewUrl;
    let ext = "jpg";
    if (outputFormat === "image/png") ext = "png";
    if (outputFormat === "image/webp") ext = "webp";
    a.download = `toolverse-${tool.slug}-optimized.${ext}`;
    a.click();
  };

  const savingsPercent =
    originalSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <Dropzone
            accept="image/*,.jpg,.jpeg,.png,.webp,.svg,.avif"
            maxFiles={1}
            onDrop={handleFilesDropped}
            helperText="Drop your photo here to compress, resize, or convert"
          />

          {selectedFile && (
            <div className="flex flex-col gap-5 pt-4 border-t border-border">
              {/* Quality Slider */}
              <Slider
                label="Compression Quality"
                min={10}
                max={100}
                step={1}
                value={quality}
                unit="%"
                onChangeValue={handleQualityChange}
              />

              {/* Dimensions */}
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-secondary">Image Dimensions (px)</span>
                  <button
                    type="button"
                    onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                    className="flex items-center gap-1 text-accent font-semibold hover:underline"
                  >
                    {aspectRatioLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {aspectRatioLocked ? "Locked 16:9" : "Free Scale"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Width"
                    type="number"
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 10)}
                    suffixSymbol="px"
                  />
                  <Input
                    label="Height"
                    type="number"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 10)}
                    suffixSymbol="px"
                  />
                </div>
              </div>

              {/* Format selector */}
              <div className="flex flex-col gap-1.5 text-xs font-semibold">
                <label className="text-text-secondary">Target Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "image/jpeg", label: "JPG / JPEG" },
                    { id: "image/png", label: "PNG" },
                    { id: "image/webp", label: "WebP" },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleFormatChange(fmt.id)}
                      className={`p-2 rounded-lg border text-xs transition-colors ${
                        outputFormat === fmt.id
                          ? "bg-accent/10 border-accent text-accent font-bold"
                          : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter presets */}
              <div className="flex flex-col gap-1.5 text-xs font-semibold">
                <label className="text-text-secondary">Filter Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "none", label: "Original" },
                    { id: "grayscale", label: "B&W" },
                    { id: "sepia", label: "Sepia" },
                    { id: "high-contrast", label: "Punchy" },
                    { id: "invert", label: "Inverted" },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => handleFilterChange(flt.id)}
                      className={`p-2 rounded-lg border text-xs transition-colors ${
                        filterMode === flt.id
                          ? "bg-accent/10 border-accent text-accent font-bold"
                          : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette Extraction */}
              {extractedColors.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-accent" /> Extracted Color Palette
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {extractedColors.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(hex);
                          setCopiedColor(hex);
                          setTimeout(() => setCopiedColor(""), 1500);
                        }}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-raised border border-border group"
                      >
                        <div className="w-full h-6 rounded border border-border/60" style={{ backgroundColor: hex }} />
                        <span className="text-[10px] font-mono text-text-secondary group-hover:text-accent">
                          {copiedColor === hex ? "Copied" : hex}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column Preview */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-surface border border-border rounded-xl p-6 shadow-card sticky top-20">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Processed Result Preview</h3>
            {(processedUrl || previewUrl) && (
              <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
                Download Image
              </Button>
            )}
          </div>

          <div className="w-full aspect-video bg-surface-raised border border-border rounded-xl flex items-center justify-center overflow-hidden relative p-2">
            {processedUrl || previewUrl ? (
              <img
                src={processedUrl || previewUrl}
                alt="Optimized output preview"
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-center text-text-tertiary p-6">
                <Sliders className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Upload an image on the left to see live client-side optimization</p>
              </div>
            )}
          </div>

          {/* Size Reduction Badge Card */}
          {selectedFile && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface-raised border border-border rounded-lg text-center">
                <span className="text-[11px] text-text-tertiary block">Original Size</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">
                  {(originalSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="p-3 bg-surface-raised border border-border rounded-lg text-center">
                <span className="text-[11px] text-text-tertiary block">Optimized Size</span>
                <span className="text-sm font-bold text-accent mt-0.5 block">
                  {(compressedSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="p-3 bg-surface-raised border border-border rounded-lg text-center">
                <span className="text-[11px] text-text-tertiary block">Size Reduction</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  {savingsPercent > 0 ? `-${savingsPercent}%` : "Optimized"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
