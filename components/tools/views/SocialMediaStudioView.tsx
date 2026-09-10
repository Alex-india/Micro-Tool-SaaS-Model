"use client";

import React, { useState, useMemo, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Download, Sparkles, Video, Music, Copy, Check, Scissors, Volume2 } from "lucide-react";

export interface SocialMediaStudioViewProps {
  tool: ToolMeta;
}

const SOCIAL_LIMITS = [
  { platform: "Twitter / X Post", limit: 280, warn: 260 },
  { platform: "Twitter / X Name", limit: 50, warn: 45 },
  { platform: "Instagram Caption", limit: 2200, warn: 2100 },
  { platform: "Instagram Bio", limit: 150, warn: 140 },
  { platform: "LinkedIn Post", limit: 3000, warn: 2900 },
  { platform: "LinkedIn Headline", limit: 220, warn: 200 },
  { platform: "YouTube Video Title", limit: 100, warn: 90 },
  { platform: "YouTube Description", limit: 5000, warn: 4800 },
  { platform: "TikTok Caption", limit: 2200, warn: 2100 },
  { platform: "Pinterest Pin Description", limit: 500, warn: 480 },
];

export const SocialMediaStudioView: React.FC<SocialMediaStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  const isCharCounter = slug.includes("character-counter");
  const isAspectRatio = slug.includes("aspect-ratio");
  const isSubtitle = slug.includes("srt") || slug.includes("vtt");
  const isVideoOrAudio =
    slug.includes("video") ||
    slug.includes("audio") ||
    slug.includes("mp3") ||
    slug.includes("trimmer") ||
    slug.includes("compressor");

  // 1. Character Counter State
  const [socialText, setSocialText] = useState<string>("");

  // 2. Aspect Ratio States
  const [arWidth, setArWidth] = useState<string>("");
  const [arHeight, setArHeight] = useState<string>("");
  const [newWidth, setNewWidth] = useState<string>("");

  // 3. Subtitle States
  const [subInput, setSubInput] = useState<string>("");
  const [copiedSub, setCopiedSub] = useState<boolean>(false);

  // 4. Media & Resizer States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [processedUrl, setProcessedUrl] = useState<string>("");
  const [preset, setPreset] = useState<string>(
    slug.includes("youtube-thumbnail")
      ? "1280x720"
      : slug.includes("youtube-banner")
      ? "2560x1440"
      : slug.includes("tiktok") || slug.includes("story")
      ? "1080x1920"
      : slug.includes("linkedin")
      ? "1584x396"
      : slug.includes("facebook")
      ? "820x312"
      : "1080x1080"
  );
  const [videoTrimStart, setVideoTrimStart] = useState<number>(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState<number>(10);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const presets = [
    { label: "YouTube Thumbnail (1280x720 - 16:9)", value: "1280x720", width: 1280, height: 720 },
    { label: "YouTube Banner (2560x1440)", value: "2560x1440", width: 2560, height: 1440 },
    { label: "Instagram Square (1080x1080 - 1:1)", value: "1080x1080", width: 1080, height: 1080 },
    { label: "Instagram Portrait (1080x1350 - 4:5)", value: "1080x1350", width: 1080, height: 1350 },
    { label: "TikTok / Reel / Story (1080x1920 - 9:16)", value: "1080x1920", width: 1080, height: 1920 },
    { label: "LinkedIn Banner (1584x396)", value: "1584x396", width: 1584, height: 396 },
    { label: "Twitter / X Header (1500x500)", value: "1500x500", width: 1500, height: 500 },
    { label: "Facebook Cover (820x312)", value: "820x312", width: 820, height: 312 },
  ];

  // Aspect ratio calculation
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const arResult = useMemo(() => {
    const parsedW = parseFloat(arWidth) || 0;
    const parsedH = parseFloat(arHeight) || 0;
    const parsedNewW = parseFloat(newWidth) || 0;

    if (!parsedW && !parsedH) {
      return {
        ratioStr: "--:--",
        decimal: "0.00",
        scaledHeight: 0,
      };
    }
    const w = Math.max(1, Math.round(parsedW));
    const h = Math.max(1, Math.round(parsedH));
    const g = gcd(w, h);
    const simpW = w / g;
    const simpH = h / g;
    const calculatedNewHeight = parsedNewW ? Math.round((parsedNewW * h) / w) : 0;

    return {
      ratioStr: `${simpW}:${simpH}`,
      decimal: (w / h).toFixed(4),
      scaledHeight: calculatedNewHeight,
    };
  }, [arWidth, arHeight, newWidth]);

  // Subtitle conversion calculation
  const convertedSubtitles = useMemo(() => {
    if (slug.includes("srt-to-vtt") || !slug.includes("vtt-to-srt")) {
      // SRT to VTT
      let vtt = "WEBVTT\n\n";
      vtt += subInput.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
      return vtt;
    } else {
      // VTT to SRT
      let srt = subInput.replace(/^WEBVTT\n\n?/i, "");
      srt = srt.replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, "$1,$2");
      return srt;
    }
  }, [subInput, slug]);

  const handleDrop = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      if (file.type.startsWith("image/")) {
        renderResized(url, preset);
      }
    }
  };

  const renderResized = (url: string, presetVal: string) => {
    const selectedPreset = presets.find((p) => p.value === presetVal) || presets[0];
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = selectedPreset.width;
      canvas.height = selectedPreset.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#090A0F";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedUrl(URL.createObjectURL(blob));
        }
      }, "image/jpeg", 0.92);
    };
    img.src = url;
  };

  const handlePresetChange = (val: string) => {
    setPreset(val);
    if (previewUrl && selectedFile?.type.startsWith("image/")) {
      renderResized(previewUrl, val);
    }
  };

  const handleDownload = () => {
    if (!processedUrl && !previewUrl) return;
    const a = document.createElement("a");
    a.href = processedUrl || previewUrl;
    a.download = `toolverse-${tool.slug}-output.${selectedFile?.type.startsWith("video/") ? "mp4" : "jpg"}`;
    a.click();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {isCharCounter ? (
        /* 1. SOCIAL MEDIA CHARACTER COUNTER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Draft Social Media Message
            </h3>
            <textarea
              value={socialText}
              onChange={(e) => setSocialText(e.target.value)}
              rows={8}
              className="w-full bg-surface-raised border border-border rounded-lg p-4 text-sm text-text-primary outline-none focus:border-accent leading-relaxed"
              placeholder="Type or paste your social post here..."
            />
            <div className="flex items-center justify-between text-xs text-text-tertiary">
              <span>{socialText.length} Total Characters</span>
              <span>{socialText.trim() ? socialText.trim().split(/\s+/).length : 0} Words</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3 bg-surface border border-border rounded-xl p-6 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Platform Limits
            </h3>
            <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
              {SOCIAL_LIMITS.map((item) => {
                const count = socialText.length;
                const remaining = item.limit - count;
                const isOver = remaining < 0;
                const isWarning = remaining >= 0 && remaining <= item.limit - item.warn;

                return (
                  <div key={item.platform} className="p-3 bg-surface-raised rounded-lg border border-border flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary">{item.platform}</span>
                      <span
                        className={`font-mono font-bold ${
                          isOver ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over limit`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full transition-all duration-200 ${
                          isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, (count / item.limit) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : isAspectRatio ? (
        /* 2. ASPECT RATIO CALCULATOR */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Original Dimensions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Width (px)"
                type="number"
                value={arWidth}
                onChange={(e) => setArWidth(e.target.value)}
                placeholder="e.g. 1920"
              />
              <Input
                label="Height (px)"
                type="number"
                value={arHeight}
                onChange={(e) => setArHeight(e.target.value)}
                placeholder="e.g. 1080"
              />
            </div>
            <Input
              label="Calculate Scaled Height for New Width (px)"
              type="number"
              value={newWidth}
              onChange={(e) => setNewWidth(e.target.value)}
              placeholder="e.g. 1280"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Aspect Ratio Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-surface-raised rounded-lg border border-border text-center">
                <span className="text-text-tertiary block">Simplified Ratio</span>
                <span className="text-lg font-bold text-accent mt-0.5 block">{arResult.ratioStr}</span>
              </div>
              <div className="p-3.5 bg-surface-raised rounded-lg border border-border text-center">
                <span className="text-text-tertiary block">Scaled Dimensions</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 block">
                  {newWidth} × {arResult.scaledHeight}
                </span>
              </div>
              <div className="p-3.5 bg-surface-raised rounded-lg border border-border text-center col-span-2">
                <span className="text-text-tertiary block">Decimal Multiplier</span>
                <span className="text-sm font-mono text-text-primary mt-0.5 block">{arResult.decimal}</span>
              </div>
            </div>
          </div>
        </div>
      ) : isSubtitle ? (
        /* 3. SUBTITLE CONVERTER (SRT / VTT) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Source Subtitle ({slug.includes("srt-to-vtt") ? "SRT" : "VTT"})
              </span>
            </div>
            <textarea
              value={subInput}
              onChange={(e) => setSubInput(e.target.value)}
              rows={12}
              className="w-full bg-surface-raised border border-border rounded-lg p-3.5 font-mono text-xs text-text-primary outline-none focus:border-accent"
              placeholder="Paste SRT or VTT subtitle text..."
            />
          </div>

          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Converted Subtitle ({slug.includes("srt-to-vtt") ? "VTT" : "SRT"})
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(convertedSubtitles);
                  setCopiedSub(true);
                  setTimeout(() => setCopiedSub(false), 2000);
                }}
                leftIcon={copiedSub ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copiedSub ? "Copied" : "Copy"}
              </Button>
            </div>
            <textarea
              readOnly
              value={convertedSubtitles}
              rows={12}
              className="w-full bg-surface-raised border border-border rounded-lg p-3.5 font-mono text-xs text-emerald-400 outline-none"
            />
          </div>
        </div>
      ) : (
        /* 4. MEDIA & SOCIAL RESIZER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-6 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Select Preset & Media
            </h3>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-text-secondary">Platform Canvas Preset</label>
              <select
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg p-3 text-sm text-text-primary font-semibold outline-none focus:border-accent"
              >
                {presets.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <Dropzone
              accept="image/*,video/*,audio/*"
              maxFiles={1}
              onDrop={handleDrop}
              helperText="Upload any JPG, PNG, MP4, WebM, or audio file"
            />

            {isVideoOrAudio && (
              <div className="flex flex-col gap-3 pt-3 border-t border-border">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Media Controls</span>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Trim Start (sec)"
                    type="number"
                    value={videoTrimStart}
                    onChange={(e) => setVideoTrimStart(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Trim End (sec)"
                    type="number"
                    value={videoTrimEnd}
                    onChange={(e) => setVideoTrimEnd(parseFloat(e.target.value) || 10)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card sticky top-20">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Live Preview</span>
              {(processedUrl || previewUrl) && (
                <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
                  Download Processed Media
                </Button>
              )}
            </div>

            <div className="w-full aspect-video bg-surface-raised border border-border rounded-xl flex items-center justify-center overflow-hidden relative">
              {selectedFile?.type.startsWith("video/") ? (
                <video src={previewUrl} controls className="max-h-full max-w-full rounded-lg" />
              ) : selectedFile?.type.startsWith("audio/") ? (
                <div className="flex flex-col items-center gap-3 p-6">
                  <Volume2 className="w-12 h-12 text-accent animate-pulse" />
                  <audio src={previewUrl} controls className="w-full max-w-md" />
                </div>
              ) : processedUrl || previewUrl ? (
                <img src={processedUrl || previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-tertiary">
                  <Video className="w-12 h-12 opacity-30" />
                  <span className="text-xs">Upload media to see preview & apply preset</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
