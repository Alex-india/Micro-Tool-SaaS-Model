"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export interface BackButtonProps {
  /** Target URL to fallback to if browser history is empty or direct navigation */
  fallbackHref?: string;
  /** Custom label text (defaults to "Back") */
  label?: string;
  /** Extra CSS classes */
  className?: string;
  /** Visual style variant */
  variant?: "default" | "outline" | "ghost" | "pill";
  /** Size */
  size?: "sm" | "md";
  /** If true, show only icon on small mobile screens */
  iconOnlyOnMobile?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackHref = "/tools",
  label = "Back",
  className = "",
  variant = "default",
  size = "sm",
  iconOnlyOnMobile = false,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return "bg-surface hover:bg-surface-raised border border-border hover:border-accent/40 text-text-primary shadow-subtle";
      case "pill":
        return "bg-surface-raised/80 hover:bg-surface-raised text-text-primary border border-border/80 hover:border-accent/30 rounded-full shadow-subtle";
      case "ghost":
        return "bg-transparent hover:bg-surface-raised/60 text-text-secondary hover:text-text-primary border border-transparent";
      case "default":
      default:
        return "bg-surface-raised hover:bg-surface-raised/80 text-text-secondary hover:text-text-primary border border-border hover:border-border-hover shadow-subtle";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "md":
        return "px-3.5 py-2 text-xs sm:text-sm gap-2 rounded-lg";
      case "sm":
      default:
        return "px-2.5 py-1.5 text-xs gap-1.5 rounded-lg";
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      className={`group inline-flex items-center font-semibold transition-all duration-150 cursor-pointer active:scale-95 select-none ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 shrink-0 text-accent group-hover:-translate-x-0.5 transition-transform duration-150" />
      <span className={iconOnlyOnMobile ? "hidden sm:inline" : ""}>{label}</span>
    </button>
  );
};

export default BackButton;
