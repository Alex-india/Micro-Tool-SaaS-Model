"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  Clock,
  ArrowLeftRight,
  Sliders,
  Search,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCode,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dropzone, type FileRejection } from "@/components/ui/Dropzone";
import type { SubtitleCue } from "@/lib/video-audio-engine";
import type { ToolConfig } from "@/lib/ffmpeg/tool-config";

interface SubtitleStudioPanelProps {
  slug: string;
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  convertedText: string;
  cueCount: number;
  cues: SubtitleCue[];
  totalDurationSec: number;
  warnings: string[];
  timeOffsetMs: number;
  onTimeOffsetChange: (offset: number) => void;
  stripFormatting: boolean;
  onStripFormattingChange: (strip: boolean) => void;
  includeCueNumbers: boolean;
  onIncludeCueNumbersChange: (include: boolean) => void;
  onDownload: () => void;
  onDrop: (files: File[]) => void;
  onReject: (rejections: FileRejection[]) => void;
  fileError: string;
  selectedFile: File | null;
  onClearFile: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  config: ToolConfig | undefined;
}

export const SubtitleStudioPanel: React.FC<SubtitleStudioPanelProps> = ({
  slug,
  sourceText,
  onSourceTextChange,
  convertedText,
  cueCount,
  cues,
  totalDurationSec,
  warnings,
  timeOffsetMs,
  onTimeOffsetChange,
  stripFormatting,
  onStripFormattingChange,
  includeCueNumbers,
  onIncludeCueNumbersChange,
  onDownload,
  onDrop,
  onReject,
  fileError,
  selectedFile,
  onClearFile,
  onLoadSample,
  onClear,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<"code" | "cues">("code");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCueId, setCopiedCueId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isSrtToVtt = slug === "srt-to-vtt";
  const sourceFormatLabel = isSrtToVtt ? "SubRip (.SRT)" : "WebVTT (.VTT)";
  const targetFormatLabel = isSrtToVtt ? "WebVTT (.VTT)" : "SubRip (.SRT)";
  const swapLink = isSrtToVtt ? "/video/vtt-to-srt" : "/video/srt-to-vtt";

  const handleCopyAll = () => {
    if (!convertedText) return;
    navigator.clipboard.writeText(convertedText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingleCue = (cue: SubtitleCue) => {
    const textToCopy = `${cue.start} --> ${cue.end}\n${cue.text}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCueId(cue.id);
    setTimeout(() => setCopiedCueId(null), 1800);
  };

  // Filter cues by search query
  const filteredCues = cues.filter((cue) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cue.text.toLowerCase().includes(q) ||
      cue.start.toLowerCase().includes(q) ||
      cue.end.toLowerCase().includes(q) ||
      String(cue.id).includes(q)
    );
  });

  const formatDurationDisplay = (sec: number): string => {
    if (!sec || sec <= 0) return "0.0s";
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-card">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs font-semibold text-accent">
            <span>{isSrtToVtt ? "SRT" : "VTT"}</span>
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{isSrtToVtt ? "WebVTT" : "SRT"}</span>
          </div>

          <span className="text-xs text-text-muted hidden sm:inline">
            {isSrtToVtt
              ? "Converts SubRip files to standards-compliant WebVTT for HTML5 players"
              : "Converts WebVTT files to standard SubRip (.srt) subtitle format"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadSample}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
            title="Load sample subtitle text"
          >
            Load Sample
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
            title="Toggle subtitle settings & offset"
          >
            {showAdvanced ? "Hide Settings" : "Sync & Options"}
          </Button>

          {sourceText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-red-400" />}
              title="Clear all text"
            >
              Clear
            </Button>
          )}

          <Link href={swapLink}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}
              title={`Switch to ${isSrtToVtt ? "VTT to SRT" : "SRT to VTT"}`}
            >
              Swap Tool
            </Button>
          </Link>
        </div>
      </div>

      {/* Advanced Settings Bar (Time Offset & Formatting) */}
      {showAdvanced && (
        <div className="bg-surface border border-accent/20 rounded-xl p-4 shadow-card flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              Timing Offset (Shift Subtitles)
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              Current Offset: <strong className={timeOffsetMs !== 0 ? "text-accent" : "text-text-primary"}>
                {timeOffsetMs > 0 ? `+${timeOffsetMs}` : timeOffsetMs} ms
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted mr-1">Quick Presets:</span>
            {[-1000, -500, 0, 500, 1000].map((ms) => (
              <button
                key={ms}
                onClick={() => onTimeOffsetChange(ms)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all font-mono ${
                  timeOffsetMs === ms
                    ? "bg-accent text-white border-accent shadow-sm"
                    : "bg-surface-raised border-border text-text-primary hover:border-accent/50"
                }`}
              >
                {ms === 0 ? "Reset (0ms)" : ms > 0 ? `+${ms / 1000}s` : `${ms / 1000}s`}
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-auto">
              <label htmlFor="custom-offset" className="text-xs text-text-muted">
                Custom ms:
              </label>
              <input
                id="custom-offset"
                type="number"
                step="50"
                value={timeOffsetMs}
                onChange={(e) => onTimeOffsetChange(Number(e.target.value) || 0)}
                className="w-24 px-2 py-1 text-xs bg-surface-raised border border-border rounded-md text-text-primary font-mono outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-text-primary">
              <input
                type="checkbox"
                checked={stripFormatting}
                onChange={(e) => onStripFormattingChange(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span>Strip HTML styling tags (Plain text output)</span>
            </label>

            {isSrtToVtt && (
              <label className="flex items-center gap-2 cursor-pointer select-none text-text-primary">
                <input
                  type="checkbox"
                  checked={includeCueNumbers}
                  onChange={(e) => onIncludeCueNumbersChange(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Include cue identifiers (1, 2, 3...)</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Source Subtitle */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Source ({sourceFormatLabel})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {sourceText && (
                <span className="text-[11px] font-mono text-text-muted">
                  {sourceText.length.toLocaleString()} chars
                </span>
              )}
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Client-Side
              </span>
            </div>
          </div>

          {/* Uploaded File Chip or Dropzone */}
          {selectedFile ? (
            <div className="flex items-center justify-between p-3 bg-surface-raised border border-accent/20 rounded-lg text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileCode className="w-4 h-4 text-accent shrink-0" />
                <span className="font-medium text-text-primary truncate">{selectedFile.name}</span>
                <span className="text-text-muted text-[11px]">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={onClearFile}
                className="text-text-muted hover:text-red-400 p-1 rounded transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Dropzone
              accept={config?.accept || ".srt,.vtt,text/plain"}
              maxFiles={1}
              maxSizeMB={config?.maxSizeMB || 10}
              onDrop={onDrop}
              onReject={onReject}
              helperText={
                config?.dropzoneText ||
                (isSrtToVtt
                  ? "Drop .SRT file here, or paste SubRip text below"
                  : "Drop .VTT file here, or paste WebVTT text below")
              }
            />
          )}

          {fileError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{fileError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>Paste or edit raw subtitle text:</span>
              <span>
                {sourceText ? `${sourceText.split("\n").length} lines` : "Empty"}
              </span>
            </div>
            <textarea
              rows={14}
              value={sourceText}
              onChange={(e) => onSourceTextChange(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-xs text-text-primary leading-relaxed outline-none focus:border-accent resize-y placeholder:text-text-muted/40 transition-colors"
              placeholder={
                isSrtToVtt
                  ? `1\n00:00:01,000 --> 00:00:04,000\nHello and welcome to ToolVerse!\n\n2\n00:00:04,500 --> 00:00:08,000\nEnjoy fast, free, client-side subtitle conversion.`
                  : `WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nHello and welcome to ToolVerse!\n\n2\n00:00:04.500 --> 00:00:08.000\nEnjoy fast, free, client-side subtitle conversion.`
              }
              aria-label="Source subtitle text"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Converted Output */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Converted ({targetFormatLabel})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Selector */}
              <div className="flex items-center bg-surface-raised border border-border rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                    activeTab === "code"
                      ? "bg-accent text-white shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  Code ({isSrtToVtt ? ".vtt" : ".srt"})
                </button>
                <button
                  onClick={() => setActiveTab("cues")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                    activeTab === "cues"
                      ? "bg-accent text-white shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  Cues ({cueCount})
                </button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyAll}
                disabled={!convertedText}
                leftIcon={copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedAll ? "Copied" : "Copy"}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={onDownload}
                disabled={!convertedText || cueCount === 0}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download
              </Button>
            </div>
          </div>

          {/* Main Tab Content */}
          {activeTab === "code" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>
                  Direct output stream (ready for {isSrtToVtt ? "HTML5 video players" : "media players & video editors"}):
                </span>
                {cueCount > 0 && (
                  <span className="text-emerald-400 font-mono">
                    ✓ {cueCount} valid cues generated
                  </span>
                )}
              </div>
              <textarea
                readOnly
                rows={17}
                value={convertedText}
                className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-xs text-emerald-400 leading-relaxed outline-none resize-y selection:bg-emerald-500/30"
                placeholder={`Converted ${targetFormatLabel} stream will appear here instantly...`}
                aria-label="Converted subtitle output"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Cue Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter cues by text or timestamp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-surface-raised border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>

              {/* Cue Cards List */}
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredCues.length === 0 ? (
                  <div className="p-8 text-center text-xs text-text-muted">
                    {cues.length === 0
                      ? "No parsed cues yet. Enter subtitle text on the left."
                      : "No cues match your search query."}
                  </div>
                ) : (
                  filteredCues.map((cue) => (
                    <div
                      key={cue.id}
                      className="p-3 bg-surface-raised border border-border/70 hover:border-border rounded-lg flex flex-col gap-1.5 transition-colors group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] font-bold text-accent">
                            #{cue.id}
                          </span>
                          <span className="text-text-primary text-[11px] font-semibold">
                            {cue.start}
                          </span>
                          <span className="text-text-muted text-[10px]">➔</span>
                          <span className="text-text-primary text-[11px] font-semibold">
                            {cue.end}
                          </span>
                          <span className="text-text-muted text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border">
                            {cue.durationSec.toFixed(1)}s
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopySingleCue(cue)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-accent rounded"
                          title="Copy cue text"
                        >
                          {copiedCueId === cue.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="text-xs text-text-primary/90 whitespace-pre-wrap pl-1 font-sans">
                        {cue.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Validation Warnings (if any) */}
          {warnings.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col gap-1.5 text-xs text-amber-400">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Format Notice ({warnings.length}):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/90 pl-1 max-h-24 overflow-y-auto">
                {warnings.slice(0, 5).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
                {warnings.length > 5 && (
                  <li className="list-none text-text-muted italic">
                    +{warnings.length - 5} more warnings
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Stats Bar */}
          {cueCount > 0 && (
            <div className="p-3 bg-surface-raised border border-border rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-text-primary">
                    {cueCount} {cueCount === 1 ? "Cue" : "Cues"}
                  </span>
                </div>
                {totalDurationSec > 0 && (
                  <div className="text-text-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duration: <strong className="text-text-primary">{formatDurationDisplay(totalDurationSec)}</strong></span>
                  </div>
                )}
              </div>

              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {isSrtToVtt ? "W3C WebVTT Compliant" : "SubRip Standard"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
