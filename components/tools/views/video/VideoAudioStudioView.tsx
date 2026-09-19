"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../../ToolHeader";
import { Dropzone, type FileRejection } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../../SEOContent";
import { RelatedTools } from "../../RelatedTools";
import {
  Video,
  Music,
  Scissors,
  Download,
  Check,
  ShieldCheck,
  Sparkles,
  Play,
  Minimize2,
  Volume2,
  Copy,
  FileText,
  Trash2,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getToolConfig } from "@/lib/ffmpeg/tool-config";
import { isWebAssemblySupported } from "@/lib/ffmpeg/ffmpeg-client";
import { useMediaProcessor } from "./useMediaProcessor";
import {
  compressVideo,
  resizeVideo,
  cropVideo,
  trimVideo,
  videoToGif,
  gifToVideo,
  videoToMp3,
  compressAudio,
  convertAudio,
  trimAudio,
  type AudioOutputFormat,
} from "@/lib/ffmpeg/media-ops";
import {
  convertSrtToVtt,
  convertVttToSrt,
  decodeMediaFileToAudioBuffer,
  readSubtitleFile,
  SubtitleCue,
} from "@/lib/video-audio-engine";

// Per-tool control components
import { VideoCompressorControls } from "./controls/VideoCompressorControls";
import { VideoResizerControls } from "./controls/VideoResizerControls";
import { VideoCropperControls } from "./controls/VideoCropperControls";
import { VisualVideoCropper } from "./controls/VisualVideoCropper";
import { VideoTrimmerControls } from "./controls/VideoTrimmerControls";
import { VisualVideoTrimmer } from "./controls/VisualVideoTrimmer";
import { VideoToGifControls } from "./controls/VideoToGifControls";
import { GifToVideoControls } from "./controls/GifToVideoControls";
import { VideoToMp3Controls } from "./controls/VideoToMp3Controls";
import { AudioCompressorControls } from "./controls/AudioCompressorControls";
import { AudioConverterControls } from "./controls/AudioConverterControls";
import { AudioTrimmerControls } from "./controls/AudioTrimmerControls";
import { VisualAudioTrimmer } from "./controls/VisualAudioTrimmer";
import { SubtitleStudioPanel } from "./controls/SubtitleStudioPanel";

export interface VideoAudioStudioViewProps {
  tool: ToolMeta;
}

