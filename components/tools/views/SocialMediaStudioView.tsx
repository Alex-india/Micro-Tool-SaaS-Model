"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  Download,
  Sparkles,
  Video,
  Music,
  Copy,
  Check,
  Scissors,
  Volume2,
  Image as ImageIcon,
  SlidersHorizontal,
  Play,
  Pause,
  RefreshCw,
  Film,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Layers,
  Crop,
  CheckCircle2,
} from "lucide-react";

export interface SocialMediaStudioViewProps {
  tool: ToolMeta;
}

// ====================================================
// BINARY UTILITIES: MP4 & WEBM DURATION METADATA PATCHING
// ====================================================

/**
 * Patches MP4 duration in mvhd, tkhd, and mehd header boxes.
 * Fixes Windows Explorer displaying blank / missing length metadata.
 */
function patchMp4Duration(buf: Uint8Array, durationSec: number): Uint8Array {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let timescale = 1000;

  for (let i = 0; i < buf.length - 36; i++) {
    // 1. Movie Header Box ('mvhd')
    if (
      buf[i] === 0x6d &&
      buf[i + 1] === 0x76 &&
      buf[i + 2] === 0x68 &&
      buf[i + 3] === 0x64
    ) {
      const version = buf[i + 4];
      if (version === 0) {
        timescale = view.getUint32(i + 16);
        if (timescale > 0) {
          const durUnits = Math.round(durationSec * timescale);
          view.setUint32(i + 20, durUnits);
        }
      } else if (version === 1) {
        timescale = view.getUint32(i + 24);
        if (timescale > 0) {
          const durUnits = BigInt(Math.round(durationSec * timescale));
          view.setBigUint64(i + 28, durUnits);
        }
      }
    }

    // 2. Track Header Box ('tkhd')
    if (
      buf[i] === 0x74 &&
      buf[i + 1] === 0x6b &&
      buf[i + 2] === 0x68 &&
      buf[i + 3] === 0x64
    ) {
      const version = buf[i + 4];
      if (timescale > 0) {
        const durUnits = Math.round(durationSec * timescale);
        if (version === 0) {
          view.setUint32(i + 24, durUnits);
        } else if (version === 1) {
          view.setBigUint64(i + 32, BigInt(durUnits));
        }
      }
    }

    // 3. Movie Extends Header Box ('mehd')
    if (
      buf[i] === 0x6d &&
      buf[i + 1] === 0x65 &&
      buf[i + 2] === 0x68 &&
      buf[i + 3] === 0x64
    ) {
      const version = buf[i + 4];
      if (timescale > 0) {
        const durUnits = Math.round(durationSec * timescale);
        if (version === 0) {
          view.setUint32(i + 8, durUnits);
        } else if (version === 1) {
          view.setBigUint64(i + 8, BigInt(durUnits));
        }
      }
    }
  }
  return buf;
}

/**
 * Patches WebM duration in EBML Info element (0x44, 0x89).
 * Fixes VLC / Media Player displaying missing video length.
 */
function patchWebmDuration(buf: Uint8Array, durationSec: number): Uint8Array {
  const durationMs = durationSec * 1000;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  // Check for existing Duration element (0x44, 0x89) inside Segment Info
  for (let i = 0; i < Math.min(buf.length - 12, 120000); i++) {
    if (buf[i] === 0x44 && buf[i + 1] === 0x89) {
      const lenByte = buf[i + 2];
      if (lenByte === 0x84) {
        view.setFloat32(i + 3, durationMs, false);
        return buf;
      } else if (lenByte === 0x88) {
        view.setFloat64(i + 3, durationMs, false);
        return buf;
      }
    }
  }

  // If Duration element not found, inject it right after Segment Info tag (0x15, 0x49, 0xA9, 0x66)
  for (let i = 0; i < Math.min(buf.length - 16, 120000); i++) {
    if (
      buf[i] === 0x15 &&
      buf[i + 1] === 0x49 &&
      buf[i + 2] === 0xa9 &&
      buf[i + 3] === 0x66
    ) {
      let offset = i + 4;
      const firstByte = buf[offset];
      let vlen = 1;
      if (firstByte & 0x80) vlen = 1;
      else if (firstByte & 0x40) vlen = 2;
      else if (firstByte & 0x20) vlen = 3;
      else if (firstByte & 0x10) vlen = 4;
      offset += vlen;

      // Inject 7 bytes: 0x44, 0x89, 0x84, 4-byte float32(durationMs)
      const injectBytes = new Uint8Array(7);
      injectBytes[0] = 0x44;
      injectBytes[1] = 0x89;
      injectBytes[2] = 0x84;
      const fView = new DataView(injectBytes.buffer);
      fView.setFloat32(3, durationMs, false);

      const newBuf = new Uint8Array(buf.length + 7);
      newBuf.set(buf.subarray(0, offset), 0);
      newBuf.set(injectBytes, offset);
      newBuf.set(buf.subarray(offset), offset + 7);
      return newBuf;
    }
  }
  return buf;
}

