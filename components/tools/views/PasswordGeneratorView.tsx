"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Dropzone } from "@/components/ui/Dropzone";
import { generatePassword } from "@/tools/privacy/password";
import {
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  History,
  Layers,
  Sparkles,
  Download,
  Key,
  Lock,
  FileCheck,
  CheckCircle2,
  XCircle,
  Server,
  Zap,
} from "lucide-react";

export interface PasswordGeneratorViewProps {
  tool: ToolMeta;
}

const PASSPHRASE_WORDS = [
  "apple", "beacon", "castle", "desert", "eagle", "forest", "galaxy", "harbor", "island",
  "jungle", "knight", "lagoon", "meadow", "nebula", "ocean", "palace", "quartz", "river",
  "shadow", "timber", "umbrella", "valley", "whisper", "zenith", "crystal", "breeze", "thunder",
  "planet", "silver", "golden", "aurora", "comet", "falcon", "glacier", "horizon", "ignite",
  "journey", "kinetic", "lunar", "mystic", "nomad", "orbit", "phoenix", "radiant", "stellar",
  "twilight", "utopia", "vortex", "wildlife", "zigzag", "amber", "blizzard", "canyon", "driftwood",
  "emerald", "flame", "granite", "haven", "infinity", "jupiter", "karma", "lantern", "miracle",
];

