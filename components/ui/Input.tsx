import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixSymbol?: string;
  suffixSymbol?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      prefixSymbol,
      suffixSymbol,
      type = "text",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs sm:text-sm font-semibold text-text-secondary select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {prefixSymbol && (
            <span className="absolute left-3.5 text-text-tertiary text-sm font-bold select-none pointer-events-none">
              {prefixSymbol}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={cn(
              "w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-base sm:text-sm font-medium text-text-primary placeholder:text-text-tertiary outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent shadow-sm",
              prefixSymbol && "pl-8",
              suffixSymbol && "pr-11",
              error && "border-error focus:border-error focus:ring-error",
              className
            )}
            {...props}
          />
          {suffixSymbol && (
            <span className="absolute right-3.5 text-text-tertiary text-xs sm:text-sm font-bold select-none pointer-events-none">
              {suffixSymbol}
            </span>
          )}
        </div>
        {error ? (
          <span className="text-xs sm:text-sm text-error font-semibold">{error}</span>
        ) : (
          helperText && <span className="text-xs text-text-tertiary font-medium">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
