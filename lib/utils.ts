import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ALL_TOOLS, CATEGORIES } from "./constants";
import { ToolMeta, ToolCategory, CategoryMeta } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(val: number, currency: "INR" | "USD" = "INR"): string {
  if (isNaN(val)) return currency === "INR" ? "₹0" : "$0";
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number, decimals: number = 0): string {
  if (isNaN(val)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val);
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Pre-indexed Map for O(1) lookups
const toolSlugMap = new Map<string, ToolMeta>();
const categorySlugMap = new Map<string, CategoryMeta>();
const categoryToolsMap = new Map<ToolCategory, ToolMeta[]>();

ALL_TOOLS.forEach((t) => {
  toolSlugMap.set(t.slug, t);
  const list = categoryToolsMap.get(t.category) || [];
  list.push(t);
  categoryToolsMap.set(t.category, list);
});

CATEGORIES.forEach((c) => {
  categorySlugMap.set(c.slug, c);
});

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return toolSlugMap.get(slug);
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return categorySlugMap.get(slug);
}

export function getRelatedTools(slugs: string[]): ToolMeta[] {
  const result: ToolMeta[] = [];
  for (const s of slugs) {
    const t = toolSlugMap.get(s);
    if (t) result.push(t);
  }
  return result;
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return categoryToolsMap.get(category) || [];
}

