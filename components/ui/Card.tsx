"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { Button } from "./Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "base" | "interactive" | "raised";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "base", children, ...props }, ref) => {
    const variants = {
      base: "bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-subtle transition-all duration-200",
      interactive:
        "bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-subtle hover:border-accent/40 hover:bg-surface-raised/50 transition-all duration-200 cursor-pointer group",
      raised: "bg-surface-raised border border-border rounded-xl p-5 sm:p-6 shadow-subtle",
    };

    return (
      <div ref={ref} className={cn(variants[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface PremiumLockCardProps {
  title?: string;
  description?: string;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

export const PremiumLockCard: React.FC<PremiumLockCardProps> = ({
  title = "Unlock Premium Features",
  description = "Get unlimited batch exports, high resolution outputs, and priority server processing.",
  onUpgrade,
  children,
}) => {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    if (!user) {
      openAuthModal("signup", "Please sign in or create an account to unlock Pro features.");
    } else {
      router.push("/pricing");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-subtle">
      <div className="filter blur-[5px] pointer-events-none opacity-30 select-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-surface/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-3">
          <Lock className="w-5.5 h-5.5 text-accent" />
        </div>
        <h4 className="text-lg font-bold text-text-primary mb-1">{title}</h4>
        <p className="text-xs sm:text-sm font-medium text-text-secondary max-w-xs mb-4">{description}</p>
        <Button variant="primary" size="md" className="font-bold" onClick={handleUpgradeClick}>
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
};
