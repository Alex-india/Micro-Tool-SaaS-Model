"use client";

import React from "react";
import { Input } from "@/components/ui/Input";

interface Props {
  bitrate: string;
  setBitrate: (v: string) => void;
  sampleRate: number;
  setSampleRate: (v: number) => void;
  channels: number;
  setChannels: (v: number) => void;
  outputFormat: "mp3" | "m4a";
  setOutputFormat: (v: "mp3" | "m4a") => void;
  trimStart?: number;
  setTrimStart?: (v: number) => void;
  trimEnd?: number;
  setTrimEnd?: (v: number) => void;
  duration: number;
}

const BITRATE_OPTIONS = [
  { label: "320k", value: "320k", desc: "Highest quality" },
  { label: "256k", value: "256k", desc: "High quality" },
  { label: "192k", value: "192k", desc: "Good quality" },
  { label: "128k", value: "128k", desc: "Standard" },
  { label: "96k", value: "96k", desc: "Compact" },
];

const SAMPLE_RATES = [
  { label: "48 kHz", rate: 48000 },
  { label: "44.1 kHz", rate: 44100 },
  { label: "22.05 kHz", rate: 22050 },
];

export const VideoToMp3Controls: React.FC<Props> = ({
  bitrate,
  setBitrate,
  sampleRate,
  setSampleRate,
  channels,
  setChannels,
  outputFormat,
  setOutputFormat,
  duration,
}) => {
  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-border">
      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
        Output Format
      </span>
      <div className="grid grid-cols-2 gap-2">
        {(["mp3", "m4a"] as const).map((fmt) => (
          <button
            key={fmt}
            type="button"
            onClick={() => setOutputFormat(fmt)}
            className={`py-1.5 rounded-lg border text-xs font-semibold uppercase transition-colors ${
              outputFormat === fmt
                ? "bg-accent/10 border-accent text-accent"
                : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
            }`}
            aria-label={`Output as ${fmt.toUpperCase()}`}
          >
            {fmt.toUpperCase()}
          </button>
        ))}
      </div>

      <span className="text-xs font-bold text-text-primary uppercase tracking-wider pt-2">
        Audio Bitrate
      </span>
      <div className="grid grid-cols-5 gap-1.5">
        {BITRATE_OPTIONS.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => setBitrate(b.value)}
            className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              bitrate === b.value
                ? "bg-accent/10 border-accent text-accent"
                : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
            }`}
            aria-label={`Set bitrate to ${b.label}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <span className="text-xs font-bold text-text-primary uppercase tracking-wider pt-2">
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

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="text-text-secondary font-medium">Channels:</label>
        <div className="flex gap-2">
          {[
            { label: "Stereo", value: 2 },
            { label: "Mono", value: 1 },
          ].map((ch) => (
            <button
              key={ch.value}
              type="button"
              onClick={() => setChannels(ch.value)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
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