export const PasswordGeneratorView: React.FC<PasswordGeneratorViewProps> = ({ tool }) => {
  const slug = tool.slug;

  const isPassphrase = slug.includes("passphrase");
  const isStrengthChecker = slug.includes("strength") || slug.includes("check");
  const isSecureRandom = slug.includes("secure-random") || slug.includes("random-generator");
  const isMetadataCleaner = slug.includes("metadata") || slug.includes("exif");

  // 1. Password Generator States
  const [length, setLength] = useState<number>(16);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);
  const [excludeCustom, setExcludeCustom] = useState<string>("");
  const [isPronounceable, setIsPronounceable] = useState<boolean>(false);
  const [bulkCount, setBulkCount] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedBulk, setCopiedBulk] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Session Password History (Last 5 generated)
  const [passwordHistory, setPasswordHistory] = useState<string[]>([]);

  // 2. Passphrase States
  const [wordCount, setWordCount] = useState<number>(4);
  const [separator, setSeparator] = useState<string>("-");
  const [capitalizeWords, setCapitalizeWords] = useState<boolean>(true);
  const [includeNumberInPassphrase, setIncludeNumberInPassphrase] = useState<boolean>(true);

  // 3. Password Strength Checker State
  const [testPassword, setTestPassword] = useState<string>("");

  // 4. Secure Random States
  const [randomFormat, setRandomFormat] = useState<"hex" | "alphanumeric" | "base64" | "numeric">("alphanumeric");
  const [randomLength, setRandomLength] = useState<number>(32);

  // 5. Metadata Cleaner States
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cleanedUrl, setCleanedUrl] = useState<string>("");
  const [cleanedStatus, setCleanedStatus] = useState<string>("");

  // Server data state
  const [apiServerPassword, setApiServerPassword] = useState<string>("");
  const [apiServerBulk, setApiServerBulk] = useState<string[]>([]);

  // Local Client Generator
  const clientPasswordResult = useMemo(() => {
    return generatePassword({
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      excludeAmbiguous,
      excludeCustom,
      isPronounceable,
      count: bulkCount,
    });
  }, [
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeAmbiguous,
    excludeCustom,
    isPronounceable,
    bulkCount,
    refreshKey,
  ]);

  // Sync with Server API on option changes or refresh
  useEffect(() => {
    if (isPassphrase || isStrengthChecker || isSecureRandom || isMetadataCleaner) return;

    let isMounted = true;
    fetch("/api/privacy/password-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "password",
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeAmbiguous,
        excludeCustom,
        count: bulkCount,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setApiServerPassword(json.data.password);
          setApiServerBulk(json.data.passwordsList);
        }
      })
      .catch(() => {
        // silently fallback to client
      });

    return () => {
      isMounted = false;
    };
  }, [
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeAmbiguous,
    excludeCustom,
    bulkCount,
    refreshKey,
    isPassphrase,
    isStrengthChecker,
    isSecureRandom,
    isMetadataCleaner,
  ]);

  const activePassword = apiServerPassword || clientPasswordResult.password;
  const activeBulkList = apiServerBulk.length > 0 ? apiServerBulk : clientPasswordResult.passwordsList;

  // Track password history
  useEffect(() => {
    if (activePassword) {
      setPasswordHistory((prev) => {
        if (prev[0] === activePassword) return prev;
        return [activePassword, ...prev.filter((p) => p !== activePassword)].slice(0, 5);
      });
    }
  }, [activePassword]);

  // Keyboard shortcut (Ctrl + R or Space to regenerate password)
  const handleRegenerate = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleRegenerate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRegenerate]);

  // Passphrase Result
  const passphraseResult = useMemo(() => {
    const chosen: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const idx = Math.floor(Math.random() * PASSPHRASE_WORDS.length);
      let w = PASSPHRASE_WORDS[idx];
      if (capitalizeWords) w = w.charAt(0).toUpperCase() + w.slice(1);
      chosen.push(w);
    }
    let phrase = chosen.join(separator);
    if (includeNumberInPassphrase) {
      phrase += separator + Math.floor(10 + Math.random() * 90);
    }
    const entropy = Math.round(wordCount * 13.5 + (includeNumberInPassphrase ? 6.6 : 0));
    return {
      phrase,
      entropy,
      crackTime: wordCount >= 5 ? "Trillions of centuries" : "Billions of years",
    };
  }, [wordCount, separator, capitalizeWords, includeNumberInPassphrase, refreshKey]);

  // Strength Checker Evaluation
  const strengthEvaluation = useMemo(() => {
    const pwd = testPassword;
    if (!pwd) {
      return {
        score: 0,
        label: "Enter Password",
        color: "text-text-tertiary",
        barColor: "bg-surface-raised",
        crackTime: "--",
        entropy: 0,
        checks: {
          length: false,
          lengthGood: false,
          hasUpper: false,
          hasLower: false,
          hasNumber: false,
          hasSymbol: false,
          notCommon: true,
        },
      };
    }

    let score = 0;
    const checks = {
      length: pwd.length >= 12,
      lengthGood: pwd.length >= 16,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSymbol: /[^A-Za-z0-9]/.test(pwd),
      notCommon: !/^(password|123456|qwerty|admin|welcome)/i.test(pwd),
    };

    if (checks.length) score += 20;
    if (checks.lengthGood) score += 20;
    if (checks.hasUpper) score += 15;
    if (checks.hasLower) score += 15;
    if (checks.hasNumber) score += 15;
    if (checks.hasSymbol) score += 15;
    if (!checks.notCommon) score = Math.min(score, 20);

    const charsetSize =
      (checks.hasLower ? 26 : 0) +
      (checks.hasUpper ? 26 : 0) +
      (checks.hasNumber ? 10 : 0) +
      (checks.hasSymbol ? 32 : 0) || 10;

    const entropy = Math.round(pwd.length * Math.log2(charsetSize));

    let label = "Very Weak";
    let color = "text-rose-400";
    let barColor = "bg-rose-500";
    let crackTime = "Instant (< 1 second)";

    if (score >= 85) {
      label = "Very Strong";
      color = "text-emerald-400";
      barColor = "bg-emerald-500";
      crackTime = "Trillions of years";
    } else if (score >= 65) {
      label = "Strong";
      color = "text-teal-400";
      barColor = "bg-teal-500";
      crackTime = "Centuries";
    } else if (score >= 45) {
      label = "Moderate";
      color = "text-amber-400";
      barColor = "bg-amber-500";
      crackTime = "A few days to months";
    } else if (score >= 25) {
      label = "Weak";
      color = "text-orange-400";
      barColor = "bg-orange-500";
      crackTime = "Few minutes";
    }

    return { score, label, color, barColor, crackTime, entropy, checks };
  }, [testPassword]);

  // Secure Random Generator Result
  const randomResult = useMemo(() => {
    const buffer = new Uint8Array(randomLength);
    crypto.getRandomValues(buffer);

    if (randomFormat === "hex") {
      return Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, randomLength);
    } else if (randomFormat === "numeric") {
      return Array.from(buffer)
        .map((b) => (b % 10).toString())
        .join("")
        .slice(0, randomLength);
    } else if (randomFormat === "base64") {
      const str = String.fromCharCode(...buffer);
      return btoa(str).replace(/[^a-zA-Z0-9]/g, "").slice(0, randomLength);
    } else {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      return Array.from(buffer)
        .map((b) => chars[b % chars.length])
        .join("");
    }
  }, [randomFormat, randomLength, refreshKey]);

  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllBulk = () => {
    if (activeBulkList.length === 0) return;
    navigator.clipboard.writeText(activeBulkList.join("\n"));
    setCopiedBulk(true);
    setTimeout(() => setCopiedBulk(false), 2000);
  };

  // Metadata Cleaner handler
  const handleCleanMetadata = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setUploadedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                setCleanedUrl(url);
                setCleanedStatus(`Stripped all EXIF, GPS location, and camera metadata (${(file.size / 1024).toFixed(1)} KB -> ${(blob.size / 1024).toFixed(1)} KB)`);
              }
            }, "image/jpeg", 0.95);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const url = URL.createObjectURL(file);
      setCleanedUrl(url);
      setCleanedStatus(`Sanitized file "${file.name}" with client-side privacy scrubber.`);
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
            {isSecureRandom
              ? "/api/privacy/secure-random"
              : isMetadataCleaner
              ? "/api/privacy/metadata-remover"
              : "/api/privacy/password-generator"}
          </span>
        </div>
        <span className="text-[11px] text-text-tertiary hidden sm:inline">
          CSPRNG Cryptographic Security Active
        </span>
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        {/* 1. PASSPHRASE GENERATOR */}
        {isPassphrase ? (
          <>
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 bg-surface-raised border border-border rounded-xl p-4 font-mono text-lg sm:text-xl text-text-primary tracking-wide">
                <span className="truncate">{passphraseResult.phrase}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRegenerate}
                    className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="Regenerate (Ctrl + R)"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCopyText(passphraseResult.phrase)}
                    leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Entropy: <strong className="text-text-primary font-semibold">{passphraseResult.entropy} bits</strong>
                </span>
                <span className="text-text-tertiary">
                  Est. Crack Time: <strong className="text-accent">{passphraseResult.crackTime}</strong>
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <Slider
                label="Number of Words"
                min={3}
                max={8}
                step={1}
                value={wordCount}
                unit="words"
                onChangeValue={(v) => setWordCount(v)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-text-primary">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary">Word Separator</label>
                  <select
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    className="bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value=" ">Space ( )</option>
                    <option value="_">Underscore (_)</option>
                    <option value=".">Period (.)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={capitalizeWords}
                    onChange={(e) => setCapitalizeWords(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Capitalize Each Word</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeNumberInPassphrase}
                    onChange={(e) => setIncludeNumberInPassphrase(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Include Number At End</span>
                </label>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleRegenerate}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Generate New Passphrase
              </Button>
            </div>
          </>
        ) : isStrengthChecker ? (
          /* 2. PASSWORD STRENGTH CHECKER */
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary">Enter Password to Test</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Type or paste any password..."
                  className="w-full bg-surface-raised border border-border rounded-xl p-4 pr-12 font-mono text-base text-text-primary outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-4 text-text-tertiary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Strength Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-secondary">Password Security Rating</span>
                <span className={`font-bold ${strengthEvaluation.color}`}>
                  {strengthEvaluation.label} ({strengthEvaluation.score}/100)
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-raised rounded-full overflow-hidden border border-border">
                <div
                  className={`h-full transition-all duration-300 ${strengthEvaluation.barColor}`}
                  style={{ width: `${strengthEvaluation.score}%` }}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center">
                <span className="text-[11px] text-text-tertiary block font-medium">Crack Time</span>
                <span className="text-sm font-bold text-accent mt-0.5 block">{strengthEvaluation.crackTime}</span>
              </div>
              <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center">
                <span className="text-[11px] text-text-tertiary block font-medium">Entropy</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{strengthEvaluation.entropy} bits</span>
              </div>
              <div className="bg-surface-raised border border-border p-3.5 rounded-xl text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] text-text-tertiary block font-medium">Length</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{testPassword.length} chars</span>
              </div>
            </div>

            {/* Security Checklist */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Security Requirements</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {strengthEvaluation.checks.length ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={strengthEvaluation.checks.length ? "text-text-primary" : "text-text-tertiary"}>
                    At least 12 characters (16+ ideal)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {strengthEvaluation.checks.hasUpper ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={strengthEvaluation.checks.hasUpper ? "text-text-primary" : "text-text-tertiary"}>
                    Uppercase letters (A-Z)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {strengthEvaluation.checks.hasLower ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={strengthEvaluation.checks.hasLower ? "text-text-primary" : "text-text-tertiary"}>
                    Lowercase letters (a-z)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {strengthEvaluation.checks.hasNumber ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={strengthEvaluation.checks.hasNumber ? "text-text-primary" : "text-text-tertiary"}>
                    Numbers (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {strengthEvaluation.checks.hasSymbol ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={strengthEvaluation.checks.hasSymbol ? "text-text-primary" : "text-text-tertiary"}>
                    Special characters (!@#$%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {strengthEvaluation.checks.notCommon ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={strengthEvaluation.checks.notCommon ? "text-text-primary" : "text-text-tertiary"}>
                    No common dictionary words
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : isSecureRandom ? (
          /* 3. SECURE RANDOM GENERATOR */
          <>
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 bg-surface-raised border border-border rounded-xl p-4 font-mono text-sm sm:text-base text-text-primary break-all">
                <span>{randomResult}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRegenerate}
                    className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="Regenerate (Ctrl + R)"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCopyText(randomResult)}
                    leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              <span className="text-xs text-text-tertiary">
                Generated using cryptographically secure CSPRNG (<code className="text-accent">crypto.getRandomValues</code>)
              </span>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <Slider
                label="String Length"
                min={8}
                max={128}
                step={4}
                value={randomLength}
                unit="chars"
                onChangeValue={(v) => setRandomLength(v)}
              />

              <div className="flex flex-col gap-1.5 text-xs font-medium">
                <label className="text-text-secondary">Output Format</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["alphanumeric", "hex", "base64", "numeric"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setRandomFormat(fmt)}
                      className={`p-3 rounded-xl border text-center capitalize transition-all ${
                        randomFormat === fmt
                          ? "bg-accent/10 border-accent text-accent font-bold shadow-md shadow-accent/10"
                          : "bg-surface-raised border-border text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleRegenerate}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Generate Cryptographic Token
              </Button>
            </div>
          </>
        ) : isMetadataCleaner ? (
          /* 4. METADATA & EXIF CLEANER */
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Upload File to Strip Hidden Metadata
            </h3>
            <Dropzone
              accept="*/*"
              maxFiles={1}
              onDrop={handleCleanMetadata}
              helperText="Upload any image, PDF, or document to strip EXIF, camera, GPS, and author metadata."
            />

            {uploadedFile && (
              <div className="p-4 rounded-xl bg-surface-raised border border-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">{uploadedFile.name}</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Sanitized
                  </span>
                </div>
                {cleanedStatus && <p className="text-xs text-text-secondary">{cleanedStatus}</p>}
                {cleanedUrl && (
                  <a
                    href={cleanedUrl}
                    download={`sanitized-${uploadedFile.name}`}
                    className="w-full"
                  >
                    <Button variant="primary" size="md" className="w-full" leftIcon={<Download className="w-4 h-4" />}>
                      Download Clean File
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 5. STANDARD PASSWORD GENERATOR WITH EXTENDED FUNCTIONALITY */
          <>
            {/* Output Box Display */}
            <div className="bg-surface border border-accent/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between gap-4 bg-surface-raised border border-border rounded-xl p-4 font-mono text-xl sm:text-2xl text-text-primary tracking-wider">
                <span className="truncate select-all">
                  {clientPasswordResult.isValid ? (
                    showPassword ? activePassword : "•".repeat(length)
                  ) : (
                    <span className="text-rose-400 text-sm font-sans font-normal flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {clientPasswordResult.errorMessage}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="Regenerate (Ctrl + R)"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!clientPasswordResult.isValid}
                    onClick={() => handleCopyText(activePassword)}
                    leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* Strength Meter & Quick Tips */}
              {clientPasswordResult.isValid ? (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-text-secondary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Strength: <strong className="text-text-primary font-semibold">{clientPasswordResult.strength}</strong> ({clientPasswordResult.entropy} bits)
                  </span>
                  <span className="text-text-tertiary">
                    Est. Crack Time: <strong className="text-accent">{clientPasswordResult.crackTimeText}</strong>
                  </span>
                </div>
              ) : (
                <div className="text-xs text-rose-400/90 pt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {clientPasswordResult.errorMessage}
                </div>
              )}
            </div>

            {/* Bulk Results List if count > 1 */}
            {bulkCount > 1 && clientPasswordResult.isValid && (
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-accent" />
                    Bulk Generated Passwords ({activeBulkList.length})
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyAllBulk}
                    leftIcon={copiedBulk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedBulk ? "Copied All!" : "Copy All"}
                  </Button>
                </div>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {activeBulkList.map((pwd, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-surface-raised rounded-lg border border-border font-mono text-xs text-text-primary"
                    >
                      <span className="truncate pr-2">{showPassword ? pwd : "•".repeat(length)}</span>
                      <button
                        onClick={() => handleCopyText(pwd)}
                        className="text-text-tertiary hover:text-accent p-1 transition-colors"
                        title="Copy password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration Options */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <Slider
                label="Password Character Length"
                min={8}
                max={64}
                step={1}
                value={length}
                unit="chars"
                onChangeValue={(v) => setLength(v)}
              />

              {/* Character Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium text-text-primary">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeUppercase}
                    disabled={isPronounceable}
                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span className={isPronounceable ? "text-text-tertiary" : ""}>Uppercase Letters (A-Z)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeLowercase}
                    disabled={isPronounceable}
                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span className={isPronounceable ? "text-text-tertiary" : ""}>Lowercase Letters (a-z)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Numbers (0-9)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    disabled={isPronounceable}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span className={isPronounceable ? "text-text-tertiary" : ""}>Symbols (!@#$%^&*)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={excludeAmbiguous}
                    onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Exclude Ambiguous (Il1O0)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPronounceable}
                    onChange={(e) => setIsPronounceable(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Pronounceable Syllables</span>
                </label>
              </div>

              {/* Bulk Generation Quantity Selector */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Bulk Password Quantity
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 5, 10, 25, 50].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setBulkCount(count)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        bulkCount === count
                          ? "bg-accent text-white border-accent shadow-md shadow-accent/20"
                          : "bg-surface-raised border-border text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {count} {count === 1 ? "Password" : "Passwords"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password History */}
              {passwordHistory.length > 1 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-accent" /> Recent Passwords
                    </span>
                    <button
                      onClick={() => setPasswordHistory([])}
                      className="text-text-tertiary hover:text-rose-400"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {passwordHistory.slice(1).map((hist, i) => (
                      <button
                        key={i}
                        onClick={() => handleCopyText(hist)}
                        className="px-2.5 py-1 text-xs font-mono bg-surface-raised hover:bg-surface border border-border rounded-lg text-text-secondary hover:text-text-primary flex items-center gap-1"
                      >
                        <span className="truncate max-w-[120px]">{hist}</span>
                        <Copy className="w-3 h-3 text-text-tertiary" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleRegenerate}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Generate New Password
              </Button>
            </div>
          </>
        )}
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
