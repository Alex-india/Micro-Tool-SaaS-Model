"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "../ResultDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  Plus,
  Trash2,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Clock,
  Copy,
  Check,
  Scale,
  Award,
  ListOrdered,
  Layers,
  FileCheck,
  Percent,
} from "lucide-react";

export interface StudentStudioViewProps {
  tool: ToolMeta;
}

// Data structures
interface SubjectItem {
  id: string;
  name: string;
  credits: string;
  gradePoint: string;
}

interface SemesterItem {
  id: string;
  name: string;
  sgpa: string;
  credits: string;
}

interface WeightedAssessmentItem {
  id: string;
  name: string;
  score: string;
  weight: string;
}

interface CourseworkItem {
  id: string;
  name: string;
  earned: string;
  possible: string;
}

interface MarkSubjectItem {
  id: string;
  name: string;
  scored: string;
  maxMarks: string;
}

// ==========================================
// CONTINUOUS GAPLESS GRADING SCALES (0-100%)
// ==========================================

function getUsGradeFromPercent(pct: number): { letter: string; gpa: string } {
  if (pct >= 97) return { letter: "A+", gpa: "4.0" };
  if (pct >= 93) return { letter: "A", gpa: "4.0" };
  if (pct >= 90) return { letter: "A-", gpa: "3.7" };
  if (pct >= 87) return { letter: "B+", gpa: "3.3" };
  if (pct >= 83) return { letter: "B", gpa: "3.0" };
  if (pct >= 80) return { letter: "B-", gpa: "2.7" };
  if (pct >= 77) return { letter: "C+", gpa: "2.3" };
  if (pct >= 73) return { letter: "C", gpa: "2.0" };
  if (pct >= 70) return { letter: "C-", gpa: "1.7" };
  if (pct >= 67) return { letter: "D+", gpa: "1.3" };
  if (pct >= 60) return { letter: "D", gpa: "1.0" };
  return { letter: "F", gpa: "0.0" };
}

function getUgcGradeFromPercent(pct: number): { letter: string; gradePoint: string } {
  if (pct >= 90) return { letter: "O (Outstanding)", gradePoint: "10.0" };
  if (pct >= 80) return { letter: "A+ (Excellent)", gradePoint: "9.0" };
  if (pct >= 70) return { letter: "A (Very Good)", gradePoint: "8.0" };
  if (pct >= 60) return { letter: "B+ (Good)", gradePoint: "7.0" };
  if (pct >= 55) return { letter: "B (Above Average)", gradePoint: "6.0" };
  if (pct >= 50) return { letter: "C (Average)", gradePoint: "5.0" };
  if (pct >= 40) return { letter: "P (Pass)", gradePoint: "4.0" };
  return { letter: "F (Fail)", gradePoint: "0.0" };
}

