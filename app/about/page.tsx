import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE, ALL_TOOLS, CATEGORIES } from "@/lib/constants";
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  Code2, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Cpu, 
  Flame, 
  ArrowRight,
  Globe2
} from "lucide-react";

export const metadata: Metadata = {
  title: `About Us & Architecture - ${SITE_NAME}`,
  description: `Discover the mission and client-side engineering behind ${SITE_NAME} — high-speed, 100% private online utility tools without ads or sign-up friction.`,
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-12 py-8 max-w-5xl mx-auto w-full">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center gap-4 border-b border-border pb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Built for Speed & Sovereign Privacy
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-text-primary tracking-tight max-w-3xl">
          Every utility tool you need. <br />
          <span className="bg-gradient-to-r from-accent via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Zero ads, zero data tracking.
          </span>
        </h1>
        <p className="text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed">
          {SITE_NAME} is an ecosystem of {ALL_TOOLS.length}+ deterministic web utilities engineered to give professionals, students, creators, and developers instantaneous results right in their browser.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-6">
          <div className="p-4 bg-surface rounded-xl border border-border flex flex-col items-center shadow-subtle">
            <span className="text-2xl sm:text-3xl font-extrabold text-accent font-mono">{ALL_TOOLS.length}+</span>
            <span className="text-xs text-text-tertiary mt-1">Specialized Tools</span>
          </div>
          <div className="p-4 bg-surface rounded-xl border border-border flex flex-col items-center shadow-subtle">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">100%</span>
            <span className="text-xs text-text-tertiary mt-1">Client-Side Private</span>
          </div>
          <div className="p-4 bg-surface rounded-xl border border-border flex flex-col items-center shadow-subtle">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">&lt; 5ms</span>
            <span className="text-xs text-text-tertiary mt-1">Execution Latency</span>
          </div>
          <div className="p-4 bg-surface rounded-xl border border-border flex flex-col items-center shadow-subtle">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">{CATEGORIES.length}</span>
            <span className="text-xs text-text-tertiary mt-1">Core Categories</span>
          </div>
        </div>
      </div>

      {/* Why We Built ToolVerse */}
      <div className="flex flex-col gap-6 bg-surface border border-border rounded-2xl p-6 sm:p-10 shadow-card">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-rose-400" />
          The Problem with Today&apos;s Web Utilities
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Search the web for a basic calculator, PDF converter, or image resizer today, and you are greeted with a hostile user experience: full-page banner ads, artificial 10-second download countdowns, invasive cookie prompts, and hidden paywalls. Even worse, many sites upload your confidential financial data, proprietary documents, and client contracts to unencrypted remote servers for analytics or ad retargeting.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          We built <strong>{SITE_NAME}</strong> as the antithesis to ad-cluttered web utilities. We asked a simple question: <em>Why should you have to send a PDF or financial figure to a remote cloud server when modern web browsers have more computational power than supercomputers from a decade ago?</em>
        </p>
      </div>

      {/* Core Architectural Pillars */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Engineering Philosophy</span>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Our Four Foundational Pillars</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-subtle hover:border-accent/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary">1. Sovereign Client-Side Execution</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Every tool executes in your local browser sandbox via JavaScript, Web Workers, Canvas, and HTML5 Web APIs. Your confidential salary numbers, loan terms, and uploaded files are never streamed over public networks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-subtle hover:border-accent/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary">2. Instant Millisecond Performance</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              By removing server round-trips and bloatware scripts, calculations happen instantly as you type. Custom decimal rates, slider updates, and formatting render under 5 milliseconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-subtle hover:border-accent/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary">3. Zero Friction & No Mandatory Logins</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              You do not need to register, verify an email address, or enter credit card information just to calculate an EMI schedule, format JSON, or generate a QR code. Open the tool and get your work done immediately.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-subtle hover:border-accent/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary">4. Verified Mathematical Determinism</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Our financial algorithms and calculation matrices follow official regulatory standards (including compound SIP algorithms, reducing balance EMI equations, and Indian tax slabs) with rigorous automated test suites.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary">
          How {SITE_NAME} Compares
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-primary uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3">Dimension</th>
                <th className="py-3 px-3 text-emerald-400">{SITE_NAME}</th>
                <th className="py-3 px-3 text-rose-300">Generic Online Calculators</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-text-secondary">
              <tr>
                <td className="py-3 px-3 font-semibold text-text-primary">Ad Clutter</td>
                <td className="py-3 px-3 text-emerald-400 font-medium">0% Ads (Clean Workspace)</td>
                <td className="py-3 px-3 text-rose-300">5-10 banner ads, video popups</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-text-primary">Data Privacy</td>
                <td className="py-3 px-3 text-emerald-400 font-medium">100% Client-Side In-Memory</td>
                <td className="py-3 px-3 text-rose-300">Logged on remote analytics servers</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-text-primary">Custom Value Typing</td>
                <td className="py-3 px-3 text-emerald-400 font-medium">Full custom decimals & clean blank inputs</td>
                <td className="py-3 px-3 text-rose-300">Rigid sliders or non-custom presets</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-text-primary">Export Options</td>
                <td className="py-3 px-3 text-emerald-400 font-medium">Instant PDF reports, clipboard, CSV</td>
                <td className="py-3 px-3 text-rose-300">Locked behind premium paywalls</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-accent/20 via-surface to-surface border border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Ready to streamline your daily workflow?</h2>
          <p className="text-xs sm:text-sm text-text-secondary">Explore all {ALL_TOOLS.length} specialized utilities for finance, development, PDF, media, and business.</p>
        </div>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-glow transition-all shrink-0"
        >
          Browse All Tools <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
