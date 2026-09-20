"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "../ResultDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  Calendar,
  Clock,
  Percent,
  ArrowLeftRight,
  Scale,
  Calculator,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Globe,
  Box,
  Volume2,
  VolumeX,
  CheckCircle,
} from "lucide-react";

export interface EverydayCalculatorViewProps {
  tool: ToolMeta;
}

export const EverydayCalculatorView: React.FC<EverydayCalculatorViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Exact Tool Mode Detection
  const isPercent = slug === "percentage-calculator" || slug.includes("percent");
  const isAge = slug === "age-calculator" || (slug.startsWith("age-") && !isPercent);
  const isDateDiff = slug === "date-difference-calculator";
  const isTimeDiff = slug === "time-difference-calculator";
  const isCountdown = slug === "countdown-timer" || slug.includes("countdown");
  const isRatio = slug === "ratio-calculator" || slug.includes("ratio");
  const isAverage = slug === "average-calculator" || slug.includes("average");
  const isFraction = slug === "fraction-calculator" || slug.includes("fraction");
  const isArea = slug === "area-calculator" || slug.includes("area");
  const isVolume = slug === "volume-calculator" || slug.includes("volume");
  const isSpeedOrDistance = slug === "speed-calculator" || slug === "distance-calculator" || slug.includes("speed");
  const isTimeZone = slug === "time-zone-converter" || slug.includes("time-zone") || slug.includes("timezone");
  const isUnit =
    slug === "length-converter" ||
    slug === "weight-converter" ||
    slug === "temperature-converter" ||
    (!isTimeZone && !isPercent && !isAge && !isDateDiff && !isTimeDiff && !isCountdown && !isAverage && !isFraction && !isArea && !isVolume && !isSpeedOrDistance && !isRatio);

  // Helper: GCD & LCM
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a);
    b = Math.abs(b);
    return b === 0 ? a : gcd(b, a % b);
  };

  const lcm = (a: number, b: number): number => {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcd(a, b);
  };

  // ----------------------------------------------------
  // 1. AGE STATE & CALCULATION (Western & Chinese Zodiac, Future Date Validation)
  // ----------------------------------------------------
  const [birthDate, setBirthDate] = useState<string>("");

  const getWesternZodiac = (month: number, day: number) => {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: "Aries", symbol: "♈", element: "Fire" };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: "Taurus", symbol: "♉", element: "Earth" };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: "Gemini", symbol: "♊", element: "Air" };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: "Cancer", symbol: "♋", element: "Water" };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: "Leo", symbol: "♌", element: "Fire" };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: "Virgo", symbol: "♍", element: "Earth" };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: "Libra", symbol: "♎", element: "Air" };
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: "Scorpio", symbol: "♏", element: "Water" };
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: "Sagittarius", symbol: "♐", element: "Fire" };
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: "Capricorn", symbol: "♑", element: "Earth" };
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: "Aquarius", symbol: "♒", element: "Air" };
    return { sign: "Pisces", symbol: "♓", element: "Water" };
  };

  const chineseZodiacAnimals = ["Rat 🐀", "Ox 🐂", "Tiger 🐅", "Rabbit 🐇", "Dragon 🐉", "Snake 🐍", "Horse 🐎", "Goat 🐐", "Monkey 🐒", "Rooster 🐓", "Dog 🐕", "Pig 🐖"];
  const getChineseZodiac = (year: number) => {
    const idx = ((year - 4) % 12 + 12) % 12;
    return chineseZodiacAnimals[idx];
  };

  const ageResult = useMemo(() => {
    if (!birthDate) {
      return {
        primary: "Select date of birth",
        secondary: [
          { label: "Total Days Lived", value: "--" },
          { label: "Western Zodiac", value: "--" },
          { label: "Chinese Zodiac", value: "--" },
          { label: "Next Birthday In", value: "--" },
          { label: "Day of Birth", value: "--" },
        ],
      };
    }

    const [bYear, bMonth, bDay] = birthDate.split("-").map(Number);
    if (!bYear || !bMonth || !bDay) return { primary: "Invalid Date", secondary: [] };

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1; // 1-12
    const curDay = now.getDate();

    // Timezone-safe UTC midnight check
    const birthUtc = Date.UTC(bYear, bMonth - 1, bDay);
    const todayUtc = Date.UTC(curYear, curMonth - 1, curDay);

    if (birthUtc > todayUtc) {
      return {
        primary: "Birth date cannot be in the future",
        secondary: [
          { label: "Validation Error", value: "Please select today or a past date" },
          { label: "Western Zodiac", value: "--" },
          { label: "Chinese Zodiac", value: "--" },
          { label: "Status", value: "Awaiting valid birthdate" },
        ],
      };
    }

    // Exact Years, Months, Days calculation with leap-year awareness
    let years = curYear - bYear;
    let months = curMonth - bMonth;
    let days = curDay - bDay;

    if (days < 0) {
      months--;
      // Borrow days from the previous month
      const prevMonthDays = new Date(curYear, curMonth - 1, 0).getDate();
      days += prevMonthDays;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    // Total Days Lived
    const totalDays = Math.floor((todayUtc - birthUtc) / 86400000);
    const totalHours = totalDays * 24;

    // Next Birthday Countdown
    let nextBdayYear = curYear;
    let nextBdayUtc = Date.UTC(nextBdayYear, bMonth - 1, bDay);
    if (nextBdayUtc < todayUtc) {
      nextBdayYear++;
      nextBdayUtc = Date.UTC(nextBdayYear, bMonth - 1, bDay);
    }
    const daysToNextBday = Math.round((nextBdayUtc - todayUtc) / 86400000);

    const isTodayBirthday = bMonth === curMonth && bDay === curDay;
    const westernZodiac = getWesternZodiac(bMonth, bDay);
    const chineseZodiac = getChineseZodiac(bYear);

    const birthDateObj = new Date(bYear, bMonth - 1, bDay);
    const weekday = birthDateObj.toLocaleDateString("en-US", { weekday: "long" });

    return {
      primary: isTodayBirthday
        ? `🎉 Happy Birthday! ${years} Years Old Today`
        : `${years} Years, ${months} Months, ${days} Days`,
      secondary: [
        { label: "Western Zodiac", value: `${westernZodiac.symbol} ${westernZodiac.sign} (${westernZodiac.element})` },
        { label: "Chinese Zodiac", value: `${chineseZodiac}` },
        { label: "Total Days Lived", value: `${totalDays.toLocaleString()} Days` },
        { label: "Total Weeks Lived", value: `${Math.floor(totalDays / 7)} Weeks, ${totalDays % 7} Days` },
        { label: "Total Hours Lived", value: `${totalHours.toLocaleString()} Hours` },
        { label: "Next Birthday In", value: isTodayBirthday ? "Today! 🎂" : `${daysToNextBday} Days` },
        { label: "Day of Week Born", value: weekday },
      ],
    };
  }, [birthDate]);

  // ----------------------------------------------------
  // 2. DATE DIFFERENCE STATE & CALCULATION (UTC Midnight, Non-Negative Invariant)
  // ----------------------------------------------------
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [includeEndDate, setIncludeEndDate] = useState<boolean>(false);

  const dateDiffResult = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        primary: "Select start and end dates",
        secondary: [
          { label: "Business Days", value: "--" },
          { label: "Weekend Days", value: "--" },
          { label: "Weeks & Days", value: "--" },
          { label: "Working Hours (8h/day)", value: "--" },
        ],
      };
    }

    const [y1, m1, d1] = startDate.split("-").map(Number);
    const [y2, m2, d2] = endDate.split("-").map(Number);
    if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return { primary: "Invalid Dates", secondary: [] };

    // Strict UTC midnight comparison to prevent timezone / DST hour shifts
    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);
    const minUtc = Math.min(utc1, utc2);
    const maxUtc = Math.max(utc1, utc2);

    let totalDays = Math.round((maxUtc - minUtc) / 86400000);
    if (includeEndDate) {
      totalDays += 1;
    }

    let businessDays = 0;
    let weekendDays = 0;
    for (let i = 0; i < totalDays; i++) {
      const curDate = new Date(minUtc + i * 86400000);
      const day = curDate.getUTCDay(); // 0 is Sunday, 6 is Saturday
      if (day === 0 || day === 6) {
        weekendDays++;
      } else {
        businessDays++;
      }
    }

    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;

    return {
      primary: `${totalDays} Total Days (${weeks} weeks, ${remainingDays} days)`,
      secondary: [
        { label: "Business Days (Mon-Fri)", value: `${businessDays} Days` },
        { label: "Weekend Days (Sat-Sun)", value: `${weekendDays} Days` },
        { label: "Mode", value: includeEndDate ? "Inclusive (End Date Counted)" : "Standard (Elapsed Interval)" },
        { label: "Working Hours (8h/day)", value: `${(businessDays * 8).toLocaleString()} Hours` },
        { label: "Total Calendar Hours", value: `${(totalDays * 24).toLocaleString()} Hours` },
        { label: "Months Approx", value: `${(totalDays / 30.4375).toFixed(1)} Months` },
      ],
    };
  }, [startDate, endDate, includeEndDate]);

  // ----------------------------------------------------
  // 3. TIME DIFFERENCE STATE & CALCULATION
  // ----------------------------------------------------
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const timeDiffResult = useMemo(() => {
    if (!startTime || !endTime) {
      return {
        primary: "Select start and end times",
        secondary: [
          { label: "Total Minutes", value: "--" },
          { label: "Total Seconds", value: "--" },
          { label: "Decimal Hours", value: "--" },
          { label: "Day Portion", value: "--" },
        ],
      };
    }
    const [h1, m1] = startTime.split(":").map(Number);
    const [h2, m2] = endTime.split(":").map(Number);
    let minutes1 = (h1 || 0) * 60 + (m1 || 0);
    let minutes2 = (h2 || 0) * 60 + (m2 || 0);

    let diff = minutes2 - minutes1;
    if (diff < 0) diff += 24 * 60; // Overnight span

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    return {
      primary: `${hours} Hours, ${mins} Minutes`,
      secondary: [
        { label: "Total Minutes", value: `${diff.toLocaleString()} Minutes` },
        { label: "Total Seconds", value: `${(diff * 60).toLocaleString()} Seconds` },
        { label: "Decimal Hours", value: `${(diff / 60).toFixed(2)} Hours` },
        { label: "Day Portion", value: `${((diff / 1440) * 100).toFixed(1)}% of 24 hrs` },
      ],
    };
  }, [startTime, endTime]);

  // ----------------------------------------------------
  // 4. COUNTDOWN TIMER STATE & WEB AUDIO / SPEECH SYNTHESIS
  // ----------------------------------------------------
  const [cdMode, setCdMode] = useState<"quick" | "event">("quick");
  const [cdHours, setCdHours] = useState<string>("");
  const [cdMinutes, setCdMinutes] = useState<string>("");
  const [cdSeconds, setCdSeconds] = useState<string>("");
  const [eventDateTime, setEventDateTime] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");

  const [cdRemaining, setCdRemaining] = useState<number>(0);
  const [cdInitialTotal, setCdInitialTotal] = useState<number>(0);
  const [cdRunning, setCdRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthesized two-tone chime via Web Audio API
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // First tone (880 Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      // Second higher tone (1320 Hz - E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);
      gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn("Web Audio chime failed", e);
    }

    // Optional Speech synthesis voice alert
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const text = eventName ? `${eventName} countdown completed!` : "Time is up! Countdown completed.";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // graceful fallback
      }
    }
  };

  useEffect(() => {
    let timer: any = null;
    if (cdRunning && cdRemaining > 0) {
      timer = setInterval(() => {
        setCdRemaining((prev) => {
          if (prev <= 1) {
            setCdRunning(false);
            setTimerFinished(true);
            playAlertChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cdRunning, cdRemaining, soundEnabled]);

  const handleStartCountdown = () => {
    // Unlock AudioContext on explicit user click to conform with browser autoplay policy
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch (e) {}

    setTimerFinished(false);

    if (cdMode === "quick") {
      const h = parseInt(cdHours, 10) || 0;
      const m = parseInt(cdMinutes, 10) || 0;
      const s = parseInt(cdSeconds, 10) || 0;
      const total = h * 3600 + m * 60 + s;
      if (total <= 0) return;
      setCdRemaining(total);
      setCdInitialTotal(total);
      setCdRunning(true);
    } else {
      if (!eventDateTime) return;
      const targetTime = new Date(eventDateTime).getTime();
      const diffSecs = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      if (diffSecs <= 0) return;
      setCdRemaining(diffSecs);
      setCdInitialTotal(diffSecs);
      setCdRunning(true);
    }
  };

  const handlePauseCountdown = () => {
    setCdRunning(false);
  };

  const handleResumeCountdown = () => {
    if (cdRemaining > 0) {
      setCdRunning(true);
    }
  };

  const handleResetCountdown = () => {
    setCdRunning(false);
    setCdRemaining(0);
    setTimerFinished(false);
  };

  // ----------------------------------------------------
  // 5. RATIO STATE
  // ----------------------------------------------------
  const [ratioA, setRatioA] = useState<string>("");
  const [ratioB, setRatioB] = useState<string>("");
  const [ratioC, setRatioC] = useState<string>("");

  const ratioResult = useMemo(() => {
    if (!ratioA && !ratioB) {
      return {
        primary: "-- : --",
        secondary: [
          { label: "Solved Value", value: "--" },
          { label: "Decimal Factor", value: "--" },
          { label: "Inverse Ratio", value: "--" },
          { label: "Greatest Common Divisor", value: "--" },
        ],
      };
    }
    const a = Math.max(1, Math.round(parseFloat(ratioA) || 0));
    const b = Math.max(1, Math.round(parseFloat(ratioB) || 0));
    const c = parseFloat(ratioC) || 1;
    const g = gcd(a, b);
    const simpA = a / g;
    const simpB = b / g;

    const dVal = (b * c) / a;

    return {
      primary: `Simplified Ratio: ${simpA} : ${simpB}`,
      secondary: [
        { label: `Solved Value (X where ${a}:${b} = ${ratioC || c}:X)`, value: `${dVal.toFixed(2)}` },
        { label: "Decimal Factor", value: `${(a / b).toFixed(4)}` },
        { label: "Inverse Ratio", value: `${simpB} : ${simpA}` },
        { label: "Greatest Common Divisor", value: `${g}` },
      ],
    };
  }, [ratioA, ratioB, ratioC]);

  // ----------------------------------------------------
  // 6. AVERAGE STATE & CALCULATION (Empty-skip, Trailing comma filter, Multi-modal support)
  // ----------------------------------------------------
  const [averageInput, setAverageInput] = useState<string>("");

  const averageResult = useMemo(() => {
    // Robust tokenization: skip empty strings, whitespace, and non-numbers
    const tokens = averageInput
      .trim()
      .split(/[\s,]+/)
      .filter((t) => t.length > 0 && !isNaN(Number(t)))
      .map(Number);

    if (tokens.length === 0) {
      return {
        primary: "Enter numbers to calculate",
        secondary: [
          { label: "Mean (Average)", value: "--" },
          { label: "Median", value: "--" },
          { label: "Mode", value: "--" },
          { label: "Sum of All Values", value: "--" },
          { label: "Count of Numbers", value: "0" },
          { label: "Min / Max Range", value: "--" },
          { label: "Standard Deviation", value: "--" },
        ],
      };
    }

    const sum = tokens.reduce((acc, v) => acc + v, 0);
    const mean = sum / tokens.length;

    const sorted = [...tokens].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Multi-modal Mode calculation
    const freq = new Map<number, number>();
    tokens.forEach((n) => freq.set(n, (freq.get(n) || 0) + 1));
    let maxFreq = 0;
    freq.forEach((count) => {
      if (count > maxFreq) maxFreq = count;
    });

    let modeDisplay = "";
    if (maxFreq <= 1) {
      modeDisplay = "No unique mode (all occur once)";
    } else {
      const modes: number[] = [];
      freq.forEach((count, val) => {
        if (count === maxFreq) modes.push(val);
      });
      modes.sort((a, b) => a - b);
      modeDisplay = `${modes.join(", ")} (Freq: ${maxFreq})`;
    }

    const variance = tokens.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (tokens.length > 1 ? tokens.length - 1 : 1);
    const stdDev = Math.sqrt(variance);

    return {
      primary: `Average (Mean): ${mean.toFixed(2)}`,
      secondary: [
        { label: "Median", value: `${median.toFixed(2)}` },
        { label: "Mode", value: modeDisplay },
        { label: "Sum of All Values", value: `${sum.toFixed(2)}` },
        { label: "Count of Numbers", value: `${tokens.length}` },
        { label: "Min / Max Range", value: `${sorted[0]} to ${sorted[sorted.length - 1]}` },
        { label: "Sample Std Dev", value: `${stdDev.toFixed(2)}` },
      ],
    };
  }, [averageInput]);

  // ----------------------------------------------------
  // 7. FRACTION STATE & CALCULATION (Zero-division, LCD, Mixed Fraction, Step-by-Step)
  // ----------------------------------------------------
  const [num1, setNum1] = useState<string>("");
  const [den1, setDen1] = useState<string>("");
  const [num2, setNum2] = useState<string>("");
  const [den2, setDen2] = useState<string>("");
  const [fractionOp, setFractionOp] = useState<"+" | "-" | "*" | "/">("+");

  const fractionResult = useMemo(() => {
    if (num1.trim() === "" && den1.trim() === "" && num2.trim() === "" && den2.trim() === "") {
      return {
        primary: "-- / --",
        secondary: [
          { label: "Step-by-Step Solution", value: "Enter fractions above" },
          { label: "Mixed Fraction", value: "--" },
          { label: "Decimal Value", value: "0" },
          { label: "Percentage", value: "0%" },
        ],
      };
    }

    const n1 = parseInt(num1, 10) || 0;
    const d1 = parseInt(den1, 10);
    const n2 = parseInt(num2, 10) || 0;
    const d2 = parseInt(den2, 10);

    // Zero-division check 1: Input denominators cannot be 0
    if (d1 === 0 || d2 === 0) {
      return {
        primary: "Undefined (Denominator is 0)",
        secondary: [
          { label: "Error", value: "Denominator cannot be zero" },
          { label: "Step-by-Step", value: "Division by 0 is mathematically undefined." },
          { label: "Status", value: "Please enter non-zero denominators" },
        ],
      };
    }

    // Zero-division check 2: Division by a zero-fraction
    if (fractionOp === "/" && n2 === 0) {
      return {
        primary: "Undefined (Division by 0)",
        secondary: [
          { label: "Error", value: "Cannot divide by a fraction equal to zero" },
          { label: "Step-by-Step", value: "Invert and multiply fails because reciprocal 1/0 is undefined." },
          { label: "Status", value: "Numerator 2 cannot be 0 for division" },
        ],
      };
    }

    const validD1 = isNaN(d1) ? 1 : d1;
    const validD2 = isNaN(d2) ? 1 : d2;

    let rawNum = 0;
    let rawDen = 1;
    let stepDescription = "";

    if (fractionOp === "+" || fractionOp === "-") {
      const commonDen = lcm(validD1, validD2);
      const mult1 = commonDen / validD1;
      const mult2 = commonDen / validD2;
      const adjN1 = n1 * mult1;
      const adjN2 = n2 * mult2;

      rawNum = fractionOp === "+" ? adjN1 + adjN2 : adjN1 - adjN2;
      rawDen = commonDen;
      stepDescription = `LCD = ${commonDen} → (${adjN1} ${fractionOp} ${adjN2}) / ${commonDen} = ${rawNum}/${rawDen}`;
    } else if (fractionOp === "*") {
      rawNum = n1 * n2;
      rawDen = validD1 * validD2;
      stepDescription = `Multiply numerators & denominators: (${n1} × ${n2}) / (${validD1} × ${validD2}) = ${rawNum}/${rawDen}`;
    } else {
      rawNum = n1 * validD2;
      rawDen = validD1 * n2;
      stepDescription = `Multiply by reciprocal: (${n1}/${validD1}) × (${validD2}/${n2}) = ${rawNum}/${rawDen}`;
    }

    // Sign normalization: keep denominator positive
    if (rawDen < 0) {
      rawNum = -rawNum;
      rawDen = -rawDen;
    }

    const g = gcd(Math.abs(rawNum) || 1, Math.abs(rawDen) || 1);
    const simpNum = rawNum / g;
    const simpDen = rawDen / g;

    // Mixed Fraction representation (e.g. 7/4 = 1 3/4)
    let mixedFraction = "None (Proper fraction)";
    if (Math.abs(simpNum) >= simpDen && simpDen !== 1) {
      const whole = Math.trunc(simpNum / simpDen);
      const rem = Math.abs(simpNum % simpDen);
      mixedFraction = rem === 0 ? `${whole}` : `${whole} ${rem}/${simpDen}`;
    } else if (simpDen === 1) {
      mixedFraction = `${simpNum} (Whole number)`;
    }

    const decimal = (simpNum / simpDen).toFixed(4);

    return {
      primary: simpDen === 1 ? `${simpNum}` : `${simpNum} / ${simpDen}`,
      secondary: [
        { label: "Step-by-Step", value: stepDescription },
        { label: "Simplified (GCD)", value: g > 1 ? `Reduced by GCD ${g}` : "Already in simplest form" },
        { label: "Mixed Number", value: mixedFraction },
        { label: "Decimal Approximation", value: decimal },
        { label: "Percentage", value: `${(Number(decimal) * 100).toFixed(2)}%` },
      ],
    };
  }, [num1, den1, num2, den2, fractionOp]);

  // ----------------------------------------------------
  // 8. AREA STATE & CALCULATION (Unit Selector, Standard Constants, Trapezoid)
  // ----------------------------------------------------
  const [areaShape, setAreaShape] = useState<"rectangle" | "circle" | "triangle" | "trapezoid">("rectangle");
  const [areaUnit, setAreaUnit] = useState<"m" | "ft" | "cm" | "in" | "yd">("m");
  const [areaParam1, setAreaParam1] = useState<string>(""); // length / radius / base / base a
  const [areaParam2, setAreaParam2] = useState<string>(""); // width / height / base b
  const [areaParam3, setAreaParam3] = useState<string>(""); // height (for trapezoid)

  const areaResult = useMemo(() => {
    const isP1Set = areaParam1.trim() !== "";
    const isP2Set = areaParam2.trim() !== "";
    const isP3Set = areaParam3.trim() !== "";

    if (!isP1Set) {
      return {
        primary: "0.00 Sq Units",
        secondary: [
          { label: "Square Feet", value: "0.00 sq ft" },
          { label: "Square Meters", value: "0.00 m²" },
          { label: "Acres", value: "0.0000 acres" },
          { label: "Hectares", value: "0.0000 ha" },
          { label: "Formula Used", value: "Enter dimensions above" },
        ],
      };
    }

    const p1 = parseFloat(areaParam1) || 0;
    const p2 = parseFloat(areaParam2) || 0;
    const p3 = parseFloat(areaParam3) || 0;

    let areaInUnit = 0;
    let perimeterInUnit = 0;
    let formula = "";

    if (areaShape === "rectangle") {
      areaInUnit = p1 * p2;
      perimeterInUnit = 2 * (p1 + p2);
      formula = `Length (${p1}) × Width (${p2})`;
    } else if (areaShape === "circle") {
      areaInUnit = Math.PI * Math.pow(p1, 2);
      perimeterInUnit = 2 * Math.PI * p1; // Circumference
      formula = `π × Radius² (π × ${p1}²)`;
    } else if (areaShape === "triangle") {
      areaInUnit = 0.5 * p1 * p2;
      formula = `½ × Base (${p1}) × Height (${p2})`;
    } else {
      // Trapezoid: ½ × (a + b) × h
      areaInUnit = 0.5 * (p1 + p2) * p3;
      formula = `½ × (Base A [${p1}] + Base B [${p2}]) × Height [${p3}]`;
    }

    // Convert input unit squared to standard Square Meters (m²)
    // 1 ft = 0.3048 m -> 1 sq ft = 0.09290304 sq m
    // 1 cm = 0.01 m -> 1 sq cm = 0.0001 sq m
    // 1 in = 0.0254 m -> 1 sq in = 0.00064516 sq m
    // 1 yd = 0.9144 m -> 1 sq yd = 0.83612736 sq m
    const toSqMetersFactor: Record<string, number> = {
      m: 1,
      ft: 0.09290304,
      cm: 0.0001,
      in: 0.00064516,
      yd: 0.83612736,
    };

    const sqMeters = areaInUnit * (toSqMetersFactor[areaUnit] || 1);
    const sqFeet = sqMeters * 10.7639104;
    const acres = sqFeet / 43560;
    const hectares = sqMeters / 10000;
    const sqYards = sqFeet / 9;

    return {
      primary: `${areaInUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} sq ${areaUnit}`,
      secondary: [
        { label: "Square Feet", value: `${sqFeet.toLocaleString(undefined, { maximumFractionDigits: 2 })} sq ft` },
        { label: "Square Meters", value: `${sqMeters.toLocaleString(undefined, { maximumFractionDigits: 2 })} m²` },
        { label: "Acres", value: `${acres.toFixed(4)} acres` },
        { label: "Hectares", value: `${hectares.toFixed(4)} ha` },
        { label: "Square Yards", value: `${sqYards.toLocaleString(undefined, { maximumFractionDigits: 2 })} sq yd` },
        ...(perimeterInUnit > 0
          ? [{ label: areaShape === "circle" ? "Circumference" : "Perimeter", value: `${perimeterInUnit.toFixed(2)} ${areaUnit}` }]
          : []),
        { label: "Formula Used", value: formula },
      ],
    };
  }, [areaShape, areaUnit, areaParam1, areaParam2, areaParam3]);

  // ----------------------------------------------------
  // 9. VOLUME STATE & CALCULATION (Explicit 0 Check, US/Imperial Gallons, Unit Selector)
  // ----------------------------------------------------
  const [volumeShape, setVolumeShape] = useState<"box" | "cylinder" | "sphere">("box");
  const [volUnit, setVolUnit] = useState<"cm" | "m" | "in" | "ft">("cm");
  const [volParam1, setVolParam1] = useState<string>("");
  const [volParam2, setVolParam2] = useState<string>("");
  const [volParam3, setVolParam3] = useState<string>("");

  const volumeResult = useMemo(() => {
    const isP1Set = volParam1.trim() !== "";
    const isP2Set = volParam2.trim() !== "";
    const isP3Set = volParam3.trim() !== "";

    // Require all dimensions for the active shape
    const isComplete =
      volumeShape === "sphere"
        ? isP1Set
        : volumeShape === "cylinder"
        ? isP1Set && isP2Set
        : isP1Set && isP2Set && isP3Set;

    if (!isComplete) {
      return {
        primary: "0.00 Cu Units",
        secondary: [
          { label: "Liters", value: "0.00 L" },
          { label: "US Gallons (3.785 L)", value: "0.00 gal" },
          { label: "UK / Imperial Gallons (4.546 L)", value: "0.00 gal" },
          { label: "Cubic Feet", value: "0.00 cu ft" },
          { label: "Status", value: "Enter all required dimensions above" },
        ],
      };
    }

    const v1 = parseFloat(volParam1) || 0;
    const v2 = parseFloat(volParam2) || 0;
    const v3 = parseFloat(volParam3) || 0;

    let volInUnit = 0;
    let surfaceArea = 0;
    let formula = "";

    if (volumeShape === "box") {
      volInUnit = v1 * v2 * v3;
      surfaceArea = 2 * (v1 * v2 + v1 * v3 + v2 * v3);
      formula = `Length (${v1}) × Width (${v2}) × Height (${v3})`;
    } else if (volumeShape === "cylinder") {
      volInUnit = Math.PI * Math.pow(v1, 2) * v2;
      surfaceArea = 2 * Math.PI * Math.pow(v1, 2) + 2 * Math.PI * v1 * v2;
      formula = `π × Radius² (${v1}²) × Height (${v2})`;
    } else {
      volInUnit = (4 / 3) * Math.PI * Math.pow(v1, 3);
      surfaceArea = 4 * Math.PI * Math.pow(v1, 2);
      formula = `(4/3) × π × Radius³ (${v1}³)`;
    }

    // Convert input unit cubed to Cubic Meters (m³)
    const toCuMetersFactor: Record<string, number> = {
      cm: 0.000001,
      m: 1,
      in: 0.000016387064,
      ft: 0.028316846592,
    };

    const cuMeters = volInUnit * (toCuMetersFactor[volUnit] || 1);
    const liters = cuMeters * 1000;
    const usGallons = liters / 3.785411784;
    const ukGallons = liters / 4.54609;
    const cuFeet = cuMeters * 35.3146667;

    return {
      primary: `${volInUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} cu ${volUnit}`,
      secondary: [
        { label: "Liters", value: `${liters.toLocaleString(undefined, { maximumFractionDigits: 2 })} L` },
        { label: "US Gallons (3.785 L)", value: `${usGallons.toLocaleString(undefined, { maximumFractionDigits: 2 })} gal` },
        { label: "UK / Imperial Gallons (4.546 L)", value: `${ukGallons.toLocaleString(undefined, { maximumFractionDigits: 2 })} gal` },
        { label: "Cubic Feet", value: `${cuFeet.toLocaleString(undefined, { maximumFractionDigits: 3 })} cu ft` },
        { label: "3D Surface Area", value: `${surfaceArea.toLocaleString(undefined, { maximumFractionDigits: 2 })} sq ${volUnit}` },
        { label: "Formula Used", value: formula },
      ],
    };
  }, [volumeShape, volUnit, volParam1, volParam2, volParam3]);

  // ----------------------------------------------------
  // 10. SPEED / DISTANCE STATE & CALCULATION
  // ----------------------------------------------------
  const [calcTarget, setCalcTarget] = useState<"speed" | "distance" | "time">("speed");
  const [speedVal, setSpeedVal] = useState<string>("");
  const [distanceVal, setDistanceVal] = useState<string>("");
  const [timeVal, setTimeVal] = useState<string>("");

  const speedDistanceResult = useMemo(() => {
    const sVal = parseFloat(speedVal) || 0;
    const dVal = parseFloat(distanceVal) || 0;
    const tVal = parseFloat(timeVal) || 0;

    let primary = "";
    let secondary: any[] = [];

    if (!sVal && !dVal && !tVal) {
      return {
        primary: "0.00",
        secondary: [
          { label: "Distance", value: "0 km" },
          { label: "Speed", value: "0 km/h" },
          { label: "Time", value: "0 hours" },
          { label: "Status", value: "Enter parameters above" },
        ],
      };
    }

    if (calcTarget === "speed") {
      const s = dVal / (tVal || 1);
      primary = `${s.toFixed(2)} km/h (${(s * 0.621371).toFixed(2)} mph)`;
      secondary = [
        { label: "Distance", value: `${dVal} km` },
        { label: "Time", value: `${tVal} hours` },
        { label: "Meters per Second", value: `${(s / 3.6).toFixed(2)} m/s` },
        { label: "Pace", value: `${(60 / (s || 1)).toFixed(1)} mins/km` },
      ];
    } else if (calcTarget === "distance") {
      const d = sVal * tVal;
      primary = `${d.toFixed(2)} km (${(d * 0.621371).toFixed(2)} miles)`;
      secondary = [
        { label: "Speed", value: `${sVal} km/h` },
        { label: "Time", value: `${tVal} hours` },
        { label: "Total Meters", value: `${(d * 1000).toLocaleString()} m` },
        { label: "Status", value: "Calculated" },
      ];
    } else {
      const t = dVal / (sVal || 1);
      const hrs = Math.floor(t);
      const mins = Math.round((t - hrs) * 60);
      primary = `${hrs} hrs, ${mins} mins`;
      secondary = [
        { label: "Decimal Hours", value: `${t.toFixed(2)} hrs` },
        { label: "Distance", value: `${dVal} km` },
        { label: "Speed", value: `${sVal} km/h` },
        { label: "Total Minutes", value: `${Math.round(t * 60)} mins` },
      ];
    }

    return { primary, secondary };
  }, [calcTarget, speedVal, distanceVal, timeVal]);

  // ----------------------------------------------------
  // 11. TIME ZONE STATE & CALCULATION (DST Safe via Native Intl.DateTimeFormat)
  // ----------------------------------------------------
  const [tzSource, setTzSource] = useState<string>("America/New_York");
  const [tzTarget, setTzTarget] = useState<string>("Asia/Kolkata");
  const [tzTime, setTzTime] = useState<string>("");

  const timeZoneResult = useMemo(() => {
    try {
      const now = new Date();
      let exactUtcDate: Date;

      if (tzTime) {
        const [h, m] = tzTime.split(":").map(Number);
        // Find current YYYY-MM-DD in the SOURCE timezone
        const dtfDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: tzSource,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now);
        const [year, month, day] = dtfDate.split("-").map(Number);

        // Guess UTC epoch as Date.UTC(year, month-1, day, h, m)
        const utcGuess = new Date(Date.UTC(year, month - 1, day, h || 0, m || 0, 0));

        // Format guess into tzSource parts
        const dtfSource = new Intl.DateTimeFormat("en-US", {
          timeZone: tzSource,
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: false,
        });

        const partsMap: Record<string, string> = {};
        dtfSource.formatToParts(utcGuess).forEach((p) => {
          partsMap[p.type] = p.value;
        });

        let sourceHour = parseInt(partsMap.hour, 10);
        if (sourceHour === 24) sourceHour = 0;

        const sourceAtGuess = new Date(
          Date.UTC(
            parseInt(partsMap.year, 10),
            parseInt(partsMap.month, 10) - 1,
            parseInt(partsMap.day, 10),
            sourceHour,
            parseInt(partsMap.minute, 10),
            parseInt(partsMap.second, 10)
          )
        );

        // Difference offset between target clock and UTC
        const diffMs = utcGuess.getTime() - sourceAtGuess.getTime();
        exactUtcDate = new Date(utcGuess.getTime() + diffMs);
      } else {
        exactUtcDate = now;
      }

      const sourceTimeStr = exactUtcDate.toLocaleTimeString("en-US", {
        timeZone: tzSource,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const sourceDateStr = exactUtcDate.toLocaleDateString("en-US", {
        timeZone: tzSource,
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const targetTimeStr = exactUtcDate.toLocaleTimeString("en-US", {
        timeZone: tzTarget,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const targetDateStr = exactUtcDate.toLocaleDateString("en-US", {
        timeZone: tzTarget,
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // Calculate time difference between source and target
      const sourceEpoch = new Date(exactUtcDate.toLocaleString("en-US", { timeZone: tzSource })).getTime();
      const targetEpoch = new Date(exactUtcDate.toLocaleString("en-US", { timeZone: tzTarget })).getTime();
      const diffMinutes = Math.round((targetEpoch - sourceEpoch) / 60000);
      const diffHrs = Math.floor(Math.abs(diffMinutes) / 60);
      const diffMins = Math.abs(diffMinutes) % 60;
      const diffSign = diffMinutes >= 0 ? "+" : "-";
      const diffText =
        diffMinutes === 0
          ? "Same time"
          : `${diffSign}${diffHrs} hrs ${diffMins > 0 ? `${diffMins} mins` : ""} ${diffMinutes > 0 ? "ahead" : "behind"}`;

      return {
        primary: targetTimeStr,
        secondary: [
          { label: "Target Date", value: targetDateStr },
          { label: "Time Difference", value: diffText },
          { label: "Source Time", value: `${sourceTimeStr} (${sourceDateStr})` },
          { label: "Source Timezone", value: tzSource.replace(/_/g, " ") },
          { label: "Target Timezone", value: tzTarget.replace(/_/g, " ") },
        ],
      };
    } catch (e) {
      return {
        primary: "--:--:--",
        secondary: [{ label: "Error", value: "Invalid timezone configuration" }],
      };
    }
  }, [tzSource, tzTarget, tzTime]);

  // ----------------------------------------------------
  // 12. PERCENTAGE STATE & CALCULATION
  // ----------------------------------------------------
  const [percentMode, setPercentMode] = useState<"calc_percent" | "what_percent" | "increase_decrease">("calc_percent");
  const [percentVal, setPercentVal] = useState<string>("");
  const [baseVal, setBaseVal] = useState<string>("");
  const [secondVal, setSecondVal] = useState<string>("");

  const percentResult = useMemo(() => {
    const p = parseFloat(percentVal) || 0;
    const b = parseFloat(baseVal) || 0;
    const s = parseFloat(secondVal) || 0;

    if (percentMode === "calc_percent") {
      const answer = (p * b) / 100;
      return {
        primary: `${answer.toFixed(2)}`,
        secondary: [
          { label: "Formula", value: `${p}% × ${b}` },
          { label: "Sum (Base + %)", value: `${(b + answer).toFixed(2)}` },
          { label: "Difference (Base - %)", value: `${(b - answer).toFixed(2)}` },
          { label: "Multiplier", value: `${(p / 100).toFixed(4)}` },
        ],
      };
    } else if (percentMode === "what_percent") {
      const answer = b !== 0 ? (p / b) * 100 : 0;
      return {
        primary: `${answer.toFixed(2)}%`,
        secondary: [
          { label: "Numerator", value: `${p}` },
          { label: "Denominator", value: `${b}` },
          { label: "Ratio", value: `${(p / (b || 1)).toFixed(4)}` },
          { label: "Status", value: "Calculated" },
        ],
      };
    } else {
      const diff = s - b;
      const change = b !== 0 ? (diff / b) * 100 : 0;
      return {
        primary: `${change > 0 ? "+" : ""}${change.toFixed(2)}%`,
        secondary: [
          { label: "Absolute Difference", value: `${diff.toFixed(2)}` },
          { label: "Initial Value", value: `${b}` },
          { label: "Final Value", value: `${s}` },
          { label: "Type", value: change >= 0 ? "Increase" : "Decrease" },
        ],
      };
    }
  }, [percentMode, percentVal, baseVal, secondVal]);

  // ----------------------------------------------------
  // 13. UNIT CONVERTER STATE & CALCULATION
  // ----------------------------------------------------
  const initialCategory = slug.includes("weight")
    ? "weight"
    : slug.includes("temp")
    ? "temperature"
    : "length";
  const [unitCategory, setUnitCategory] = useState<"length" | "weight" | "temperature">(initialCategory);
  const [unitInputValue, setUnitInputValue] = useState<string>("");
  const [fromUnit, setFromUnit] = useState<string>(
    initialCategory === "weight" ? "kg" : initialCategory === "temperature" ? "c" : "m"
  );
  const [toUnit, setToUnit] = useState<string>(
    initialCategory === "weight" ? "lb" : initialCategory === "temperature" ? "f" : "ft"
  );

  const unitResult = useMemo(() => {
    let result = 0;
    const v = parseFloat(unitInputValue) || 0;

    if (unitCategory === "length") {
      const toMeters: Record<string, number> = {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        in: 0.0254,
        ft: 0.3048,
        yd: 0.9144,
        mi: 1609.34,
      };
      const meters = v * (toMeters[fromUnit] || 1);
      result = meters / (toMeters[toUnit] || 1);
    } else if (unitCategory === "weight") {
      const toGrams: Record<string, number> = {
        kg: 1000,
        g: 1,
        mg: 0.001,
        lb: 453.592,
        oz: 28.3495,
        ton: 1000000,
      };
      const grams = v * (toGrams[fromUnit] || 1);
      result = grams / (toGrams[toUnit] || 1);
    } else {
      // Temperature
      let celsius = v;
      if (fromUnit === "f") celsius = ((v - 32) * 5) / 9;
      else if (fromUnit === "k") celsius = v - 273.15;

      if (toUnit === "f") result = (celsius * 9) / 5 + 32;
      else if (toUnit === "k") result = celsius + 273.15;
      else result = celsius;
    }

    return {
      primary: `${result.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toUnit.toUpperCase()}`,
      secondary: [
        { label: "Input Value", value: `${v} ${fromUnit.toUpperCase()}` },
        { label: "Target Unit", value: `${toUnit.toUpperCase()}` },
        { label: "Category", value: unitCategory.toUpperCase() },
        { label: "Precision", value: "High (4 decimals)" },
      ],
    };
  }, [unitCategory, unitInputValue, fromUnit, toUnit]);

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Panel */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          {isPercent ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Percentage Calculation Mode
              </h3>
              <div className="flex gap-2">
                {[
                  { id: "calc_percent", label: "What is X% of Y" },
                  { id: "what_percent", label: "X is what % of Y" },
                  { id: "increase_decrease", label: "% Change" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPercentMode(m.id as any);
                      setBaseVal("");
                      setPercentVal("");
                      setSecondVal("");
                    }}
                    className={`flex-1 p-2 rounded-lg border text-xs transition-colors ${
                      percentMode === m.id
                        ? "bg-accent/10 border-accent text-accent font-bold"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <Input
                label={percentMode === "increase_decrease" ? "Initial Value" : "Base Value (Y)"}
                type="number"
                value={baseVal}
                onChange={(e) => setBaseVal(e.target.value)}
                placeholder="Enter base value (e.g. 2500)..."
              />
              <Input
                label={percentMode === "increase_decrease" ? "Final Value" : "Percentage / Secondary (X)"}
                type="number"
                value={percentMode === "increase_decrease" ? secondVal : percentVal}
                onChange={(e) => {
                  if (percentMode === "increase_decrease") setSecondVal(e.target.value);
                  else setPercentVal(e.target.value);
                }}
                placeholder="Enter secondary value or % (e.g. 18)..."
              />
            </>
          ) : isAge ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Select Your Date of Birth
              </h3>
              <Input
                label="Date of Birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <div className="p-3 bg-surface-raised border border-border rounded-lg text-xs text-text-secondary flex flex-col gap-1">
                <span className="font-semibold text-text-primary">✨ Features Included:</span>
                <span>• Exact Age in Years, Months, and Days</span>
                <span>• Western Zodiac sign & element (♈, ♉, ♊...)</span>
                <span>• Chinese Lunar Zodiac Year Animal (🐅, 🐉, 🐎...)</span>
                <span>• Next birthday countdown and leap-year precision</span>
              </div>
            </>
          ) : isDateDiff ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Calculate Date Difference
              </h3>
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <label className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={includeEndDate}
                  onChange={(e) => setIncludeEndDate(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent"
                />
                <span>Include End Date in calculation (Count both start and end days)</span>
              </label>
            </>
          ) : isTimeDiff ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Calculate Time Duration
              </h3>
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </>
          ) : isCountdown ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5 flex items-center justify-between">
                <span>Countdown Timer</span>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors"
                  title={soundEnabled ? "Mute Alert" : "Enable Sound Alert"}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-accent" />
                      <span className="text-accent font-medium">Sound ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-text-tertiary">Muted</span>
                    </>
                  )}
                </button>
              </h3>

              {/* Mode Switcher */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCdMode("quick");
                    setCdHours("");
                    setCdMinutes("");
                    setCdSeconds("");
                    setCdRemaining(0);
                    setCdRunning(false);
                    setTimerFinished(false);
                  }}
                  className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                    cdMode === "quick"
                      ? "bg-accent/10 border-accent text-accent font-bold"
                      : "bg-surface-raised border-border text-text-secondary"
                  }`}
                >
                  Quick Duration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCdMode("event");
                    setEventDateTime("");
                    setEventName("");
                    setCdRemaining(0);
                    setCdRunning(false);
                    setTimerFinished(false);
                  }}
                  className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                    cdMode === "event"
                      ? "bg-accent/10 border-accent text-accent font-bold"
                      : "bg-surface-raised border-border text-text-secondary"
                  }`}
                >
                  Target Date / Event
                </button>
              </div>

              {cdMode === "quick" ? (
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Hours"
                    type="text"
                    inputMode="numeric"
                    value={cdHours}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) setCdHours(val);
                    }}
                    placeholder="e.g. 0"
                  />
                  <Input
                    label="Minutes"
                    type="text"
                    inputMode="numeric"
                    value={cdMinutes}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) setCdMinutes(val);
                    }}
                    placeholder="e.g. 25"
                  />
                  <Input
                    label="Seconds"
                    type="text"
                    inputMode="numeric"
                    value={cdSeconds}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) setCdSeconds(val);
                    }}
                    placeholder="e.g. 0"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Input
                    label="Event Title (e.g. Product Launch, Exam)"
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. New Year 2027 Countdown..."
                  />
                  <Input
                    label="Target Date & Time"
                    type="datetime-local"
                    value={eventDateTime}
                    onChange={(e) => setEventDateTime(e.target.value)}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {!cdRunning ? (
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    onClick={cdRemaining > 0 ? handleResumeCountdown : handleStartCountdown}
                    leftIcon={<Play className="w-4 h-4 fill-current" />}
                  >
                    {cdRemaining > 0 ? "Resume Timer" : "Start Countdown"}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={handlePauseCountdown}
                    leftIcon={<Pause className="w-4 h-4" />}
                  >
                    Pause
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleResetCountdown}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Reset
                </Button>
              </div>
            </>
          ) : isRatio ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Ratio Simplifier & Proportion Solver
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ratio Part A"
                  type="number"
                  value={ratioA}
                  onChange={(e) => setRatioA(e.target.value)}
                  placeholder="e.g. 1920"
                />
                <Input
                  label="Ratio Part B"
                  type="number"
                  value={ratioB}
                  onChange={(e) => setRatioB(e.target.value)}
                  placeholder="e.g. 1080"
                />
              </div>
              <Input
                label="Proportion Target C (Solve A:B = C:X)"
                type="number"
                value={ratioC}
                onChange={(e) => setRatioC(e.target.value)}
                placeholder="e.g. 1280"
              />
            </>
          ) : isAverage ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Enter Set of Numbers
              </h3>
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-text-secondary">Numbers (comma, space, or newline separated)</label>
                <textarea
                  value={averageInput}
                  onChange={(e) => setAverageInput(e.target.value)}
                  placeholder="Enter numbers separated by comma, space or newline (e.g. 15, 22, 38, 45)..."
                  rows={5}
                  className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
              <span className="text-[11px] text-text-tertiary">
                Tip: Empty inputs and trailing commas are safely ignored. Supports mean, median, multi-modal mode, sum, range, and standard deviation.
              </span>
            </>
          ) : isFraction ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Fraction Arithmetic & LCD Solver
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-2 flex-1">
                  <Input
                    label="Numerator 1"
                    type="text"
                    inputMode="numeric"
                    value={num1}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^-?\d*$/.test(val)) setNum1(val);
                    }}
                    placeholder="e.g. 3"
                  />
                  <Input
                    label="Denominator 1"
                    type="text"
                    inputMode="numeric"
                    value={den1}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^-?\d*$/.test(val)) setDen1(val);
                    }}
                    placeholder="e.g. 4"
                  />
                </div>
                <div className="flex flex-col gap-1 items-center justify-center">
                  <label className="text-[11px] text-text-secondary text-center">Operation</label>
                  <select
                    value={fractionOp}
                    onChange={(e) => setFractionOp(e.target.value as any)}
                    className="p-3 bg-surface-raised border border-border rounded-lg text-lg font-bold text-accent outline-none cursor-pointer"
                  >
                    <option value="+">+</option>
                    <option value="-">-</option>
                    <option value="*">×</option>
                    <option value="/">÷</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Input
                    label="Numerator 2"
                    type="text"
                    inputMode="numeric"
                    value={num2}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^-?\d*$/.test(val)) setNum2(val);
                    }}
                    placeholder="e.g. 2"
                  />
                  <Input
                    label="Denominator 2"
                    type="text"
                    inputMode="numeric"
                    value={den2}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^-?\d*$/.test(val)) setDen2(val);
                    }}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
            </>
          ) : isArea ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Shape & Input Unit
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["rectangle", "circle", "triangle", "trapezoid"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setAreaShape(s);
                      setAreaParam1("");
                      setAreaParam2("");
                      setAreaParam3("");
                    }}
                    className={`p-2 rounded-lg border text-xs capitalize transition-colors ${
                      areaShape === s
                        ? "bg-accent/10 border-accent text-accent font-bold"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {s === "trapezoid" ? "Trapezoid / Parcel" : s}
                  </button>
                ))}
              </div>

              {/* Unit Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">Input Measurement Unit</label>
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as any)}
                  className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="m">Meters (m)</option>
                  <option value="ft">Feet (ft)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="in">Inches (in)</option>
                  <option value="yd">Yards (yd)</option>
                </select>
              </div>

              {/* Shape Inputs */}
              {areaShape === "rectangle" && (
                <>
                  <Input
                    label={`Length (${areaUnit})`}
                    type="number"
                    value={areaParam1}
                    onChange={(e) => setAreaParam1(e.target.value)}
                    placeholder="e.g. 20"
                  />
                  <Input
                    label={`Width (${areaUnit})`}
                    type="number"
                    value={areaParam2}
                    onChange={(e) => setAreaParam2(e.target.value)}
                    placeholder="e.g. 15"
                  />
                </>
              )}

              {areaShape === "circle" && (
                <Input
                  label={`Radius (${areaUnit})`}
                  type="number"
                  value={areaParam1}
                  onChange={(e) => setAreaParam1(e.target.value)}
                  placeholder="e.g. 7"
                />
              )}

              {areaShape === "triangle" && (
                <>
                  <Input
                    label={`Base (${areaUnit})`}
                    type="number"
                    value={areaParam1}
                    onChange={(e) => setAreaParam1(e.target.value)}
                    placeholder="e.g. 12"
                  />
                  <Input
                    label={`Perpendicular Height (${areaUnit})`}
                    type="number"
                    value={areaParam2}
                    onChange={(e) => setAreaParam2(e.target.value)}
                    placeholder="e.g. 8"
                  />
                </>
              )}

              {areaShape === "trapezoid" && (
                <>
                  <Input
                    label={`Parallel Base A (${areaUnit})`}
                    type="number"
                    value={areaParam1}
                    onChange={(e) => setAreaParam1(e.target.value)}
                    placeholder="e.g. 24"
                  />
                  <Input
                    label={`Parallel Base B (${areaUnit})`}
                    type="number"
                    value={areaParam2}
                    onChange={(e) => setAreaParam2(e.target.value)}
                    placeholder="e.g. 16"
                  />
                  <Input
                    label={`Perpendicular Height (${areaUnit})`}
                    type="number"
                    value={areaParam3}
                    onChange={(e) => setAreaParam3(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </>
              )}
            </>
          ) : isVolume ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                3D Shape & Input Unit
              </h3>
              <div className="flex gap-2">
                {(["box", "cylinder", "sphere"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setVolumeShape(s);
                      setVolParam1("");
                      setVolParam2("");
                      setVolParam3("");
                    }}
                    className={`flex-1 p-2 rounded-lg border text-xs capitalize transition-colors ${
                      volumeShape === s
                        ? "bg-accent/10 border-accent text-accent font-bold"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {s === "box" ? "Box / Cube" : s}
                  </button>
                ))}
              </div>

              {/* Unit Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">Input Measurement Unit</label>
                <select
                  value={volUnit}
                  onChange={(e) => setVolUnit(e.target.value as any)}
                  className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="cm">Centimeters (cm)</option>
                  <option value="m">Meters (m)</option>
                  <option value="in">Inches (in)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>

              {/* Shape Inputs */}
              {volumeShape === "box" && (
                <>
                  <Input
                    label={`Length (${volUnit})`}
                    type="number"
                    value={volParam1}
                    onChange={(e) => setVolParam1(e.target.value)}
                    placeholder="e.g. 30"
                  />
                  <Input
                    label={`Width (${volUnit})`}
                    type="number"
                    value={volParam2}
                    onChange={(e) => setVolParam2(e.target.value)}
                    placeholder="e.g. 20"
                  />
                  <Input
                    label={`Height (${volUnit})`}
                    type="number"
                    value={volParam3}
                    onChange={(e) => setVolParam3(e.target.value)}
                    placeholder="e.g. 15"
                  />
                </>
              )}

              {volumeShape === "cylinder" && (
                <>
                  <Input
                    label={`Radius (${volUnit})`}
                    type="number"
                    value={volParam1}
                    onChange={(e) => setVolParam1(e.target.value)}
                    placeholder="e.g. 10"
                  />
                  <Input
                    label={`Height (${volUnit})`}
                    type="number"
                    value={volParam2}
                    onChange={(e) => setVolParam2(e.target.value)}
                    placeholder="e.g. 25"
                  />
                </>
              )}

              {volumeShape === "sphere" && (
                <Input
                  label={`Radius (${volUnit})`}
                  type="number"
                  value={volParam1}
                  onChange={(e) => setVolParam1(e.target.value)}
                  placeholder="e.g. 12"
                />
              )}
            </>
          ) : isSpeedOrDistance ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Speed, Distance & Time Calculator
              </h3>
              <div className="flex gap-2">
                {(["speed", "distance", "time"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setCalcTarget(t);
                      setSpeedVal("");
                      setDistanceVal("");
                      setTimeVal("");
                    }}
                    className={`flex-1 p-2 rounded-lg border text-xs capitalize transition-colors ${
                      calcTarget === t
                        ? "bg-accent/10 border-accent text-accent font-bold"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    Solve {t}
                  </button>
                ))}
              </div>
              {calcTarget !== "distance" && (
                <Input
                  label="Distance (km)"
                  type="number"
                  value={distanceVal}
                  onChange={(e) => setDistanceVal(e.target.value)}
                  placeholder="Enter distance (e.g. 260)..."
                />
              )}
              {calcTarget !== "speed" && (
                <Input
                  label="Speed (km/h)"
                  type="number"
                  value={speedVal}
                  onChange={(e) => setSpeedVal(e.target.value)}
                  placeholder="Enter speed (e.g. 65)..."
                />
              )}
              {calcTarget !== "time" && (
                <Input
                  label="Time (hours)"
                  type="number"
                  value={timeVal}
                  onChange={(e) => setTimeVal(e.target.value)}
                  placeholder="Enter time in hours (e.g. 4)..."
                />
              )}
            </>
          ) : isTimeZone ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Time Zone Converter & World Clock
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-medium">Source Time Zone</label>
                  <select
                    value={tzSource}
                    onChange={(e) => setTzSource(e.target.value)}
                    className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option value="America/New_York">New York (EDT / EST)</option>
                    <option value="America/Los_Angeles">Los Angeles (PDT / PST)</option>
                    <option value="America/Chicago">Chicago (CDT / CST)</option>
                    <option value="Europe/London">London (BST / GMT)</option>
                    <option value="Europe/Paris">Paris / Berlin (CEST / CET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Asia/Singapore">Singapore / HK (SGT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT / AEST)</option>
                    <option value="UTC">UTC / Universal</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-medium">Target Time Zone</label>
                  <select
                    value={tzTarget}
                    onChange={(e) => setTzTarget(e.target.value)}
                    className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="America/New_York">New York (EDT / EST)</option>
                    <option value="America/Los_Angeles">Los Angeles (PDT / PST)</option>
                    <option value="America/Chicago">Chicago (CDT / CST)</option>
                    <option value="Europe/London">London (BST / GMT)</option>
                    <option value="Europe/Paris">Paris / Berlin (CEST / CET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Singapore">Singapore / HK (SGT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT / AEST)</option>
                    <option value="UTC">UTC / Universal</option>
                  </select>
                </div>
              </div>
              <Input
                label="Custom Time in Source Zone (optional, leave blank for Current Time)"
                type="time"
                value={tzTime}
                onChange={(e) => setTzTime(e.target.value)}
              />
              <span className="text-[11px] text-text-tertiary">
                Uses browser's native IANA timezone engine. Automatically accounts for Daylight Saving Time (DST).
              </span>
            </>
          ) : (
            <>
              {/* Unit Converter */}
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Unit Converter
              </h3>
              <div className="flex gap-2">
                {(["length", "weight", "temperature"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setUnitCategory(cat);
                      setUnitInputValue("");
                      if (cat === "length") {
                        setFromUnit("m");
                        setToUnit("ft");
                      } else if (cat === "weight") {
                        setFromUnit("kg");
                        setToUnit("lb");
                      } else {
                        setFromUnit("c");
                        setToUnit("f");
                      }
                    }}
                    className={`flex-1 p-2 rounded-lg border text-xs capitalize transition-colors ${
                      unitCategory === cat
                        ? "bg-accent/10 border-accent text-accent font-bold"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Input
                label="Value to Convert"
                type="number"
                value={unitInputValue}
                onChange={(e) => setUnitInputValue(e.target.value)}
                placeholder="Enter value to convert (e.g. 100)..."
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary">From</label>
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                  >
                    {unitCategory === "length" && (
                      <>
                        <option value="m">Meter (m)</option>
                        <option value="km">Kilometer (km)</option>
                        <option value="cm">Centimeter (cm)</option>
                        <option value="mm">Millimeter (mm)</option>
                        <option value="ft">Foot (ft)</option>
                        <option value="in">Inch (in)</option>
                        <option value="yd">Yard (yd)</option>
                        <option value="mi">Mile (mi)</option>
                      </>
                    )}
                    {unitCategory === "weight" && (
                      <>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="mg">Milligram (mg)</option>
                        <option value="lb">Pound (lb)</option>
                        <option value="oz">Ounce (oz)</option>
                        <option value="ton">Metric Ton</option>
                      </>
                    )}
                    {unitCategory === "temperature" && (
                      <>
                        <option value="c">Celsius (°C)</option>
                        <option value="f">Fahrenheit (°F)</option>
                        <option value="k">Kelvin (K)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary">To</label>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                  >
                    {unitCategory === "length" && (
                      <>
                        <option value="ft">Foot (ft)</option>
                        <option value="in">Inch (in)</option>
                        <option value="yd">Yard (yd)</option>
                        <option value="m">Meter (m)</option>
                        <option value="km">Kilometer (km)</option>
                        <option value="cm">Centimeter (cm)</option>
                        <option value="mm">Millimeter (mm)</option>
                        <option value="mi">Mile (mi)</option>
                      </>
                    )}
                    {unitCategory === "weight" && (
                      <>
                        <option value="lb">Pound (lb)</option>
                        <option value="oz">Ounce (oz)</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="mg">Milligram (mg)</option>
                        <option value="ton">Metric Ton</option>
                      </>
                    )}
                    {unitCategory === "temperature" && (
                      <>
                        <option value="f">Fahrenheit (°F)</option>
                        <option value="c">Celsius (°C)</option>
                        <option value="k">Kelvin (K)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-6 flex flex-col gap-6 sticky top-20">
          {isPercent ? (
            <ResultDisplay
              primaryMetric={{ label: "Percentage Result", value: percentResult.primary }}
              secondaryMetrics={percentResult.secondary}
            />
          ) : isAge ? (
            <ResultDisplay
              primaryMetric={{ label: "Your Exact Age", value: ageResult.primary }}
              secondaryMetrics={ageResult.secondary}
            />
          ) : isDateDiff ? (
            <ResultDisplay
              primaryMetric={{ label: "Date Difference", value: dateDiffResult.primary }}
              secondaryMetrics={dateDiffResult.secondary}
            />
          ) : isTimeDiff ? (
            <ResultDisplay
              primaryMetric={{ label: "Total Duration", value: timeDiffResult.primary }}
              secondaryMetrics={timeDiffResult.secondary}
            />
          ) : isCountdown ? (
            <div className="bg-surface border border-border rounded-xl p-8 shadow-card flex flex-col items-center justify-center gap-5 text-center">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                {eventName ? `Countdown: ${eventName}` : "Remaining Time"}
              </span>

              <div className="font-mono text-5xl sm:text-6xl font-extrabold text-accent tracking-wider">
                {Math.floor(cdRemaining / 3600)
                  .toString()
                  .padStart(2, "0")}
                :
                {Math.floor((cdRemaining % 3600) / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {(cdRemaining % 60).toString().padStart(2, "0")}
              </div>

              {timerFinished ? (
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4" />
                  <span>Time is Up! Countdown Completed!</span>
                </div>
              ) : (
                <span className="text-xs text-text-secondary">
                  {cdRunning
                    ? "Timer is actively running"
                    : cdRemaining === 0
                    ? "Set duration and click Start Countdown"
                    : "Timer is paused"}
                </span>
              )}

              {/* Progress bar */}
              {cdInitialTotal > 0 && (
                <div className="w-full bg-surface-raised rounded-full h-2 overflow-hidden border border-border mt-2">
                  <div
                    className="bg-accent h-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${Math.min(100, Math.max(0, (cdRemaining / cdInitialTotal) * 100))}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ) : isRatio ? (
            <ResultDisplay
              primaryMetric={{ label: "Ratio Solution", value: ratioResult.primary }}
              secondaryMetrics={ratioResult.secondary}
            />
          ) : isAverage ? (
            <ResultDisplay
              primaryMetric={{ label: "Calculated Mean", value: averageResult.primary }}
              secondaryMetrics={averageResult.secondary}
            />
          ) : isFraction ? (
            <ResultDisplay
              primaryMetric={{ label: "Fraction Result", value: fractionResult.primary }}
              secondaryMetrics={fractionResult.secondary}
            />
          ) : isArea ? (
            <ResultDisplay
              primaryMetric={{ label: "Computed Area", value: areaResult.primary }}
              secondaryMetrics={areaResult.secondary}
            />
          ) : isVolume ? (
            <ResultDisplay
              primaryMetric={{ label: "Computed Volume", value: volumeResult.primary }}
              secondaryMetrics={volumeResult.secondary}
            />
          ) : isSpeedOrDistance ? (
            <ResultDisplay
              primaryMetric={{ label: "Calculated Motion Metric", value: speedDistanceResult.primary }}
              secondaryMetrics={speedDistanceResult.secondary}
            />
          ) : isTimeZone ? (
            <ResultDisplay
              primaryMetric={{ label: "Converted Local Time", value: timeZoneResult.primary }}
              secondaryMetrics={timeZoneResult.secondary}
            />
          ) : (
            <ResultDisplay
              primaryMetric={{ label: "Converted Value", value: unitResult.primary }}
              secondaryMetrics={unitResult.secondary}
            />
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
