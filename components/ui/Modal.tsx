import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-surface border border-border rounded-2xl shadow-2xl w-full p-4 sm:p-6 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] overflow-y-auto",
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border mb-3 sm:mb-4">
          {title && <h3 className="text-base sm:text-lg font-bold text-text-primary">{title}</h3>}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors ml-auto shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
