"use client";

import React, { useState, useRef, useEffect } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  Video,
  Music,
  Scissors,
  Download,
  Check,
  ShieldCheck,
  Sparkles,
  Play,
  Pause,
  Copy,
  Film,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Repeat,
  FileText,
  Clock,
  Layers,
  Crop,
  Trash2,
} from "lucide-react";
import {
  processVideoClientSide,
  convertVideoToAnimatedGif,
  decodeMediaFileToAudioBuffer,
  encodeAudioBufferToWav,
  trimAudioBuffer,
  compressAudioBuffer,
  convertSrtToVtt,
  convertVttToSrt,
} from "@/lib/video-audio-engine";

export interface VideoAudioStudioViewProps {
  tool: ToolMeta;
}

export const VideoAudioStudioView: React.FC<VideoAudioStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Tool Identifiers
  const isVideoCompressor = slug === "video-compressor";
  const isVideoResizer = slug === "video-resizer" || slug.includes("video-resizer");
  const isVideoCropper = slug === "video-cropper";
  const isVideoTrimmer = slug === "video-trimmer";
  const isVideoToGif = slug === "video-to-gif";
  const isGifToVideo = slug === "gif-to-video";
  const isVideoToMp3 = slug === "video-to-mp3";
  const isAudioCompressor = slug === "audio-compressor";
  const isAudioConverter = slug === "audio-converter";
  const isAudioTrimmer = slug === "audio-trimmer";
  const isSrtToVtt = slug === "srt-to-vtt";
  const isVttToSrt = slug === "vtt-to-srt";
  const isSubtitleTool = isSrtToVtt || isVttToSrt;

  // Common States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Result Output States
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [resultType, setResultType] = useState<"video" | "audio" | "gif" | "subtitle">("video");
  const [resultSize, setResultSize] = useState<number>(0);

  // Video / Audio Metadata
  const [duration, setDuration] = useState<number>(0);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Video Controls States
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(10);
  const [videoBitrate, setVideoBitrate] = useState<number>(1500000);
  const [targetResolution, setTargetResolution] = useState<{ width: number; height: number }>({ width: 1280, height: 720 });
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "stretch">("contain");
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });

  // GIF States
  const [gifFps, setGifFps] = useState<number>(12);
  const [gifWidth, setGifWidth] = useState<number>(480);
  const [gifDuration, setGifDuration] = useState<number>(4);

  // Audio States
  const [targetSampleRate, setTargetSampleRate] = useState<number>(44100);
  const [isMono, setIsMono] = useState<boolean>(false);
  const [audioGain, setAudioGain] = useState<number>(1);
  const [targetAudioFormat, setTargetAudioFormat] = useState<"wav" | "mp3">("wav");

  // Subtitle States
  const [subSourceText, setSubSourceText] = useState<string>("");
  const [subConvertedText, setSubConvertedText] = useState<string>("");
  const [subCueCount, setSubCueCount] = useState<number>(0);
  const [copiedSubtitle, setCopiedSubtitle] = useState<boolean>(false);

  // Audio Waveform Canvas Ref & Video Player Ref
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // File Upload Handler
  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setResultBlob(null);
    setResultUrl("");
    setStatusMessage("");
    setProgressPercent(0);

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    // 1. If Video
    if (file.type.startsWith("video/")) {
      const tempVideo = document.createElement("video");
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        const d = tempVideo.duration || 10;
        setDuration(d);
        setTrimStart(0);
        setTrimEnd(Math.min(d, 10));
        setVideoDims({ width: tempVideo.videoWidth, height: tempVideo.videoHeight });

        if (isVideoResizer) {
          setTargetResolution({ width: tempVideo.videoWidth, height: tempVideo.videoHeight });
        }
      };
    }

    // 2. If Audio or Video for Audio Decoding
    if (file.type.startsWith("audio/") || isVideoToMp3 || isAudioCompressor || isAudioTrimmer || isAudioConverter) {
      try {
        const ab = await decodeMediaFileToAudioBuffer(file);
        setAudioBuffer(ab);
        setDuration(ab.duration);
        setTrimStart(0);
        setTrimEnd(Math.min(ab.duration, 15));
        drawAudioWaveform(ab);
      } catch (err) {
        console.warn("Audio decoding notice:", err);
      }
    }

    // 3. If Subtitle File
    if (isSubtitleTool || file.name.endsWith(".srt") || file.name.endsWith(".vtt")) {
      const text = await file.text();
      setSubSourceText(text);
      executeSubtitleConversion(text);
    }
  };

  // Draw Waveform on Canvas
  const drawAudioWaveform = (ab: AudioBuffer) => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = ab.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = "#11141f";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#38bdf8";
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  };

  useEffect(() => {
    if (audioBuffer) {
      drawAudioWaveform(audioBuffer);
    }
  }, [audioBuffer]);

  // Subtitle Conversion
  const executeSubtitleConversion = (input: string) => {
    if (isSrtToVtt) {
      const { vtt, cueCount } = convertSrtToVtt(input);
      setSubConvertedText(vtt);
      setSubCueCount(cueCount);
      const blob = new Blob([vtt], { type: "text/vtt" });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setResultType("subtitle");
    } else {
      const { srt, cueCount } = convertVttToSrt(input);
      setSubConvertedText(srt);
      setSubCueCount(cueCount);
      const blob = new Blob([srt], { type: "application/x-subrip" });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setResultType("subtitle");
    }
  };

  // Execute Main Processing Operation
  const handleExecuteOperation = async () => {
    if (!selectedFile && !subSourceText) return;
    setIsProcessing(true);
    setProgressPercent(0);
    setStatusMessage("Processing media client-side in browser...");

    try {
      if (isVideoCompressor) {
        // 1. VIDEO COMPRESSOR
        const res = await processVideoClientSide(selectedFile!, {
          videoBitrate,
          width: targetResolution.width,
          height: targetResolution.height,
          onProgress: setProgressPercent,
        });
        setResultBlob(res.blob);
        setResultUrl(res.url);
        setResultType("video");
        setResultSize(res.blob.size);
        const savedPct = Math.round(((selectedFile!.size - res.blob.size) / selectedFile!.size) * 100);
        setStatusMessage(
          `Compression complete! Video file size reduced by ${Math.max(0, savedPct)}% (${(res.blob.size / (1024 * 1024)).toFixed(2)} MB).`
        );
      } else if (isVideoResizer) {
        // 2. VIDEO RESIZER
        const res = await processVideoClientSide(selectedFile!, {
          width: targetResolution.width,
          height: targetResolution.height,
          fitMode,
          videoBitrate: 2500000,
          onProgress: setProgressPercent,
        });
        setResultBlob(res.blob);
        setResultUrl(res.url);
        setResultType("video");
        setResultSize(res.blob.size);
        setStatusMessage(`Resized video to ${res.width} × ${res.height} successfully.`);
      } else if (isVideoCropper) {
        // 3. VIDEO CROPPER
        const res = await processVideoClientSide(selectedFile!, {
          width: Math.round((videoDims.width || 1280) * cropRect.width),
          height: Math.round((videoDims.height || 720) * cropRect.height),
          cropBox: cropRect,
          onProgress: setProgressPercent,
        });
        setResultBlob(res.blob);
        setResultUrl(res.url);
        setResultType("video");
        setResultSize(res.blob.size);
        setStatusMessage(`Cropped video frame successfully.`);
      } else if (isVideoTrimmer) {
        // 4. VIDEO TRIMMER
        const res = await processVideoClientSide(selectedFile!, {
          trimStart,
          trimEnd,
          onProgress: setProgressPercent,
        });
        setResultBlob(res.blob);
        setResultUrl(res.url);
        setResultType("video");
        setResultSize(res.blob.size);
        setStatusMessage(`Trimmed clip from ${trimStart}s to ${trimEnd}s (${res.duration.toFixed(1)}s total).`);
      } else if (isVideoToGif) {
        // 5. VIDEO TO GIF
        const res = await convertVideoToAnimatedGif(selectedFile!, {
          startTime: trimStart,
          duration: Math.min(8, trimEnd - trimStart),
          fps: gifFps,
          width: gifWidth,
          onProgress: setProgressPercent,
        });
        setResultBlob(res.blob);
        setResultUrl(res.url);
        setResultType("gif");
        setResultSize(res.blob.size);
        setStatusMessage(`Generated animated GIF (${res.frameCount} frames, ${(res.blob.size / 1024).toFixed(0)} KB).`);
      } else if (isGifToVideo) {
        // 6. GIF TO VIDEO
        const res = await processVideoClientSide(selectedFile!, {
          videoBitrate: 3000000,
          onProgress: setProgressPercent,
        });
        setResultBlob(res.blob);
        setResultUrl(res.url);
        setResultType("video");
        setResultSize(res.blob.size);
        setStatusMessage(`Converted GIF into high-efficiency MP4/WebM video.`);
      } else if (isVideoToMp3) {
        // 7. VIDEO TO MP3 / AUDIO EXTRACT
        let ab = audioBuffer;
        if (!ab) {
          ab = await decodeMediaFileToAudioBuffer(selectedFile!);
          setAudioBuffer(ab);
        }
        const wavBlob = encodeAudioBufferToWav(ab);
        setResultBlob(wavBlob);
        setResultUrl(URL.createObjectURL(wavBlob));
        setResultType("audio");
        setResultSize(wavBlob.size);
        setStatusMessage(`Extracted crisp audio track (${(wavBlob.size / (1024 * 1024)).toFixed(2)} MB WAV).`);
      } else if (isAudioCompressor) {
        // 8. AUDIO COMPRESSOR
        let ab = audioBuffer;
        if (!ab) {
          ab = await decodeMediaFileToAudioBuffer(selectedFile!);
          setAudioBuffer(ab);
        }
        const compressedAb = await compressAudioBuffer(ab, {
          targetSampleRate,
          forceMono: isMono,
          gain: audioGain,
        });
        const wavBlob = encodeAudioBufferToWav(compressedAb);
        setResultBlob(wavBlob);
        setResultUrl(URL.createObjectURL(wavBlob));
        setResultType("audio");
        setResultSize(wavBlob.size);
        const savedPct = Math.round(((selectedFile!.size - wavBlob.size) / selectedFile!.size) * 100);
        setStatusMessage(`Audio compression complete! (${(wavBlob.size / 1024).toFixed(0)} KB).`);
      } else if (isAudioConverter) {
        // 9. AUDIO CONVERTER
        let ab = audioBuffer;
        if (!ab) {
          ab = await decodeMediaFileToAudioBuffer(selectedFile!);
          setAudioBuffer(ab);
        }
        const resampledAb = await compressAudioBuffer(ab, {
          targetSampleRate,
          forceMono: isMono,
        });
        const wavBlob = encodeAudioBufferToWav(resampledAb);
        setResultBlob(wavBlob);
        setResultUrl(URL.createObjectURL(wavBlob));
        setResultType("audio");
        setResultSize(wavBlob.size);
        setStatusMessage(`Converted audio to high-fidelity ${targetAudioFormat.toUpperCase()} format.`);
      } else if (isAudioTrimmer) {
        // 10. AUDIO TRIMMER
        let ab = audioBuffer;
        if (!ab) {
          ab = await decodeMediaFileToAudioBuffer(selectedFile!);
          setAudioBuffer(ab);
        }
        const trimmedAb = await trimAudioBuffer(ab, trimStart, trimEnd);
        const wavBlob = encodeAudioBufferToWav(trimmedAb);
        setResultBlob(wavBlob);
        setResultUrl(URL.createObjectURL(wavBlob));
        setResultType("audio");
        setResultSize(wavBlob.size);
        setStatusMessage(`Trimmed audio from ${trimStart.toFixed(1)}s to ${trimEnd.toFixed(1)}s.`);
      } else if (isSubtitleTool) {
        // 11. SUBTITLE CONVERTER
        executeSubtitleConversion(subSourceText);
        setStatusMessage(`Converted ${subCueCount} subtitle cues successfully.`);
      }
    } catch (err: any) {
      console.error("Operation error:", err);
      setStatusMessage(`Error: ${err.message || "Failed to process media"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    let ext = "mp4";
    if (resultType === "audio") ext = "wav";
    if (resultType === "gif") ext = "gif";
    if (resultType === "subtitle") ext = isSrtToVtt ? "vtt" : "srt";
    a.download = `toolverse-${tool.slug}-result.${ext}`;
    a.click();
  };

  const playTrimmedRegionPreview = () => {
    const video = videoPlayerRef.current;
    if (!video) return;
    video.currentTime = trimStart;
    video.play();
    const interval = setInterval(() => {
      if (video.currentTime >= trimEnd) {
        video.pause();
        clearInterval(interval);
      }
    }, 100);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {isSubtitleTool ? (
        /* ================= SUBTITLE CONVERTER STUDIO ================= */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Source Subtitles ({isSrtToVtt ? "SubRip .SRT" : "WebVTT .VTT"})
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Client-Side
              </span>
            </div>

            <Dropzone
              accept=".srt,.vtt,text/plain"
              maxFiles={1}
              onDrop={handleDrop}
              helperText={`Drop your ${isSrtToVtt ? ".SRT" : ".VTT"} subtitle file or paste text below`}
            />

            <textarea
              rows={12}
              value={subSourceText}
              onChange={(e) => {
                setSubSourceText(e.target.value);
                executeSubtitleConversion(e.target.value);
              }}
              className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-xs text-text-primary outline-none focus:border-accent"
              placeholder={
                isSrtToVtt
                  ? "1\n00:00:01,000 --> 00:00:04,000\nHello and welcome to ToolVerse!\n\n2\n00:00:04,500 --> 00:00:08,000\nEnjoy 100% free client-side tools."
                  : "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello and welcome to ToolVerse!"
              }
            />
          </div>

          <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Converted Output ({isSrtToVtt ? "WebVTT .VTT" : "SubRip .SRT"})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(subConvertedText);
                    setCopiedSubtitle(true);
                    setTimeout(() => setCopiedSubtitle(false), 2000);
                  }}
                  leftIcon={copiedSubtitle ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedSubtitle ? "Copied" : "Copy"}
                </Button>
                {resultUrl && (
                  <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="w-3.5 h-3.5" />}>
                    Download
                  </Button>
                )}
              </div>
            </div>

            <textarea
              readOnly
              rows={15}
              value={subConvertedText}
              className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-xs text-emerald-400 outline-none"
              placeholder="Converted subtitle stream will appear here in real time..."
            />

            {subCueCount > 0 && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                <span className="text-text-primary font-medium">Valid Cues Detected:</span>
                <span className="font-bold text-emerald-400">{subCueCount} Cues</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= VIDEO & AUDIO STUDIO ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Configuration Controls */}
          <div className="lg:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                {slug.includes("audio") || isVideoToMp3 ? <Music className="w-4 h-4 text-accent" /> : <Video className="w-4 h-4 text-accent" />}
                Configure {tool.name}
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Client-Side
              </span>
            </div>

            {/* Media Upload Dropzone */}
            <Dropzone
              accept={
                slug.includes("audio") || isVideoToMp3
                  ? "audio/*,video/*,.mp3,.wav,.ogg,.aac,.flac,.m4a,.mp4,.webm,.mov"
                  : isGifToVideo
                  ? "image/gif,.gif"
                  : "video/*,image/gif,.mp4,.webm,.mov,.mkv,.avi,.gif"
              }
              maxFiles={1}
              onDrop={handleDrop}
              helperText={
                slug.includes("audio")
                  ? "Upload any MP3, WAV, AAC, or video file to process audio"
                  : isGifToVideo
                  ? "Upload animated GIF file to convert to MP4/WebM video"
                  : "Upload MP4, WebM, MOV, or MKV video"
              }
            />

            {/* Selected File Details */}
            {selectedFile && (
              <div className="p-3 bg-surface-raised rounded-lg border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  {selectedFile.type.startsWith("audio/") ? (
                    <Music className="w-4 h-4 text-accent shrink-0" />
                  ) : (
                    <Video className="w-4 h-4 text-accent shrink-0" />
                  )}
                  <span className="truncate font-medium text-text-primary">{selectedFile.name}</span>
                  <span className="text-[10px] text-text-tertiary">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileUrl("");
                    setResultBlob(null);
                    setResultUrl("");
                  }}
                  className="p-1 hover:text-rose-400 text-text-tertiary transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 1. VIDEO COMPRESSOR CONTROLS */}
            {isVideoCompressor && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Target Compression Preset
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Fast 720p", bitrate: 1500000, w: 1280, h: 720 },
                    { label: "Max 480p", bitrate: 800000, w: 854, h: 480 },
                    { label: "Tiny 360p", bitrate: 400000, w: 640, h: 360 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setVideoBitrate(p.bitrate);
                        setTargetResolution({ width: p.w, height: p.h });
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-colors ${
                        videoBitrate === p.bitrate
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Slider
                  label="Target Video Bitrate"
                  min={200000}
                  max={4000000}
                  step={100000}
                  value={videoBitrate}
                  unit=" bps"
                  onChangeValue={(v) => setVideoBitrate(v)}
                />
              </div>
            )}

            {/* 2. VIDEO RESIZER CONTROLS */}
            {isVideoResizer && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Target Resolution Preset
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Full HD 1080p (16:9)", w: 1920, h: 1080 },
                    { label: "HD 720p (16:9)", w: 1280, h: 720 },
                    { label: "Shorts / Reels (9:16)", w: 1080, h: 1920 },
                    { label: "Square 1:1 (1080x1080)", w: 1080, h: 1080 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setTargetResolution({ width: item.w, height: item.h })}
                      className={`p-2 rounded-lg border text-xs font-semibold text-left transition-colors ${
                        targetResolution.width === item.w && targetResolution.height === item.h
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["contain", "cover", "stretch"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFitMode(m)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                        fitMode === m
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. VIDEO CROPPER CONTROLS */}
            {isVideoCropper && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Crop Boundary Rectangles
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <Slider
                    label="Crop Width"
                    min={20}
                    max={100}
                    step={5}
                    value={Math.round(cropRect.width * 100)}
                    unit="%"
                    onChangeValue={(v) => setCropRect({ ...cropRect, width: v / 100 })}
                  />
                  <Slider
                    label="Crop Height"
                    min={20}
                    max={100}
                    step={5}
                    value={Math.round(cropRect.height * 100)}
                    unit="%"
                    onChangeValue={(v) => setCropRect({ ...cropRect, height: v / 100 })}
                  />
                  <Slider
                    label="Offset X"
                    min={0}
                    max={50}
                    step={5}
                    value={Math.round(cropRect.x * 100)}
                    unit="%"
                    onChangeValue={(v) => setCropRect({ ...cropRect, x: v / 100 })}
                  />
                  <Slider
                    label="Offset Y"
                    min={0}
                    max={50}
                    step={5}
                    value={Math.round(cropRect.y * 100)}
                    unit="%"
                    onChangeValue={(v) => setCropRect({ ...cropRect, y: v / 100 })}
                  />
                </div>
              </div>
            )}

            {/* 4. VIDEO & AUDIO TRIMMER CONTROLS */}
            {(isVideoTrimmer || isAudioTrimmer || isVideoToGif) && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Trim Duration (Total: {duration.toFixed(1)}s)
                  </span>
                  {isVideoTrimmer && (
                    <button
                      type="button"
                      onClick={playTrimmedRegionPreview}
                      className="text-accent hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Preview Region
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Time (sec)"
                    type="number"
                    step="0.5"
                    value={trimStart}
                    onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="End Time (sec)"
                    type="number"
                    step="0.5"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 10)}
                  />
                </div>
              </div>
            )}

            {/* 5. VIDEO TO GIF CONTROLS */}
            {isVideoToGif && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  GIF Quality & Dimensions
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 15, 20].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setGifFps(f)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        gifFps === f
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
                <Slider
                  label="GIF Width"
                  min={240}
                  max={640}
                  step={40}
                  value={gifWidth}
                  unit="px"
                  onChangeValue={(v) => setGifWidth(v)}
                />
              </div>
            )}

            {/* 6. AUDIO COMPRESSOR & CONVERTER CONTROLS */}
            {(isAudioCompressor || isAudioConverter || isVideoToMp3) && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Audio Output Settings
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "44.1 kHz", rate: 44100 },
                    { label: "32 kHz", rate: 32000 },
                    { label: "22.05 kHz", rate: 22050 },
                  ].map((item) => (
                    <button
                      key={item.rate}
                      type="button"
                      onClick={() => setTargetSampleRate(item.rate)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        targetSampleRate === item.rate
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="text-text-secondary font-medium">Downmix to Mono:</label>
                  <input
                    type="checkbox"
                    checked={isMono}
                    onChange={(e) => setIsMono(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                </div>
              </div>
            )}

            {/* Progress Meter during Active Processing */}
            {isProcessing && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">Processing Progress</span>
                  <span className="font-mono text-accent">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-accent transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Execute Action Button */}
            <Button
              variant="primary"
              size="lg"
              disabled={!selectedFile || isProcessing}
              onClick={handleExecuteOperation}
              leftIcon={
                isProcessing ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : slug.includes("trimmer") ? (
                  <Scissors className="w-4 h-4" />
                ) : slug.includes("compressor") ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {isProcessing ? `Processing (${progressPercent}%)...` : `Execute ${tool.name}`}
            </Button>

            {statusMessage && (
              <p className="text-xs text-text-secondary bg-surface-raised p-3 rounded-lg border border-border leading-relaxed">
                {statusMessage}
              </p>
            )}
          </div>

          {/* Right Column: Live Media Player & Processed Output */}
          <div className="lg:col-span-7 flex flex-col gap-5 bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-card lg:sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Media Player & Live Output
              </h3>
              {resultUrl && (
                <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
                  Download {resultType === "audio" ? "Audio (.wav)" : resultType === "gif" ? "GIF" : "Video"}
                </Button>
              )}
            </div>

            {/* Active Output Player */}
            {resultUrl ? (
              <div className="flex flex-col gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-text-primary">Processed Result Ready</span>
                  </div>
                  {resultSize > 0 && (
                    <span className="font-mono text-emerald-400">
                      {(resultSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>

                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-border">
                  {resultType === "video" ? (
                    <video src={resultUrl} controls className="max-h-full max-w-full" />
                  ) : resultType === "gif" ? (
                    <img src={resultUrl} alt="Processed Animated GIF" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 p-8 w-full max-w-md">
                      <Volume2 className="w-12 h-12 text-accent animate-pulse" />
                      <audio src={resultUrl} controls className="w-full" />
                    </div>
                  )}
                </div>
              </div>
            ) : fileUrl ? (
              /* Uploaded Source Preview Player */
              <div className="flex flex-col gap-4">
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-border relative">
                  {selectedFile?.type.startsWith("video/") ? (
                    <video ref={videoPlayerRef} src={fileUrl} controls className="max-h-full max-w-full" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 p-8 w-full max-w-md">
                      <Volume2 className="w-12 h-12 text-accent" />
                      <audio src={fileUrl} controls className="w-full" />
                    </div>
                  )}
                </div>

                {/* Audio Waveform Canvas */}
                {audioBuffer && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-text-secondary">Audio Waveform:</span>
                    <canvas
                      ref={waveformCanvasRef}
                      width={600}
                      height={75}
                      className="w-full h-20 rounded-lg border border-border bg-[#11141f]"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[360px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl text-text-tertiary">
                <Video className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium text-text-secondary">No Media Loaded</p>
                <p className="text-xs max-w-sm mt-1">
                  Upload your video or audio file on the left to configure settings, preview in real time, and process completely in-browser.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
