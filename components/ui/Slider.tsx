import React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  onChangeValue?: (val: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  unit = "",
  onChangeValue,
  className,
  id,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && onChangeValue) {
      onChangeValue(val);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text === "") {
      if (onChangeValue) onChangeValue(0);
      return;
    }
    const val = parseFloat(text);
    if (!isNaN(val) && onChangeValue) {
      onChangeValue(val);
    }
  };

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div className="flex justify-between items-center text-xs gap-2">
        {label && <label className="font-semibold text-text-secondary select-none">{label}</label>}
        <div className="flex items-center gap-1.5 bg-surface border border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 rounded-lg px-2.5 py-1 transition-all shadow-sm">
          <input
            type="number"
            step={step || "any"}
            value={value === 0 ? "" : value}
            placeholder="0"
            onChange={handleTextChange}
            className="w-16 bg-transparent text-right font-mono font-bold text-accent outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Type any custom value"
          />
          {unit && (
            <span className="font-mono font-bold text-text-tertiary text-xs select-none">
              {unit}
            </span>
          )}
        </div>
      </div>
      <div className="relative flex items-center w-full h-5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value || min))}
          onChange={handleChange}
          className="w-full h-2 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
          {...props}
        />
      </div>
      <div className="flex justify-between text-[11px] text-text-tertiary select-none">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
};
