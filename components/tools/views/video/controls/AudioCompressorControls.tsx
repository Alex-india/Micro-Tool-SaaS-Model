"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Sliders } from "lucide-react";

interface Props {
  bitrate: string;
  setBitrate: (v: string) => void;
  sampleRate: number;
  setSampleRate: (v: number) => void;
  channels: number;
  setChannels: (v: number) => void;
  normalize: boolean;
  setNormalize: (v: boolean) => void;
  inputSize: number; // bytes
  duration?: number; // seconds
}

// Standard MPEG-1/2 Layer 3 bitrates supported by FFmpeg libmp3lame CBR
const STANDARD_BITRATES = [
  { kbps: 32, value: "32k" },
  { kbps: 40, value: "40k" },
  { kbps: 48, value: "48k" },
  { kbps: 56, value: "56k" },
  { kbps: 64, value: "64k" },
  { kbps: 80, value: "80k" },
  { kbps: 96, value: "96k" },
  { kbps: 112, value: "112k" },
  { kbps: 128, value: "128k" },
  { kbps: 160, value: "160k" },
  { kbps: 192, value: "192k" },
];

const SAMPLE_RATES = [
  { label: "44.1 kHz", rate: 44100 },
  { label: "32 kHz", rate: 32000 },
  { label: "22.05 kHz", rate: 22050 },
];

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${mb.toFixed(2)} MB`;
}

export const AudioCompressorControls: React.FC<Props> = ({
  bitrate,
  setBitrate,
  sampleRate,
  setSampleRate,
  channels,
  setChannels,
  normalize,
  setNormalize,
  inputSize,
  duration = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Effective duration in seconds
  const effDuration =
    duration > 0
      ? duration
      : inputSize > 0
      ? (inputSize * 8) / (128 * 1000)
      : 80;

  // Exact audio file byte size calculation: duration * bitrate_bps / 8
  const getBytesForKbps = (kbps: number) => {
    return Math.round((effDuration * kbps * 1000) / 8);
  };

  // Only include bitrates that genuinely compress the file (strictly smaller than inputSize)
  const achievableOptions = STANDARD_BITRATES.filter((s) => {
    if (inputSize <= 0) return true;
    const bytes = getBytesForKbps(s.kbps);
    return bytes < inputSize * 0.98;
  }).map((s) => {
    const bytes = getBytesForKbps(s.kbps);
    const reduction = Math.round(((inputSize - bytes) / inputSize) * 100);
    return {
      value: s.value,
      kbps: s.kbps,
      bytes,
      reduction,
      sizeFormatted: formatSize(bytes),
    };
  });

  const effectiveOptions =
    achievableOptions.length > 0
      ? achievableOptions
      : [
          {
            value: "32k",
            kbps: 32,
            bytes: getBytesForKbps(32),
            reduction: 0,
            sizeFormatted: formatSize(getBytesForKbps(32)),
          },
        ];

  // Auto-clamp: If current bitrate produces output >= inputSize or isn't a valid option, auto-select a valid one
  useEffect(() => {
    if (inputSize > 0 && effectiveOptions.length > 0) {
      const isCurrentValid = effectiveOptions.some((opt) => opt.value === bitrate);
      if (!isCurrentValid) {
        // Default to a balanced compression target (e.g. 64k or middle of options)
        const defaultOpt =
          effectiveOptions.find((o) => o.kbps === 64) ||
          effectiveOptions[Math.floor(effectiveOptions.length / 2)];
        setBitrate(defaultOpt.value);
        if (defaultOpt.kbps <= 64) {
          setChannels(1);
        }
      }
    }
  }, [inputSize, effDuration]);

  // Current active option index
  const currentStepIndex = Math.max(
    0,
    effectiveOptions.findIndex((s) => s.value === bitrate)
  );
  const activeOption = effectiveOptions[currentStepIndex] || effectiveOptions[0];

  const handleSelectBitrate = (newBitrate: string) => {
    setBitrate(newBitrate);
    const kb = parseInt(newBitrate, 10) || 128;
    // Auto-adjust channels for low bitrates (mono is clearer for <= 64k)
    if (kb <= 64 && channels === 2) {
      setChannels(1);
    } else if (kb > 64 && channels === 1) {
      setChannels(2);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-border">
      {/* Target Compressed Size Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Target Compressed Size
        </span>
        <span className="text-xs font-mono font-semibold text-accent">
          ~{activeOption.sizeFormatted} {activeOption.reduction > 0 ? `(-${activeOption.reduction}%)` : ""}
        </span>
      </div>

      {/* Target Size Selector & Slider Card */}
      <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-surface-raised/40 border border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-text-secondary">Select Target Size:</span>
          <span className="font-mono font-bold text-accent text-sm">
            {activeOption.sizeFormatted}
          </span>
        </div>

        {/* Dropdown with exact achievable sizes */}
        <select
          value={bitrate}
          onChange={(e) => handleSelectBitrate(e.target.value)}
          className="w-full py-2 px-3 rounded-lg border border-border bg-surface text-text-primary text-xs font-mono font-medium focus:border-accent focus:outline-none cursor-pointer"
          aria-label="Select target compressed size"
        >
          {effectiveOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.sizeFormatted} (-{opt.reduction}% • {opt.kbps} kbps)
            </option>
          ))}
        </select>

        {/* Slider stepping through exact achievable sizes */}
        <div className="flex flex-col gap-1.5 pt-1">
          <input
            type="range"
            min={0}
            max={effectiveOptions.length - 1}
            step={1}
            value={currentStepIndex}
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              if (effectiveOptions[idx]) {
                handleSelectBitrate(effectiveOptions[idx].value);
              }
            }}
            className="w-full h-2 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
            aria-label="Adjust compressed size"
          />
          <div className="flex justify-between text-[10px] text-text-tertiary font-mono">
            <span>Min ({effectiveOptions[0]?.sizeFormatted})</span>
            <span>Original ({formatSize(inputSize)})</span>
          </div>
        </div>
      </div>

      {/* Output Summary Card */}
      <div className="p-2.5 rounded-lg bg-surface-raised/70 border border-border flex items-center justify-between text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-text-tertiary">Estimated Output</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-text-secondary">{formatSize(inputSize)}</span>
            <span className="text-text-tertiary">→</span>
            <span className="text-text-primary font-bold">~{activeOption.sizeFormatted}</span>
            {activeOption.reduction > 0 && (
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                (-{activeOption.reduction}%)
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-text-tertiary block">Bitrate</span>
          <span className="text-xs font-mono font-semibold text-text-secondary">{bitrate}</span>
        </div>
      </div>

      {/* Advanced Audio Settings Collapsible */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-1.5 px-2.5 rounded-lg border border-border bg-surface-raised/30 hover:bg-surface-raised flex items-center justify-between text-xs text-text-secondary hover:text-text-primary transition-colors"
          aria-expanded={showAdvanced}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Sliders className="w-3.5 h-3.5 text-text-tertiary" />
            Advanced Audio Settings
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-text-tertiary font-mono">
              {bitrate} • {channels === 1 ? "Mono" : "Stereo"}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-3 pt-3 px-1">
            {/* Target Bitrate manual selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">Target Bitrate:</span>
                <span className="text-[10px] font-mono text-accent">{bitrate}</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {STANDARD_BITRATES.map((b) => {
                  const wouldEnlarge = inputSize > 0 && getBytesForKbps(b.kbps) >= inputSize;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      disabled={wouldEnlarge}
                      onClick={() => !wouldEnlarge && handleSelectBitrate(b.value)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors flex flex-col items-center ${
                        wouldEnlarge
                          ? "opacity-30 border-border bg-surface text-text-tertiary cursor-not-allowed"
                          : bitrate === b.value
                          ? "bg-accent/10 border-accent text-accent"
                          : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
                      }`}
                      title={
                        wouldEnlarge
                          ? `Exceeds original file size (${formatSize(inputSize)})`
                          : `Set bitrate to ${b.value}`
                      }
                      aria-label={`Set bitrate to ${b.value}`}
                    >
                      <span>{b.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sample Rate manual selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">Sample Rate:</span>
                <span className="text-[10px] font-mono text-accent">
                  {(sampleRate / 1000).toFixed(1)} kHz
                </span>
              </div>
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

            {/* Channels: Stereo vs Mono */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-text-secondary font-medium">Channels:</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setChannels(2)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                    channels === 2
                      ? "bg-accent/15 border-accent text-accent font-semibold"
                      : "bg-surface-raised border-border text-text-secondary hover:border-accent/30"
                  }`}
                >
                  Stereo (2 ch)
                </button>
                <button
                  type="button"
                  onClick={() => setChannels(1)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                    channels === 1
                      ? "bg-accent/15 border-accent text-accent font-semibold"
                      : "bg-surface-raised border-border text-text-secondary hover:border-accent/30"
                  }`}
                >
                  Mono (1 ch)
                </button>
              </div>
            </div>

            {/* Loudness Normalization Switch */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label htmlFor="normalize-checkbox" className="text-text-secondary font-medium cursor-pointer">
                Loudness Normalization
              </label>
              <input
                id="normalize-checkbox"
                type="checkbox"
                checked={normalize}
                onChange={(e) => setNormalize(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-accent cursor-pointer"
                aria-label="Toggle loudness normalization"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};




