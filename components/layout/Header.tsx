"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SITE_NAME, ALL_TOOLS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  LayoutGrid,
  Sparkles,
  LogOut,
  ChevronDown,
  Calculator,
  Code2,
  FileText,
  Layers,
} from "lucide-react";
import { ToolMeta } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

const POPULAR_FINANCE = [
  { name: "SIP Calculator", path: "/finance/sip-calculator", desc: "Mutual fund wealth projection" },
  { name: "EMI Calculator", path: "/finance/emi-calculator", desc: "Home & car loan amortizations" },
  { name: "GST Calculator", path: "/finance/gst-calculator", desc: "Inclusive & exclusive tax splits" },
  { name: "Currency Converter", path: "/finance/currency-converter", desc: "Live exchange rates table" },
];

const POPULAR_DEVELOPER = [
  { name: "JSON Formatter", path: "/developer/json-formatter", desc: "Format, validate & minify JSON" },
  { name: "JWT Decoder", path: "/developer/jwt-decoder", desc: "Decode payload, header & tokens" },
  { name: "Base64 Encoder", path: "/developer/base64-encoder", desc: "Encode/decode strings & files" },
  { name: "UUID Generator", path: "/developer/uuid-generator", desc: "Generate RFC4122 v4 UUIDs" },
];

const POPULAR_PDF = [
  { name: "Merge PDF", path: "/pdf/merge-pdf", desc: "Combine multiple PDF files" },
  { name: "PDF to JPG", path: "/pdf/pdf-to-jpg", desc: "Extract high-res image pages" },
  { name: "Compress PDF", path: "/pdf/compress-pdf", desc: "Shrink PDF document size" },
  { name: "Split PDF", path: "/pdf/split-pdf", desc: "Extract pages or export to ZIP" },
];

function HeaderNavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const isDirectoryActive = pathname === "/tools" && !categoryParam;
  const isFinanceActive = (pathname === "/tools" && categoryParam === "finance") || pathname.startsWith("/finance");
  const isDeveloperActive = (pathname === "/tools" && categoryParam === "developer") || pathname.startsWith("/developer");
  const isPdfActive = (pathname === "/tools" && (categoryParam === "pdf" || categoryParam === "converters")) || pathname.startsWith("/pdf");
  const isPricingActive = pathname === "/pricing";

  const getLinkClasses = (isActive: boolean) =>
    `px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
      isActive
        ? "bg-accent/10 text-accent font-semibold border border-accent/20 shadow-sm"
        : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
    }`;

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
      {/* 1. Directory */}
      <Link href="/tools" prefetch={false} className={getLinkClasses(isDirectoryActive)}>
        Directory
      </Link>

      {/* 2. Finance */}
      <div
        className="relative"
        onMouseEnter={() => setActiveDropdown("finance")}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <Link href="/tools?category=finance" prefetch={false} className={getLinkClasses(isFinanceActive)}>
          <span>Finance</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </Link>

        {activeDropdown === "finance" && (
          <div className="absolute top-full left-0 w-72 pt-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
            <div className="bg-surface border border-border rounded-xl p-3 shadow-card flex flex-col gap-1">
              <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-2">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-accent" /> Finance Tools
                </span>
                <Link href="/tools?category=finance" prefetch={false} className="text-accent hover:underline">
                  View All (20) →
                </Link>
              </div>
              {POPULAR_FINANCE.map((t) => (
                <Link
                  key={t.path}
                  href={t.path}
                  prefetch={false}
                  className="p-2 rounded-lg hover:bg-surface-raised flex flex-col gap-0.5 transition-colors group"
                >
                  <span className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                    {t.name}
                  </span>
                  <span className="text-[10px] text-text-tertiary line-clamp-1">{t.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Developer */}
      <div
        className="relative"
        onMouseEnter={() => setActiveDropdown("developer")}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <Link href="/tools?category=developer" prefetch={false} className={getLinkClasses(isDeveloperActive)}>
          <span>Developer</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </Link>

        {activeDropdown === "developer" && (
          <div className="absolute top-full left-0 w-72 pt-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
            <div className="bg-surface border border-border rounded-xl p-3 shadow-card flex flex-col gap-1">
              <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-2">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-accent" /> Developer Tools
                </span>
                <Link href="/tools?category=developer" prefetch={false} className="text-accent hover:underline">
                  View All (17) →
                </Link>
              </div>
              {POPULAR_DEVELOPER.map((t) => (
                <Link
                  key={t.path}
                  href={t.path}
                  prefetch={false}
                  className="p-2 rounded-lg hover:bg-surface-raised flex flex-col gap-0.5 transition-colors group"
                >
                  <span className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                    {t.name}
                  </span>
                  <span className="text-[10px] text-text-tertiary line-clamp-1">{t.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. PDF */}
      <div
        className="relative"
        onMouseEnter={() => setActiveDropdown("pdf")}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <Link href="/tools?category=pdf" prefetch={false} className={getLinkClasses(isPdfActive)}>
          <span>PDF</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </Link>

        {activeDropdown === "pdf" && (
          <div className="absolute top-full left-0 w-72 pt-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
            <div className="bg-surface border border-border rounded-xl p-3 shadow-card flex flex-col gap-1">
              <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-2">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent" /> PDF Utilities
                </span>
                <Link href="/tools?category=pdf" prefetch={false} className="text-accent hover:underline">
                  View All (18) →
                </Link>
              </div>
              {POPULAR_PDF.map((t) => (
                <Link
                  key={t.path}
                  href={t.path}
                  prefetch={false}
                  className="p-2 rounded-lg hover:bg-surface-raised flex flex-col gap-0.5 transition-colors group"
                >
                  <span className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                    {t.name}
                  </span>
                  <span className="text-[10px] text-text-tertiary line-clamp-1">{t.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Pricing */}
      <Link href="/pricing" prefetch={false} className={getLinkClasses(isPricingActive)}>
        Pricing
      </Link>
    </nav>
  );
}

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, openAuthModal, logout } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("toolverse_theme");
      if (stored === "light") {
        setIsDark(false);
        document.documentElement.classList.add("light");
      }
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add("light");
      localStorage.setItem("toolverse_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("toolverse_theme", "dark");
      setIsDark(true);
    }
  };

  // Shortcut for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredTools = searchQuery.trim()
    ? ALL_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 8)
    : ALL_TOOLS.filter((t) => t.isPopular).slice(0, 8);

  const handleSelectTool = (tool: ToolMeta) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(tool.path);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-16 sm:h-[68px] glass-panel transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo & Desktop Navigation */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent text-white flex items-center justify-center font-extrabold shadow-sm transition-transform duration-150 group-hover:scale-105">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-text-primary">
                {SITE_NAME}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <Suspense fallback={<div className="hidden md:flex gap-3 text-sm text-text-tertiary">Loading...</div>}>
              <HeaderNavLinks />
            </Suspense>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Search Trigger Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 h-9 sm:h-10 px-3 sm:px-3.5 text-xs sm:text-sm font-medium text-text-secondary bg-surface hover:bg-surface-raised border border-border hover:border-border-hover rounded-xl transition-colors shadow-sm"
              title="Search tools (⌘K)"
            >
              <Search className="w-4 h-4 text-text-tertiary shrink-0" />
              <span className="hidden lg:inline text-xs sm:text-sm text-text-tertiary">Search tools...</span>
              <kbd className="hidden sm:inline-flex items-center font-mono text-[11px] font-semibold px-2 py-0.5 bg-surface-raised border border-border rounded text-text-tertiary">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface hover:bg-surface-raised border border-border hover:border-border-hover rounded-xl transition-colors shadow-sm shrink-0"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Language Selector Desktop */}
            <LanguageSelector variant="header" />

            {/* User & Auth CTA Desktop */}
            <div className="hidden sm:flex items-center gap-2.5 ml-1">
              {user ? (
                /* Logged In State */
                <div className="flex items-center gap-2">
                  <Link href="/dashboard">
                    <button className="flex items-center gap-2.5 h-9 sm:h-10 px-3.5 rounded-xl bg-surface-raised border border-border hover:border-accent/40 text-xs sm:text-sm font-bold text-text-primary transition-all shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-extrabold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="max-w-28 truncate">{user.name}</span>
                      {user.plan === "pro" ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> PRO
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-tertiary text-[10px] uppercase font-bold">
                          FREE
                        </span>
                      )}
                    </button>
                  </Link>

                  <button
                    onClick={logout}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Logged Out / Visitor State */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAuthModal("login")}
                    className="h-9 sm:h-10 px-3.5 sm:px-4 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Log In
                  </button>
                  <Link href="/pricing">
                    <button className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-bold transition-all shadow-sm hover:shadow-accent/20 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Get Pro
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface hover:bg-surface-raised border border-border rounded-xl transition-colors"
              title="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 bg-surface border-b border-border p-5 flex flex-col gap-3 z-30 md:hidden shadow-lg animate-in slide-in-from-top-1">
          <nav className="flex flex-col gap-1.5 font-medium text-xs text-text-primary">
            <Link
              href="/tools"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-surface-raised flex items-center justify-between"
            >
              <span>All Tools ({ALL_TOOLS.length})</span>
              <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
            </Link>
            <Link
              href="/tools?category=finance"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-surface-raised flex items-center justify-between"
            >
              <span>Finance Calculators</span>
              <span className="text-[10px] text-accent font-semibold">20 tools</span>
            </Link>
            <Link
              href="/tools?category=developer"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-surface-raised flex items-center justify-between"
            >
              <span>Developer Tools</span>
              <span className="text-[10px] text-accent font-semibold">17 tools</span>
            </Link>
            <Link
              href="/tools?category=pdf"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-surface-raised flex items-center justify-between"
            >
              <span>PDF Utilities</span>
              <span className="text-[10px] text-accent font-semibold">18 tools</span>
            </Link>
            <Link
              href="/pricing"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-surface-raised"
            >
              Pricing Plans
            </Link>
            <Link
              href="/about"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-surface-raised"
            >
              About
            </Link>
            <Link
              href="/dashboard"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-surface-raised"
            >
              Dashboard
            </Link>
          </nav>
          
          {/* Mobile Language Selector */}
          <div className="pt-2 border-t border-border">
            <LanguageSelector variant="mobile" />
          </div>

          <div className="pt-3 border-t border-border">
            <Link href="/pricing" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full" size="sm">
                View Pro Plans
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Search Modal */}
      <Modal isOpen={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="lg">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              autoFocus
              placeholder="Search by tool name, keyword, or category (e.g. SIP, EMI, JSON, PDF, QR)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pt-1">
            <span className="text-[10px] font-semibold text-text-tertiary px-2 uppercase tracking-wider">
              {searchQuery.trim() ? "Search Results" : "Popular Utilities"}
            </span>
            {filteredTools.length === 0 ? (
              <p className="text-xs text-text-tertiary py-8 text-center">No tools matched your search.</p>
            ) : (
              filteredTools.map((tool) => (
                <button
                  key={tool.slug}
                  onClick={() => handleSelectTool(tool)}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-surface-raised border border-transparent hover:border-border transition-colors text-left group"
                >
                  <div className="flex flex-col gap-0.5">
                    <h5 className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {tool.name}
                    </h5>
                    <p className="text-[11px] text-text-tertiary line-clamp-1">{tool.description}</p>
                  </div>
                  <span className="text-[11px] font-mono text-text-tertiary group-hover:text-accent shrink-0 ml-2">
                    Open →
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
