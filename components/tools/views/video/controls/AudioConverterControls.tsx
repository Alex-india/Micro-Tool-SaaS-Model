"use client";

import React from "react";
import type { AudioOutputFormat } from "@/lib/ffmpeg/media-ops";

interface Props {
  outputFormat: AudioOutputFormat;
  setOutputFormat: (v: AudioOutputFormat) => void;
  bitrate: string;
  setBitrate: (v: string) => void;
  sampleRate: number;
  setSampleRate: (v: number) => void;
  channels: number;
  setChannels: (v: number) => void;
}

const FORMAT_OPTIONS: { value: AudioOutputFormat; label: string; desc: string }[] = [
  { value: "mp3", label: "MP3", desc: "Universal compatibility" },
  { value: "wav", label: "WAV", desc: "Lossless, large file" },
  { value: "m4a", label: "AAC / M4A", desc: "Apple / web standard" },
  { value: "ogg", label: "OGG Vorbis", desc: "Open source, high quality" },
  { value: "flac", label: "FLAC", desc: "Lossless, compressed" },
  { value: "opus", label: "OPUS", desc: "Modern web standard" },
];

const BITRATE_OPTIONS = ["320k", "256k", "192k", "128k", "96k", "64k"];

const SAMPLE_RATES = [
  { label: "48 kHz", rate: 48000 },
  { label: "44.1 kHz", rate: 44100 },
  { label: "22.05 kHz", rate: 22050 },
];

export const AudioConverterControls: React.FC<Props> = ({
  outputFormat,
  setOutputFormat,
  bitrate,
  setBitrate,
  sampleRate,
  setSampleRate,
  channels,
  setChannels,
}) => {
  const isLossless = outputFormat === "wav" || outputFormat === "flac";

  const getFormatSummary = () => {
    const fmt = outputFormat.toUpperCase();
    const ch = channels === 1 ? "Mono" : "Stereo";
    const sr = `${sampleRate / 1000} kHz`;
    if (isLossless) {
      return `${fmt} • Lossless • ${sr} • ${ch}`;
    }
    return `${fmt} • ${bitrate} • ${sr} • ${ch}`;
  };

  return (
    <div className="flex flex-col gap-3.5 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Output Format
        </span>
        <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
          {getFormatSummary()}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FORMAT_OPTIONS.map((fmt) => (
          <button
            key={fmt.value}
            type="button"
            onClick={() => setOutputFormat(fmt.value)}
            className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
              outputFormat === fmt.value
                ? "bg-accent/10 border-accent text-accent shadow-sm"
                : "bg-surface-raised border-border text-text-secondary hover:border-accent/40 hover:text-text-primary"
            }`}
            aria-label={`Convert to ${fmt.label}`}
          >
            <div className="font-bold text-text-primary">{fmt.label}</div>
            <div className="text-[10px] opacity-70 font-normal mt-0.5 leading-tight">{fmt.desc}</div>
          </button>
        ))}
      </div>

      {!isLossless && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Bitrate
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            {BITRATE_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBitrate(b)}
                className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  bitrate === b
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
                }`}
                aria-label={`Set bitrate to ${b}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Sample Rate
        </span>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_RATES.map((s) => (
            <button
              key={s.rate}
              type="button"
              onClick={() => setSampleRate(s.rate)}
              className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                sampleRate === s.rate
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
              }`}
              aria-label={`Set sample rate to ${s.label}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
        <label className="text-text-secondary font-medium">Channel Mode:</label>
        <div className="flex gap-2">
          {[
            { label: "Stereo (2ch)", value: 2 },
            { label: "Mono (1ch)", value: 1 },
          ].map((ch) => (
            <button
              key={ch.value}
              type="button"
              onClick={() => setChannels(ch.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                channels === ch.value
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
              }`}
              aria-label={`Set channels to ${ch.label}`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
