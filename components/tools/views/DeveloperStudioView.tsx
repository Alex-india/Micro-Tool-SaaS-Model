"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Copy, Check, Code2, RefreshCw, Terminal, Clock, CheckCircle2, AlertCircle, Hash, Clipboard } from "lucide-react";
import { formatSql, minifySql } from "@/tools/developer/sqlEngine";
import { formatCss, minifyCss } from "@/tools/developer/cssEngine";

export interface DeveloperStudioViewProps {
  tool: ToolMeta;
}

export const DeveloperStudioView: React.FC<DeveloperStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // --- Mode detections ---
  const isBase64 = slug.includes("base64");
  const isUrl = slug === "url-encoder" || slug === "url-decoder" || (slug.startsWith("url-") && !slug.includes("parser"));
  const isUuid = slug.includes("uuid");
  const isTimestamp = slug.includes("timestamp") || slug.includes("unix");
  const isUnixTimestamp = slug.includes("unix");
  const isRegex = slug.includes("regex");
  const isCron = slug.includes("cron");
  const isSql = slug.includes("sql");
  const isCss = slug.includes("css");
  const isHash = slug.includes("hash") || slug.includes("sha") || slug.includes("md5");
  const isHtmlEntity = slug.includes("html-encoder") || slug.includes("html-decoder") || slug.includes("entity");
  const hasToggle = isBase64 || isUrl || isHtmlEntity || isCss;

  // B3/B5/B7/B18 FIX: Smart mode default — decoder pages default to "decode"
  const defaultMode = slug.includes("decoder") || slug.includes("decode") ? "decode" : "encode";

  // General & Base64/URL States
  const [inputText, setInputText] = useState<string>("");
  const [mode, setMode] = useState<"encode" | "decode">(defaultMode);
  const [copied, setCopied] = useState<boolean>(false);

  // UUID Generator States
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidUppercase, setUuidUppercase] = useState<boolean>(false);
  const [uuidHyphens, setUuidHyphens] = useState<boolean>(true);
  const [uuidRefreshKey, setUuidRefreshKey] = useState<number>(0);

  // Timestamp States
  const [epochInput, setEpochInput] = useState<string>("");
  const [datePickerInput, setDatePickerInput] = useState<string>("");
  const [isoStringInput, setIsoStringInput] = useState<string>("");
  const [liveTimestamp, setLiveTimestamp] = useState<number>(Math.floor(Date.now() / 1000));

  // Regex Tester States
  const [regexPattern, setRegexPattern] = useState<string>("");
  const [regexFlags, setRegexFlags] = useState<string>("g");
  const [regexReplacement, setRegexReplacement] = useState<string>("");

  // Cron Expression States
  const [cronMin, setCronMin] = useState<string>("0");
  const [cronHour, setCronHour] = useState<string>("9");
  const [cronDay, setCronDay] = useState<string>("*");
  const [cronMonth, setCronMonth] = useState<string>("*");
  const [cronWeekday, setCronWeekday] = useState<string>("1-5");

  // Hash state
  const [hashOutput, setHashOutput] = useState<string>("");

  // Live timestamp ticker for unix-timestamp-converter
  useEffect(() => {
    if (!isUnixTimestamp) return;
    const timer = setInterval(() => {
      setLiveTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isUnixTimestamp]);

  // B9 FIX: Multi-algorithm Web Crypto Hash (SHA-1, SHA-256, SHA-384, SHA-512)
  useEffect(() => {
    if (!isHash) return;
    let isCancelled = false;

    const computeAllHashes = async () => {
      if (!inputText) {
        if (!isCancelled) setHashOutput("Enter text to generate cryptographic hashes.");
        return;
      }

      try {
        const data = new TextEncoder().encode(inputText);
        const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
        const results: string[] = [];

        for (const algo of algorithms) {
          const buf = await crypto.subtle.digest(algo, data);
          const hex = Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          results.push(`${algo}:\n${hex}`);
        }

        if (!isCancelled) {
          setHashOutput(results.join("\n\n"));
        }
      } catch (e: any) {
        if (!isCancelled) setHashOutput(`Error computing hashes: ${e.message}`);
      }
    };

    computeAllHashes();
    return () => {
      isCancelled = true;
    };
  }, [inputText, isHash]);

  // B15 FIX: Tokenizer-aware SQL Formatter & Minifier
  const formatSQL = useCallback((sql: string): string => {
    if (!sql.trim()) return "";
    if (mode === "decode") {
      return minifySql(sql);
    }
    return formatSql(sql).formattedSql;
  }, [mode]);

  // B17 FIX: Professional CSS Formatter & Minifier
  const formatCSS = useCallback((css: string): string => {
    if (!css.trim()) return "";
    if (mode === "decode") {
      return minifyCss(css);
    }
    return formatCss(css).formattedCss;
  }, [mode]);

  // B23 FIX: Enhanced Cron Description with next 5 run times
  const cronDescription = useMemo(() => {
    const expr = `${cronMin} ${cronHour} ${cronDay} ${cronMonth} ${cronWeekday}`;

    // Parse cron field
    const parseCronField = (field: string, max: number): number[] => {
      if (field === "*") return Array.from({ length: max + 1 }, (_, i) => i);
      const values = new Set<number>();
      for (const part of field.split(",")) {
        const stepMatch = part.match(/^(\*|\d+(?:-\d+)?)\/(\d+)$/);
        if (stepMatch) {
          const step = parseInt(stepMatch[2]);
          let start = 0;
          let end = max;
          if (stepMatch[1] !== "*") {
            const range = stepMatch[1].split("-").map(Number);
            start = range[0];
            end = range.length > 1 ? range[1] : max;
          }
          for (let v = start; v <= end; v += step) values.add(v);
        } else if (part.includes("-")) {
          const [s, e] = part.split("-").map(Number);
          for (let v = s; v <= e; v++) values.add(v);
        } else {
          values.add(parseInt(part));
        }
      }
      return Array.from(values).filter((v) => !isNaN(v) && v >= 0 && v <= max).sort((a, b) => a - b);
    };

    const minutes = parseCronField(cronMin, 59);
    const hours = parseCronField(cronHour, 23);
    const daysOfMonth = parseCronField(cronDay, 31);
    const months = parseCronField(cronMonth, 12);
    const weekdays = parseCronField(cronWeekday, 7);

    // Human-readable description
    let desc = "";
    if (cronMin === "*") desc += "Every minute";
    else if (cronMin.includes("/")) desc += `Every ${cronMin.split("/")[1]} minutes`;
    else desc += `At minute ${cronMin}`;

    if (cronHour === "*") desc += ", every hour";
    else if (cronHour.includes("/")) desc += `, every ${cronHour.split("/")[1]} hours`;
    else desc += `, at hour ${cronHour}`;

    if (cronWeekday !== "*") {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      if (cronWeekday === "1-5") desc += ", Monday through Friday";
      else if (cronWeekday === "0,6" || cronWeekday === "6,0") desc += ", weekends only";
      else {
        const names = weekdays.map((d) => dayNames[d % 7] || `Day ${d}`).join(", ");
        desc += `, on ${names}`;
      }
    }

    if (cronDay !== "*") desc += `, on day-of-month ${cronDay}`;
    if (cronMonth !== "*") {
      const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const names = months.map((m) => monthNames[m] || `Month ${m}`).join(", ");
      desc += `, in ${names}`;
    }

    // Calculate next 5 runs
    const nextRuns: string[] = [];
    const now = new Date();
    const check = new Date(now);
    check.setSeconds(0, 0);

    for (let attempt = 0; attempt < 10000 && nextRuns.length < 5; attempt++) {
      check.setMinutes(check.getMinutes() + 1);
      const m = check.getMinutes();
      const h = check.getHours();
      const dom = check.getDate();
      const mo = check.getMonth() + 1;
      const dow = check.getDay();

      if (
        minutes.includes(m) &&
        hours.includes(h) &&
        (cronDay === "*" || daysOfMonth.includes(dom)) &&
        (cronMonth === "*" || months.includes(mo)) &&
        (cronWeekday === "*" || weekdays.includes(dow))
      ) {
        nextRuns.push(
          check.toLocaleString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      }
    }

    return { expr, desc, nextRuns };
  }, [cronMin, cronHour, cronDay, cronMonth, cronWeekday]);

  // General Synchronous Output
  const output = useMemo(() => {
    try {
      // B2 FIX: Base64 with proper UTF-8 via TextEncoder/TextDecoder
      if (isBase64) {
        if (mode === "encode") {
          const bytes = new TextEncoder().encode(inputText);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary);
        } else {
          try {
            const binary = atob(inputText);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            return new TextDecoder().decode(bytes);
          } catch {
            return "❌ Invalid Base64 string. Please check the input.";
          }
        }
      } else if (isUrl) {
        if (mode === "encode") {
          return encodeURIComponent(inputText);
        } else {
          try {
            return decodeURIComponent(inputText);
          } catch {
            return "❌ Invalid URL-encoded string. Please check the input.";
          }
        }
      } else if (isUuid) {
        const list: string[] = [];
        for (let i = 0; i < uuidCount; i++) {
          let id = crypto.randomUUID();
          if (!uuidHyphens) id = id.replace(/-/g, "");
          if (uuidUppercase) id = id.toUpperCase();
          list.push(id);
        }
        return list.join("\n");
      } else if (isTimestamp) {
        // Differentiate between unix-timestamp-converter and timestamp-converter
        if (!isUnixTimestamp) {
          // B12 FIX: timestamp-converter — handles ISO 8601 / date strings
          if (isoStringInput.trim()) {
            const date = new Date(isoStringInput.trim());
            if (isNaN(date.getTime())) {
              return "❌ Invalid date string. Supported formats:\n• ISO 8601: 2024-01-15T12:30:00Z\n• RFC 2822: Mon, 15 Jan 2024 12:30:00 GMT\n• Date string: January 15, 2024 12:30:00";
            }
            const epoch = Math.floor(date.getTime() / 1000);
            const relDiff = Math.floor(Date.now() / 1000) - epoch;
            let relative = "";
            if (Math.abs(relDiff) < 60) relative = relDiff >= 0 ? `${relDiff} seconds ago` : `in ${Math.abs(relDiff)} seconds`;
            else if (Math.abs(relDiff) < 3600) relative = relDiff >= 0 ? `${Math.floor(relDiff / 60)} minutes ago` : `in ${Math.floor(Math.abs(relDiff) / 60)} minutes`;
            else if (Math.abs(relDiff) < 86400) relative = relDiff >= 0 ? `${Math.floor(relDiff / 3600)} hours ago` : `in ${Math.floor(Math.abs(relDiff) / 3600)} hours`;
            else if (Math.abs(relDiff) < 2592000) relative = relDiff >= 0 ? `${Math.floor(relDiff / 86400)} days ago` : `in ${Math.floor(Math.abs(relDiff) / 86400)} days`;
            else if (Math.abs(relDiff) < 31536000) relative = relDiff >= 0 ? `${Math.floor(relDiff / 2592000)} months ago` : `in ${Math.floor(Math.abs(relDiff) / 2592000)} months`;
            else relative = relDiff >= 0 ? `${Math.floor(relDiff / 31536000)} years ago` : `in ${Math.floor(Math.abs(relDiff) / 31536000)} years`;

            return [
              `UTC ISO 8601:  ${date.toISOString()}`,
              `Local Time:    ${date.toLocaleString()}`,
              `UTC String:    ${date.toUTCString()}`,
              `Unix Seconds:  ${epoch}`,
              `Milliseconds:  ${date.getTime()}`,
              `Relative:      ${relative}`,
              `Day of Week:   ${date.toLocaleDateString("en-US", { weekday: "long" })}`,
            ].join("\n");
          }
          if (epochInput.trim()) {
            const epochNum = parseInt(epochInput, 10);
            if (isNaN(epochNum)) return "❌ Invalid input. Enter a Unix timestamp or ISO date string.";
            const ts = epochInput.trim().length >= 13 ? epochNum : epochNum * 1000;
            const date = new Date(ts);
            return [
              `UTC ISO 8601:  ${date.toISOString()}`,
              `Local Time:    ${date.toLocaleString()}`,
              `UTC String:    ${date.toUTCString()}`,
              `Unix Seconds:  ${Math.floor(date.getTime() / 1000)}`,
              `Milliseconds:  ${date.getTime()}`,
            ].join("\n");
          }
          return "Enter an ISO 8601 date string or Unix timestamp to convert.";
        }

        // unix-timestamp-converter
        if (!epochInput.trim()) return `Current Unix Timestamp: ${liveTimestamp}\n\nEnter a timestamp above to convert.`;
        const epochSec = parseInt(epochInput, 10);
        if (isNaN(epochSec)) return "❌ Invalid Unix timestamp. Enter a numeric value.";
        // B10 FIX: 10 digits = seconds, 13+ = milliseconds
        const ts = epochInput.trim().length >= 13 ? epochSec : epochSec * 1000;
        const date = new Date(ts);
        if (isNaN(date.getTime())) return "❌ Invalid timestamp value.";
        return [
          `UTC ISO 8601:  ${date.toISOString()}`,
          `Local Time:    ${date.toLocaleString()}`,
          `UTC String:    ${date.toUTCString()}`,
          `Unix Seconds:  ${Math.floor(date.getTime() / 1000)}`,
          `Milliseconds:  ${date.getTime()}`,
          ``,
          `Current:       ${liveTimestamp}`,
        ].join("\n");
      } else if (isRegex) {
        // B13/B14 FIX: Safe regex with error handling
        if (!regexPattern) return "Enter a regex pattern and test text to evaluate.";
        try {
          const re = new RegExp(regexPattern, regexFlags);
          let matches: string[];
          if (regexFlags.includes("g")) {
            matches = Array.from(inputText.matchAll(re)).map(
              (m, idx) => `Match #${idx + 1}: "${m[0]}" at index ${m.index}${m.length > 1 ? ` | Groups: ${m.slice(1).join(", ")}` : ""}`
            );
          } else {
            const m = inputText.match(re);
            if (m) {
              matches = [`Match: "${m[0]}" at index ${m.index}${m.length > 1 ? ` | Groups: ${m.slice(1).join(", ")}` : ""}`];
            } else {
              matches = [];
            }
          }
          const replaced = inputText.replace(re, regexReplacement);
          return `--- MATCHES (${matches.length} found) ---\n${matches.join("\n") || "No matches found"}\n\n--- REPLACEMENT PREVIEW ---\n${replaced}`;
        } catch (regexErr: any) {
          return `❌ Invalid regular expression: ${regexErr.message}`;
        }
      } else if (isHtmlEntity) {
        if (mode === "encode") {
          return inputText.replace(/[\u00A0-\u9999<>&"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
        } else {
          // B7 FIX: Use textarea trick for reliable entity decoding
          if (typeof document === "undefined") return inputText;
          const textarea = document.createElement("textarea");
          textarea.innerHTML = inputText;
          return textarea.value;
        }
      } else if (isCron) {
        // B23 FIX: Show expression, description, and next 5 runs
        const lines = [
          `CRON EXPRESSION:`,
          `${cronDescription.expr}`,
          ``,
          `HUMAN READABLE:`,
          `${cronDescription.desc}`,
          ``,
          `NEXT 5 SCHEDULED RUNS:`,
        ];
        if (cronDescription.nextRuns.length > 0) {
          cronDescription.nextRuns.forEach((run, i) => {
            lines.push(`  ${i + 1}. ${run}`);
          });
        } else {
          lines.push("  (Could not compute — expression may be too restrictive)");
        }
        return lines.join("\n");
      } else if (isSql) {
        return formatSQL(inputText);
      } else if (isCss) {
        return formatCSS(inputText);
      } else if (isHash) {
        return hashOutput || "Enter text to generate cryptographic hashes.";
      } else {
        return inputText;
      }
    } catch (e: any) {
      return `❌ Error: ${e.message}`;
    }
  }, [
    isBase64,
    isUrl,
    isUuid,
    isTimestamp,
    isUnixTimestamp,
    isRegex,
    isCron,
    isSql,
    isCss,
    isHtmlEntity,
    isHash,
    inputText,
    mode,
    uuidCount,
    uuidUppercase,
    uuidHyphens,
    uuidRefreshKey,
    epochInput,
    isoStringInput,
    liveTimestamp,
    regexPattern,
    regexFlags,
    regexReplacement,
    cronDescription,
    hashOutput,
    formatSQL,
    formatCSS,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDateToEpoch = (isoString: string) => {
    setDatePickerInput(isoString);
    const date = new Date(isoString);
    if (!isNaN(date.getTime())) {
      setEpochInput(Math.floor(date.getTime() / 1000).toString());
    }
  };

  // Toggle label customization
  const getToggleLabels = (): [string, string] => {
    if (isCss) return ["Beautify", "Minify"];
    return ["Encode", "Decode"];
  };
  const [label1, label2] = getToggleLabels();

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Input Panel */}
        <div className="lg:col-span-6 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-accent" /> Developer Input
            </h3>

            {/* Toggle Mode */}
            {hasToggle && (
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border">
                <button
                  onClick={() => setMode("encode")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    mode === "encode" ? "bg-accent text-white shadow-glow" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {label1}
                </button>
                <button
                  onClick={() => setMode("decode")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    mode === "decode" ? "bg-accent text-white shadow-glow" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {label2}
                </button>
              </div>
            )}
          </div>

          {/* 1. UUID Controls */}
          {isUuid && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="font-medium text-text-secondary">Quantity to Generate ({uuidCount})</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 25].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setUuidCount(cnt)}
                      className={`py-2 text-xs font-semibold rounded-md border transition-all ${
                        uuidCount === cnt ? "bg-accent border-accent text-white" : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {cnt} {cnt === 1 ? "UUID" : "UUIDs"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uuidUppercase}
                    onChange={(e) => setUuidUppercase(e.target.checked)}
                    className="accent-accent w-4 h-4 rounded"
                  />
                  <span>Uppercase</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uuidHyphens}
                    onChange={(e) => setUuidHyphens(e.target.checked)}
                    className="accent-accent w-4 h-4 rounded"
                  />
                  <span>Include Hyphens</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setUuidRefreshKey((k) => k + 1)}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="flex-1"
                >
                  Regenerate UUIDs
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  leftIcon={copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                >
                  {copied ? "Copied!" : "Copy All"}
                </Button>
              </div>
            </div>
          )}

          {/* 2. Timestamp Controls */}
          {isTimestamp && (
            <div className="flex flex-col gap-4">
              {/* B11 FIX: Live current timestamp display */}
              {isUnixTimestamp && (
                <div className="flex items-center justify-between p-3 bg-surface-raised rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-text-secondary font-medium">Current Epoch:</span>
                    <span className="font-mono font-bold text-accent">{liveTimestamp}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(String(liveTimestamp));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              )}

              <Input
                label="Unix Timestamp (Seconds or Milliseconds)"
                type="text"
                value={epochInput}
                onChange={(e) => setEpochInput(e.target.value)}
                placeholder="e.g. 1672531200"
              />

              {/* B12 FIX: ISO string input for timestamp-converter */}
              {!isUnixTimestamp && (
                <Input
                  label="Or Enter Date/Time String (ISO 8601, RFC 2822)"
                  type="text"
                  value={isoStringInput}
                  onChange={(e) => setIsoStringInput(e.target.value)}
                  placeholder="e.g. 2024-01-15T12:30:00Z or Jan 15, 2024"
                />
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEpochInput(Math.floor(Date.now() / 1000).toString())}
              >
                Set to Current Time (Now)
              </Button>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                <label className="text-xs font-medium text-text-secondary">Or Pick a Calendar Date</label>
                <input
                  type="datetime-local"
                  value={datePickerInput}
                  onChange={(e) => handleDateToEpoch(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* 3. Cron Controls */}
          {isCron && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-5 gap-2">
                <Input label="Minute" value={cronMin} onChange={(e) => setCronMin(e.target.value)} />
                <Input label="Hour" value={cronHour} onChange={(e) => setCronHour(e.target.value)} />
                <Input label="Day" value={cronDay} onChange={(e) => setCronDay(e.target.value)} />
                <Input label="Month" value={cronMonth} onChange={(e) => setCronMonth(e.target.value)} />
                <Input label="Weekday" value={cronWeekday} onChange={(e) => setCronWeekday(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Every Minute", m: "*", h: "*", d: "*", mo: "*", w: "*" },
                  { label: "Every 5 Min", m: "*/5", h: "*", d: "*", mo: "*", w: "*" },
                  { label: "Daily at 9 AM", m: "0", h: "9", d: "*", mo: "*", w: "*" },
                  { label: "Weekdays 9 AM", m: "0", h: "9", d: "*", mo: "*", w: "1-5" },
                  { label: "Midnight", m: "0", h: "0", d: "*", mo: "*", w: "*" },
                  { label: "Hourly", m: "0", h: "*", d: "*", mo: "*", w: "*" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCronMin(preset.m);
                      setCronHour(preset.h);
                      setCronDay(preset.d);
                      setCronMonth(preset.mo);
                      setCronWeekday(preset.w);
                    }}
                    className="p-1.5 bg-surface-raised border border-border rounded text-[11px] text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Regex Controls */}
          {isRegex && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-3">
                  <Input label="Regex Pattern" value={regexPattern} onChange={(e) => setRegexPattern(e.target.value)} placeholder="e.g. [A-Z][a-z]+" />
                </div>
                <div className="sm:col-span-1">
                  <Input label="Flags (g, i, m)" value={regexFlags} onChange={(e) => setRegexFlags(e.target.value)} placeholder="g" />
                </div>
              </div>
              <Input
                label="Replacement String"
                value={regexReplacement}
                onChange={(e) => setRegexReplacement(e.target.value)}
                placeholder="e.g. [$1]"
              />
            </div>
          )}

          {/* Hash info banner */}
          {isHash && (
            <div className="flex items-start gap-2 p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs text-text-secondary">
              <Hash className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>
                Generates <strong>SHA-1</strong>, <strong>SHA-256</strong>, <strong>SHA-384</strong>, and <strong>SHA-512</strong> hashes using the Web Crypto API.
                All computation happens in your browser — nothing is sent to any server.
              </span>
            </div>
          )}

          {/* Text Area for General Developer Input */}
          {!isUuid && !isTimestamp && !isCron && (
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-medium text-text-secondary">
                {isHash ? "Input Text to Hash" : isRegex ? "Test Text" : "Input Payload / Source Code"}
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={isHash ? 6 : 10}
                className="w-full bg-surface-raised border border-border rounded-lg p-3.5 font-mono text-xs text-text-primary outline-none focus:border-accent leading-relaxed"
                placeholder={
                  isHash
                    ? "Type or paste text here to compute hashes..."
                    : isSql
                    ? "Paste SQL query here, e.g. select * from users where active = 1..."
                    : isCss
                    ? "Paste CSS code here, e.g. body { color: red; background: blue; }..."
                    : isRegex
                    ? "Enter test text to match against the regex pattern..."
                    : "Type or paste input payload here..."
                }
              />
            </div>
          )}
        </div>

        {/* Right Column Output Panel */}
        <div className="lg:col-span-6 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card sticky top-20">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> {isHash ? "Hash Output" : "Formatted Output"}
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? "Copied!" : "Copy Result"}
            </Button>
          </div>

          <pre className="w-full bg-surface-raised border border-border rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto min-h-[220px] max-h-[460px] whitespace-pre-wrap leading-relaxed select-all">
            {output}
          </pre>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
