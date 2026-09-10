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

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return ALL_TOOLS.find((t) => t.slug === slug);
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug as ToolCategory);
}

export function getRelatedTools(slugs: string[]): ToolMeta[] {
  return ALL_TOOLS.filter((t) => slugs.includes(t.slug));
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}
