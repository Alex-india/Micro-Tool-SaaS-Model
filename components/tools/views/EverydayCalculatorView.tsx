"use client";

import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";

export interface EverydayCalculatorViewProps {
  tool: ToolMeta;
}

export const EverydayCalculatorView: React.FC<EverydayCalculatorViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Exact Tool Mode Detection (Avoid loose substring collisions like "age" inside "percentage")
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

  // 1. Age State
  const [birthDate, setBirthDate] = useState<string>("");

  // 2. Date Diff State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 3. Time Diff State
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  // 4. Countdown Timer State
  const [cdHours, setCdHours] = useState<string>("");
  const [cdMinutes, setCdMinutes] = useState<string>("");
  const [cdSeconds, setCdSeconds] = useState<string>("");
  const [cdRemaining, setCdRemaining] = useState<number>(0);
  const [cdRunning, setCdRunning] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (cdRunning && cdRemaining > 0) {
      timer = setInterval(() => {
        setCdRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (cdRemaining === 0) {
      setCdRunning(false);
    }
    return () => clearInterval(timer);
  }, [cdRunning, cdRemaining]);

  const handleStartCountdown = () => {
    const h = parseInt(cdHours, 10) || 0;
    const m = parseInt(cdMinutes, 10) || 0;
    const s = parseInt(cdSeconds, 10) || 0;
    setCdRemaining(h * 3600 + m * 60 + s);
    setCdRunning(true);
  };

  // 5. Ratio State
  const [ratioA, setRatioA] = useState<string>("");
  const [ratioB, setRatioB] = useState<string>("");
  const [ratioC, setRatioC] = useState<string>("");

  // 6. Average State
  const [averageInput, setAverageInput] = useState<string>("");

  // 7. Fraction State
  const [num1, setNum1] = useState<string>("");
  const [den1, setDen1] = useState<string>("");
  const [num2, setNum2] = useState<string>("");
  const [den2, setDen2] = useState<string>("");
  const [fractionOp, setFractionOp] = useState<"+" | "-" | "*" | "/">("+");

  // 8. Area State
  const [areaShape, setAreaShape] = useState<"rectangle" | "circle" | "triangle">("rectangle");
  const [areaParam1, setAreaParam1] = useState<string>(""); // length / radius / base
  const [areaParam2, setAreaParam2] = useState<string>(""); // width / height

  // 9. Volume State
  const [volumeShape, setVolumeShape] = useState<"box" | "cylinder" | "sphere">("box");
  const [volParam1, setVolParam1] = useState<string>("");
  const [volParam2, setVolParam2] = useState<string>("");
  const [volParam3, setVolParam3] = useState<string>("");

  // 10. Speed / Distance State
  const [calcTarget, setCalcTarget] = useState<"speed" | "distance" | "time">("speed");
  const [speedVal, setSpeedVal] = useState<string>(""); // km/h
  const [distanceVal, setDistanceVal] = useState<string>(""); // km
  const [timeVal, setTimeVal] = useState<string>(""); // hours

  // 11. Time Zone State
  const [tzSource, setTzSource] = useState<string>("America/New_York");
  const [tzTarget, setTzTarget] = useState<string>("Asia/Kolkata");
  const [tzTime, setTzTime] = useState<string>("");

  // 12. Percentage State
  const [percentMode, setPercentMode] = useState<"calc_percent" | "what_percent" | "increase_decrease">("calc_percent");
  const [percentVal, setPercentVal] = useState<string>("");
  const [baseVal, setBaseVal] = useState<string>("");
  const [secondVal, setSecondVal] = useState<string>("");

  // 13. Unit Converter State
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

  // Helper: GCD
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  // 1. Age Calculation
  const ageResult = useMemo(() => {
    if (!birthDate) {
      return {
        primary: "Select date of birth",
        secondary: [
          { label: "Total Days Lived", value: "--" },
          { label: "Total Hours Lived", value: "--" },
          { label: "Next Birthday In", value: "--" },
          { label: "Day of Birth", value: "--" },
        ],
      };
    }
    const birth = new Date(birthDate);
    const now = new Date();
    if (isNaN(birth.getTime())) return { primary: "Invalid Date", secondary: [] };

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const diffMs = now.getTime() - birth.getTime();
    const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const totalHours = totalDays * 24;

    const nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
    const daysToNextBday = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      primary: `${years} Years, ${months} Months, ${days} Days`,
      secondary: [
        { label: "Total Days Lived", value: `${totalDays.toLocaleString()} Days` },
        { label: "Total Hours Lived", value: `${totalHours.toLocaleString()} Hours` },
        { label: "Next Birthday In", value: `${daysToNextBday} Days` },
        { label: "Day of Birth", value: birth.toLocaleDateString("en-US", { weekday: "long" }) },
      ],
    };
  }, [birthDate]);

  // 2. Date Difference Calculation
  const dateDiffResult = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        primary: "Select start and end dates",
        secondary: [
          { label: "Business Days", value: "--" },
          { label: "Weekend Days", value: "--" },
          { label: "Months Approx", value: "--" },
          { label: "Total Hours", value: "--" },
        ],
      };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { primary: "Invalid Dates", secondary: [] };

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;

    let businessDays = 0;
    const cur = new Date(Math.min(start.getTime(), end.getTime()));
    const finalDate = new Date(Math.max(start.getTime(), end.getTime()));
    while (cur <= finalDate) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) businessDays++;
      cur.setDate(cur.getDate() + 1);
    }

    return {
      primary: `${totalDays} Days (${weeks} weeks, ${remainingDays} days)`,
      secondary: [
        { label: "Business Days", value: `${businessDays} Days` },
        { label: "Weekend Days", value: `${totalDays - businessDays} Days` },
        { label: "Months Approx", value: `${(totalDays / 30.4375).toFixed(1)} Months` },
        { label: "Total Hours", value: `${(totalDays * 24).toLocaleString()} Hours` },
      ],
    };
  }, [startDate, endDate]);

  // 3. Time Difference Calculation
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
        { label: "Total Minutes", value: `${diff} Minutes` },
        { label: "Total Seconds", value: `${diff * 60} Seconds` },
        { label: "Decimal Hours", value: `${(diff / 60).toFixed(2)} Hours` },
        { label: "Day Portion", value: `${((diff / 1440) * 100).toFixed(1)}% of 24 hrs` },
      ],
    };
  }, [startTime, endTime]);

  // 4. Ratio Calculation
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

    // Solve A : B = C : D => D = (B * C) / A
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

  // 5. Average Calculation
  const averageResult = useMemo(() => {
    const nums = averageInput
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !isNaN(n));

    if (nums.length === 0) return { primary: "0", secondary: [] };

    const sum = nums.reduce((acc, v) => acc + v, 0);
    const mean = sum / nums.length;

    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length;
    const stdDev = Math.sqrt(variance);

    return {
      primary: `Average (Mean): ${mean.toFixed(2)}`,
      secondary: [
        { label: "Median", value: `${median.toFixed(2)}` },
        { label: "Sum of All Values", value: `${sum.toFixed(2)}` },
        { label: "Count of Numbers", value: `${nums.length}` },
        { label: "Min / Max Range", value: `${sorted[0]} to ${sorted[sorted.length - 1]}` },
        { label: "Standard Deviation", value: `${stdDev.toFixed(2)}` },
      ],
    };
  }, [averageInput]);

  // 6. Fraction Calculation
  const fractionResult = useMemo(() => {
    if (!num1 && !num2 && !den1 && !den2) {
      return {
        primary: "-- / --",
        secondary: [
          { label: "Decimal Value", value: "0" },
          { label: "Percentage", value: "0%" },
          { label: "Equation", value: "Enter fractions above" },
          { label: "Simplified Factor", value: "--" },
        ],
      };
    }
    const n1 = parseInt(num1, 10) || 0;
    const d1 = parseInt(den1, 10) || 1;
    const n2 = parseInt(num2, 10) || 0;
    const d2 = parseInt(den2, 10) || 1;
    let resNum = 0;
    let resDen = 1;

    if (fractionOp === "+") {
      resNum = n1 * d2 + n2 * d1;
      resDen = d1 * d2;
    } else if (fractionOp === "-") {
      resNum = n1 * d2 - n2 * d1;
      resDen = d1 * d2;
    } else if (fractionOp === "*") {
      resNum = n1 * n2;
      resDen = d1 * d2;
    } else {
      resNum = n1 * d2;
      resDen = d1 * (n2 || 1);
    }

    const g = gcd(Math.abs(resNum) || 1, Math.abs(resDen) || 1);
    const simpNum = resNum / g;
    const simpDen = resDen / g;
    const decimal = simpDen !== 0 ? (simpNum / simpDen).toFixed(4) : "0";

    return {
      primary: `${simpNum} / ${simpDen}`,
      secondary: [
        { label: "Decimal Value", value: `${decimal}` },
        { label: "Percentage", value: `${(Number(decimal) * 100).toFixed(2)}%` },
        { label: "Equation", value: `${n1}/${d1} ${fractionOp} ${n2}/${d2}` },
        { label: "Simplified Factor", value: `Reduced by ${g}` },
      ],
    };
  }, [num1, den1, num2, den2, fractionOp]);

  // 7. Area Calculation
  const areaResult = useMemo(() => {
    const p1 = parseFloat(areaParam1) || 0;
    const p2 = parseFloat(areaParam2) || 0;
    if (!p1 && !p2) {
      return {
        primary: "0.00 Sq Units",
        secondary: [
          { label: "Square Feet", value: "0.00 sq ft" },
          { label: "Square Meters", value: "0.00 m²" },
          { label: "Acres Approx", value: "0.0000 acres" },
          { label: "Formula Used", value: "Enter dimensions above" },
        ],
      };
    }
    let area = 0;
    let formula = "";
    if (areaShape === "rectangle") {
      area = p1 * p2;
      formula = `Length (${p1}) × Width (${p2})`;
    } else if (areaShape === "circle") {
      area = Math.PI * Math.pow(p1, 2);
      formula = `π × Radius² (${p1}²)`;
    } else {
      area = 0.5 * p1 * p2;
      formula = `½ × Base (${p1}) × Height (${p2})`;
    }

    return {
      primary: `${area.toFixed(2)} Sq Units`,
      secondary: [
        { label: "Square Feet", value: `${(area * 10.764).toFixed(2)} sq ft` },
        { label: "Square Meters", value: `${area.toFixed(2)} m²` },
        { label: "Acres Approx", value: `${(area / 4046.86).toFixed(4)} acres` },
        { label: "Formula Used", value: formula },
      ],
    };
  }, [areaShape, areaParam1, areaParam2]);

  // 8. Volume Calculation
  const volumeResult = useMemo(() => {
    const v1 = parseFloat(volParam1) || 0;
    const v2 = parseFloat(volParam2) || 0;
    const v3 = parseFloat(volParam3) || 0;
    if (!v1) {
      return {
        primary: "0.00 Cu Units",
        secondary: [
          { label: "Liters Approx", value: "0.00 L" },
          { label: "Gallons Approx", value: "0.00 gal" },
          { label: "Cubic Feet", value: "0.00 cu ft" },
          { label: "Formula Used", value: "Enter dimensions above" },
        ],
      };
    }
    let vol = 0;
    let formula = "";
    if (volumeShape === "box") {
      vol = v1 * (v2 || 1) * (v3 || 1);
      formula = `Length (${v1}) × Width (${v2 || 1}) × Height (${v3 || 1})`;
    } else if (volumeShape === "cylinder") {
      vol = Math.PI * Math.pow(v1, 2) * (v2 || 1);
      formula = `π × Radius² (${v1}²) × Height (${v2 || 1})`;
    } else {
      vol = (4 / 3) * Math.PI * Math.pow(v1, 3);
      formula = `(4/3) × π × Radius³ (${v1}³)`;
    }

    return {
      primary: `${vol.toFixed(2)} Cu Units`,
      secondary: [
        { label: "Liters Approx", value: `${(vol * 1).toFixed(2)} L` },
        { label: "Gallons (US)", value: `${(vol * 0.264172).toFixed(2)} gal` },
        { label: "Cubic Feet", value: `${(vol * 0.0353147).toFixed(2)} cu ft` },
        { label: "Formula Used", value: formula },
      ],
    };
  }, [volumeShape, volParam1, volParam2, volParam3]);

  // 9. Speed / Distance Calculation
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

  // 10. Percentage Calculation
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

  // 11. Time Zone Calculation
  const timeZoneResult = useMemo(() => {
    try {
      let targetDate = new Date();
      if (tzTime) {
        const [h, m] = tzTime.split(":").map(Number);
        targetDate.setHours(h || 0, m || 0, 0, 0);
      }

      const sourceStr = targetDate.toLocaleTimeString("en-US", {
        timeZone: tzSource,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const targetStr = targetDate.toLocaleTimeString("en-US", {
        timeZone: tzTarget,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const targetDateStr = targetDate.toLocaleDateString("en-US", {
        timeZone: tzTarget,
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return {
        primary: `${targetStr}`,
        secondary: [
          { label: "Target Date", value: targetDateStr },
          { label: "Source Time", value: `${sourceStr} (${tzSource.split("/")[1]?.replace(/_/g, " ") || tzSource})` },
          { label: "Destination City", value: tzTarget.split("/")[1]?.replace(/_/g, " ") || tzTarget },
          { label: "Status", value: "Synchronized" },
        ],
      };
    } catch (e) {
      return {
        primary: "--:--:--",
        secondary: [
          { label: "Error", value: "Invalid timezone" },
        ],
      };
    }
  }, [tzSource, tzTarget, tzTime]);

  // 12. Unit Converter Calculation
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
        {/* Left Inputs */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          {isPercent ? (
            <>
              {/* Standard Percentage */}
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
                    onClick={() => setPercentMode(m.id as any)}
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
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Set Countdown Timer
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Hours"
                  type="number"
                  value={cdHours}
                  onChange={(e) => setCdHours(e.target.value)}
                  placeholder="0"
                />
                <Input
                  label="Minutes"
                  type="number"
                  value={cdMinutes}
                  onChange={(e) => setCdMinutes(e.target.value)}
                  placeholder="25"
                />
                <Input
                  label="Seconds"
                  type="number"
                  value={cdSeconds}
                  onChange={(e) => setCdSeconds(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={handleStartCountdown}
                  leftIcon={<Play className="w-4 h-4 fill-current" />}
                >
                  {cdRunning ? "Restart Timer" : "Start Countdown"}
                </Button>
                {cdRunning && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setCdRunning(false)}
                    leftIcon={<Pause className="w-4 h-4" />}
                  >
                    Pause
                  </Button>
                )}
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
                <label className="text-text-secondary">Numbers (comma or space separated)</label>
                <textarea
                  value={averageInput}
                  onChange={(e) => setAverageInput(e.target.value)}
                  placeholder="Enter numbers separated by comma or space (e.g. 12, 45, 67, 89)..."
                  rows={5}
                  className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
            </>
          ) : isFraction ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Fraction Arithmetic
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <Input
                    label="Numerator 1"
                    type="number"
                    value={num1}
                    onChange={(e) => setNum1(e.target.value)}
                    placeholder="e.g. 3"
                  />
                  <Input
                    label="Denominator 1"
                    type="number"
                    value={den1}
                    onChange={(e) => setDen1(e.target.value)}
                    placeholder="e.g. 4"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary text-center">Op</label>
                  <select
                    value={fractionOp}
                    onChange={(e) => setFractionOp(e.target.value as any)}
                    className="p-3 bg-surface-raised border border-border rounded-lg text-base font-bold text-accent"
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
                    type="number"
                    value={num2}
                    onChange={(e) => setNum2(e.target.value)}
                    placeholder="e.g. 2"
                  />
                  <Input
                    label="Denominator 2"
                    type="number"
                    value={den2}
                    onChange={(e) => setDen2(e.target.value)}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
            </>
          ) : isArea ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Area Dimensions
              </h3>
              <div className="flex gap-2">
                {(["rectangle", "circle", "triangle"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAreaShape(s)}
                    className={`flex-1 p-2 rounded-lg border text-xs capitalize transition-colors ${
                      areaShape === s
                        ? "bg-accent/10 border-accent text-accent font-bold"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Input
                label={areaShape === "circle" ? "Radius" : "Length / Base"}
                type="number"
                value={areaParam1}
                onChange={(e) => setAreaParam1(e.target.value)}
                placeholder="Enter length or radius (e.g. 25)..."
              />
              {areaShape !== "circle" && (
                <Input
                  label="Width / Height"
                  type="number"
                  value={areaParam2}
                  onChange={(e) => setAreaParam2(e.target.value)}
                  placeholder="Enter width or height (e.g. 14)..."
                />
              )}
            </>
          ) : isVolume ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Volume Dimensions
              </h3>
              <div className="flex gap-2">
                {(["box", "cylinder", "sphere"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVolumeShape(s)}
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
              <Input
                label={volumeShape === "sphere" ? "Radius" : volumeShape === "cylinder" ? "Radius" : "Length"}
                type="number"
                value={volParam1}
                onChange={(e) => setVolParam1(e.target.value)}
                placeholder="Enter radius or length..."
              />
              {volumeShape === "box" && (
                <Input
                  label="Width"
                  type="number"
                  value={volParam2}
                  onChange={(e) => setVolParam2(e.target.value)}
                  placeholder="Enter width..."
                />
              )}
              {volumeShape !== "sphere" && (
                <Input
                  label="Height"
                  type="number"
                  value={volumeShape === "cylinder" ? volParam2 : volParam3}
                  onChange={(e) => {
                    if (volumeShape === "cylinder") setVolParam2(e.target.value);
                    else setVolParam3(e.target.value);
                  }}
                  placeholder="Enter height..."
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
                    onClick={() => setCalcTarget(t)}
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
                  <label className="text-xs text-text-secondary">Source Time Zone</label>
                  <select
                    value={tzSource}
                    onChange={(e) => setTzSource(e.target.value)}
                    className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option value="America/New_York">New York (EST/EDT)</option>
                    <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                    <option value="America/Chicago">Chicago (CST/CDT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris / Berlin (CET/CEST)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Asia/Singapore">Singapore / HK (SGT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                    <option value="UTC">UTC / GMT</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary">Target Time Zone</label>
                  <select
                    value={tzTarget}
                    onChange={(e) => setTzTarget(e.target.value)}
                    className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="America/New_York">New York (EST/EDT)</option>
                    <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                    <option value="America/Chicago">Chicago (CST/CDT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris / Berlin (CET/CEST)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Singapore">Singapore / HK (SGT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                    <option value="UTC">UTC / GMT</option>
                  </select>
                </div>
              </div>
              <Input
                label="Custom Time (optional, defaults to Current Time)"
                type="time"
                value={tzTime}
                onChange={(e) => setTzTime(e.target.value)}
              />
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
        <div className="lg:col-span-6 flex flex-col gap-6 lg:sticky lg:top-24">
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
            <div className="bg-surface border border-border rounded-xl p-8 shadow-card flex flex-col items-center justify-center gap-4 text-center">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Remaining Time</span>
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
              <span className="text-xs text-text-secondary">
                {cdRunning ? "Timer is actively running" : cdRemaining === 0 ? "Countdown Completed!" : "Timer is paused"}
              </span>
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
