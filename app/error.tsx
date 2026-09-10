"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { AlertOctagon, RefreshCw, Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client runtime error safely for debugging
    console.error("Runtime Application Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 max-w-xl mx-auto w-full text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-subtle">
        <AlertOctagon className="w-10 h-10" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
          500 • Internal System Exception
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Something Went Wrong
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          An unexpected calculation or rendering error occurred. Your data is safe and has not been transmitted outside your browser.
        </p>
      </div>

      {error?.digest && (
        <div className="p-3 rounded-lg bg-surface border border-border font-mono text-[11px] text-text-tertiary">
          Error Reference ID: <span className="text-text-primary">{error.digest}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => reset()}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Try Again
        </Button>
        <Link href="/">
          <Button variant="secondary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <Link href="/contact">
          <Button variant="ghost" size="md" leftIcon={<MessageSquare className="w-4 h-4" />}>
            Report Bug
          </Button>
        </Link>
      </div>
    </div>
  );
}
