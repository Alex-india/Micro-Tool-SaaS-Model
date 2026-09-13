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
import { Plus, Trash2, GraduationCap, CheckCircle2, AlertCircle, Sparkles, BookOpen, Clock, Copy, Check } from "lucide-react";

export interface StudentStudioViewProps {
  tool: ToolMeta;
}

interface SubjectItem {
  id: string;
  name: string;
  credits: string;
  gradePoint: string;
}

export const StudentStudioView: React.FC<StudentStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Mode detection
  const isAttendance = slug.includes("attendance") || slug.includes("bunk");
  const isCitation = slug.includes("citation") || slug.includes("apa") || slug.includes("mla");
  const isCountdown = slug.includes("exam") || slug.includes("countdown");
  const isStudyHours = slug.includes("study") || slug.includes("hours");
  const isMarksOrGrade =
    slug.includes("marks") ||
    slug.includes("grade-calculator") ||
    slug.includes("required-marks") ||
    slug.includes("weighted");
  const isSGPA = slug.includes("sgpa") || slug.includes("semester") || slug === "gpa-calculator";
  const isCGPA = !isAttendance && !isCitation && !isCountdown && !isStudyHours && !isMarksOrGrade && !isSGPA;

  // 1. CGPA / Percentage States
  const [cgpa, setCgpa] = useState<string>("");
  const [cgpaScale, setCgpaScale] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<string>("9.5");

  // 2. Attendance States
  const [attendedClasses, setAttendedClasses] = useState<string>("");
  const [totalClasses, setTotalClasses] = useState<string>("");
  const [targetAttendance, setTargetAttendance] = useState<number>(75);

  // 3. SGPA Course Table
  const [subjects, setSubjects] = useState<SubjectItem[]>([
    { id: "1", name: "", credits: "", gradePoint: "" },
  ]);

  // 4. Citation States
  const [citeFormat, setCiteFormat] = useState<"APA" | "MLA">("APA");
  const [citeType, setCiteType] = useState<"book" | "website" | "journal">("book");
  const [citeAuthor, setCiteAuthor] = useState<string>("");
  const [citeTitle, setCiteTitle] = useState<string>("");
  const [citeYear, setCiteYear] = useState<string>("");
  const [citePublisher, setCitePublisher] = useState<string>("");
  const [citeUrl, setCiteUrl] = useState<string>("");
  const [copiedCite, setCopiedCite] = useState<boolean>(false);

  // 5. Exam Countdown State
  const [examName, setExamName] = useState<string>("");
  const [examDate, setExamDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // 6. Marks & Grade States
  const [obtainedMarks, setObtainedMarks] = useState<string>("");
  const [totalMaxMarks, setTotalMaxMarks] = useState<string>("");
  const [targetGradeGoal, setTargetGradeGoal] = useState<string>("");
  const [finalExamWeight, setFinalExamWeight] = useState<number>(40);

  // 7. Study Hours States
  const [totalCreditsEnrolled, setTotalCreditsEnrolled] = useState<string>("");
  const [difficultyLevel, setDifficultyLevel] = useState<"standard" | "hard" | "light">("standard");

  // Calculations
  const cgpaResult = useMemo(() => {
    const numCgpa = parseFloat(cgpa) || 0;
    const numMult = parseFloat(multiplier) || 9.5;
    if (!numCgpa) {
      return {
        percentage: "0.00",
        gpa4: "0.00",
        gpa10: "0.00",
        classification: "Enter your CGPA",
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
    };
  }, [cgpa, cgpaScale, multiplier]);

  const attendanceResult = useMemo(() => {
    const attended = Math.max(0, parseFloat(attendedClasses) || 0);
    const total = Math.max(0, parseFloat(totalClasses) || 0);
    if (!total && !attended) {
      return {
        currentPercent: "0.0",
        isSafe: true,
        bunkable: 0,
        needed: 0,
      };
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
    };
  }, [attendedClasses, totalClasses, targetAttendance]);

  const sgpaResult = useMemo(() => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    subjects.forEach((s) => {
      const c = parseFloat(s.credits) || 0;
      const gp = parseFloat(s.gradePoint) || 0;
      totalCredits += c;
      totalGradePoints += c * gp;
    });

    const calculatedSGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    return {
      sgpa: calculatedSGPA.toFixed(2),
      totalCredits,
      totalGradePoints,
    };
  }, [subjects]);

  const citationOutput = useMemo(() => {
    if (citeFormat === "APA") {
      if (citeType === "book") {
        return `${citeAuthor} (${citeYear}). ${citeTitle}. ${citePublisher}.`;
      } else if (citeType === "website") {
        return `${citeAuthor} (${citeYear}). ${citeTitle}. Retrieved from ${citeUrl}`;
      } else {
        return `${citeAuthor} (${citeYear}). ${citeTitle}. ${citePublisher}, 10(2), 112-124.`;
      }
    } else {
      // MLA
      if (citeType === "book") {
        return `${citeAuthor}. ${citeTitle}. ${citePublisher}, ${citeYear}.`;
      } else if (citeType === "website") {
        return `${citeAuthor}. "${citeTitle}." ${citePublisher || "Web"}, ${citeYear}, ${citeUrl}.`;
      } else {
        return `${citeAuthor}. "${citeTitle}." ${citePublisher}, vol. 10, no. 2, ${citeYear}, pp. 112-124.`;
      }
    }
  }, [citeFormat, citeType, citeAuthor, citeTitle, citeYear, citePublisher, citeUrl]);

  const examCountdownResult = useMemo(() => {
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

  const marksResult = useMemo(() => {
    const obtained = parseFloat(obtainedMarks) || 0;
    const total = parseFloat(totalMaxMarks) || 0;
    const target = parseFloat(targetGradeGoal) || 0;
    if (!obtained && !total) {
      return {
        pct: "0.0",
        letter: "--",
        requiredExamPct: "0.0",
      };
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
    };
  }, [obtainedMarks, totalMaxMarks, targetGradeGoal, finalExamWeight]);

  const studyHoursResult = useMemo(() => {
    const numCredits = parseFloat(totalCreditsEnrolled) || 0;
    if (!numCredits) {
      return {
        weeklyHours: "0",
        dailyHours: "0.0",
        pomodoroSessions: 0,
      };
    }
    const multiplierHours = difficultyLevel === "hard" ? 3 : difficultyLevel === "light" ? 1.5 : 2;
    const weeklyHours = numCredits * multiplierHours;
    const dailyHours = (weeklyHours / 7).toFixed(1);
    const pomodoroSessions = Math.ceil((weeklyHours * 60) / 25);

    return {
      weeklyHours: weeklyHours.toFixed(0),
      dailyHours,
      pomodoroSessions,
    };
  }, [totalCreditsEnrolled, difficultyLevel]);

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationOutput);
    setCopiedCite(true);
    setTimeout(() => setCopiedCite(false), 2000);
  };

  const handleAddSubject = () => {
    const newId = (subjects.length + 1).toString();
    setSubjects([...subjects, { id: newId, name: `Course ${newId}`, credits: "", gradePoint: "" }]);
  };

  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          {isAttendance ? (
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
              <Input label="Author(s) (Last, First)" value={citeAuthor} onChange={(e) => setCiteAuthor(e.target.value)} />
              <Input label="Title of Work / Article" value={citeTitle} onChange={(e) => setCiteTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Publication Year" value={citeYear} onChange={(e) => setCiteYear(e.target.value)} />
                <Input label="Publisher / Journal" value={citePublisher} onChange={(e) => setCitePublisher(e.target.value)} />
              </div>
              {citeType === "website" && (
                <Input label="URL Link" value={citeUrl} onChange={(e) => setCiteUrl(e.target.value)} />
              )}
            </>
          ) : isCountdown ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Exam Countdown Settings
              </h3>
              <Input label="Examination / Assignment Name" value={examName} onChange={(e) => setExamName(e.target.value)} />
              <Input label="Exam Date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </>
          ) : isMarksOrGrade ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Marks & Target Grade Estimator
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
            <>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Semester Course Matrix
                </h3>
                <Button variant="secondary" size="sm" onClick={handleAddSubject} leftIcon={<Plus className="w-3.5 h-3.5" />}>
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
                        onClick={() => handleRemoveSubject(sub.id)}
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
            <>
              {/* Standard CGPA Converter */}
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
        <div className="lg:col-span-6 flex flex-col gap-6 lg:sticky lg:top-24">
          {isAttendance ? (
            <ResultDisplay
              primaryMetric={{
                label: "Current Attendance",
                value: `${attendanceResult.currentPercent}%`,
              }}
              secondaryMetrics={[
                {
                  label: "Bunk Status",
                  value: attendanceResult.isSafe
                    ? `You can safely miss ${attendanceResult.bunkable} classes!`
                    : `Attend next ${attendanceResult.needed} classes consecutively!`,
                },
                { label: "Target Requirement", value: `${targetAttendance}%` },
                { label: "Classes Attended", value: `${attendedClasses} / ${totalClasses}` },
                { label: "Safety Status", value: attendanceResult.isSafe ? "In Safe Zone" : "Danger (Shortage)" },
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
                value: `${examCountdownResult.days} Days`,
              }}
              secondaryMetrics={[
                { label: "Exam Title", value: examName },
                { label: "Target Date", value: new Date(examDate).toLocaleDateString() },
                { label: "Total Hours", value: `${examCountdownResult.hours} Hours` },
                { label: "Status", value: "Active Study Countdown" },
              ]}
            />
          ) : isMarksOrGrade ? (
            <ResultDisplay
              primaryMetric={{
                label: "Current Marks Percentage",
                value: `${marksResult.pct}% (${marksResult.letter})`,
              }}
              secondaryMetrics={[
                { label: "Required Score on Final Exam", value: `${marksResult.requiredExamPct}%` },
                { label: "Goal Grade Target", value: `${targetGradeGoal}%` },
                { label: "Marks Scored", value: `${obtainedMarks} / ${totalMaxMarks}` },
                { label: "Final Weighting", value: `${finalExamWeight}% of total` },
              ]}
            />
          ) : isStudyHours ? (
            <ResultDisplay
              primaryMetric={{
                label: "Recommended Weekly Study",
                value: `${studyHoursResult.weeklyHours} Hours / Week`,
              }}
              secondaryMetrics={[
                { label: "Daily Commitment", value: `${studyHoursResult.dailyHours} Hours / Day` },
                { label: "Pomodoro Sessions", value: `${studyHoursResult.pomodoroSessions} Pomodoros` },
                { label: "Enrolled Credits", value: `${totalCreditsEnrolled} Credits` },
                { label: "Rigour Setting", value: difficultyLevel.toUpperCase() },
              ]}
            />
          ) : isSGPA ? (
            <ResultDisplay
              primaryMetric={{
                label: "Calculated Semester SGPA",
                value: sgpaResult.sgpa,
              }}
              secondaryMetrics={[
                { label: "Total Semester Credits", value: `${sgpaResult.totalCredits}` },
                { label: "Weighted Grade Points", value: `${sgpaResult.totalGradePoints}` },
                { label: "Equivalent Percentage", value: `${(parseFloat(sgpaResult.sgpa) * 9.5).toFixed(1)}%` },
                { label: "Academic Standing", value: parseFloat(sgpaResult.sgpa) >= 8.5 ? "First Class with Distinction" : "Good Standing" },
              ]}
            />
          ) : (
            <ResultDisplay
              primaryMetric={{
                label: "Calculated Percentage",
                value: `${cgpaResult.percentage}%`,
              }}
              secondaryMetrics={[
                { label: "Equivalent 4.0 GPA", value: cgpaResult.gpa4 },
                { label: "Equivalent 10.0 CGPA", value: cgpaResult.gpa10 },
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
