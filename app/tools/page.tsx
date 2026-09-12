"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ALL_TOOLS, CATEGORIES } from "@/lib/constants";
import { ToolMeta } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Search, Layers } from "lucide-react";
import { ToolIcon } from "@/components/ui/ToolIcon";

import { BackButton } from "@/components/ui/BackButton";

function ToolsDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "premium">("all");
  const [sortBy, setSortBy] = useState<"popular" | "a-z">("popular");

  // Sync category state when URL search params change (e.g. clicking header links)
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("all");
    }
  }, [categoryParam]);

  const handleCategorySelect = (catSlug: string) => {
    setSelectedCategory(catSlug);
    if (catSlug === "all") {
      router.push("/tools", { scroll: false });
    } else {
      router.push(`/tools?category=${catSlug}`, { scroll: false });
    }
  };

  const filteredTools = useMemo(() => {
    let result = [...ALL_TOOLS];

    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (planFilter !== "all") {
      result = result.filter((t) => (planFilter === "free" ? t.plan === "free" : t.plan !== "free"));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (sortBy === "popular") {
      result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    } else if (sortBy === "a-z") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [selectedCategory, searchQuery, planFilter, sortBy]);

  const activeCategoryObj = CATEGORIES.find((c) => c.slug === selectedCategory);

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/" label="Back to Home" variant="outline" size="sm" />
        <span className="text-xs font-mono font-semibold text-text-tertiary">
          {ALL_TOOLS.length} Total Tools Available
        </span>
      </div>

      {/* Directory Title Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          {activeCategoryObj ? `${activeCategoryObj.name} Tools` : "Tools Directory"}
        </h1>
        <p className="text-sm sm:text-base font-medium text-text-secondary">
          {activeCategoryObj
            ? `Browse all ${filteredTools.length} ${activeCategoryObj.name.toLowerCase()} utilities. Fast, 100% private, and client-side.`
            : `Browse all ${ALL_TOOLS.length} utility tools across ${CATEGORIES.length} domains. Fast, local, and completely free of tracking.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Category Filter */}
        <aside className="lg:col-span-3 flex flex-col gap-1 bg-surface border border-border p-3.5 rounded-xl shadow-subtle sticky top-20">
          <span className="text-xs font-extrabold uppercase tracking-wider text-text-tertiary px-2.5 py-2 border-b border-border mb-1">
            Categories ({CATEGORIES.length})
          </span>

          <button
            onClick={() => handleCategorySelect("all")}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
              selectedCategory === "all"
                ? "bg-accent text-white font-extrabold shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Layers className="w-4.5 h-4.5" /> All Categories
            </span>
            <span className="font-mono text-xs opacity-90">{ALL_TOOLS.length}</span>
          </button>

          {CATEGORIES.map((cat) => {
            const count = ALL_TOOLS.filter((t) => t.category === cat.slug).length;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  isSelected
                    ? "bg-accent text-white font-extrabold shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <ToolIcon name={cat.icon} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="font-mono text-xs opacity-90 ml-2 shrink-0">{count}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Content Tools Grid */}
        <main className="lg:col-span-9 flex flex-col gap-5">
          {/* Top Bar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-3 rounded-lg shadow-subtle">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search tools by name, tag, or function..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>

            {/* Plan Filter Toggle */}
            <div className="flex items-center gap-1 bg-surface-raised border border-border p-0.5 rounded-md text-xs">
              <button
                onClick={() => setPlanFilter("all")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  planFilter === "all" ? "bg-accent text-white font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPlanFilter("free")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  planFilter === "free" ? "bg-accent text-white font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setPlanFilter("premium")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  planFilter === "premium" ? "bg-accent text-white font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Pro
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-tertiary">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-surface-raised border border-border text-text-primary rounded px-2 py-1 outline-none text-xs font-medium"
              >
                <option value="popular">Most Popular</option>
                <option value="a-z">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Results Count Banner */}
          <div className="flex items-center justify-between text-xs text-text-secondary px-1">
            <span>
              Showing <strong>{filteredTools.length}</strong> of {ALL_TOOLS.length} utilities
            </span>
            {selectedCategory !== "all" && (
              <span className="font-semibold text-text-primary capitalize">
                Filtered: {selectedCategory}
              </span>
            )}
          </div>

          {/* Tools Grid */}
          {filteredTools.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-12 text-center flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">No tools found matching your search</p>
              <p className="text-xs text-text-secondary">Try searching for different keywords or clear the category filter.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  handleCategorySelect("all");
                  setPlanFilter("all");
                }}
                className="mt-2 text-xs text-accent hover:underline font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTools.map((tool) => {
                return (
                  <Link key={tool.slug} href={tool.path} prefetch={false}>
                    <Card variant="interactive" className="h-full flex flex-col justify-between p-5">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-accent">
                            <ToolIcon name={tool.icon} className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            {tool.isPopular && <Badge variant="popular">Popular</Badge>}
                            <Badge variant={tool.plan === "free" ? "free" : tool.plan === "premium" ? "premium" : "freemium"}>
                              {tool.plan === "premium" ? "Pro" : tool.plan === "freemium" ? "Freemium" : "Free"}
                            </Badge>
                          </div>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                          {tool.name}
                        </h3>

                        <p className="text-xs sm:text-sm text-text-secondary font-medium line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-text-tertiary uppercase">{tool.category}</span>
                        <span className="font-bold text-accent group-hover:translate-x-1 transition-transform">
                          Open →
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ToolsDirectoryPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-text-secondary">Loading directory...</div>}>
      <ToolsDirectoryContent />
    </Suspense>
  );
}