export const StudentStudioView: React.FC<StudentStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Strict Discrete Mode Detection
  const isAttendance = slug.includes("attendance") || slug.includes("bunk");
  const isCitation = slug.includes("citation") || slug.includes("apa") || slug.includes("mla");
  const isCountdown = slug.includes("exam") || slug.includes("countdown");
  const isStudyHours = slug.includes("study") || slug.includes("hours");
  const isRequiredMarks = slug === "required-marks-calculator";
  const isMarksPercentage = slug === "marks-percentage-calculator";
  const isWeightedGrade = slug === "weighted-grade-calculator";
  const isGradeCalculator = slug === "grade-calculator";
  const isSGPA = slug === "semester-gpa-calculator" || slug === "gpa-calculator";
  const isCgpaCalculator = slug === "cgpa-calculator";
  const isCgpaToPercentage = !isAttendance && !isCitation && !isCountdown && !isStudyHours && !isRequiredMarks && !isMarksPercentage && !isWeightedGrade && !isGradeCalculator && !isSGPA && !isCgpaCalculator;

  // ==========================================
  // STATE MANAGEMENT (Clean & Empty by default)
  // ==========================================

  // 1. Attendance & Bunk States
  const [attendedClasses, setAttendedClasses] = useState<string>("");
  const [totalClasses, setTotalClasses] = useState<string>("");
  const [targetAttendance, setTargetAttendance] = useState<number>(75);

  // 2. CGPA to Percentage States (Conversion only)
  const [cgpa, setCgpa] = useState<string>("");
  const [cgpaScale, setCgpaScale] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<string>("9.5");

  // 3. Multi-Semester CGPA Calculator States (Clean empty rows)
  const [semesters, setSemesters] = useState<SemesterItem[]>([
    { id: "1", name: "Semester 1", sgpa: "", credits: "" },
    { id: "2", name: "Semester 2", sgpa: "", credits: "" },
    { id: "3", name: "Semester 3", sgpa: "", credits: "" },
  ]);

  // 4. Marks Percentage Calculator States (Clean empty rows)
  const [markMode, setMarkMode] = useState<"single" | "multi">("single");
  const [singleScored, setSingleScored] = useState<string>("");
  const [singleMax, setSingleMax] = useState<string>("");
  const [multiSubjects, setMultiSubjects] = useState<MarkSubjectItem[]>([
    { id: "1", name: "Subject 1", scored: "", maxMarks: "100" },
    { id: "2", name: "Subject 2", scored: "", maxMarks: "100" },
    { id: "3", name: "Subject 3", scored: "", maxMarks: "100" },
  ]);

  // 5. Weighted Grade Calculator States (Clean empty rows)
  const [weightedAssessments, setWeightedAssessments] = useState<WeightedAssessmentItem[]>([
    { id: "1", name: "Homework / Assignments", score: "", weight: "" },
    { id: "2", name: "Midterm Exam", score: "", weight: "" },
    { id: "3", name: "Final Examination", score: "", weight: "" },
  ]);

  // 6. Grade Calculator States (Clean empty rows)
  const [gradeScaleType, setGradeScaleType] = useState<"4.0" | "10.0">("4.0");
  const [courseworkItems, setCourseworkItems] = useState<CourseworkItem[]>([
    { id: "1", name: "Assignment 1", earned: "", possible: "" },
    { id: "2", name: "Midterm Test", earned: "", possible: "" },
  ]);

  // 7. SGPA Course Table
  const [subjects, setSubjects] = useState<SubjectItem[]>([
    { id: "1", name: "Course 1", credits: "", gradePoint: "" },
    { id: "2", name: "Course 2", credits: "", gradePoint: "" },
    { id: "3", name: "Course 3", credits: "", gradePoint: "" },
  ]);

  // 8. Required Marks States
  const [obtainedMarks, setObtainedMarks] = useState<string>("");
  const [totalMaxMarks, setTotalMaxMarks] = useState<string>("");
  const [targetGradeGoal, setTargetGradeGoal] = useState<string>("");
  const [finalExamWeight, setFinalExamWeight] = useState<number>(40);

  // 9. Citation States
  const [citeFormat, setCiteFormat] = useState<"APA" | "MLA">("APA");
  const [citeType, setCiteType] = useState<"book" | "website" | "journal">("book");
  const [citeAuthor, setCiteAuthor] = useState<string>("");
  const [citeTitle, setCiteTitle] = useState<string>("");
  const [citeYear, setCiteYear] = useState<string>("");
  const [citePublisher, setCitePublisher] = useState<string>("");
  const [citeUrl, setCiteUrl] = useState<string>("");
  const [copiedCite, setCopiedCite] = useState<boolean>(false);

  // 10. Exam Countdown State
  const [examName, setExamName] = useState<string>("");
  const [examDate, setExamDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // 11. Study Hours States
  const [totalCreditsEnrolled, setTotalCreditsEnrolled] = useState<string>("");
  const [difficultyLevel, setDifficultyLevel] = useState<"standard" | "hard" | "light">("standard");

  // ==========================================
  // MATHEMATICAL CALCULATIONS
  // ==========================================

  // A. Marks Percentage Calculator (Strict Sum-of-Scored / Sum-of-Total)
  const marksPercentageResult = useMemo(() => {
    let scoredSum = 0;
    let maxMarksSum = 0;

    if (markMode === "single") {
      scoredSum = parseFloat(singleScored) || 0;
      maxMarksSum = parseFloat(singleMax) || 0;
    } else {
      multiSubjects.forEach((sub) => {
        scoredSum += parseFloat(sub.scored) || 0;
        maxMarksSum += parseFloat(sub.maxMarks) || 0;
      });
    }

    const hasInput = markMode === "single"
      ? (parseFloat(singleScored) > 0 || parseFloat(singleMax) > 0)
      : multiSubjects.some((s) => parseFloat(s.scored) > 0);

    if (!hasInput || maxMarksSum <= 0) {
      return {
        pct: "--",
        scored: "0",
        total: "0",
        letter: "--",
        division: "Enter your scored marks",
        isPass: false,
        hasData: false,
      };
    }

    const pct = (scoredSum / maxMarksSum) * 100;
    const usGrade = getUsGradeFromPercent(pct);

    let division = "Fail / Compartment";
    let isPass = false;
    if (pct >= 75) {
      division = "First Class with Distinction";
      isPass = true;
    } else if (pct >= 60) {
      division = "First Division";
      isPass = true;
    } else if (pct >= 50) {
      division = "Second Division";
      isPass = true;
    } else if (pct >= 40) {
      division = "Third Division (Pass)";
      isPass = true;
    }

    return {
      pct: pct.toFixed(2),
      scored: scoredSum.toFixed(1),
      total: maxMarksSum.toFixed(1),
      letter: usGrade.letter,
      division,
      isPass,
      hasData: true,
    };
  }, [markMode, singleScored, singleMax, multiSubjects]);

  // B. Multi-Semester CGPA Calculator (Credit-Weighted)
  const multiSemesterCgpaResult = useMemo(() => {
    let totalCredits = 0;
    let totalGradePoints = 0;
    let sgpaSumNoCredits = 0;
    let countNoCredits = 0;

    semesters.forEach((sem) => {
      const sgpaVal = parseFloat(sem.sgpa) || 0;
      const credVal = parseFloat(sem.credits) || 0;
      if (sgpaVal > 0) {
        if (credVal > 0) {
          totalCredits += credVal;
          totalGradePoints += sgpaVal * credVal;
        } else {
          sgpaSumNoCredits += sgpaVal;
          countNoCredits += 1;
        }
      }
    });

    const hasData = semesters.some((s) => parseFloat(s.sgpa) > 0);

    let calculatedCGPA = 0;
    if (totalCredits > 0) {
      calculatedCGPA = totalGradePoints / totalCredits;
    } else if (countNoCredits > 0) {
      calculatedCGPA = sgpaSumNoCredits / countNoCredits;
    }

    const percentage = calculatedCGPA * 9.5;
    const usGpa = (calculatedCGPA / 10) * 4.0;

    let standing = "Enter semester SGPAs";
    if (hasData) {
      standing = "Good Academic Standing";
      if (calculatedCGPA >= 8.5) standing = "First Class with Distinction";
      else if (calculatedCGPA >= 6.5) standing = "First Class";
      else if (calculatedCGPA >= 5.5) standing = "Second Class";
      else if (calculatedCGPA < 4.0 && calculatedCGPA > 0) standing = "Probation / Needs Improvement";
    }

    return {
      cgpa: hasData ? calculatedCGPA.toFixed(2) : "--",
      totalCredits: totalCredits > 0 ? totalCredits.toString() : "--",
      percentage: hasData ? percentage.toFixed(2) : "--",
      usGpa: hasData ? usGpa.toFixed(2) : "--",
      standing,
      hasData,
      semesterCount: semesters.length,
    };
  }, [semesters]);

  // C. Weighted Grade Calculator (Normalized with Weight Sum Validation)
  const weightedGradeResult = useMemo(() => {
    let totalWeight = 0;
    let weightedSum = 0;

    weightedAssessments.forEach((item) => {
      const s = parseFloat(item.score) || 0;
      const w = parseFloat(item.weight) || 0;
      totalWeight += w;
      weightedSum += s * w;
    });

    const hasData = weightedAssessments.some((a) => parseFloat(a.score) > 0 && parseFloat(a.weight) > 0);
    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const gradeInfo = getUsGradeFromPercent(finalScore);

    let weightStatus: "complete" | "incomplete" | "exceeds" = "incomplete";
    if (totalWeight > 0) {
      if (Math.abs(totalWeight - 100) < 0.01) {
        weightStatus = "complete";
      } else {
        weightStatus = totalWeight < 100 ? "incomplete" : "exceeds";
      }
    }

    return {
      finalScore: hasData ? finalScore.toFixed(2) : "--",
      totalWeight: totalWeight.toFixed(1),
      letter: hasData ? gradeInfo.letter : "--",
      gpa: hasData ? gradeInfo.gpa : "--",
      weightStatus,
      isPassing: finalScore >= 60,
      hasData,
    };
  }, [weightedAssessments]);

  // D. Grade Calculator (Points-Weighted with Dual Scale)
  const gradeCalculatorResult = useMemo(() => {
    let totalEarned = 0;
    let totalPossible = 0;

    courseworkItems.forEach((item) => {
      totalEarned += parseFloat(item.earned) || 0;
      totalPossible += parseFloat(item.possible) || 0;
    });

    const hasData = courseworkItems.some((c) => parseFloat(c.earned) > 0 && parseFloat(c.possible) > 0);
    const overallPercent = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    const usGrade = getUsGradeFromPercent(overallPercent);
    const ugcGrade = getUgcGradeFromPercent(overallPercent);

    return {
      overallPercent: hasData ? overallPercent.toFixed(2) : "--",
      totalEarned: hasData ? totalEarned.toFixed(1) : "--",
      totalPossible: hasData ? totalPossible.toFixed(1) : "--",
      usLetter: hasData ? usGrade.letter : "--",
      usGpa: hasData ? usGrade.gpa : "--",
      ugcLetter: hasData ? ugcGrade.letter : "--",
      ugcPoint: hasData ? ugcGrade.gradePoint : "--",
      isPass: overallPercent >= 60,
      hasData,
    };
  }, [courseworkItems]);

  // E. CGPA to Percentage (Single Conversion)
  const cgpaResult = useMemo(() => {
    const numCgpa = parseFloat(cgpa) || 0;
    const numMult = parseFloat(multiplier) || 9.5;
    if (!numCgpa) {
      return {
        percentage: "0.00",
        gpa4: "0.00",
        gpa10: "0.00",
        classification: "Enter your CGPA",
        hasData: false,
      };
    }
    const percentage = cgpaScale === 10 ? numCgpa * numMult : (numCgpa / 4) * 100;
    const gpa4 = cgpaScale === 10 ? (numCgpa / 10) * 4 : numCgpa;
    const gpa10 = cgpaScale === 4 ? (numCgpa / 4) * 10 : numCgpa;

    let classification = "First Class with Distinction";
    if (percentage < 40) classification = "Needs Improvement";
    else if (percentage < 50) classification = "Pass Class";
    else if (percentage < 60) classification = "Second Class";
    else if (percentage < 75) classification = "First Class";

    return {
      percentage: Math.min(100, Math.max(0, percentage)).toFixed(2),
      gpa4: gpa4.toFixed(2),
      gpa10: gpa10.toFixed(2),
      classification,
      hasData: true,
    };
  }, [cgpa, cgpaScale, multiplier]);

  // F. Attendance Calculator
  const attendanceResult = useMemo(() => {
    const attended = Math.max(0, parseFloat(attendedClasses) || 0);
    const total = Math.max(0, parseFloat(totalClasses) || 0);
    const hasData = parseFloat(attendedClasses) > 0 || parseFloat(totalClasses) > 0;
    if (!hasData || !total) {
      return { currentPercent: "0.0", isSafe: true, bunkable: 0, needed: 0, hasData: false };
    }
    const safeTotal = Math.max(1, total);
    const currentPercent = (attended / safeTotal) * 100;

    let bunkable = 0;
    let needed = 0;

    if (currentPercent >= targetAttendance) {
      bunkable = Math.max(0, Math.floor((attended * 100) / targetAttendance - safeTotal));
    } else {
      const numerator = targetAttendance * safeTotal - 100 * attended;
      const denominator = 100 - targetAttendance;
      needed = denominator > 0 ? Math.max(0, Math.ceil(numerator / denominator)) : 0;
    }

    return {
      currentPercent: currentPercent.toFixed(1),
      isSafe: currentPercent >= targetAttendance,
      bunkable,
      needed,
      hasData: true,
    };
  }, [attendedClasses, totalClasses, targetAttendance]);

  // G. SGPA Course Matrix
  const sgpaResult = useMemo(() => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    subjects.forEach((s) => {
      const c = parseFloat(s.credits) || 0;
      const gp = parseFloat(s.gradePoint) || 0;
      totalCredits += c;
      totalGradePoints += c * gp;
    });

    const hasData = totalCredits > 0;
    const calculatedSGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    return {
      sgpa: hasData ? calculatedSGPA.toFixed(2) : "--",
      totalCredits,
      totalGradePoints,
      hasData,
    };
  }, [subjects]);

  // H. Required Marks on Final Exam
  const requiredMarksResult = useMemo(() => {
    const obtained = parseFloat(obtainedMarks) || 0;
    const total = parseFloat(totalMaxMarks) || 0;
    const target = parseFloat(targetGradeGoal) || 0;
    const hasData = parseFloat(obtainedMarks) > 0 && parseFloat(totalMaxMarks) > 0 && parseFloat(targetGradeGoal) > 0;
    if (!hasData) {
      return { pct: "--", letter: "--", requiredExamPct: "--", hasData: false };
    }
    const pct = total > 0 ? (obtained / total) * 100 : 0;
    let letter = "F";
    if (pct >= 90) letter = "A+ (Outstanding)";
    else if (pct >= 80) letter = "A (Excellent)";
    else if (pct >= 70) letter = "B (Good)";
    else if (pct >= 60) letter = "C (Satisfactory)";
    else if (pct >= 50) letter = "D (Pass)";

    const currentWeight = 100 - finalExamWeight;
    const currentContribution = (pct * currentWeight) / 100;
    const neededFromFinal = target - currentContribution;
    const requiredExamPct = finalExamWeight > 0 ? (neededFromFinal / finalExamWeight) * 100 : 0;

    return {
      pct: pct.toFixed(1),
      letter,
      requiredExamPct: Math.min(100, Math.max(0, requiredExamPct)).toFixed(1),
      hasData: true,
    };
  }, [obtainedMarks, totalMaxMarks, targetGradeGoal, finalExamWeight]);

  // I. Citation Output
  const citationOutput = useMemo(() => {
    if (!citeAuthor && !citeTitle) {
      return "Enter publication and author details on the left to view formatted citation.";
    }
    if (citeFormat === "APA") {
      if (citeType === "book") {
        return `${citeAuthor || "Author"} (${citeYear || "Year"}). ${citeTitle || "Title"}. ${citePublisher || "Publisher"}.`;
      } else if (citeType === "website") {
        return `${citeAuthor || "Author"} (${citeYear || "Year"}). ${citeTitle || "Title"}. Retrieved from ${citeUrl || "URL"}`;
      } else {
        return `${citeAuthor || "Author"} (${citeYear || "Year"}). ${citeTitle || "Title"}. ${citePublisher || "Journal"}, 10(2), 112-124.`;
      }
    } else {
      if (citeType === "book") {
        return `${citeAuthor || "Author"}. ${citeTitle || "Title"}. ${citePublisher || "Publisher"}, ${citeYear || "Year"}.`;
      } else if (citeType === "website") {
        return `${citeAuthor || "Author"}. "${citeTitle || "Title"}." ${citePublisher || "Web"}, ${citeYear || "Year"}, ${citeUrl || "URL"}.`;
      } else {
        return `${citeAuthor || "Author"}. "${citeTitle || "Title"}." ${citePublisher || "Journal"}, vol. 10, no. 2, ${citeYear || "Year"}, pp. 112-124.`;
      }
    }
  }, [citeFormat, citeType, citeAuthor, citeTitle, citeYear, citePublisher, citeUrl]);

  // J. Exam Countdown Result
  const examCountdownResult = useMemo(() => {
    if (!examDate) {
      return { days: "--", hours: "--", status: "Enter exam date" };
    }
    const target = new Date(examDate);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const hours = days * 24;

    return {
      days,
      hours,
      status: days > 0 ? `${days} Days Remaining` : "Exam Today / Passed",
    };
  }, [examDate]);

  // K. Study Hours Result
  const studyHoursResult = useMemo(() => {
    const numCredits = parseFloat(totalCreditsEnrolled) || 0;
    if (!numCredits) {
      return { weeklyHours: "--", dailyHours: "--", pomodoroSessions: "--", hasData: false };
    }
    const multiplierHours = difficultyLevel === "hard" ? 3 : difficultyLevel === "light" ? 1.5 : 2;
    const weeklyHours = numCredits * multiplierHours;
    const dailyHours = (weeklyHours / 7).toFixed(1);
    const pomodoroSessions = Math.ceil((weeklyHours * 60) / 25);

    return {
      weeklyHours: weeklyHours.toFixed(0),
      dailyHours,
      pomodoroSessions,
      hasData: true,
    };
  }, [totalCreditsEnrolled, difficultyLevel]);

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationOutput);
    setCopiedCite(true);
    setTimeout(() => setCopiedCite(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Controls */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          {/* 1. MARKS PERCENTAGE CALCULATOR */}
          {isMarksPercentage ? (
            <>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-accent" /> Marks Percentage Calculator
                </h3>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMarkMode("single")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      markMode === "single" ? "bg-accent/15 text-accent border border-accent" : "bg-surface-raised text-text-secondary border border-border"
                    }`}
                  >
                    Quick Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkMode("multi")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      markMode === "multi" ? "bg-accent/15 text-accent border border-accent" : "bg-surface-raised text-text-secondary border border-border"
                    }`}
                  >
                    Subject Wise
                  </button>
                </div>
              </div>

              {markMode === "single" ? (
                <div className="flex flex-col gap-4">
                  <Input
                    label="Total Marks Obtained / Scored"
                    type="number"
                    value={singleScored}
                    onChange={(e) => setSingleScored(e.target.value)}
                    placeholder="e.g. 425"
                  />
                  <Input
                    label="Maximum Total Marks (Total Out of)"
                    type="number"
                    value={singleMax}
                    onChange={(e) => setSingleMax(e.target.value)}
                    placeholder="e.g. 500"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Enter marks per subject:</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const newId = (multiSubjects.length + 1).toString();
                        setMultiSubjects([...multiSubjects, { id: newId, name: `Subject ${newId}`, scored: "", maxMarks: "100" }]);
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Subject
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {multiSubjects.map((sub, i) => (
                      <div key={sub.id} className="p-3 bg-surface-raised rounded-lg border border-border flex items-center gap-2.5">
                        <span className="text-xs font-mono text-text-tertiary w-4">{i + 1}.</span>
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => {
                            const updated = [...multiSubjects];
                            updated[i].name = e.target.value;
                            setMultiSubjects(updated);
                          }}
                          placeholder="Subject"
                          className="flex-1 bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                        />
                        <div className="w-20">
                          <input
                            type="number"
                            value={sub.scored}
                            onChange={(e) => {
                              const updated = [...multiSubjects];
                              updated[i].scored = e.target.value;
                              setMultiSubjects(updated);
                            }}
                            placeholder="Scored"
                            className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center font-bold text-accent outline-none focus:border-accent"
                          />
                        </div>
                        <span className="text-xs text-text-tertiary">/</span>
                        <div className="w-20">
                          <input
                            type="number"
                            value={sub.maxMarks}
                            onChange={(e) => {
                              const updated = [...multiSubjects];
                              updated[i].maxMarks = e.target.value;
                              setMultiSubjects(updated);
                            }}
                            placeholder="Max"
                            className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center outline-none focus:border-accent"
                          />
                        </div>
                        {multiSubjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMultiSubjects(multiSubjects.filter((s) => s.id !== sub.id))}
                            className="p-1.5 text-text-tertiary hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : isCgpaCalculator ? (
            /* 2. MULTI-SEMESTER CGPA CALCULATOR */
            <>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-accent" /> Multi-Semester CGPA Calculator
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newId = (semesters.length + 1).toString();
                    setSemesters([...semesters, { id: newId, name: `Semester ${newId}`, sgpa: "", credits: "" }]);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Semester
                </Button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {semesters.map((sem, i) => (
                  <div key={sem.id} className="p-3 bg-surface-raised rounded-lg border border-border flex items-center gap-3">
                    <span className="text-xs font-mono text-text-tertiary w-4">{i + 1}.</span>
                    <input
                      type="text"
                      value={sem.name}
                      onChange={(e) => {
                        const updated = [...semesters];
                        updated[i].name = e.target.value;
                        setSemesters(updated);
                      }}
                      placeholder="Semester"
                      className="flex-1 bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                    />
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={sem.sgpa}
                        onChange={(e) => {
                          const updated = [...semesters];
                          updated[i].sgpa = e.target.value;
                          setSemesters(updated);
                        }}
                        placeholder="SGPA"
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center font-bold text-accent outline-none focus:border-accent"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={sem.credits}
                        onChange={(e) => {
                          const updated = [...semesters];
                          updated[i].credits = e.target.value;
                          setSemesters(updated);
                        }}
                        placeholder="Credits"
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center outline-none focus:border-accent"
                      />
                    </div>
                    {semesters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSemesters(semesters.filter((s) => s.id !== sem.id))}
                        className="p-1.5 text-text-tertiary hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <span className="text-[11px] text-text-tertiary">
                Formula: Strict credit-weighted average: Σ(SGPA × Credits) / Σ(Credits).
              </span>
            </>
          ) : isWeightedGrade ? (
            /* 3. WEIGHTED GRADE CALCULATOR */
            <>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-accent" /> Weighted Grade Calculator
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newId = (weightedAssessments.length + 1).toString();
                    setWeightedAssessments([...weightedAssessments, { id: newId, name: `Assessment ${newId}`, score: "", weight: "" }]);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Assessment
                </Button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {weightedAssessments.map((item, i) => (
                  <div key={item.id} className="p-3 bg-surface-raised rounded-lg border border-border flex items-center gap-3">
                    <span className="text-xs font-mono text-text-tertiary w-4">{i + 1}.</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...weightedAssessments];
                        updated[i].name = e.target.value;
                        setWeightedAssessments(updated);
                      }}
                      placeholder="Assessment Name"
                      className="flex-1 bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                    />
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.score}
                        onChange={(e) => {
                          const updated = [...weightedAssessments];
                          updated[i].score = e.target.value;
                          setWeightedAssessments(updated);
                        }}
                        placeholder="Score (%)"
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center font-bold text-accent outline-none focus:border-accent"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.weight}
                        onChange={(e) => {
                          const updated = [...weightedAssessments];
                          updated[i].weight = e.target.value;
                          setWeightedAssessments(updated);
                        }}
                        placeholder="Weight (%)"
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center outline-none focus:border-accent"
                      />
                    </div>
                    {weightedAssessments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setWeightedAssessments(weightedAssessments.filter((a) => a.id !== item.id))}
                        className="p-1.5 text-text-tertiary hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Weight Sum Validation Alert Badge */}
              <div
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                  weightedGradeResult.weightStatus === "complete"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : weightedGradeResult.weightStatus === "incomplete"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                <span>Total Weights Sum: {weightedGradeResult.totalWeight}%</span>
                <span>
                  {weightedGradeResult.weightStatus === "complete"
                    ? "✓ Exact 100%"
                    : weightedGradeResult.weightStatus === "incomplete"
                    ? `Remaining: ${(100 - parseFloat(weightedGradeResult.totalWeight)).toFixed(1)}%`
                    : `Exceeds by ${(parseFloat(weightedGradeResult.totalWeight) - 100).toFixed(1)}%`}
                </span>
              </div>
            </>
          ) : isGradeCalculator ? (
            /* 4. COURSE GRADE CALCULATOR */
            <>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent" /> Course Grade Calculator
                </h3>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGradeScaleType("4.0")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      gradeScaleType === "4.0" ? "bg-accent/15 text-accent border border-accent" : "bg-surface-raised text-text-secondary border border-border"
                    }`}
                  >
                    4.0 US Scale
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeScaleType("10.0")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      gradeScaleType === "10.0" ? "bg-accent/15 text-accent border border-accent" : "bg-surface-raised text-text-secondary border border-border"
                    }`}
                  >
                    10-Pt UGC
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Enter coursework points:</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newId = (courseworkItems.length + 1).toString();
                    setCourseworkItems([...courseworkItems, { id: newId, name: `Item ${newId}`, earned: "", possible: "" }]);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Item
                </Button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {courseworkItems.map((item, i) => (
                  <div key={item.id} className="p-3 bg-surface-raised rounded-lg border border-border flex items-center gap-3">
                    <span className="text-xs font-mono text-text-tertiary w-4">{i + 1}.</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...courseworkItems];
                        updated[i].name = e.target.value;
                        setCourseworkItems(updated);
                      }}
                      placeholder="Assignment / Test"
                      className="flex-1 bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                    />
                    <div className="w-20">
                      <input
                        type="number"
                        value={item.earned}
                        onChange={(e) => {
                          const updated = [...courseworkItems];
                          updated[i].earned = e.target.value;
                          setCourseworkItems(updated);
                        }}
                        placeholder="Earned"
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center font-bold text-accent outline-none focus:border-accent"
                      />
                    </div>
                    <span className="text-xs text-text-tertiary">/</span>
                    <div className="w-20">
                      <input
                        type="number"
                        value={item.possible}
                        onChange={(e) => {
                          const updated = [...courseworkItems];
                          updated[i].possible = e.target.value;
                          setCourseworkItems(updated);
                        }}
                        placeholder="Possible"
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center outline-none focus:border-accent"
                      />
                    </div>
                    {courseworkItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCourseworkItems(courseworkItems.filter((c) => c.id !== item.id))}
                        className="p-1.5 text-text-tertiary hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : isAttendance ? (
            /* 5. ATTENDANCE CALCULATOR */
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Attendance & Bunk Planner
              </h3>
              <Input
                label="Total Classes Attended"
                type="number"
                value={attendedClasses}
                onChange={(e) => setAttendedClasses(e.target.value)}
                placeholder="Classes attended (e.g. 38)..."
              />
              <Input
                label="Total Classes Conducted to Date"
                type="number"
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                placeholder="Total classes (e.g. 45)..."
              />
              <Slider
                label="Target Minimum Attendance Requirement"
                min={50}
                max={95}
                step={1}
                value={targetAttendance}
                unit="%"
                onChangeValue={(v) => setTargetAttendance(v)}
              />
            </>
          ) : isCitation ? (
            /* 6. CITATION GENERATOR */
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Citation Generator (APA / MLA)
              </h3>
              <div className="flex gap-2">
                {(["APA", "MLA"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setCiteFormat(fmt)}
                    className={`flex-1 p-2 rounded-lg border text-xs font-semibold ${
                      citeFormat === fmt ? "bg-accent/10 border-accent text-accent" : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {fmt} 7th/9th Edition
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(["book", "website", "journal"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCiteType(t)}
                    className={`flex-1 p-1.5 rounded-lg border text-xs capitalize ${
                      citeType === t ? "bg-accent/10 border-accent text-accent" : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Input label="Author(s) (Last, First)" value={citeAuthor} onChange={(e) => setCiteAuthor(e.target.value)} placeholder="e.g. Smith, John" />
              <Input label="Title of Work / Article" value={citeTitle} onChange={(e) => setCiteTitle(e.target.value)} placeholder="e.g. Modern Web Architecture" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Publication Year" value={citeYear} onChange={(e) => setCiteYear(e.target.value)} placeholder="e.g. 2024" />
                <Input label="Publisher / Journal" value={citePublisher} onChange={(e) => setCitePublisher(e.target.value)} placeholder="e.g. Academic Press" />
              </div>
              {citeType === "website" && (
                <Input label="URL Link" value={citeUrl} onChange={(e) => setCiteUrl(e.target.value)} placeholder="e.g. https://example.com/article" />
              )}
            </>
          ) : isCountdown ? (
            /* 7. EXAM COUNTDOWN */
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Exam Countdown Settings
              </h3>
              <Input label="Examination / Assignment Name" value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Final Board Examinations" />
              <Input label="Exam Date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </>
          ) : isRequiredMarks ? (
            /* 8. REQUIRED MARKS ON FINAL EXAM */
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Required Final Exam Marks Estimator
              </h3>
              <Input
                label="Marks Obtained So Far"
                type="number"
                value={obtainedMarks}
                onChange={(e) => setObtainedMarks(e.target.value)}
                placeholder="Marks obtained (e.g. 82)..."
              />
              <Input
                label="Maximum Total Marks"
                type="number"
                value={totalMaxMarks}
                onChange={(e) => setTotalMaxMarks(e.target.value)}
                placeholder="Maximum marks (e.g. 100)..."
              />
              <Input
                label="Desired Overall Target Grade (%)"
                type="number"
                value={targetGradeGoal}
                onChange={(e) => setTargetGradeGoal(e.target.value)}
                suffixSymbol="%"
                placeholder="Desired target % (e.g. 90)..."
              />
              <Slider
                label="Upcoming Final Exam Weight (%)"
                min={10}
                max={70}
                step={5}
                value={finalExamWeight}
                unit="%"
                onChangeValue={(v) => setFinalExamWeight(v)}
              />
            </>
          ) : isStudyHours ? (
            /* 9. STUDY HOURS CALCULATOR */
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Study Hours Planner
              </h3>
              <Input
                label="Total Course Credits Enrolled"
                type="number"
                value={totalCreditsEnrolled}
                onChange={(e) => setTotalCreditsEnrolled(e.target.value)}
                placeholder="Enrolled credits (e.g. 18)..."
              />
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-text-secondary">Course Rigor / Difficulty</label>
                <div className="flex gap-2">
                  {[
                    { id: "light", label: "Light (1.5h/credit)" },
                    { id: "standard", label: "Standard (2h/credit)" },
                    { id: "hard", label: "STEM / Intensive (3h/credit)" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficultyLevel(d.id as any)}
                      className={`flex-1 p-2 rounded-lg border text-xs ${
                        difficultyLevel === d.id ? "bg-accent/10 border-accent text-accent font-semibold" : "bg-surface-raised border-border text-text-secondary"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : isSGPA ? (
            /* 10. SEMESTER GPA / GPA CALCULATOR */
            <>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Semester Course Matrix
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newId = (subjects.length + 1).toString();
                    setSubjects([...subjects, { id: newId, name: `Course ${newId}`, credits: "", gradePoint: "" }]);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Course
                </Button>
              </div>
              <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                {subjects.map((sub, i) => (
                  <div key={sub.id} className="p-3 bg-surface-raised rounded-lg border border-border flex items-center gap-3">
                    <span className="text-xs font-mono text-text-tertiary w-4">{i + 1}.</span>
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => {
                        const updated = [...subjects];
                        updated[i].name = e.target.value;
                        setSubjects(updated);
                      }}
                      placeholder="Course name (e.g. Math)..."
                      className="flex-1 bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                    />
                    <div className="w-16">
                      <input
                        type="number"
                        value={sub.credits}
                        min={1}
                        max={10}
                        onChange={(e) => {
                          const updated = [...subjects];
                          updated[i].credits = e.target.value;
                          setSubjects(updated);
                        }}
                        placeholder="Credits"
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center outline-none focus:border-accent"
                      />
                    </div>
                    <div className="w-16">
                      <input
                        type="number"
                        value={sub.gradePoint}
                        min={0}
                        max={10}
                        onChange={(e) => {
                          const updated = [...subjects];
                          updated[i].gradePoint = e.target.value;
                          setSubjects(updated);
                        }}
                        placeholder="Grade"
                        className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary text-center font-bold text-accent outline-none focus:border-accent"
                      />
                    </div>
                    {subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSubjects(subjects.filter((s) => s.id !== sub.id))}
                        className="p-1.5 text-text-tertiary hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* 11. CGPA TO PERCENTAGE CONVERTER */
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                CGPA to Percentage Converter
              </h3>
              <Input
                label="Enter Your CGPA / GPA"
                type="number"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                placeholder="Enter your CGPA (e.g. 8.5)..."
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCgpaScale(10);
                    setMultiplier("9.5");
                  }}
                  className={`flex-1 p-2.5 rounded-lg border text-xs font-semibold ${
                    cgpaScale === 10 ? "bg-accent/10 border-accent text-accent" : "bg-surface-raised border-border text-text-secondary"
                  }`}
                >
                  10-Point Scale (CBSE/AICTE)
                </button>
                <button
                  type="button"
                  onClick={() => setCgpaScale(4)}
                  className={`flex-1 p-2.5 rounded-lg border text-xs font-semibold ${
                    cgpaScale === 4 ? "bg-accent/10 border-accent text-accent" : "bg-surface-raised border-border text-text-secondary"
                  }`}
                >
                  4.0 US Scale
                </button>
              </div>
              {cgpaScale === 10 && (
                <Input
                  label="Conversion Multiplier Factor"
                  type="number"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  placeholder="9.5"
                />
              )}
            </>
          )}
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-6 flex flex-col gap-6 sticky top-20">
          {isMarksPercentage ? (
            <ResultDisplay
              primaryMetric={{
                label: "Aggregate Marks Percentage",
                value: marksPercentageResult.hasData ? `${marksPercentageResult.pct}%` : "--%",
              }}
              secondaryMetrics={[
                { label: "Grade Awarded", value: marksPercentageResult.letter },
                { label: "Classification", value: marksPercentageResult.division },
                { label: "Total Scored", value: marksPercentageResult.hasData ? `${marksPercentageResult.scored} / ${marksPercentageResult.total}` : "-- / --" },
                { label: "Result Status", value: marksPercentageResult.hasData ? (marksPercentageResult.isPass ? "Passed" : "Needs Improvement") : "Awaiting input" },
              ]}
            />
          ) : isCgpaCalculator ? (
            <ResultDisplay
              primaryMetric={{
                label: "Cumulative CGPA",
                value: multiSemesterCgpaResult.hasData ? `${multiSemesterCgpaResult.cgpa} / 10.0` : "-- / 10.0",
              }}
              secondaryMetrics={[
                { label: "Equivalent Percentage", value: multiSemesterCgpaResult.hasData ? `${multiSemesterCgpaResult.percentage}% (× 9.5)` : "--%" },
                { label: "Equivalent 4.0 US GPA", value: multiSemesterCgpaResult.hasData ? `${multiSemesterCgpaResult.usGpa} / 4.0` : "-- / 4.0" },
                { label: "Total Course Credits", value: multiSemesterCgpaResult.hasData ? `${multiSemesterCgpaResult.totalCredits} Credits` : "-- Credits" },
                { label: "Academic Standing", value: multiSemesterCgpaResult.standing },
              ]}
            />
          ) : isWeightedGrade ? (
            <ResultDisplay
              primaryMetric={{
                label: "Overall Weighted Grade",
                value: weightedGradeResult.hasData ? `${weightedGradeResult.finalScore}% (${weightedGradeResult.letter})` : "--%",
              }}
              secondaryMetrics={[
                { label: "Equivalent 4.0 GPA", value: weightedGradeResult.hasData ? `${weightedGradeResult.gpa} / 4.0` : "-- / 4.0" },
                { label: "Weights Total", value: `${weightedGradeResult.totalWeight}%` },
                { label: "Assessments Count", value: `${weightedAssessments.length} items` },
                { label: "Course Standing", value: weightedGradeResult.hasData ? (weightedGradeResult.isPassing ? "Passing Grade" : "Failing Grade") : "Enter scores & weights" },
              ]}
            />
          ) : isGradeCalculator ? (
            <ResultDisplay
              primaryMetric={{
                label: "Calculated Course Grade",
                value: gradeCalculatorResult.hasData ? `${gradeCalculatorResult.overallPercent}% (${
                  gradeScaleType === "4.0" ? gradeCalculatorResult.usLetter : gradeCalculatorResult.ugcLetter
                })` : "--%",
              }}
              secondaryMetrics={[
                {
                  label: gradeScaleType === "4.0" ? "Equivalent US GPA" : "Equivalent UGC Point",
                  value: gradeCalculatorResult.hasData ? (gradeScaleType === "4.0" ? `${gradeCalculatorResult.usGpa} / 4.0` : `${gradeCalculatorResult.ugcPoint} / 10.0`) : "--",
                },
                { label: "Total Points", value: gradeCalculatorResult.hasData ? `${gradeCalculatorResult.totalEarned} / ${gradeCalculatorResult.totalPossible}` : "-- / --" },
                { label: "Grading Scale", value: gradeScaleType === "4.0" ? "US Standard 4.0 Scale" : "UGC 10-Point Scale" },
                { label: "Course Status", value: gradeCalculatorResult.hasData ? (gradeCalculatorResult.isPass ? "Satisfactory / Pass" : "Unsatisfactory / Fail") : "Enter coursework points" },
              ]}
            />
          ) : isAttendance ? (
            <ResultDisplay
              primaryMetric={{
                label: "Current Attendance",
                value: attendanceResult.hasData ? `${attendanceResult.currentPercent}%` : "--%",
              }}
              secondaryMetrics={[
                {
                  label: "Bunk Status",
                  value: attendanceResult.hasData
                    ? (attendanceResult.isSafe
                      ? `You can safely miss ${attendanceResult.bunkable} classes!`
                      : `Attend next ${attendanceResult.needed} classes consecutively!`)
                    : "Enter class attendance",
                },
                { label: "Target Requirement", value: `${targetAttendance}%` },
                { label: "Classes Attended", value: attendanceResult.hasData ? `${attendedClasses} / ${totalClasses}` : "-- / --" },
                { label: "Safety Status", value: attendanceResult.hasData ? (attendanceResult.isSafe ? "In Safe Zone" : "Danger (Shortage)") : "Awaiting input" },
              ]}
            />
          ) : isCitation ? (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Formatted {citeFormat} Citation
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyCitation}
                  leftIcon={copiedCite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copiedCite ? "Copied" : "Copy Citation"}
                </Button>
              </div>
              <div className="p-4 bg-surface-raised border border-border rounded-lg text-sm text-text-primary leading-relaxed font-serif italic">
                {citationOutput}
              </div>
              <span className="text-xs text-text-tertiary">
                Follows standard citation formatting rules for academic bibliographies and works cited pages.
              </span>
            </div>
          ) : isCountdown ? (
            <ResultDisplay
              primaryMetric={{
                label: examCountdownResult.status,
                value: examDate ? `${examCountdownResult.days} Days` : "-- Days",
              }}
              secondaryMetrics={[
                { label: "Exam Title", value: examName || "Exam Countdown" },
                { label: "Target Date", value: examDate ? new Date(examDate).toLocaleDateString() : "--" },
                { label: "Total Hours", value: examDate ? `${examCountdownResult.hours} Hours` : "-- Hours" },
                { label: "Status", value: examDate ? "Active Study Countdown" : "Set exam date" },
              ]}
            />
          ) : isRequiredMarks ? (
            <ResultDisplay
              primaryMetric={{
                label: "Current Marks Percentage",
                value: requiredMarksResult.hasData ? `${requiredMarksResult.pct}% (${requiredMarksResult.letter})` : "--%",
              }}
              secondaryMetrics={[
                { label: "Required Score on Final Exam", value: requiredMarksResult.hasData ? `${requiredMarksResult.requiredExamPct}%` : "--%" },
                { label: "Goal Grade Target", value: targetGradeGoal ? `${targetGradeGoal}%` : "--%" },
                { label: "Marks Scored", value: requiredMarksResult.hasData ? `${obtainedMarks} / ${totalMaxMarks}` : "-- / --" },
                { label: "Final Weighting", value: `${finalExamWeight}% of total` },
              ]}
            />
          ) : isStudyHours ? (
            <ResultDisplay
              primaryMetric={{
                label: "Recommended Weekly Study",
                value: studyHoursResult.hasData ? `${studyHoursResult.weeklyHours} Hours / Week` : "-- Hours / Week",
              }}
              secondaryMetrics={[
                { label: "Daily Commitment", value: studyHoursResult.hasData ? `${studyHoursResult.dailyHours} Hours / Day` : "-- Hours / Day" },
                { label: "Pomodoro Sessions", value: studyHoursResult.hasData ? `${studyHoursResult.pomodoroSessions} Pomodoros` : "-- Pomodoros" },
                { label: "Enrolled Credits", value: totalCreditsEnrolled ? `${totalCreditsEnrolled} Credits` : "-- Credits" },
                { label: "Rigour Setting", value: difficultyLevel.toUpperCase() },
              ]}
            />
          ) : isSGPA ? (
            <ResultDisplay
              primaryMetric={{
                label: "Calculated Semester SGPA",
                value: sgpaResult.hasData ? sgpaResult.sgpa : "--",
              }}
              secondaryMetrics={[
                { label: "Total Semester Credits", value: sgpaResult.hasData ? `${sgpaResult.totalCredits}` : "--" },
                { label: "Weighted Grade Points", value: sgpaResult.hasData ? `${sgpaResult.totalGradePoints}` : "--" },
                { label: "Equivalent Percentage", value: sgpaResult.hasData ? `${(parseFloat(sgpaResult.sgpa) * 9.5).toFixed(1)}%` : "--%" },
                { label: "Academic Standing", value: sgpaResult.hasData ? (parseFloat(sgpaResult.sgpa) >= 8.5 ? "First Class with Distinction" : "Good Standing") : "Enter course credits & grades" },
              ]}
            />
          ) : (
            <ResultDisplay
              primaryMetric={{
                label: "Calculated Percentage",
                value: cgpaResult.hasData ? `${cgpaResult.percentage}%` : "--%",
              }}
              secondaryMetrics={[
                { label: "Equivalent 4.0 GPA", value: cgpaResult.hasData ? cgpaResult.gpa4 : "--" },
                { label: "Equivalent 10.0 CGPA", value: cgpaResult.hasData ? cgpaResult.gpa10 : "--" },
                { label: "Academic Division", value: cgpaResult.classification },
                { label: "Formula Applied", value: cgpaScale === 10 ? `CGPA × ${multiplier}` : "(GPA / 4) × 100" },
              ]}
            />
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};
