import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "category" | "free" | "premium" | "freemium" | "new" | "popular";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "category",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md select-none border tracking-wide";

  const variants = {
    category: "bg-surface-raised text-text-secondary border-border",
    free: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 font-medium",
    freemium: "bg-sky-500/10 text-sky-400 border-sky-500/25 font-medium",
    premium: "bg-violet-500/15 text-violet-300 border-violet-500/35 font-bold shadow-xs",
    new: "bg-amber-500/10 text-amber-400 border-amber-500/25 font-medium",
    popular: "bg-amber-500/10 text-amber-400 border-amber-500/25 font-semibold",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
