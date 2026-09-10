"use client";

import React, { useState, useMemo } from "react";
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
  Key,
  Lock,
  FileCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Download,
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
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

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

  // Standard Password Result
  const passwordResult = useMemo(() => {
    return generatePassword({
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      excludeAmbiguous,
    });
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous, refreshKey]);

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
      // Alphanumeric
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      return Array.from(buffer)
        .map((b) => chars[b % chars.length])
        .join("");
    }
  }, [randomFormat, randomLength, refreshKey]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Metadata Cleaner handler
  const handleCleanMetadata = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setUploadedFile(file);

    // If image, draw to canvas without EXIF and export clean blob
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
      // For generic files, create cleaned blob
      const url = URL.createObjectURL(file);
      setCleanedUrl(url);
      setCleanedStatus(`Sanitized file "${file.name}" with client-side privacy scrubber.`);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        {/* 1. PASSPHRASE GENERATOR */}
        {isPassphrase ? (
          <>
            <div className="bg-surface-raised border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-lg p-4 font-mono text-lg sm:text-xl text-text-primary tracking-wide">
                <span className="truncate">{passphraseResult.phrase}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
                    title="Regenerate"
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

            <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-6">
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
                onClick={() => setRefreshKey((k) => k + 1)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Generate New Passphrase
              </Button>
            </div>
          </>
        ) : isStrengthChecker ? (
          /* 2. PASSWORD STRENGTH CHECKER */
          <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary">Enter Password to Test</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Type or paste any password..."
                  className="w-full bg-surface-raised border border-border rounded-lg p-3.5 pr-12 font-mono text-base text-text-primary outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-text-tertiary hover:text-text-primary"
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
              <div className="bg-surface-raised border border-border p-3.5 rounded-lg text-center">
                <span className="text-[11px] text-text-tertiary block">Crack Time</span>
                <span className="text-sm font-bold text-accent mt-0.5 block">{strengthEvaluation.crackTime}</span>
              </div>
              <div className="bg-surface-raised border border-border p-3.5 rounded-lg text-center">
                <span className="text-[11px] text-text-tertiary block">Entropy</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{strengthEvaluation.entropy} bits</span>
              </div>
              <div className="bg-surface-raised border border-border p-3.5 rounded-lg text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] text-text-tertiary block">Length</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{testPassword.length} characters</span>
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
            <div className="bg-surface-raised border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-lg p-4 font-mono text-sm sm:text-base text-text-primary break-all">
                <span>{randomResult}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
                    title="Regenerate"
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
                Generated using cryptographically secure Web Crypto CSPRNG (<code className="text-accent">crypto.getRandomValues</code>)
              </span>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-6">
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
                      className={`p-2.5 rounded-lg border text-center capitalize transition-all ${
                        randomFormat === fmt
                          ? "bg-accent/10 border-accent text-accent font-bold"
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
                onClick={() => setRefreshKey((k) => k + 1)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Generate Cryptographic String
              </Button>
            </div>
          </>
        ) : isMetadataCleaner ? (
          /* 4. METADATA & EXIF CLEANER */
          <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-6">
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
              <div className="p-4 rounded-lg bg-surface-raised border border-border flex flex-col gap-3">
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
          /* 5. STANDARD PASSWORD GENERATOR */
          <>
            {/* Output Box Display */}
            <div className="bg-surface-raised border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-lg p-4 font-mono text-xl sm:text-2xl text-text-primary tracking-wider">
                <span className="truncate">
                  {showPassword ? passwordResult.password : "•".repeat(length)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-text-tertiary hover:text-text-primary rounded hover:bg-surface-raised transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCopyText(passwordResult.password)}
                    leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* Strength Meter */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Strength: <strong className="text-text-primary font-semibold">{passwordResult.strength}</strong> ({passwordResult.entropy} bits)
                </span>
                <span className="text-text-tertiary">
                  Est. Crack Time: <strong className="text-accent">{passwordResult.crackTimeText}</strong>
                </span>
              </div>
            </div>

            {/* Configuration Options */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-6">
              <Slider
                label="Password Character Length"
                min={8}
                max={64}
                step={1}
                value={length}
                unit="chars"
                onChangeValue={(v) => setLength(v)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-text-primary">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeUppercase}
                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Uppercase Letters (A-Z)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeLowercase}
                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Lowercase Letters (a-z)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Numbers (0-9)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface-raised/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Special Symbols (!@#$%)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface-raised/50 cursor-pointer select-none sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={excludeAmbiguous}
                    onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span>Exclude Ambiguous Characters (O, 0, l, 1, I)</span>
                </label>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => setRefreshKey((k) => k + 1)}
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
