import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "premium";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]";

    const variants = {
      primary:
        "bg-accent hover:bg-accent-hover text-white shadow-sm border border-blue-400/50 hover:border-blue-300 font-bold",
      secondary:
        "bg-surface hover:bg-surface-raised text-text-primary border-2 border-border hover:border-accent shadow-sm font-semibold",
      ghost:
        "bg-transparent hover:bg-surface-raised text-text-secondary hover:text-text-primary border border-border/70 hover:border-border font-semibold",
      destructive:
        "bg-red-600 hover:bg-red-700 text-white border border-red-400/60 hover:border-red-300 shadow-sm font-bold",
      premium:
        "bg-accent hover:bg-accent-hover text-white border border-indigo-400/60 hover:border-indigo-300 shadow-sm font-bold",
    };

    const sizes = {
      sm: "h-9 px-3.5 text-xs sm:text-sm gap-1.5 font-semibold",
      md: "h-10 px-4 text-sm sm:text-base gap-2 font-semibold",
      lg: "h-12 px-5.5 text-base sm:text-lg gap-2.5 font-bold",
      xl: "h-13 px-6.5 text-lg gap-3 font-bold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
