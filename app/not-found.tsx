"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE_NAME, ALL_TOOLS } from "@/lib/constants";
import { 
  Compass, 
  Search, 
  Home, 
  ArrowRight, 
  TrendingUp, 
  Calculator, 
  FileText, 
  Code, 
  Image as ImageIcon 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const POPULAR_SHORTCUTS = [
  { name: "SIP Calculator", path: "/tools/sip-calculator", icon: TrendingUp, cat: "Finance" },
  { name: "EMI Calculator", path: "/tools/emi-calculator", icon: Calculator, cat: "Finance" },
  { name: "GST Calculator", path: "/tools/gst-calculator", icon: Calculator, cat: "Finance" },
  { name: "Income Tax Calculator", path: "/tools/income-tax-calculator", icon: TrendingUp, cat: "Finance" },
  { name: "JSON Formatter", path: "/tools/json-formatter", icon: Code, cat: "Developer" },
  { name: "Password Generator", path: "/tools/password-generator", icon: Compass, cat: "Privacy" },
  { name: "Image Resizer", path: "/tools/image-resizer", icon: ImageIcon, cat: "Image" },
  { name: "PDF Merger", path: "/tools/pdf-merge", icon: FileText, cat: "PDF" },
];

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tools?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 max-w-4xl mx-auto w-full text-center gap-8">
      {/* 404 Glowing Badge Graphic */}
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-4 bg-accent/20 rounded-full blur-2xl opacity-60 animate-pulse" />
        <div className="relative w-28 h-28 rounded-3xl bg-surface border border-accent/40 shadow-glow flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold font-mono text-accent tracking-tighter">404</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Not Found</span>
        </div>
      </div>

      {/* Heading & Subtitle */}
      <div className="flex flex-col gap-2 max-w-lg">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Oops! Tool or Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          The link you followed may be broken, outdated, or the tool may have been reorganized. Search our suite of {ALL_TOOLS.length} utilities below or jump directly to a popular tool.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-md relative flex items-center">
        <Search className="w-4 h-4 text-text-tertiary absolute left-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${ALL_TOOLS.length} calculators, converters, utilities...`}
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-24 py-3 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-subtle"
        />
        <button
          type="submit"
          className="absolute right-2 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors"
        >
          Search
        </button>
      </form>

      {/* Popular Shortcuts */}
      <div className="flex flex-col gap-3 w-full max-w-2xl mt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
          Popular Utilities You Might Be Looking For:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {POPULAR_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className="p-3 bg-surface hover:bg-surface-raised border border-border hover:border-accent/40 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs group shadow-subtle"
              >
                <Icon className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-text-primary text-center truncate w-full">{item.name}</span>
                <span className="text-[10px] text-text-tertiary uppercase">{item.cat}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <Link href="/">
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Return to Homepage
          </Button>
        </Link>
        <Link href="/tools">
          <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Browse All Tools
          </Button>
        </Link>
      </div>
    </div>
  );
}
