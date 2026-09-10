"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE_NAME, CATEGORIES, ALL_TOOLS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Download,
  Calculator,
  Code,
  FileText,
  KeyRound,
  QrCode,
  FileSpreadsheet,
} from "lucide-react";
import * as Icons from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = searchQuery.trim()
    ? ALL_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      router.push(searchResults[0].path);
    } else if (searchQuery.trim()) {
      router.push(`/tools?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popularTools = ALL_TOOLS.filter((t) => t.isPopular).slice(0, 8);

  const keyPillars = [
    {
      icon: ShieldCheck,
      title: "100% Client-Side Privacy",
      description: "Calculations, conversions, and formatting run entirely inside your browser. No data ever leaves your device.",
    },
    {
      icon: Zap,
      title: "Instant & Lightweight",
      description: "No heavy web apps or bloat. Minimal dependencies and immediate math computations.",
    },
    {
      icon: Lock,
      title: "No Sign-up Required",
      description: `Use all ${ALL_TOOLS.length} calculators, converters, and generators without registering or providing an email.`,
    },
    {
      icon: Download,
      title: "Clean PDF & CSV Exports",
      description: "Download detailed amortization schedules, invoice templates, and formatted logs with one click.",
    },
  ];

  return (
    <div className="flex flex-col gap-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-raised border border-border text-text-secondary text-xs sm:text-sm font-semibold shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{ALL_TOOLS.length} Free Online Utilities</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.15]">
          Fast, private tools for everyday work.
        </h1>

        <p className="text-base sm:text-xl font-medium text-text-secondary max-w-2xl leading-relaxed">
          Reliable calculators, converters, PDF utilities, and developer tools. Deterministic mathematical accuracy with zero tracking.
        </p>

        {/* Hero Interactive Search Bar */}
        <div className="w-full max-w-2xl relative mt-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${ALL_TOOLS.length} tools (e.g., SIP Calculator, JSON Formatter, EMI)...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl pl-12 pr-28 py-3.5 text-sm sm:text-base font-medium text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-md transition-all"
            />
            <div className="absolute right-2">
              <Button variant="primary" size="md" type="submit" className="font-bold">
                Search
              </Button>
            </div>
          </form>

          {/* Quick Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-20 text-left">
              {searchResults.map((tool) => (
                <Link
                  key={tool.slug}
                  href={tool.path}
                  className="flex items-center justify-between p-3.5 hover:bg-surface-raised border-b border-border/50 last:border-0 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">{tool.name}</span>
                    <span className="text-xs text-text-tertiary font-medium line-clamp-1">{tool.description}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-accent">Open →</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Category Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs sm:text-sm font-semibold">
          <span className="text-text-tertiary text-xs font-bold uppercase tracking-wider">Popular:</span>
          <Link
            href="/tools?category=finance"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors font-semibold"
          >
            Finance
          </Link>
          <Link
            href="/tools?category=developer"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors font-semibold"
          >
            Developer
          </Link>
          <Link
            href="/tools?category=pdf"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors font-semibold"
          >
            PDF & Documents
          </Link>
          <Link
            href="/tools?category=text"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors font-semibold"
          >
            Text Tools
          </Link>
          <Link
            href="/tools?category=privacy"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors font-semibold"
          >
            Privacy
          </Link>
        </div>
      </section>

      {/* Featured / Popular Tools Grid */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary">Featured Utilities</h2>
            <p className="text-xs sm:text-sm font-medium text-text-secondary mt-0.5">Essential everyday tools used by finance professionals, developers, and writers</p>
          </div>
          <Link href="/tools" className="text-xs sm:text-sm font-bold text-accent hover:underline">
            View All {ALL_TOOLS.length} Tools →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularTools.map((tool) => {
            const IconComp = (Icons as any)[tool.icon] || Icons.Wrench;
            return (
              <Link key={tool.slug} href={tool.path}>
                <Card variant="interactive" className="h-full flex flex-col justify-between p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-accent">
                        <IconComp className="w-4.5 h-4.5" />
                      </div>
                      <Badge variant={tool.plan === "free" ? "free" : "premium"}>{tool.plan}</Badge>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary font-medium line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-text-tertiary group-hover:text-accent pt-3 mt-3 border-t border-border/50 flex items-center gap-1">
                    Use tool →
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary">Explore by Category</h2>
            <p className="text-xs sm:text-sm font-medium text-text-secondary mt-0.5">Browse tools organized across 13 specialized domains</p>
          </div>
          <Link href="/tools" className="text-xs sm:text-sm font-bold text-accent hover:underline">
            Directory Index →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => {
            const IconComponent = (Icons as any)[cat.icon] || Icons.Wrench;
            const count = ALL_TOOLS.filter((t) => t.category === cat.slug).length;

            return (
              <Link key={cat.slug} href={`/tools?category=${cat.slug}`}>
                <Card variant="interactive" className="h-full flex flex-col justify-between p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-text-primary">
                        <IconComponent className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-text-tertiary">{count} tools</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary font-medium line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-accent mt-4 flex items-center gap-1.5">
                    Browse Category <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Why Use ToolVerse - Trust Pillars */}
      <section className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-subtle flex flex-col gap-6">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-text-primary">Built for Speed and Privacy</h2>
          <p className="text-xs sm:text-sm font-medium text-text-secondary mt-0.5">No tracking cookies, no intrusive advertisements, no slow server round-trips.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {keyPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="flex flex-col gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-text-primary">
                  <Icon className="w-4.5 h-4.5 text-accent" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-text-primary">{pillar.title}</h4>
                <p className="text-xs sm:text-sm text-text-secondary font-medium leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Clean Bottom Banner */}
      <section className="bg-surface-raised border border-border rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-extrabold text-text-primary">Need batch processing & export features?</h3>
          <p className="text-xs sm:text-sm font-medium text-text-secondary">Upgrade to Pro for high-capacity batch compression, larger PDF size limits, and custom PDF templates.</p>
        </div>
        <Link href="/pricing" className="shrink-0">
          <Button variant="primary" size="md" className="font-bold">
            View Pro Pricing
          </Button>
        </Link>
      </section>
    </div>
  );
}