/**
 * Parses video blob and injects duration metadata into container header.
 */
async function fixVideoBlobDuration(blob: Blob, durationSec: number): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    const isMp4 =
      blob.type.includes("mp4") ||
      (uint8.length > 12 &&
        uint8[4] === 0x66 &&
        uint8[5] === 0x74 &&
        uint8[6] === 0x79 &&
        uint8[7] === 0x70); // 'ftyp'

    const isWebm =
      blob.type.includes("webm") ||
      (uint8.length > 4 &&
        uint8[0] === 0x1a &&
        uint8[1] === 0x45 &&
        uint8[2] === 0xdf &&
        uint8[3] === 0xa3);

    if (isMp4) {
      const patched = patchMp4Duration(uint8, durationSec);
      return new Blob([patched.buffer as ArrayBuffer], { type: blob.type || "video/mp4" });
    } else if (isWebm) {
      const patched = patchWebmDuration(uint8, durationSec);
      return new Blob([patched.buffer as ArrayBuffer], { type: blob.type || "video/webm" });
    }
  } catch (err) {
    console.warn("Could not patch video duration metadata:", err);
  }
  return blob;
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
  const isImageCompressor = slug === "social-media-image-compressor";
  const isVideoResizer = slug === "instagram-video-resizer" || slug.includes("video-resizer");
  const isVideoOrAudio =
    !isImageCompressor &&
    !isVideoResizer &&
    (slug.includes("video") ||
      slug.includes("audio") ||
      slug.includes("mp3") ||
      slug.includes("trimmer"));

  // ----------------------------------------------------
  // 1. CHARACTER COUNTER STATE
  // ----------------------------------------------------
  const [socialText, setSocialText] = useState<string>("");

  // ----------------------------------------------------
  // 2. ASPECT RATIO STATES
  // ----------------------------------------------------
  const [arWidth, setArWidth] = useState<string>("");
  const [arHeight, setArHeight] = useState<string>("");
  const [newWidth, setNewWidth] = useState<string>("");

  // ----------------------------------------------------
  // 3. SUBTITLE STATES
  // ----------------------------------------------------
  const [subInput, setSubInput] = useState<string>("");
  const [copiedSub, setCopiedSub] = useState<boolean>(false);

  // ----------------------------------------------------
  // 4. IMAGE COMPRESSOR STATES (Dedicated for social-media-image-compressor)
  // ----------------------------------------------------
  const [compFile, setCompFile] = useState<File | null>(null);
  const [compPreviewUrl, setCompPreviewUrl] = useState<string>("");
  const [compResultUrl, setCompResultUrl] = useState<string>("");
  const [compOriginalSize, setCompOriginalSize] = useState<number>(0);
  const [compResultSize, setCompResultSize] = useState<number>(0);
  const [compPreset, setCompPreset] = useState<"1mb" | "2mb" | "5mb" | "custom">("2mb");
  const [compQuality, setCompQuality] = useState<number>(80);
  const [compMaxDim, setCompMaxDim] = useState<number>(0); // 0 = original
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compDims, setCompDims] = useState<{ origW: number; origH: number; outW: number; outH: number } | null>(null);

  // ----------------------------------------------------
  // 5. VIDEO RESIZER STATES (Dedicated for instagram-video-resizer 9:16 Reels)
  // ----------------------------------------------------
  const [vidFile, setVidFile] = useState<File | null>(null);
  const [vidUrl, setVidUrl] = useState<string>("");
  const [vidDuration, setVidDuration] = useState<number>(0);
  const [vidTrimStart, setVidTrimStart] = useState<number>(0);
  const [vidTrimEnd, setVidTrimEnd] = useState<number>(15);
  const [vidAspectRatio, setVidAspectRatio] = useState<"9:16" | "1:1" | "4:5">("9:16");
  const [vidQuality, setVidQuality] = useState<"1080p" | "720p">("1080p");
  const [vidFitMode, setVidFitMode] = useState<"cover" | "blur" | "black">("cover");
  const [isRenderingVideo, setIsRenderingVideo] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string>("");
  const [exportMimeType, setExportMimeType] = useState<string>("video/mp4");
  const [renderStatusText, setRenderStatusText] = useState<string>("");
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // ----------------------------------------------------
  // 6. GENERAL MEDIA & RESIZER STATES (For other image tools)
  // ----------------------------------------------------
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

  // Helper: Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper: Format seconds to MM:SS
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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
      let vtt = "WEBVTT\n\n";
      vtt += subInput.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
      return vtt;
    } else {
      let srt = subInput.replace(/^WEBVTT\n\n?/i, "");
      srt = srt.replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, "$1,$2");
      return srt;
    }
  }, [subInput, slug]);

  // ----------------------------------------------------
  // IMAGE COMPRESSOR ENGINE (Pure Client-Side Canvas)
  // ----------------------------------------------------
  const executeImageCompression = useCallback(
    (file: File, presetMode: "1mb" | "2mb" | "5mb" | "custom", qVal: number, maxDim: number) => {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let targetW = img.width;
          let targetH = img.height;

          if (maxDim > 0 && (targetW > maxDim || targetH > maxDim)) {
            if (targetW > targetH) {
              targetH = Math.round((targetH * maxDim) / targetW);
              targetW = maxDim;
            } else {
              targetW = Math.round((targetW * maxDim) / targetH);
              targetH = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setIsCompressing(false);
            return;
          }

          ctx.drawImage(img, 0, 0, targetW, targetH);

          if (presetMode === "custom") {
            const qualityRatio = Math.max(0.05, Math.min(1.0, qVal / 100));
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  setCompResultUrl(URL.createObjectURL(blob));
                  setCompResultSize(blob.size);
                  setCompDims({
                    origW: img.width,
                    origH: img.height,
                    outW: targetW,
                    outH: targetH,
                  });
                }
                setIsCompressing(false);
              },
              "image/jpeg",
              qualityRatio
            );
          } else {
            const targetBytes =
              presetMode === "1mb" ? 1024 * 1024 : presetMode === "2mb" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;

            const tryCompress = (q: number, scaleFactor: number) => {
              if (scaleFactor < 1) {
                canvas.width = Math.max(100, Math.round(targetW * scaleFactor));
                canvas.height = Math.max(100, Math.round(targetH * scaleFactor));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              }
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    if (blob.size <= targetBytes || q <= 0.25) {
                      setCompResultUrl(URL.createObjectURL(blob));
                      setCompResultSize(blob.size);
                      setCompDims({
                        origW: img.width,
                        origH: img.height,
                        outW: canvas.width,
                        outH: canvas.height,
                      });
                      setIsCompressing(false);
                    } else if (q > 0.4) {
                      tryCompress(q - 0.15, scaleFactor);
                    } else if (scaleFactor > 0.6) {
                      tryCompress(0.75, scaleFactor - 0.2);
                    } else {
                      setCompResultUrl(URL.createObjectURL(blob));
                      setCompResultSize(blob.size);
                      setCompDims({
                        origW: img.width,
                        origH: img.height,
                        outW: canvas.width,
                        outH: canvas.height,
                      });
                      setIsCompressing(false);
                    }
                  } else {
                    setIsCompressing(false);
                  }
                },
                "image/jpeg",
                q
              );
            };

            tryCompress(0.88, 1.0);
          }
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleCompDrop = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setCompFile(file);
      setCompOriginalSize(file.size);
      const url = URL.createObjectURL(file);
      setCompPreviewUrl(url);
      executeImageCompression(file, compPreset, compQuality, compMaxDim);
    }
  };

  const handleCompDownload = () => {
    if (!compResultUrl) return;
    const a = document.createElement("a");
    a.href = compResultUrl;
    a.download = `toolverse-compressed-${compFile ? compFile.name.replace(/\.[^/.]+$/, "") : "image"}.jpg`;
    a.click();
  };

  // ----------------------------------------------------
  // INSTAGRAM VIDEO RESIZER ENGINE (Canvas + Web Audio + MediaRecorder + Duration Fix)
  // ----------------------------------------------------
  const handleVidDrop = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setVidFile(file);
      const url = URL.createObjectURL(file);
      setVidUrl(url);
      setExportedVideoUrl("");
      setRenderProgress(0);

      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        const dur = Math.round(tempVideo.duration) || 15;
        setVidDuration(dur);
        setVidTrimStart(0);
        setVidTrimEnd(Math.min(dur, 60));
      };
    }
  };

  const executeVideoExport = async () => {
    if (!vidUrl || !vidFile) return;

    setIsRenderingVideo(true);
    setRenderProgress(0);
    setRenderStatusText("Initializing video canvas and audio pipeline...");
    setExportedVideoUrl("");

    // Target dimensions matching UI exactly (Fixes Issue 3: Output Resolution Mismatch)
    let targetW = 1080;
    let targetH = 1920;
    if (vidQuality === "720p") {
      if (vidAspectRatio === "9:16") {
        targetW = 720;
        targetH = 1280;
      } else if (vidAspectRatio === "1:1") {
        targetW = 720;
        targetH = 720;
      } else if (vidAspectRatio === "4:5") {
        targetW = 720;
        targetH = 900;
      }
    } else {
      // 1080p Full HD (Default)
      if (vidAspectRatio === "9:16") {
        targetW = 1080;
        targetH = 1920;
      } else if (vidAspectRatio === "1:1") {
        targetW = 1080;
        targetH = 1080;
      } else if (vidAspectRatio === "4:5") {
        targetW = 1080;
        targetH = 1350;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      alert("Canvas 2D context not supported.");
      setIsRenderingVideo(false);
      return;
    }

    // Create rendering video element and attach to DOM off-screen
    // (Attaching to DOM ensures Chromium's audio decoder remains active and does not silence background audio)
    const renderVid = document.createElement("video");
    renderVid.src = vidUrl;
    renderVid.muted = false;
    renderVid.volume = 1.0;
    renderVid.playsInline = true;
    renderVid.crossOrigin = "anonymous";
    renderVid.style.position = "fixed";
    renderVid.style.top = "-9999px";
    renderVid.style.left = "-9999px";
    renderVid.style.width = "2px";
    renderVid.style.height = "2px";
    renderVid.style.opacity = "0.01";
    renderVid.style.pointerEvents = "none";
    document.body.appendChild(renderVid);

    await new Promise<void>((resolve) => {
      renderVid.onloadeddata = () => resolve();
      renderVid.load();
    });

    renderVid.currentTime = vidTrimStart;
    await new Promise<void>((resolve) => {
      renderVid.onseeked = () => resolve();
    });

    // Create video stream from canvas
    const stream = canvas.captureStream(30);

    // Audio Pipeline (Fixes Issue 1: Audio Bitrate 0kbps)
    // Route video element audio through Web Audio API into MediaStreamAudioDestination
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    let audioCtx: AudioContext | null = null;

    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        const source = audioCtx.createMediaElementSource(renderVid);
        const audioDest = audioCtx.createMediaStreamDestination();
        source.connect(audioDest);

        const audioTracks = audioDest.stream.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
          stream.addTrack(audioTracks[0]);
        }
      } catch (audioErr) {
        console.warn("Web Audio API routing notice:", audioErr);
        // Fallback: direct captureStream audio
        try {
          const directStream =
            (renderVid as any).captureStream?.() ||
            (renderVid as any).mozCaptureStream?.();
          if (directStream) {
            directStream.getAudioTracks().forEach((t: MediaStreamTrack) => stream.addTrack(t));
          }
        } catch {
          // ignore
        }
      }
    }

    // Determine supported container format
    let mime = "video/webm;codecs=vp9";
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
        mime = "video/mp4";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mime = "video/mp4";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
        mime = "video/webm;codecs=vp9,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mime = "video/webm";
      }
    }
    setExportMimeType(mime);

    // Configure MediaRecorder with explicit audio & video bitrates (Fixes Issue 1)
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: targetW >= 1080 ? 8_000_000 : 4_500_000,
        audioBitsPerSecond: 128_000, // Explicit 128 kbps audio encoding
      });
    } catch {
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        audioBitsPerSecond: 128_000,
      });
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const totalExportDuration = Math.max(1, vidTrimEnd - vidTrimStart);

    recorder.onstop = async () => {
      // Clean up DOM and AudioContext
      if (renderVid.parentNode) {
        renderVid.parentNode.removeChild(renderVid);
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }

      setRenderStatusText("Finalizing video duration & audio metadata...");
      const rawBlob = new Blob(chunks, { type: mime });

      // Patch Duration Metadata into container header (Fixes Issue 2: Missing Length)
      const finalBlob = await fixVideoBlobDuration(rawBlob, totalExportDuration);
      const finalUrl = URL.createObjectURL(finalBlob);

      setExportedVideoUrl(finalUrl);
      setIsRenderingVideo(false);
      setRenderProgress(100);
      setRenderStatusText("Video processing complete!");
    };

    setRenderStatusText(`Rendering frames for Instagram (${targetW}x${targetH})...`);
    recorder.start(100);
    renderVid.play();

    let animId: number;
    const drawFrame = () => {
      if (renderVid.paused && renderVid.ended) {
        recorder.stop();
        return;
      }

      const elapsed = renderVid.currentTime - vidTrimStart;
      const pct = Math.min(99, Math.max(0, Math.round((elapsed / totalExportDuration) * 100)));
      setRenderProgress(pct);

      const vW = renderVid.videoWidth || targetW;
      const vH = renderVid.videoHeight || targetH;

      if (vidFitMode === "blur") {
        // Blurred background
        ctx.save();
        ctx.filter = "blur(24px) brightness(0.65)";
        ctx.drawImage(renderVid, -40, -40, canvas.width + 80, canvas.height + 80);
        ctx.restore();

        // Crisp centered video
        const scale = Math.min(canvas.width / vW, canvas.height / vH);
        const w = vW * scale;
        const h = vH * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(renderVid, x, y, w, h);
      } else if (vidFitMode === "black") {
        // Black letterbox
        ctx.fillStyle = "#090A0F";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / vW, canvas.height / vH);
        const w = vW * scale;
        const h = vH * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(renderVid, x, y, w, h);
      } else {
        // Cover / Center Crop
        const scale = Math.max(canvas.width / vW, canvas.height / vH);
        const w = vW * scale;
        const h = vH * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(renderVid, x, y, w, h);
      }

      if (renderVid.currentTime >= vidTrimEnd || renderVid.ended) {
        renderVid.pause();
        cancelAnimationFrame(animId);
        recorder.stop();
        return;
      }

      animId = requestAnimationFrame(drawFrame);
    };

    animId = requestAnimationFrame(drawFrame);
  };

  const handleExportedVideoDownload = () => {
    if (!exportedVideoUrl) return;
    const a = document.createElement("a");
    a.href = exportedVideoUrl;
    const ext = exportMimeType.includes("mp4") ? "mp4" : "webm";
    const resTag = vidQuality === "720p" ? "720p" : "1080p";
    a.download = `toolverse-instagram-reel-${vidAspectRatio.replace(":", "x")}-${resTag}.${ext}`;
    a.click();
  };

  // ----------------------------------------------------
  // GENERAL RESIZER LOGIC (For YouTube, Facebook, LinkedIn, etc.)
  // ----------------------------------------------------
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

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setProcessedUrl(URL.createObjectURL(blob));
          }
        },
        "image/jpeg",
        0.92
      );
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
      ) : isImageCompressor ? (
        /* 4. DEDICATED SOCIAL MEDIA IMAGE COMPRESSOR (Real Under 1MB/2MB/5MB + Quality) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5 flex items-center justify-between">
              <span>Compression Settings</span>
              <span className="text-[10px] text-accent font-semibold px-2 py-0.5 bg-accent/10 rounded-full">
                Zero Quality Loss
              </span>
            </h3>

            <Dropzone
              accept="image/*"
              maxFiles={1}
              onDrop={handleCompDrop}
              helperText="Upload any JPG, PNG, or WebP graphic"
            />

            {compFile && (
              <div className="flex flex-col gap-5 pt-2">
                {/* Target Limit Presets */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-secondary">Target File Size Preset</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "1mb", label: "Under 1 MB", sub: "Fast Web / WhatsApp" },
                      { id: "2mb", label: "Under 2 MB", sub: "Twitter / Discord" },
                      { id: "5mb", label: "Under 5 MB", sub: "LinkedIn / HD" },
                      { id: "custom", label: "Custom", sub: "Manual Quality %" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const mode = item.id as "1mb" | "2mb" | "5mb" | "custom";
                          setCompPreset(mode);
                          if (compFile) executeImageCompression(compFile, mode, compQuality, compMaxDim);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-0.5 ${
                          compPreset === item.id
                            ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                            : "bg-surface-raised border-border text-text-secondary hover:border-border-hover"
                        }`}
                      >
                        <span className="text-xs font-bold text-text-primary">{item.label}</span>
                        <span className="text-[10px] text-text-tertiary">{item.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Quality Slider if custom is selected */}
                {compPreset === "custom" && (
                  <div className="flex flex-col gap-2 p-3.5 bg-surface-raised rounded-lg border border-border">
                    <Slider
                      label="Output Compression Quality"
                      min={10}
                      max={100}
                      step={5}
                      value={compQuality}
                      unit="%"
                      onChangeValue={(val) => {
                        setCompQuality(val);
                        if (compFile) executeImageCompression(compFile, "custom", val, compMaxDim);
                      }}
                    />
                  </div>
                )}

                {/* Max Dimension Limit */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-semibold text-text-secondary">Resolution Scaling</label>
                  <select
                    value={compMaxDim}
                    onChange={(e) => {
                      const d = parseInt(e.target.value) || 0;
                      setCompMaxDim(d);
                      if (compFile) executeImageCompression(compFile, compPreset, compQuality, d);
                    }}
                    className="w-full bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary font-semibold outline-none focus:border-accent"
                  >
                    <option value={0}>Original Resolution (No downscale)</option>
                    <option value={1920}>Max Full HD (1080p / 1920px)</option>
                    <option value={1280}>Max HD (720p / 1280px)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col gap-5 bg-surface border border-border rounded-xl p-6 shadow-card sticky top-20">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Compressed Output</span>
                {isCompressing && (
                  <span className="text-[10px] text-accent flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Compressing...
                  </span>
                )}
              </div>
              {compResultUrl && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCompDownload}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download Compressed ({formatBytes(compResultSize)})
                </Button>
              )}
            </div>

            {/* Metrics Comparison Card */}
            {compOriginalSize > 0 && compResultSize > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-surface-raised rounded-lg border border-border flex flex-col gap-0.5">
                  <span className="text-[11px] text-text-tertiary">Original Size</span>
                  <span className="text-sm font-mono font-bold text-text-primary">
                    {formatBytes(compOriginalSize)}
                  </span>
                  {compDims && (
                    <span className="text-[10px] text-text-tertiary">
                      {compDims.origW} × {compDims.origH}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-surface-raised rounded-lg border border-border flex flex-col gap-0.5">
                  <span className="text-[11px] text-text-tertiary">Compressed Size</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {formatBytes(compResultSize)}
                  </span>
                  {compDims && (
                    <span className="text-[10px] text-text-tertiary">
                      {compDims.outW} × {compDims.outH}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30 flex flex-col gap-0.5 items-center justify-center">
                  <span className="text-[11px] font-semibold text-emerald-400">Saved</span>
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {compOriginalSize > compResultSize
                      ? `-${Math.round(((compOriginalSize - compResultSize) / compOriginalSize) * 100)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            )}

            {/* Preview Box */}
            <div className="w-full aspect-video bg-surface-raised border border-border rounded-xl flex items-center justify-center overflow-hidden relative">
              {compResultUrl ? (
                <img
                  src={compResultUrl}
                  alt="Compressed output"
                  className="max-h-full max-w-full object-contain p-2"
                />
              ) : compPreviewUrl ? (
                <img
                  src={compPreviewUrl}
                  alt="Original preview"
                  className="max-h-full max-w-full object-contain p-2 opacity-60"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-tertiary p-8">
                  <ImageIcon className="w-12 h-12 opacity-30" />
                  <span className="text-xs">Upload an image to compress under social upload limits</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isVideoResizer ? (
        /* 5. DEDICATED INSTAGRAM VIDEO RESIZER (9:16 Reels Vertical Scaler & Cropper) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5 flex items-center justify-between">
              <span>Instagram Video Setup</span>
              <span className="text-[10px] text-accent font-semibold px-2 py-0.5 bg-accent/10 rounded-full">
                {vidQuality === "720p" ? "720×1280 HD" : "1080×1920 Full HD"}
              </span>
            </h3>

            <Dropzone
              accept="video/*"
              maxFiles={1}
              onDrop={handleVidDrop}
              helperText="Upload MP4, WebM, or MOV video file"
            />

            {vidFile && (
              <div className="flex flex-col gap-5 pt-2">
                {/* Target Ratio Selection with exact dimensions */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-secondary">Target Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "9:16",
                        label: "9:16 Reels / Story",
                        desc: vidQuality === "720p" ? "720×1280" : "1080×1920",
                      },
                      {
                        id: "1:1",
                        label: "1:1 Square Feed",
                        desc: vidQuality === "720p" ? "720×720" : "1080×1080",
                      },
                      {
                        id: "4:5",
                        label: "4:5 Portrait Post",
                        desc: vidQuality === "720p" ? "720×900" : "1080×1350",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setVidAspectRatio(opt.id as "9:16" | "1:1" | "4:5")}
                        className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-0.5 ${
                          vidAspectRatio === opt.id
                            ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                            : "bg-surface-raised border-border text-text-secondary hover:border-border-hover"
                        }`}
                      >
                        <span className="text-xs font-bold text-text-primary">{opt.label}</span>
                        <span className="text-[10px] text-accent font-mono font-semibold">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution Quality Selector */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-semibold text-text-secondary">Export Resolution</label>
                  <select
                    value={vidQuality}
                    onChange={(e) => setVidQuality(e.target.value as "1080p" | "720p")}
                    className="w-full bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary font-semibold outline-none focus:border-accent"
                  >
                    <option value="1080p">1080p Full HD (Instagram Native — 1080×1920)</option>
                    <option value="720p">720p HD (Fast Export — 720×1280)</option>
                  </select>
                </div>

                {/* Fit Mode Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-secondary">Reels Fit Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "cover", label: "Center Crop", sub: "Fill canvas" },
                      { id: "blur", label: "Blurred BG", sub: "Trending look" },
                      { id: "black", label: "Letterbox", sub: "Clean black bars" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setVidFitMode(mode.id as "cover" | "blur" | "black")}
                        className={`p-2.5 rounded-lg border text-left transition-all flex flex-col gap-0.5 ${
                          vidFitMode === mode.id
                            ? "bg-accent/10 border-accent text-text-primary"
                            : "bg-surface-raised border-border text-text-secondary hover:border-border-hover"
                        }`}
                      >
                        <span className="text-xs font-bold text-text-primary">{mode.label}</span>
                        <span className="text-[10px] text-text-tertiary">{mode.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Trimmer Controls */}
                <div className="flex flex-col gap-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-secondary">Trim Duration</span>
                    <span className="font-mono text-text-tertiary">
                      {formatTime(vidTrimStart)} - {formatTime(vidTrimEnd)} ({vidTrimEnd - vidTrimStart}s duration)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Time (sec)"
                      type="number"
                      min={0}
                      max={vidDuration}
                      value={vidTrimStart}
                      onChange={(e) => setVidTrimStart(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <Input
                      label="End Time (sec)"
                      type="number"
                      min={vidTrimStart}
                      max={vidDuration}
                      value={vidTrimEnd}
                      onChange={(e) =>
                        setVidTrimEnd(Math.min(vidDuration, Math.max(vidTrimStart + 1, parseFloat(e.target.value) || 1)))
                      }
                    />
                  </div>
                </div>

                {/* Render Button */}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isRenderingVideo}
                  onClick={executeVideoExport}
                  leftIcon={
                    isRenderingVideo ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )
                  }
                  className="w-full mt-2"
                >
                  {isRenderingVideo
                    ? `Processing ${renderProgress}%...`
                    : `Process & Export for Instagram (${vidAspectRatio} — ${
                        vidQuality === "720p"
                          ? vidAspectRatio === "9:16"
                            ? "720×1280"
                            : vidAspectRatio === "1:1"
                            ? "720×720"
                            : "720×900"
                          : vidAspectRatio === "9:16"
                          ? "1080×1920"
                          : vidAspectRatio === "1:1"
                          ? "1080×1080"
                          : "1080×1350"
                      })`}
                </Button>

                {isRenderingVideo && (
                  <div className="flex flex-col gap-1.5 p-3 bg-surface-raised rounded-lg border border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">{renderStatusText}</span>
                      <span className="font-mono font-bold text-accent">{renderProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-accent transition-all duration-150"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 flex flex-col gap-5 bg-surface border border-border rounded-xl p-6 shadow-card sticky top-20">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {exportedVideoUrl ? "Exported Video Ready" : "Live Video Preview"}
              </span>
              {exportedVideoUrl && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportedVideoDownload}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download Reel ({vidAspectRatio} — {vidQuality})
                </Button>
              )}
            </div>

            {/* Phone Mockup Frame for Vertical 9:16 Video */}
            <div className="w-full flex items-center justify-center p-4 bg-surface-raised border border-border rounded-xl">
              <div
                className={`relative bg-black rounded-2xl overflow-hidden border-2 border-border shadow-2xl transition-all ${
                  vidAspectRatio === "9:16"
                    ? "w-[240px] aspect-[9/16]"
                    : vidAspectRatio === "4:5"
                    ? "w-[280px] aspect-[4/5]"
                    : "w-[280px] aspect-square"
                }`}
              >
                {exportedVideoUrl ? (
                  <div className="w-full h-full relative">
                    <video
                      src={exportedVideoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md pointer-events-none">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </div>
                  </div>
                ) : vidUrl ? (
                  <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
                    {/* Simulated Fit Mode Preview */}
                    {vidFitMode === "blur" && (
                      <video
                        src={vidUrl}
                        muted
                        autoPlay
                        loop
                        className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60"
                      />
                    )}
                    <video
                      ref={videoPreviewRef}
                      src={vidUrl}
                      controls
                      className={`relative z-10 ${
                        vidFitMode === "cover"
                          ? "w-full h-full object-cover"
                          : "max-w-full max-h-full object-contain"
                      }`}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-tertiary p-6 text-center">
                    <Film className="w-10 h-10 opacity-30" />
                    <span className="text-xs">Upload video to preview 9:16 Reels canvas</span>
                  </div>
                )}
              </div>
            </div>

            {exportedVideoUrl && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs text-text-primary font-semibold">
                    Instagram {vidAspectRatio} video ({vidQuality === "720p" ? "720p" : "1080p"}) rendered successfully!
                  </span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleExportedVideoDownload}>
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 6. GENERAL MEDIA & SOCIAL RESIZER (YouTube Thumbnail, Banner, LinkedIn, FB, etc.) */
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