export const VideoAudioStudioView: React.FC<VideoAudioStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;
  const config = getToolConfig(slug);
  const isSubtitleTool = slug === "srt-to-vtt" || slug === "vtt-to-srt";

  // Processor hook
  const processor = useMediaProcessor();

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileError, setFileError] = useState<string>("");

  // Media metadata
  const [duration, setDuration] = useState<number>(0);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Status
  const [statusMessage, setStatusMessage] = useState<string>("");

  // --- Video Compressor state ---
  const [crf, setCrf] = useState(28);
  const [compressorWidth, setCompressorWidth] = useState(0);
  const [compressorHeight, setCompressorHeight] = useState(0);

  // --- Video Resizer state ---
  const [targetWidth, setTargetWidth] = useState(1280);
  const [targetHeight, setTargetHeight] = useState(720);
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "stretch">("contain");

  // --- Video Cropper state ---
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [aspectLock, setAspectLock] = useState("free");

  // --- Video Trimmer state ---
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [preciseCut, setPreciseCut] = useState(false);

  // --- Video to GIF state ---
  const [gifStartTime, setGifStartTime] = useState(0);
  const [gifDuration, setGifDuration] = useState(0); // 0 indicates full video duration until loaded
  const [gifFps, setGifFps] = useState(12);
  const [gifWidth, setGifWidth] = useState(480);
  const [dithering, setDithering] = useState(true);

  // --- GIF to Video state ---
  const [loopCount, setLoopCount] = useState(1);
  const [gifCrf, setGifCrf] = useState(23);

  // --- Video to MP3 state ---
  const [mp3Bitrate, setMp3Bitrate] = useState("192k");
  const [mp3SampleRate, setMp3SampleRate] = useState(44100);
  const [mp3Channels, setMp3Channels] = useState(2);
  const [mp3OutputFormat, setMp3OutputFormat] = useState<"mp3" | "m4a">("mp3");

  // --- Audio Compressor state ---
  const [acBitrate, setAcBitrate] = useState("128k");
  const [acSampleRate, setAcSampleRate] = useState(44100);
  const [acChannels, setAcChannels] = useState(2);
  const [acNormalize, setAcNormalize] = useState(false);

  // --- Audio Converter state ---
  const [convFormat, setConvFormat] = useState<AudioOutputFormat>("mp3");
  const [convBitrate, setConvBitrate] = useState("192k");
  const [convSampleRate, setConvSampleRate] = useState(44100);
  const [convChannels, setConvChannels] = useState(2);

  // --- Audio Trimmer state ---
  const [atFadeIn, setAtFadeIn] = useState(0);
  const [atFadeOut, setAtFadeOut] = useState(0);

  // --- Subtitle state ---
  const [subSourceText, setSubSourceText] = useState<string>("");
  const [subConvertedText, setSubConvertedText] = useState<string>("");
  const [subCueCount, setSubCueCount] = useState<number>(0);
  const [subCues, setSubCues] = useState<SubtitleCue[]>([]);
  const [subTotalDuration, setSubTotalDuration] = useState<number>(0);
  const [subWarnings, setSubWarnings] = useState<string[]>([]);
  const [subOffsetMs, setSubOffsetMs] = useState<number>(0);
  const [subStripFormatting, setSubStripFormatting] = useState<boolean>(false);
  const [subIncludeCueNumbers, setSubIncludeCueNumbers] = useState<boolean>(true);
  const [subResultBlob, setSubResultBlob] = useState<Blob | null>(null);
  const [subResultUrl, setSubResultUrl] = useState<string>("");

  const [resultAudioBuffer, setResultAudioBuffer] = useState<AudioBuffer | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resultWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const prevFileUrlRef = useRef<string>("");

  // Cleanup file URLs on change
  useEffect(() => {
    return () => {
      if (prevFileUrlRef.current) {
        URL.revokeObjectURL(prevFileUrlRef.current);
      }
    };
  }, []);

  // Draw waveform
  const drawAudioWaveform = useCallback((ab: AudioBuffer, targetCanvas?: HTMLCanvasElement | null) => {
    const canvas = targetCanvas || waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const data = ab.getChannelData(0);
    const step = Math.ceil(data.length / w);
    const centerY = h / 2;

    ctx.fillStyle = "#0c0f17";
    ctx.fillRect(0, 0, w, h);

    // Subtle center baseline
    ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    for (let i = 0; i < w; i++) {
      let peak = 0;
      const start = i * step;
      const end = Math.min(start + step, data.length);
      for (let j = start; j < end; j++) {
        const val = Math.abs(data[j] || 0);
        if (val > peak) peak = val;
      }
      const barHeight = Math.max(2, peak * (h - 8));
      const y = centerY - barHeight / 2;
      ctx.fillRect(i, y, 1.2, barHeight);
    }
  }, []);

  useEffect(() => {
    if (audioBuffer && waveformCanvasRef.current) {
      drawAudioWaveform(audioBuffer, waveformCanvasRef.current);
    }
  }, [audioBuffer, drawAudioWaveform]);

  // Decode result audio for waveform when complete
  useEffect(() => {
    if (processor.result && processor.result.blob.type.startsWith("audio/")) {
      decodeMediaFileToAudioBuffer(processor.result.blob)
        .then((ab) => {
          setResultAudioBuffer(ab);
          if (resultWaveformCanvasRef.current) {
            drawAudioWaveform(ab, resultWaveformCanvasRef.current);
          }
        })
        .catch(() => setResultAudioBuffer(null));
    } else {
      setResultAudioBuffer(null);
    }
  }, [processor.result, drawAudioWaveform]);

  // File upload handler
  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];

    // Revoke previous URL
    if (prevFileUrlRef.current) {
      URL.revokeObjectURL(prevFileUrlRef.current);
    }

    setSelectedFile(file);
    setFileError("");
    setStatusMessage("");
    processor.reset();

    const url = URL.createObjectURL(file);
    setFileUrl(url);
    prevFileUrlRef.current = url;

    // Probe media metadata
    if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setVideoDims({ width: img.naturalWidth, height: img.naturalHeight });
      };
    } else if (file.type.startsWith("video/")) {
      const tempVideo = document.createElement("video");
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        const d = tempVideo.duration || 0;
        setDuration(d);
        setTrimStart(0);
        setTrimEnd(d); // Default to FULL duration, not 10s
        setVideoDims({ width: tempVideo.videoWidth, height: tempVideo.videoHeight });

        // Initialize cropper with full frame
        setCropX(0);
        setCropY(0);
        setCropWidth(tempVideo.videoWidth);
        setCropHeight(tempVideo.videoHeight);

        // Initialize compressor resolution
        setCompressorWidth(tempVideo.videoWidth);
        setCompressorHeight(tempVideo.videoHeight);

        // Initialize Video to GIF to full video length by default
        setGifStartTime(0);
        setGifDuration(d);

        // Initialize resizer
        if (slug === "video-resizer") {
          setTargetWidth(tempVideo.videoWidth);
          setTargetHeight(tempVideo.videoHeight);
        }
      };
    } else {
      // Audio file probe via HTMLAudioElement for duration reliability
      const tempAudio = document.createElement("audio");
      tempAudio.src = url;
      tempAudio.onloadedmetadata = () => {
        const d = tempAudio.duration || 0;
        if (d > 0 && isFinite(d)) {
          setDuration(d);
          setTrimStart(0);
          setTrimEnd(d);
        }
      };
    }

    // Decode audio for waveform (audio tools only)
    if (config?.showWaveform || file.type.startsWith("audio/") || slug.startsWith("audio-") || slug === "video-to-mp3") {
      try {
        const ab = await decodeMediaFileToAudioBuffer(file);
        setAudioBuffer(ab);
        if (!file.type.startsWith("video/") && ab.duration > 0) {
          setDuration(ab.duration);
          setTrimStart(0);
          setTrimEnd(ab.duration); // Full duration
        }
      } catch (err) {
        console.warn("Audio decoding notice:", err);
      }
    }

    // Subtitle auto-convert
    if (isSubtitleTool) {
      try {
        const text = await readSubtitleFile(file);
        setSubSourceText(text);
        executeSubtitleConversion(text, subOffsetMs, subStripFormatting, subIncludeCueNumbers);
        setStatusMessage(`Loaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
      } catch (err: any) {
        setFileError(`Failed to read subtitle file: ${err?.message || "Unknown error"}`);
      }
    }
  };

  const handleReject = (rejections: FileRejection[]) => {
    setFileError(rejections.map((r) => r.reason).join(" "));
  };

  // Subtitle conversion
  const executeSubtitleConversion = useCallback(
    (
      input: string,
      offset: number = subOffsetMs,
      strip: boolean = subStripFormatting,
      includeNums: boolean = subIncludeCueNumbers
    ) => {
      if (!input.trim()) {
        setSubConvertedText("");
        setSubCueCount(0);
        setSubCues([]);
        setSubTotalDuration(0);
        setSubWarnings([]);
        if (subResultUrl) {
          URL.revokeObjectURL(subResultUrl);
          setSubResultUrl("");
        }
        setSubResultBlob(null);
        return;
      }

      if (slug === "srt-to-vtt") {
        const { output, cueCount, cues, totalDurationSec, warnings } = convertSrtToVtt(input, {
          timeOffsetMs: offset,
          stripFormatting: strip,
          includeCueNumbers: includeNums,
        });
        setSubConvertedText(output);
        setSubCueCount(cueCount);
        setSubCues(cues);
        setSubTotalDuration(totalDurationSec);
        setSubWarnings(warnings);
        if (subResultUrl) URL.revokeObjectURL(subResultUrl);
        const blob = new Blob([output], { type: "text/vtt;charset=utf-8" });
        setSubResultBlob(blob);
        setSubResultUrl(URL.createObjectURL(blob));
      } else {
        const { output, cueCount, cues, totalDurationSec, warnings } = convertVttToSrt(input, {
          timeOffsetMs: offset,
          stripFormatting: strip,
        });
        setSubConvertedText(output);
        setSubCueCount(cueCount);
        setSubCues(cues);
        setSubTotalDuration(totalDurationSec);
        setSubWarnings(warnings);
        if (subResultUrl) URL.revokeObjectURL(subResultUrl);
        const blob = new Blob([output], { type: "application/x-subrip;charset=utf-8" });
        setSubResultBlob(blob);
        setSubResultUrl(URL.createObjectURL(blob));
      }
    },
    [slug, subOffsetMs, subStripFormatting, subIncludeCueNumbers, subResultUrl]
  );

  const handleOffsetChange = (newOffset: number) => {
    setSubOffsetMs(newOffset);
    if (subSourceText) {
      executeSubtitleConversion(subSourceText, newOffset, subStripFormatting, subIncludeCueNumbers);
    }
  };

  const handleStripFormattingChange = (strip: boolean) => {
    setSubStripFormatting(strip);
    if (subSourceText) {
      executeSubtitleConversion(subSourceText, subOffsetMs, strip, subIncludeCueNumbers);
    }
  };

  const handleIncludeCueNumbersChange = (include: boolean) => {
    setSubIncludeCueNumbers(include);
    if (subSourceText) {
      executeSubtitleConversion(subSourceText, subOffsetMs, subStripFormatting, include);
    }
  };

  const handleSourceTextChange = (text: string) => {
    setSubSourceText(text);
    executeSubtitleConversion(text, subOffsetMs, subStripFormatting, subIncludeCueNumbers);
  };

  const handleLoadSampleSubtitles = () => {
    if (slug === "srt-to-vtt") {
      const sampleSrt = `1
00:00:01,200 --> 00:00:04,500
Welcome to ToolVerse Subtitle Studio!

2
00:00:05,000 --> 00:00:08,800
This tool converts SubRip (.srt) into standard WebVTT (.vtt) format.

3
00:00:09,100 --> 00:00:13,400
It supports <i>italics</i>, <b>bold</b>, <font color="#f59e0b">colored text</font>, and multi-line cues.

4
00:00:14,000 --> 00:00:18,500
All processing runs 100% in your browser for total privacy and zero delay.`;
      setSubSourceText(sampleSrt);
      setSelectedFile(null);
      executeSubtitleConversion(sampleSrt, subOffsetMs, subStripFormatting, subIncludeCueNumbers);
      setStatusMessage("Loaded sample SRT subtitles.");
    } else {
      const sampleVtt = `WEBVTT

1
00:00:01.200 --> 00:00:04.500
Welcome to ToolVerse Subtitle Studio!

2
00:00:05.000 --> 00:00:08.800
This tool converts WebVTT (.vtt) into standard SubRip (.srt) format.

3
00:00:09.100 --> 00:00:13.400
<v Narrator>HTML5 video captions are converted with exact millisecond precision.</v>

4
00:00:14.000 --> 00:00:18.500
Enjoy fast, private, and client-side subtitle processing!`;
      setSubSourceText(sampleVtt);
      setSelectedFile(null);
      executeSubtitleConversion(sampleVtt, subOffsetMs, subStripFormatting, subIncludeCueNumbers);
      setStatusMessage("Loaded sample WebVTT subtitles.");
    }
  };

  const handleClearSubtitles = () => {
    setSubSourceText("");
    setSubConvertedText("");
    setSubCueCount(0);
    setSubCues([]);
    setSubTotalDuration(0);
    setSubWarnings([]);
    setSelectedFile(null);
    setFileError("");
    setStatusMessage("");
    if (subResultUrl) {
      URL.revokeObjectURL(subResultUrl);
      setSubResultUrl("");
    }
    setSubResultBlob(null);
  };

  // Execute operation
  const handleExecuteOperation = async () => {
    if (!selectedFile && !subSourceText) return;

    if (isSubtitleTool) {
      executeSubtitleConversion(subSourceText);
      setStatusMessage(`Converted ${subCueCount} subtitle cues successfully.`);
      return;
    }

    if (!selectedFile) return;

    const file = selectedFile;
    const progressCallback = (p: { ratio: number }) => {
      processor.processProgress; // trigger re-render
    };

    setStatusMessage("Processing...");

    await processor.execute(async ({ onProcessProgress, onDownloadProgress }) => {
      switch (slug) {
        case "video-trimmer":
          return trimVideo(file, {
            startTime: trimStart,
            endTime: trimEnd,
            preciseCut,
            onProcessProgress,
            onDownloadProgress,
          });

        case "video-compressor": {
          const isDownscaled =
            compressorWidth > 0 &&
            compressorHeight > 0 &&
            (compressorWidth !== videoDims.width || compressorHeight !== videoDims.height);

          const res = await compressVideo(file, {
            crf,
            targetWidth: isDownscaled ? compressorWidth : undefined,
            targetHeight: isDownscaled ? compressorHeight : undefined,
            onProcessProgress,
            onDownloadProgress,
          });
          const savedPct = Math.round(((file.size - res.metadata.size) / file.size) * 100);
          if (savedPct >= 0) {
            setStatusMessage(
              `Compression complete! File size reduced by ${savedPct}% (${(res.metadata.size / (1024 * 1024)).toFixed(2)} MB).`
            );
          } else {
            setStatusMessage(
              `Warning: Output (${(res.metadata.size / (1024 * 1024)).toFixed(2)} MB) is ${Math.abs(savedPct)}% larger than input (${(file.size / (1024 * 1024)).toFixed(2)} MB). Try a higher CRF or lower resolution.`
            );
          }
          return res;
        }

        case "video-resizer": {
          const res = await resizeVideo(file, {
            width: targetWidth,
            height: targetHeight,
            fitMode,
            onProcessProgress,
            onDownloadProgress,
          });
          setStatusMessage(`Resized video to ${targetWidth}×${targetHeight} (${fitMode} mode).`);
          return res;
        }

        case "video-cropper": {
          const res = await cropVideo(file, {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight,
            sourceWidth: videoDims.width,
            sourceHeight: videoDims.height,
            onProcessProgress,
            onDownloadProgress,
          });
          setStatusMessage(`Cropped video to ${cropWidth}×${cropHeight} at (${cropX}, ${cropY}).`);
          return res;
        }

        case "video-to-gif": {
          const isFullVideo =
            gifStartTime === 0 &&
            (gifDuration <= 0 || gifDuration >= (duration > 0 ? duration - 0.05 : 0));
          const res = await videoToGif(file, {
            startTime: isFullVideo ? undefined : gifStartTime,
            duration: isFullVideo ? undefined : gifDuration,
            fps: gifFps,
            width: gifWidth,
            dithering,
            onProcessProgress,
            onDownloadProgress,
          });
          const sizeMB = (res.metadata.size / (1024 * 1024)).toFixed(2);
          setStatusMessage(
            `Generated animated GIF (${sizeMB} MB)${
              isFullVideo ? " from entire video." : ` (${gifDuration.toFixed(1)}s clip).`
            }`
          );
          if (res.metadata.size > 15 * 1024 * 1024) {
            setStatusMessage(
              (prev) => prev + " ⚠ File is over 15 MB — consider reducing width or frame rate if needed."
            );
          }
          return res;
        }

        case "gif-to-video": {
          const res = await gifToVideo(file, {
            loopCount,
            crf: gifCrf,
            onProcessProgress,
            onDownloadProgress,
          });
          setStatusMessage(`Converted GIF to MP4 video (${(res.metadata.size / (1024 * 1024)).toFixed(2)} MB).`);
          return res;
        }

        case "video-to-mp3": {
          const res = await videoToMp3(file, {
            bitrate: mp3Bitrate,
            sampleRate: mp3SampleRate,
            channels: mp3Channels,
            outputFormat: mp3OutputFormat,
            onProcessProgress,
            onDownloadProgress,
          });
          setStatusMessage(
            `Extracted ${mp3OutputFormat.toUpperCase()} audio (${(res.metadata.size / (1024 * 1024)).toFixed(2)} MB, ${mp3Bitrate} bitrate).`
          );
          return res;
        }

        case "audio-compressor": {
          const res = await compressAudio(file, {
            bitrate: acBitrate,
            sampleRate: acSampleRate,
            channels: acChannels,
            normalize: acNormalize,
            onProcessProgress,
            onDownloadProgress,
          });
          const savedPct = Math.round(((file.size - res.metadata.size) / file.size) * 100);
          if (savedPct >= 0) {
            setStatusMessage(
              `Audio compressed! Reduced by ${savedPct}% (${(res.metadata.size / (1024 * 1024)).toFixed(2)} MB).`
            );
          } else {
            setStatusMessage(
              `Warning: Output (${(res.metadata.size / (1024 * 1024)).toFixed(2)} MB) is larger than input (${(file.size / (1024 * 1024)).toFixed(2)} MB). Try a lower bitrate.`
            );
          }
          return res;
        }

        case "audio-converter": {
          const res = await convertAudio(file, {
            outputFormat: convFormat,
            bitrate: convBitrate,
            sampleRate: convSampleRate,
            channels: convChannels,
            onProcessProgress,
            onDownloadProgress,
          });
          setStatusMessage(
            `Converted to ${convFormat.toUpperCase()} (${(res.metadata.size / (1024 * 1024)).toFixed(2)} MB).`
          );
          return res;
        }

        case "audio-trimmer": {
          const res = await trimAudio(file, {
            startTime: trimStart,
            endTime: trimEnd,
            fadeIn: atFadeIn > 0 ? atFadeIn : undefined,
            fadeOut: atFadeOut > 0 ? atFadeOut : undefined,
            onProcessProgress,
            onDownloadProgress,
          });
          setStatusMessage(
            `Trimmed audio from ${trimStart.toFixed(1)}s to ${trimEnd.toFixed(1)}s (${(trimEnd - trimStart).toFixed(1)}s).`
          );
          return res;
        }

        default:
          throw new Error(`Unknown tool: ${slug}`);
      }
    }, duration);
  };

  // Download handler — derives extension from actual blob
  const handleDownload = () => {
    if (isSubtitleTool) {
      const content = subConvertedText;
      if (!content) return;
      const ext = slug === "srt-to-vtt" ? "vtt" : "srt";
      const mime = slug === "srt-to-vtt" ? "text/vtt;charset=utf-8" : "application/x-subrip;charset=utf-8";
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, "") : "subtitle";
      a.download = `${baseName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      return;
    }

    if (!processor.result) return;

    const blob = processor.result.blob;
    const mimeToExt: Record<string, string> = {
      "video/mp4": "mp4",
      "video/webm": "webm",
      "image/gif": "gif",
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/ogg": "ogg",
      "audio/flac": "flac",
      "audio/aac": "aac",
      "audio/opus": "opus",
    };

    let ext: string;
    if (slug === "audio-converter") {
      ext = convFormat;
    } else if (slug === "video-to-mp3") {
      ext = mp3OutputFormat;
    } else {
      ext = mimeToExt[blob.type] || config?.outputExt || "bin";
    }

    const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, "") : "output";
    const opName = slug === "video-to-mp3"
      ? `to-${mp3OutputFormat}`
      : slug === "audio-converter"
      ? `to-${convFormat}`
      : slug.replace(/^(video|audio)-/, "");

    const a = document.createElement("a");
    a.href = processor.result.url;
    a.download = `${baseName}-${opName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Preview trim region
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

  // Clear file
  const clearFile = () => {
    if (prevFileUrlRef.current) {
      URL.revokeObjectURL(prevFileUrlRef.current);
      prevFileUrlRef.current = "";
    }
    setSelectedFile(null);
    setFileUrl("");
    setFileError("");
    setStatusMessage("");
    setAudioBuffer(null);
    setDuration(0);
    setGifStartTime(0);
    setGifDuration(0);
    setVideoDims({ width: 0, height: 0 });
    processor.reset();
  };

  // WASM support check
  const wasmSupported = typeof window !== "undefined" ? isWebAssemblySupported() : true;

  // Determine output type for display
  const getResultOutputType = (): "video" | "audio" | "gif" => {
    if (!processor.result) return "video";
    const mime = processor.result.blob.type;
    if (mime.startsWith("audio/")) return "audio";
    if (mime === "image/gif") return "gif";
    return "video";
  };

  // Get button icon
  const getButtonIcon = () => {
    if (processor.state === "processing" || processor.state === "loading-engine") {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (slug.includes("trimmer")) return <Scissors className="w-4 h-4" />;
    if (slug.includes("compressor")) return <Minimize2 className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  // Get download button label based on actual output format
  const getDownloadButtonLabel = () => {
    if (!processor.result) return "Download";
    const mime = processor.result.blob.type;

    if (slug === "video-to-mp3") {
      return `Download ${mp3OutputFormat.toUpperCase()}`;
    }
    if (slug === "audio-converter") {
      const labelMap: Record<string, string> = {
        mp3: "MP3",
        wav: "WAV",
        m4a: "M4A",
        ogg: "OGG",
        flac: "FLAC",
        opus: "OPUS",
      };
      return `Download ${labelMap[convFormat] || convFormat.toUpperCase()}`;
    }

    if (mime === "audio/mp4" || mime === "audio/x-m4a") return "Download M4A";
    if (mime === "audio/mpeg") return "Download MP3";
    if (mime === "audio/wav" || mime === "audio/x-wav") return "Download WAV";
    if (mime === "audio/ogg") return "Download OGG";
    if (mime === "audio/flac") return "Download FLAC";
    if (mime === "audio/aac") return "Download AAC";

    if (mime.startsWith("audio/")) return "Download Audio";
    if (mime === "image/gif") return "Download GIF";
    if (mime === "video/webm") return "Download WebM";
    if (mime === "video/mp4") return "Download MP4";

    return "Download Media";
  };

  // Get execute button label
  const getExecuteButtonLabel = () => {
    if (processor.state === "processing" || processor.state === "loading-engine") {
      return "Processing...";
    }
    if (slug === "video-to-mp3") {
      return `Execute Video to ${mp3OutputFormat.toUpperCase()}`;
    }
    if (slug === "audio-converter") {
      const labelMap: Record<string, string> = {
        mp3: "MP3",
        wav: "WAV",
        m4a: "AAC / M4A",
        ogg: "OGG Vorbis",
        flac: "FLAC",
        opus: "OPUS",
      };
      return `Convert to ${labelMap[convFormat] || convFormat.toUpperCase()}`;
    }
    return `Execute ${tool.name}`;
  };

  // ========= SUBTITLE UI =========
  if (isSubtitleTool) {
    return (
      <div className="w-full flex flex-col gap-6">
        <ToolHeader tool={tool} />

        <SubtitleStudioPanel
          slug={slug}
          sourceText={subSourceText}
          onSourceTextChange={handleSourceTextChange}
          convertedText={subConvertedText}
          cueCount={subCueCount}
          cues={subCues}
          totalDurationSec={subTotalDuration}
          warnings={subWarnings}
          timeOffsetMs={subOffsetMs}
          onTimeOffsetChange={handleOffsetChange}
          stripFormatting={subStripFormatting}
          onStripFormattingChange={handleStripFormattingChange}
          includeCueNumbers={subIncludeCueNumbers}
          onIncludeCueNumbersChange={handleIncludeCueNumbersChange}
          onDownload={handleDownload}
          onDrop={handleDrop}
          onReject={handleReject}
          fileError={fileError}
          selectedFile={selectedFile}
          onClearFile={() => {
            setSelectedFile(null);
            handleClearSubtitles();
          }}
          onLoadSample={handleLoadSampleSubtitles}
          onClear={handleClearSubtitles}
          config={config}
        />

        <SEOContent tool={tool} />
        <RelatedTools slugs={tool.related} />
      </div>
    );
  }

  // ========= MEDIA PROCESSING UI =========
  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* WASM Support Check */}
      {!wasmSupported && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-red-400">
            <strong>Browser Not Supported</strong>
            <p className="mt-1 text-xs">
              Your browser does not support WebAssembly, which is required for video/audio processing.
              Please use a modern browser like Chrome 90+, Firefox 90+, Safari 15+, or Edge 90+.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              {config?.mediaType === "audio" || slug === "video-to-mp3" ? (
                <Music className="w-4 h-4 text-accent" />
              ) : (
                <Video className="w-4 h-4 text-accent" />
              )}
              Configure {tool.name}
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              100% Client-Side
            </span>
          </div>

          {/* Dropzone */}
          <Dropzone
            accept={config?.accept || "video/*,audio/*"}
            maxFiles={1}
            maxSizeMB={config?.maxSizeMB || 500}
            onDrop={handleDrop}
            onReject={handleReject}
            helperText={config?.dropzoneText}
          />

          {/* File error */}
          {fileError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400" role="alert" aria-live="assertive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Selected file info */}
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
                {duration > 0 && (
                  <span className="text-[10px] text-text-tertiary">
                    • {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, "0")}
                  </span>
                )}
                {videoDims.width > 0 && (
                  <span className="text-[10px] text-text-tertiary">
                    • {videoDims.width}×{videoDims.height}
                  </span>
                )}
              </div>
              <button onClick={clearFile} className="p-1 hover:text-rose-400 text-text-tertiary transition-colors" aria-label="Remove file">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Per-tool controls */}
          {selectedFile && slug === "video-compressor" && (
            <VideoCompressorControls
              crf={crf}
              setCrf={setCrf}
              targetWidth={compressorWidth}
              setTargetWidth={setCompressorWidth}
              targetHeight={compressorHeight}
              setTargetHeight={setCompressorHeight}
              sourceWidth={videoDims.width}
              sourceHeight={videoDims.height}
            />
          )}
          {selectedFile && slug === "video-resizer" && (
            <VideoResizerControls
              targetWidth={targetWidth}
              setTargetWidth={setTargetWidth}
              targetHeight={targetHeight}
              setTargetHeight={setTargetHeight}
              fitMode={fitMode}
              setFitMode={setFitMode}
            />
          )}
          {selectedFile && slug === "video-cropper" && (
            <VideoCropperControls
              cropX={cropX}
              setCropX={setCropX}
              cropY={cropY}
              setCropY={setCropY}
              cropWidth={cropWidth}
              setCropWidth={setCropWidth}
              cropHeight={cropHeight}
              setCropHeight={setCropHeight}
              sourceWidth={videoDims.width}
              sourceHeight={videoDims.height}
              aspectLock={aspectLock}
              setAspectLock={setAspectLock}
            />
          )}
          {selectedFile && (slug === "video-trimmer") && (
            <VideoTrimmerControls
              trimStart={trimStart}
              setTrimStart={setTrimStart}
              trimEnd={trimEnd}
              setTrimEnd={setTrimEnd}
              duration={duration}
              preciseCut={preciseCut}
              setPreciseCut={setPreciseCut}
              onPreviewSelection={playTrimmedRegionPreview}
            />
          )}
          {selectedFile && slug === "video-to-gif" && (
            <VideoToGifControls
              startTime={gifStartTime}
              setStartTime={setGifStartTime}
              gifDuration={gifDuration}
              setGifDuration={setGifDuration}
              fps={gifFps}
              setFps={setGifFps}
              width={gifWidth}
              setWidth={setGifWidth}
              dithering={dithering}
              setDithering={setDithering}
              videoDuration={duration}
            />
          )}
          {selectedFile && slug === "gif-to-video" && (
            <GifToVideoControls
              loopCount={loopCount}
              setLoopCount={setLoopCount}
              crf={gifCrf}
              setCrf={setGifCrf}
            />
          )}
          {selectedFile && slug === "video-to-mp3" && (
            <VideoToMp3Controls
              bitrate={mp3Bitrate}
              setBitrate={setMp3Bitrate}
              sampleRate={mp3SampleRate}
              setSampleRate={setMp3SampleRate}
              channels={mp3Channels}
              setChannels={setMp3Channels}
              outputFormat={mp3OutputFormat}
              setOutputFormat={setMp3OutputFormat}
              duration={duration}
            />
          )}
          {selectedFile && slug === "audio-compressor" && (
            <AudioCompressorControls
              bitrate={acBitrate}
              setBitrate={setAcBitrate}
              sampleRate={acSampleRate}
              setSampleRate={setAcSampleRate}
              channels={acChannels}
              setChannels={setAcChannels}
              normalize={acNormalize}
              setNormalize={setAcNormalize}
              inputSize={selectedFile.size}
              duration={duration}
            />
          )}
          {selectedFile && slug === "audio-converter" && (
            <AudioConverterControls
              outputFormat={convFormat}
              setOutputFormat={setConvFormat}
              bitrate={convBitrate}
              setBitrate={setConvBitrate}
              sampleRate={convSampleRate}
              setSampleRate={setConvSampleRate}
              channels={convChannels}
              setChannels={setConvChannels}
            />
          )}
          {selectedFile && slug === "audio-trimmer" && (
            <AudioTrimmerControls
              trimStart={trimStart}
              setTrimStart={setTrimStart}
              trimEnd={trimEnd}
              setTrimEnd={setTrimEnd}
              duration={duration}
              fadeIn={atFadeIn}
              setFadeIn={setAtFadeIn}
              fadeOut={atFadeOut}
              setFadeOut={setAtFadeOut}
            />
          )}

          {/* Progress */}
          {(processor.state === "processing" || processor.state === "loading-engine") && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">
                  {processor.state === "loading-engine"
                    ? `Loading video engine (${processor.engineProgress || 0}%)...`
                    : processor.statusDetail || `Processing media (${processor.processProgress}%)...`}
                </span>
                <span className="font-mono text-accent">
                  {processor.elapsedTime}s elapsed
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-raised rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.max(3, processor.processProgress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="lg"
              disabled={!selectedFile || processor.state === "processing" || processor.state === "loading-engine" || !wasmSupported}
              onClick={handleExecuteOperation}
              leftIcon={getButtonIcon()}
              className="flex-1"
            >
              {getExecuteButtonLabel()}
            </Button>

            {(processor.state === "processing" || processor.state === "loading-engine") && (
              <Button
                variant="secondary"
                size="lg"
                onClick={processor.cancel}
                leftIcon={<X className="w-4 h-4" />}
                aria-label="Cancel processing"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Status / Error messages */}
          <div aria-live="polite">
            {processor.error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{processor.error}</span>
              </div>
            )}
            {statusMessage && processor.state === "complete" && (
              <p className="text-xs text-text-secondary bg-surface-raised p-3 rounded-lg border border-border leading-relaxed">
                {statusMessage}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Preview & Output */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card lg:sticky lg:top-20">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Media Player & Output
            </h3>
            {processor.result && (
              <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
                {getDownloadButtonLabel()}
              </Button>
            )}
          </div>

          {/* Result display */}
          {processor.result ? (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-text-primary">Processed Result Ready</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  {selectedFile && (
                    <span className="text-text-tertiary">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB →
                    </span>
                  )}
                  <span className="text-emerald-400 font-bold">
                    {(processor.result.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>

              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-border">
                {getResultOutputType() === "video" ? (
                  <video src={processor.result.url} controls className="max-h-full max-w-full" />
                ) : getResultOutputType() === "gif" ? (
                  <img src={processor.result.url} alt="Processed Animated GIF" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-4 p-8 w-full max-w-md">
                    <Volume2 className="w-12 h-12 text-accent animate-pulse" />
                    <audio src={processor.result.url} controls className="w-full" />
                  </div>
                )}
              </div>

              {/* Converted Audio Waveform */}
              {getResultOutputType() === "audio" && resultAudioBuffer && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Converted Audio Waveform:
                  </span>
                  <canvas
                    ref={(el) => {
                      resultWaveformCanvasRef.current = el;
                      if (el && resultAudioBuffer) {
                        drawAudioWaveform(resultAudioBuffer, el);
                      }
                    }}
                    width={600}
                    height={75}
                    className="w-full h-20 rounded-lg border border-border bg-[#0c0f17]"
                  />
                </div>
              )}
            </div>
          ) : fileUrl ? (
            /* Source preview */
            <div className="flex flex-col gap-4">
              {slug === "video-cropper" ? (
                <VisualVideoCropper
                  videoUrl={fileUrl}
                  sourceWidth={videoDims.width}
                  sourceHeight={videoDims.height}
                  cropX={cropX}
                  setCropX={setCropX}
                  cropY={cropY}
                  setCropY={setCropY}
                  cropWidth={cropWidth}
                  setCropWidth={setCropWidth}
                  cropHeight={cropHeight}
                  setCropHeight={setCropHeight}
                  aspectLock={aspectLock}
                  setAspectLock={setAspectLock}
                />
              ) : slug === "video-trimmer" ? (
                <VisualVideoTrimmer
                  videoUrl={fileUrl}
                  duration={duration}
                  trimStart={trimStart}
                  setTrimStart={setTrimStart}
                  trimEnd={trimEnd}
                  setTrimEnd={setTrimEnd}
                  preciseCut={preciseCut}
                  setPreciseCut={setPreciseCut}
                />
              ) : slug === "audio-trimmer" ? (
                <VisualAudioTrimmer
                  audioUrl={fileUrl}
                  audioBuffer={audioBuffer}
                  duration={duration}
                  trimStart={trimStart}
                  setTrimStart={setTrimStart}
                  trimEnd={trimEnd}
                  setTrimEnd={setTrimEnd}
                  fadeIn={atFadeIn}
                  setFadeIn={setAtFadeIn}
                  fadeOut={atFadeOut}
                  setFadeOut={setAtFadeOut}
                />
              ) : slug === "gif-to-video" || selectedFile?.type === "image/gif" || selectedFile?.name.toLowerCase().endsWith(".gif") ? (
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-border relative p-2">
                  <img
                    src={fileUrl}
                    alt="Source Animated GIF"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
              ) : (
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
              )}

              {/* Waveform for tools other than audio-trimmer (which has its own integrated waveform track) */}
              {audioBuffer && slug !== "audio-trimmer" && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-text-secondary">Audio Waveform:</span>
                  <canvas
                    ref={(el) => {
                      waveformCanvasRef.current = el;
                      if (el && audioBuffer) {
                        drawAudioWaveform(audioBuffer, el);
                      }
                    }}
                    width={600}
                    height={75}
                    className="w-full h-20 rounded-lg border border-border bg-[#0c0f17]"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
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

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
