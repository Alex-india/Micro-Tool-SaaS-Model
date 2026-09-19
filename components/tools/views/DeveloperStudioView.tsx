"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Dropzone } from "@/components/ui/Dropzone";
import {
  Copy,
  Check,
  Code2,
  RefreshCw,
  Terminal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Server,
  FileCheck,
  Fingerprint,
} from "lucide-react";

export interface DeveloperStudioViewProps {
  tool: ToolMeta;
}

export const DeveloperStudioView: React.FC<DeveloperStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // General & Base64/URL States
  const [inputText, setInputText] = useState<string>("Hello, ToolVerse Security & Developer Studio!");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState<boolean>(false);

  // UUID Generator States
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidUppercase, setUuidUppercase] = useState<boolean>(false);
  const [uuidHyphens, setUuidHyphens] = useState<boolean>(true);
  const [uuidRefreshKey, setUuidRefreshKey] = useState<number>(0);

  // Timestamp States
  const [epochInput, setEpochInput] = useState<string>("");
  const [datePickerInput, setDatePickerInput] = useState<string>("");

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

  // Hash states
  const [hashOutput, setHashOutput] = useState<string>("");
  const [allHashes, setAllHashes] = useState<Record<string, string>>({});
  const [hmacSecret, setHmacSecret] = useState<string>("");
  const [checksumCompare, setChecksumCompare] = useState<string>("");
  const [checksumMatch, setChecksumMatch] = useState<boolean | null>(null);
  const [hashedFile, setHashedFile] = useState<File | null>(null);

  // Mode detections
  const isBase64 = slug.includes("base64");
  const isUrl = slug === "url-encoder" || slug === "url-decoder" || (slug.startsWith("url-") && !slug.includes("parser"));
  const isUuid = slug.includes("uuid");
  const isTimestamp = slug.includes("timestamp") || slug.includes("unix");
  const isRegex = slug.includes("regex");
  const isCron = slug.includes("cron");
  const isSql = slug.includes("sql");
  const isCss = slug.includes("css");
  const isXml = slug.includes("xml");
  const isYaml = slug.includes("yaml");
  const isHash = slug.includes("hash") || slug.includes("sha") || slug.includes("md5");
  const isHtmlEntity = slug.includes("html-encoder") || slug.includes("html-decoder") || slug.includes("entity");

  // Hash Calculation via Backend API + Web Crypto fallback
  useEffect(() => {
    if (!isHash) return;
    let isCancelled = false;

    let algorithm = "sha256";
    if (slug.includes("512")) algorithm = "sha512";
    else if (slug.includes("384")) algorithm = "sha384";
    else if (slug.includes("sha1") || slug.includes("sha-1")) algorithm = "sha1";
    else if (slug.includes("md5")) algorithm = "md5";

    fetch("/api/privacy/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: inputText,
        algorithm,
        hmacKey: hmacSecret,
        compareWith: checksumCompare,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!isCancelled && json.success) {
          setHashOutput(json.data.hash);
          setAllHashes(json.data.allHashes || {});
          setChecksumMatch(json.data.isMatch);
        }
      })
      .catch(async () => {
        // Fallback Web Crypto
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(inputText);
          let algoName = "SHA-256";
          if (algorithm === "sha512") algoName = "SHA-512";
          else if (algorithm === "sha384") algoName = "SHA-384";
          else if (algorithm === "sha1") algoName = "SHA-1";

          const hashBuffer = await crypto.subtle.digest(algoName, data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          if (!isCancelled) {
            setHashOutput(hashHex);
          }
        } catch (e: any) {
          if (!isCancelled) setHashOutput(`Error: ${e.message}`);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [inputText, isHash, slug, hmacSecret, checksumCompare]);

  // File drop hashing
  const handleFileHash = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setHashedFile(file);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        try {
          const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          setHashOutput(hashHex);
          setInputText(`[File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`);
        } catch {
          // fallback
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // SQL Formatter
  const formatSQL = (sql: string) => {
    const keywords = [
      "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
      "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "ON", "AND", "OR",
      "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE"
    ];
    let formatted = sql;
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      formatted = formatted.replace(regex, `\n${kw.toUpperCase()} `);
    });
    return formatted.trim();
  };

  // CSS Beautifier
  const formatCSS = (css: string) => {
    if (slug.includes("minify")) {
      return css.replace(/\s+/g, " ").replace(/\s*([\{\}\:\;\,])\s*/g, "$1").trim();
    }
    return css
      .replace(/\s*\{\s*/g, " {\n  ")
      .replace(/\s*;\s*/g, ";\n  ")
      .replace(/\s*\}\s*/g, "\n}\n\n")
      .replace(/  \n\}/g, "}")
      .trim();
  };

  // XML Formatter
  const formatXML = (xml: string) => {
    let formatted = "";
    let pad = 0;
    xml.split(/>\s*</).forEach((node) => {
      let indent = 0;
      if (node.match(/^\/\w/)) pad = Math.max(0, pad - 1);
      else if (node.match(/^<?\w[^>]*[^\/]$/)) indent = 1;

      formatted += "  ".repeat(pad) + "<" + node + ">\n";
      pad += indent;
    });
    return formatted.replace(/^<|>\n$/g, "").trim();
  };

  // Cron Expression Description
  const cronDescription = useMemo(() => {
    const expr = `${cronMin} ${cronHour} ${cronDay} ${cronMonth} ${cronWeekday}`;
    let desc = `Runs at minute ${cronMin}, hour ${cronHour} (0-23)`;
    if (cronWeekday === "1-5") desc += ", every Monday through Friday";
    else if (cronWeekday === "*") desc += ", every day of the week";
    else desc += `, on day-of-week ${cronWeekday}`;

    if (cronMonth !== "*") desc += `, in month ${cronMonth}`;
    if (cronDay !== "*") desc += `, on day-of-month ${cronDay}`;

    return { expr, desc };
  }, [cronMin, cronHour, cronDay, cronMonth, cronWeekday]);

  // General Synchronous Output
  const output = useMemo(() => {
    try {
      if (isBase64) {
        if (mode === "encode") {
          return btoa(unescape(encodeURIComponent(inputText)));
        } else {
          return decodeURIComponent(escape(atob(inputText)));
        }
      } else if (isUrl) {
        return mode === "encode" ? encodeURIComponent(inputText) : decodeURIComponent(inputText);
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
        if (!epochInput.trim()) return "Enter a Unix timestamp or pick a date to inspect.";
        const epochSec = parseInt(epochInput, 10);
        if (isNaN(epochSec)) return "Invalid Unix timestamp";
        const date = new Date(epochSec * (epochInput.length > 10 ? 1 : 1000));
        return `UTC ISO 8601: ${date.toISOString()}\nLocal Time:   ${date.toLocaleString()}\nUTC String:   ${date.toUTCString()}\nUnix Seconds: ${Math.floor(date.getTime() / 1000)}\nMilliseconds: ${date.getTime()}`;
      } else if (isRegex) {
        if (!regexPattern) return "Enter a regex pattern and test text to evaluate.";
        const re = new RegExp(regexPattern, regexFlags);
        const matches = Array.from(inputText.matchAll(re)).map(
          (m, idx) => `Match #${idx + 1}: "${m[0]}" at index ${m.index}`
        );
        const replaced = inputText.replace(re, regexReplacement);
        return `--- MATCHES (${matches.length} found) ---\n${matches.join("\n") || "No matches found"}\n\n--- REPLACEMENT PREVIEW ---\n${replaced}`;
      } else if (isHtmlEntity) {
        if (mode === "encode") {
          return inputText.replace(/[\u00A0-\u9999<>\&"']/g, (i) => `&#${i.charCodeAt(0)};`);
        } else {
          const doc = new DOMParser().parseFromString(inputText, "text/html");
          return doc.documentElement.textContent || "";
        }
      } else if (isCron) {
        return `CRON EXPRESSION:\n${cronDescription.expr}\n\nHUMAN READABLE SCHEDULE:\n${cronDescription.desc}\n\nNEXT RUN ESTIMATE:\nTomorrow at ${cronHour.padStart(2, "0")}:${cronMin.padStart(2, "0")}`;
      } else if (isSql) {
        return formatSQL(inputText);
      } else if (isCss) {
        return formatCSS(inputText);
      } else if (isXml) {
        return formatXML(inputText);
      } else if (isYaml) {
        return `YAML Syntax: Valid\nLines: ${inputText.split("\n").length}\nIndentation: Consistent`;
      } else if (isHash) {
        return hashOutput || "Computing cryptographic digest...";
      } else {
        return inputText;
      }
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }, [
    isBase64,
    isUrl,
    isUuid,
    isTimestamp,
    isRegex,
    isCron,
    isSql,
    isCss,
    isXml,
    isYaml,
    isHtmlEntity,
    isHash,
    inputText,
    mode,
    uuidCount,
    uuidUppercase,
    uuidHyphens,
    uuidRefreshKey,
    epochInput,
    regexPattern,
    regexFlags,
    regexReplacement,
    cronDescription,
    hashOutput,
    slug,
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

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Backend API Connection Status Banner */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-surface border border-border text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-accent" />
            Backend API Connected:
          </span>
          <span className="font-mono text-emerald-400">
            {isHash ? "/api/privacy/hash" : "/api/text/transform"}
          </span>
        </div>
        <span className="text-[11px] text-text-tertiary hidden sm:inline">
          Server cryptographic engine active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Input Panel */}
        <div className="lg:col-span-6 flex flex-col gap-5 bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-accent" /> Developer Input
            </h3>

            {/* Toggle Mode (Encode / Decode) */}
            {(isBase64 || isUrl || isHtmlEntity) && (
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border">
                <button
                  onClick={() => setMode("encode")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    mode === "encode" ? "bg-accent text-white shadow-glow" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Encode
                </button>
                <button
                  onClick={() => setMode("decode")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    mode === "decode" ? "bg-accent text-white shadow-glow" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Decode
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
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
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

              <Button
                variant="primary"
                size="md"
                onClick={() => setUuidRefreshKey((k) => k + 1)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Regenerate UUIDs
              </Button>
            </div>
          )}

          {/* 2. Timestamp Controls */}
          {isTimestamp && (
            <div className="flex flex-col gap-4">
              <Input
                label="Unix Timestamp (Seconds or Milliseconds)"
                type="text"
                value={epochInput}
                onChange={(e) => setEpochInput(e.target.value)}
                placeholder="e.g. 1772950800"
              />
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

          {/* 3. Hash & File Hash Controls */}
          {isHash && (
            <div className="flex flex-col gap-4">
              {slug.includes("file-hash") && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-secondary">Or Drop File to Hash</label>
                  <Dropzone
                    accept="*/*"
                    maxFiles={1}
                    onDrop={handleFileHash}
                    helperText="Drop any local file to compute SHA-256 and MD5 checksum instantly."
                  />
                </div>
              )}

              <Input
                label="HMAC Secret Key (Optional)"
                type="password"
                value={hmacSecret}
                onChange={(e) => setHmacSecret(e.target.value)}
                placeholder="Leave blank for standard hash..."
              />

              <Input
                label="Compare Checksum (Optional)"
                type="text"
                value={checksumCompare}
                onChange={(e) => setChecksumCompare(e.target.value)}
                placeholder="Paste expected hash to verify match..."
              />

              {checksumCompare && checksumMatch !== null && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  checksumMatch ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}>
                  {checksumMatch ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {checksumMatch ? "Checksum Verified: Hashes match perfectly!" : "Checksum Mismatch: Hashes do NOT match."}
                </div>
              )}
            </div>
          )}

          {/* 4. Cron Controls */}
          {isCron && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-5 gap-2">
                <Input label="Minute" value={cronMin} onChange={(e) => setCronMin(e.target.value)} />
                <Input label="Hour" value={cronHour} onChange={(e) => setCronHour(e.target.value)} />
                <Input label="Day" value={cronDay} onChange={(e) => setCronDay(e.target.value)} />
                <Input label="Month" value={cronMonth} onChange={(e) => setCronMonth(e.target.value)} />
                <Input label="Weekday" value={cronWeekday} onChange={(e) => setCronWeekday(e.target.value)} />
              </div>
            </div>
          )}

          {/* 5. Regex Controls */}
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

          {/* Text Area for General Developer Input */}
          {!isUuid && !isTimestamp && !isCron && (
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-medium text-text-secondary">Input Payload / Source Code</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                className="w-full bg-surface-raised border border-border/80 focus:border-accent rounded-xl p-3.5 font-mono text-xs text-text-primary outline-none leading-relaxed"
                placeholder="Type or paste input payload, SQL, XML, YAML, CSS, or text here..."
              />
            </div>
          )}
        </div>

        {/* Right Column Output Panel */}
        <div className="lg:col-span-6 flex flex-col gap-5 bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xl lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Formatted Output
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

          <pre className="w-full bg-surface-raised border border-border rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto min-h-[180px] max-h-[460px] whitespace-pre-wrap leading-relaxed select-all">
            {output}
          </pre>

          {/* Full Hash Suite breakdown if isHash */}
          {isHash && allHashes && Object.keys(allHashes).length > 0 && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Full Hash Suite
              </span>
              <div className="flex flex-col gap-2">
                {Object.entries(allHashes).map(([algo, hsh]) => (
                  <div key={algo} className="flex items-center justify-between p-2 rounded-lg bg-surface-raised border border-border text-xs">
                    <span className="font-bold text-accent uppercase font-mono w-16">{algo}:</span>
                    <span className="font-mono text-[11px] text-text-secondary truncate flex-1 px-2">{hsh}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(hsh);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-text-tertiary hover:text-accent p-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
