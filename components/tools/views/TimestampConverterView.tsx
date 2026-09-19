"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  parseTimestamp,
  customDateToTimestamp,
  parseBatchTimestamps,
  generateCodeSnippets,
  formatCustomDate,
  calculateTimeDifference,
  type TimestampUnit,
  type DetailedTimestampResult,
  type BatchConversionItem,
  type TimeDifferenceResult,
} from "@/tools/developer/timestampEngine";
import {
  Clock,
  Calendar,
  Copy,
  Check,
  Globe,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  ArrowRight,
  Code2,
  HelpCircle,
  CheckCircle2,
  Download,
  Calculator,
  Hourglass,
  CalendarDays,
  SlidersHorizontal,
  FileCode,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

export interface TimestampConverterViewProps {
  tool: ToolMeta;
}

const UNIVERSAL_PRESETS = [
  { label: "Now", getVal: () => Math.floor(Date.now() / 1000).toString() },
  { label: "ISO 8601 UTC", getVal: () => new Date().toISOString() },
  { label: "RFC 2822", getVal: () => new Date().toUTCString() },
  { label: "Start of Year", getVal: () => `${new Date().getUTCFullYear()}-01-01T00:00:00Z` },
  { label: "SQL Timestamp", getVal: () => "2025-01-15 14:30:00" },
  { label: "Y2038 Milestone", getVal: () => "2147483647" },
  { label: "Unix Epoch (1970)", getVal: () => "0" },
];

const CUSTOM_FORMAT_PRESETS = [
  { label: "SQL DateTime", pattern: "YYYY-MM-DD HH:mm:ss" },
  { label: "European Date", pattern: "DD/MM/YYYY HH:mm:ss" },
  { label: "US Standard", pattern: "MM/DD/YYYY hh:mm:ss A" },
  { label: "Compact Date", pattern: "YYYYMMDD" },
  { label: "Date with Millis", pattern: "YYYY-MM-DD HH:mm:ss.SSS" },
];

export const TimestampConverterView: React.FC<TimestampConverterViewProps> = ({ tool }) => {
  const isGenericTimestampSlug = tool.slug === "timestamp-converter";

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"omniConverter" | "dateToEpoch" | "difference" | "batch">(
    "omniConverter"
  );

  // Real-time ticking clock
  const [liveNow, setLiveNow] = useState<number>(Date.now());
  const [isTickerPaused, setIsTickerPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isTickerPaused) return;
    const interval = setInterval(() => {
      setLiveNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isTickerPaused]);

  const liveSeconds = Math.floor(liveNow / 1000);

  // --- Tab 1: Omni-Format Converter State ---
  const [mainInput, setMainInput] = useState<string>(() =>
    isGenericTimestampSlug ? new Date().toISOString() : Math.floor(Date.now() / 1000).toString()
  );
  const [forcedUnit, setForcedUnit] = useState<TimestampUnit | "auto">("auto");
  const [customPattern, setCustomPattern] = useState<string>("YYYY-MM-DD HH:mm:ss");
  const [isCustomPatternUtc, setIsCustomPatternUtc] = useState<boolean>(true);

  // Detailed parsed result for Tab 1
  const parsedResult: DetailedTimestampResult = useMemo(() => {
    return parseTimestamp(mainInput, {
      unit: forcedUnit === "auto" ? undefined : forcedUnit,
      nowMs: liveNow,
    });
  }, [mainInput, forcedUnit, liveNow]);

  const formattedCustomDate = useMemo(() => {
    if (!parsedResult.isValid) return "";
    return formatCustomDate(parsedResult.date, customPattern, isCustomPatternUtc);
  }, [parsedResult, customPattern, isCustomPatternUtc]);

  // --- Tab 2: Human Date Component Picker State ---
  const initialDate = new Date();
  const [customYear, setCustomYear] = useState<number>(initialDate.getUTCFullYear());
  const [customMonth, setCustomMonth] = useState<number>(initialDate.getUTCMonth() + 1);
  const [customDay, setCustomDay] = useState<number>(initialDate.getUTCDate());
  const [customHour, setCustomHour] = useState<number>(initialDate.getUTCHours());
  const [customMinute, setCustomMinute] = useState<number>(initialDate.getUTCMinutes());
  const [customSecond, setCustomSecond] = useState<number>(initialDate.getUTCSeconds());
  const [isCustomUtc, setIsCustomUtc] = useState<boolean>(true);

  const pickerResult: DetailedTimestampResult = useMemo(() => {
    return customDateToTimestamp({
      year: customYear,
      month: customMonth,
      day: customDay,
      hours: customHour,
      minutes: customMinute,
      seconds: customSecond,
      isUtc: isCustomUtc,
    });
  }, [customYear, customMonth, customDay, customHour, customMinute, customSecond, isCustomUtc]);

  const setCustomToNow = () => {
    const d = new Date();
    if (isCustomUtc) {
      setCustomYear(d.getUTCFullYear());
      setCustomMonth(d.getUTCMonth() + 1);
      setCustomDay(d.getUTCDate());
      setCustomHour(d.getUTCHours());
      setCustomMinute(d.getUTCMinutes());
      setCustomSecond(d.getUTCSeconds());
    } else {
      setCustomYear(d.getFullYear());
      setCustomMonth(d.getMonth() + 1);
      setCustomDay(d.getDate());
      setCustomHour(d.getHours());
      setCustomMinute(d.getMinutes());
      setCustomSecond(d.getSeconds());
    }
  };

  // --- Tab 3: Time Difference Calculator State ---
  const [diffStartInput, setDiffStartInput] = useState<string>("2024-01-01T00:00:00Z");
  const [diffEndInput, setDiffEndInput] = useState<string>(() => new Date().toISOString());

  const diffResult: TimeDifferenceResult = useMemo(() => {
    return calculateTimeDifference(diffStartInput, diffEndInput);
  }, [diffStartInput, diffEndInput]);

  // --- Tab 4: Batch & Code Snippets State ---
  const [batchInput, setBatchInput] = useState<string>(
    "1700000000\n1704067200\n1726723200\n2025-01-01T00:00:00Z\n2025-12-31 23:59:59"
  );
  const [activeSnippetLang, setActiveSnippetLang] = useState<string>("javascript");

  const batchResults: BatchConversionItem[] = useMemo(() => {
    return parseBatchTimestamps(batchInput);
  }, [batchInput]);

  const targetEpochForSnippets = parsedResult.isValid ? parsedResult.epochSeconds : liveSeconds;
  const snippets = useMemo(() => {
    return generateCodeSnippets(targetEpochForSnippets);
  }, [targetEpochForSnippets]);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  const triggerCopy = (text: string, identifier: string, label = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    setToastMessage(label);
    setTimeout(() => {
      setCopiedKey(null);
      setToastMessage("");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full">
      <ToolHeader tool={tool} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl shadow-2xl border border-blue-400/30 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {toastMessage}
        </div>
      )}

      {/* Suite Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border">
          <Link
            href="/developer/timestamp-converter"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              isGenericTimestampSlug
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Timestamp Converter (ISO 8601 & Dates)
          </Link>
          <Link
            href="/developer/unix-timestamp-converter"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              !isGenericTimestampSlug
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Unix Timestamp Converter
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>UTC &bull; ISO 8601 &bull; RFC 2822 &bull; Multi-Timezone Synchronized</span>
        </div>
      </div>

      {/* Live Unix Epoch Ticker Banner */}
      <div className="bg-gradient-to-r from-surface via-surface-raised to-surface border border-border rounded-2xl p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Current Unix Epoch
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <button
                onClick={() => setIsTickerPaused(!isTickerPaused)}
                className="text-[11px] text-text-muted hover:text-text-primary flex items-center gap-1 ml-2 font-mono"
                title={isTickerPaused ? "Resume live clock" : "Pause live clock"}
              >
                {isTickerPaused ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-400" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-amber-400" /> Pause
                  </>
                )}
              </button>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-2xl md:text-3xl font-mono font-bold text-text-primary tracking-tight">
                {liveSeconds}
              </span>
              <span className="text-xs font-mono text-text-muted">({liveNow} ms)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => triggerCopy(liveSeconds.toString(), "live-sec", "Copied current seconds!")}
            className="px-3 py-2 rounded-xl bg-surface hover:bg-surface-raised border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all flex items-center gap-1.5 shadow-sm"
          >
            {copiedKey === "live-sec" ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-accent" />
            )}
            Copy Seconds
          </button>
          <button
            onClick={() => triggerCopy(liveNow.toString(), "live-ms", "Copied current milliseconds!")}
            className="px-3 py-2 rounded-xl bg-surface hover:bg-surface-raised border border-border hover:border-accent text-xs font-semibold text-text-primary transition-all flex items-center gap-1.5 shadow-sm"
          >
            {copiedKey === "live-ms" ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-accent" />
            )}
            Copy Milliseconds
          </button>
          <button
            onClick={() => setMainInput(liveSeconds.toString())}
            className="px-3 py-2 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/30 text-xs font-semibold text-accent transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Set to Input
          </button>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2 bg-surface p-1 rounded-xl border border-border text-xs">
          <button
            onClick={() => setActiveTab("omniConverter")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "omniConverter"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Clock className="w-4 h-4" />
            Universal Timestamp Converter
          </button>
          <button
            onClick={() => setActiveTab("dateToEpoch")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "dateToEpoch"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Date Picker to Formats
          </button>
          <button
            onClick={() => setActiveTab("difference")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "difference"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Hourglass className="w-4 h-4" />
            Time Difference Calculator
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "batch"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Batch & Code Snippets
          </button>
        </div>
      </div>

      {/* TAB 1: UNIVERSAL TIMESTAMP CONVERTER */}
      {activeTab === "omniConverter" && (
        <div className="flex flex-col gap-6">
          {/* Input Controls Card */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Universal Timestamp & Date Input
                </h2>
              </div>
              {parsedResult.isValid && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent font-mono">
                    Detected: {parsedResult.detectedUnit}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Presets Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-text-muted font-medium shrink-0">Presets:</span>
              {UNIVERSAL_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainInput(p.getVal())}
                  className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary text-[11px] whitespace-nowrap transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input & Unit Override */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={mainInput}
                  onChange={(e) => setMainInput(e.target.value)}
                  placeholder="Paste Unix epoch (1705321800), ISO 8601 (2024-01-15T12:00:00Z), RFC 2822, or SQL date..."
                  className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <select
                  value={forcedUnit}
                  onChange={(e) => setForcedUnit(e.target.value as any)}
                  className="w-full bg-surface-raised border border-border rounded-xl px-3 py-3 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="auto">Unit: Auto-Detect</option>
                  <option value="seconds">Seconds (10 digits)</option>
                  <option value="milliseconds">Milliseconds (13 digits)</option>
                  <option value="microseconds">Microseconds (16 digits)</option>
                  <option value="nanoseconds">Nanoseconds (19 digits)</option>
                </select>
              </div>
            </div>

            {/* Error notice if invalid */}
            {!parsedResult.isValid && parsedResult.error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parsedResult.error}</span>
              </div>
            )}
          </div>

          {/* Results Grid (When Valid) */}
          {parsedResult.isValid && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              {/* Card 1: ISO 8601 UTC */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>ISO 8601 (UTC)</span>
                  <button
                    onClick={() => triggerCopy(parsedResult.iso8601, "c-iso", "Copied ISO 8601 UTC!")}
                    className="p-1 rounded hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  >
                    {copiedKey === "c-iso" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-accent font-bold truncate text-sm">{parsedResult.iso8601}</span>
              </div>

              {/* Card 2: ISO 8601 Local */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>ISO 8601 (Local Offset)</span>
                  <button
                    onClick={() => triggerCopy(parsedResult.iso8601Local, "c-isoloc", "Copied ISO 8601 Local!")}
                    className="p-1 rounded hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  >
                    {copiedKey === "c-isoloc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-text-primary font-bold truncate text-sm">{parsedResult.iso8601Local}</span>
              </div>

              {/* Card 3: RFC 2822 / GMT */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>RFC 2822 (GMT Date)</span>
                  <button
                    onClick={() => triggerCopy(parsedResult.utcString, "c-rfc", "Copied RFC 2822!")}
                    className="p-1 rounded hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  >
                    {copiedKey === "c-rfc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-text-primary font-bold truncate text-xs">{parsedResult.utcString}</span>
              </div>

              {/* Card 4: Unix Seconds */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>Unix Epoch (Seconds)</span>
                  <button
                    onClick={() => triggerCopy(parsedResult.epochSeconds.toString(), "c-sec", "Copied Epoch Seconds!")}
                    className="p-1 rounded hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  >
                    {copiedKey === "c-sec" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-text-primary font-bold text-base">{parsedResult.epochSeconds}</span>
              </div>

              {/* Card 5: Unix Milliseconds */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>Unix Epoch (Milliseconds)</span>
                  <button
                    onClick={() => triggerCopy(parsedResult.epochMilliseconds.toString(), "c-ms", "Copied Milliseconds!")}
                    className="p-1 rounded hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  >
                    {copiedKey === "c-ms" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-text-primary font-bold text-base">{parsedResult.epochMilliseconds}</span>
              </div>

              {/* Card 6: SQL DateTime */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>SQL DateTime Format</span>
                  <button
                    onClick={() => triggerCopy(parsedResult.sqlTimestamp, "c-sql", "Copied SQL DateTime!")}
                    className="p-1 rounded hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  >
                    {copiedKey === "c-sql" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-emerald-400 font-bold truncate text-sm">{parsedResult.sqlTimestamp}</span>
              </div>

              {/* Card 7: Excel Serial Date */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>Excel Serial Date</span>
                  <button
                    onClick={() => triggerCopy(parsedResult.excelSerial.toString(), "c-excel", "Copied Excel Serial!")}
                    className="p-1 rounded hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                  >
                    {copiedKey === "c-excel" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-text-primary font-bold text-base">{parsedResult.excelSerial}</span>
              </div>

              {/* Card 8: Relative Elapsed Time */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>Relative Elapsed Time</span>
                  <span className="text-[10px] text-text-muted">vs Now</span>
                </div>
                <span className="text-purple-400 font-bold text-sm font-sans">{parsedResult.relativeTime}</span>
              </div>

              {/* Card 9: Calendar Metrics */}
              <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-2 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted font-sans font-semibold">
                  <span>Calendar Metrics</span>
                  <span className="text-text-primary">{parsedResult.dayOfWeek}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted font-sans">
                  <span>Day: {parsedResult.dayOfYear}/366</span>
                  <span>Week #{parsedResult.weekOfYear}</span>
                  <span>{parsedResult.isLeapYear ? "Leap Year" : "Regular Year"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Custom Format Pattern Builder Card */}
          {parsedResult.isValid && (
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    Custom Format Pattern Generator
                  </h3>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCustomPatternUtc}
                    onChange={(e) => setIsCustomPatternUtc(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                  <span className="text-text-secondary font-semibold">Format as UTC</span>
                </label>
              </div>

              {/* Pattern Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-text-muted font-medium shrink-0">Presets:</span>
                {CUSTOM_FORMAT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomPattern(p.pattern)}
                    className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary text-[11px] whitespace-nowrap transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Pattern Input & Live Result */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Pattern Template (YYYY, MM, DD, HH, mm, ss, SSS, A)
                  </label>
                  <input
                    type="text"
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Formatted Result</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formattedCustomDate}
                      className="w-full bg-surface-raised border border-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-accent font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => triggerCopy(formattedCustomDate, "c-custom", "Copied formatted date!")}
                      className="px-3 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs flex items-center gap-1 shadow-sm shrink-0"
                    >
                      {copiedKey === "c-custom" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* World Clock Matrix */}
          {parsedResult.isValid && (
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Globe className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Global World Timezone Synchronizer
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
                {parsedResult.timezones.map((tz, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-raised border border-border flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-sans font-bold text-text-primary truncate">{tz.name}</span>
                      <span className="text-text-muted text-[11px] truncate">{tz.formatted}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] text-accent font-bold shrink-0">
                      {tz.offset}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATE PICKER TO FORMATS */}
      {activeTab === "dateToEpoch" && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Interactive Date & Time Component Picker
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={setCustomToNow}
                className="px-3 py-1.5 rounded-lg bg-accent/15 hover:bg-accent/25 border border-accent/30 text-xs font-semibold text-accent transition-colors"
              >
                Set to Current Time
              </button>
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border text-xs">
                <button
                  onClick={() => setIsCustomUtc(true)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    isCustomUtc ? "bg-accent text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  UTC Time
                </button>
                <button
                  onClick={() => setIsCustomUtc(false)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    !isCustomUtc ? "bg-accent text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Local Time
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Input Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-text-secondary">Year</label>
              <input
                type="number"
                value={customYear}
                onChange={(e) => setCustomYear(parseInt(e.target.value) || 0)}
                className="bg-surface-raised border border-border rounded-xl p-2.5 font-mono text-center text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-text-secondary">Month (1-12)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={customMonth}
                onChange={(e) => setCustomMonth(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                className="bg-surface-raised border border-border rounded-xl p-2.5 font-mono text-center text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-text-secondary">Day (1-31)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={customDay}
                onChange={(e) => setCustomDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                className="bg-surface-raised border border-border rounded-xl p-2.5 font-mono text-center text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-text-secondary">Hour (0-23)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={customHour}
                onChange={(e) => setCustomHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                className="bg-surface-raised border border-border rounded-xl p-2.5 font-mono text-center text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-text-secondary">Minute (0-59)</label>
              <input
                type="number"
                min={0}
                max={59}
                value={customMinute}
                onChange={(e) => setCustomMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="bg-surface-raised border border-border rounded-xl p-2.5 font-mono text-center text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-text-secondary">Second (0-59)</label>
              <input
                type="number"
                min={0}
                max={59}
                value={customSecond}
                onChange={(e) => setCustomSecond(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="bg-surface-raised border border-border rounded-xl p-2.5 font-mono text-center text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Quick Output Conversion Cards for Date Picker */}
          {pickerResult.isValid && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono pt-2">
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex flex-col gap-1">
                <span className="text-text-muted font-sans">Unix Epoch Seconds</span>
                <span className="text-accent font-bold text-base">{pickerResult.epochSeconds}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex flex-col gap-1">
                <span className="text-text-muted font-sans">ISO 8601 UTC</span>
                <span className="text-text-primary font-bold text-xs truncate">{pickerResult.iso8601}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex flex-col gap-1">
                <span className="text-text-muted font-sans">RFC 2822 GMT</span>
                <span className="text-text-primary font-bold text-xs truncate">{pickerResult.utcString}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TIME DIFFERENCE CALCULATOR */}
      {activeTab === "difference" && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Hourglass className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Time Difference & Duration Calculator
              </h2>
            </div>
            <div className="text-xs text-text-muted">
              Compare any two dates, timestamps, or ISO strings
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Start Date / Timestamp</label>
              <input
                type="text"
                value={diffStartInput}
                onChange={(e) => setDiffStartInput(e.target.value)}
                placeholder="2024-01-01T00:00:00Z or epoch..."
                className="w-full bg-surface-raised border border-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">End Date / Timestamp</label>
              <input
                type="text"
                value={diffEndInput}
                onChange={(e) => setDiffEndInput(e.target.value)}
                placeholder="2024-01-15T12:00:00Z or epoch..."
                className="w-full bg-surface-raised border border-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {diffResult.isValid ? (
            <div className="flex flex-col gap-4">
              {/* Highlight Result Card */}
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex flex-col gap-1">
                <span className="text-xs text-text-muted font-sans font-semibold">
                  Elapsed Duration {diffResult.isPast && "(Negative Time Shift)"}
                </span>
                <span className="text-lg md:text-xl font-bold text-accent font-sans">
                  {diffResult.humanDuration}
                </span>
              </div>

              {/* Metric Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-surface-raised border border-border flex flex-col gap-0.5">
                  <span className="text-text-muted font-sans">Total Days</span>
                  <span className="text-text-primary font-bold text-base">{diffResult.totalDays}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised border border-border flex flex-col gap-0.5">
                  <span className="text-text-muted font-sans">Working Days</span>
                  <span className="text-emerald-400 font-bold text-base">{diffResult.workdays}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised border border-border flex flex-col gap-0.5">
                  <span className="text-text-muted font-sans">Total Hours</span>
                  <span className="text-text-primary font-bold text-base">{diffResult.totalHours}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised border border-border flex flex-col gap-0.5">
                  <span className="text-text-muted font-sans">Total Seconds</span>
                  <span className="text-text-primary font-bold text-base">{diffResult.totalSeconds}</span>
                </div>
              </div>
            </div>
          ) : (
            diffResult.error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{diffResult.error}</span>
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 4: BATCH & CODE SNIPPETS */}
      {activeTab === "batch" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Multi-line Batch Log Parser */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
                <FileCode className="w-4 h-4 text-accent" />
                <span>Batch Timestamp Log Parser</span>
              </div>
              <span className="text-xs text-text-muted">{batchResults.length} lines</span>
            </div>

            <textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              rows={8}
              className="w-full bg-surface-raised border border-border rounded-xl p-3 font-mono text-xs text-text-primary focus:outline-none focus:border-accent"
              placeholder="Paste timestamps or ISO strings, one per line..."
            />

            <div className="overflow-x-auto max-h-60 rounded-xl border border-border">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-raised text-text-muted border-b border-border">
                  <tr>
                    <th className="p-2">Input</th>
                    <th className="p-2">Seconds</th>
                    <th className="p-2">UTC Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batchResults.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-raised/40">
                      <td className="p-2 text-text-secondary truncate max-w-[120px]">{item.input}</td>
                      <td className="p-2 text-accent font-bold">{item.epochSeconds ?? "Invalid"}</td>
                      <td className="p-2 text-text-primary truncate max-w-[160px]">{item.utc ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Code Snippets in 8 Languages */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
                <Code2 className="w-4 h-4 text-accent" />
                <span>Developer Code Snippets ({activeSnippetLang})</span>
              </div>
              <span className="text-[11px] text-text-muted font-mono">Epoch: {targetEpochForSnippets}</span>
            </div>

            {/* Language Selection Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {Object.keys(snippets).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveSnippetLang(lang)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all capitalize ${
                    activeSnippetLang === lang
                      ? "bg-accent text-white shadow-xs"
                      : "bg-surface-raised text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Snippet Code View */}
            {snippets[activeSnippetLang] && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-text-secondary">Get Current Time:</span>
                  <pre className="p-2.5 bg-surface-raised rounded-xl text-xs font-mono text-accent overflow-x-auto border border-border">
                    {snippets[activeSnippetLang].current}
                  </pre>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-text-secondary">Parse Timestamp to Date:</span>
                  <pre className="p-2.5 bg-surface-raised rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-border">
                    {snippets[activeSnippetLang].parse}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Educational Reference Guide */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <HelpCircle className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-text-primary">
            Standard Timestamp Formats: ISO 8601, RFC 2822, and Epoch Standards
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-text-secondary leading-relaxed">
          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              ISO 8601 Standard
            </h3>
            <p>
              The international standard for date and time formatting (<code className="text-accent">YYYY-MM-DDTHH:mm:ss.sssZ</code>). The trailing <code className="text-accent">Z</code> denotes UTC zero offset. Essential for JSON APIs, database storage, and cross-platform date transmission.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              RFC 2822 (Email / HTTP Date)
            </h3>
            <p>
              Standardized format used by HTTP header responses (<code className="text-emerald-300">Date</code>, <code className="text-emerald-300">Last-Modified</code>) and email headers (<code className="text-emerald-300">Mon, 15 Jan 2024 12:30:00 GMT</code>).
            </p>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-surface-raised rounded-xl border border-border">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Unix Epoch & Year 2038
            </h3>
            <p>
              Total elapsed seconds since 00:00:00 UTC on January 1, 1970. On January 19, 2038 at 03:14:07 UTC, 32-bit signed integer timestamps will overflow (the Y2038 bug). 64-bit timestamps will safely function for billions of years.
            </p>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
