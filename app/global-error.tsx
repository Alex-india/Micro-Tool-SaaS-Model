"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
        <div className="flex flex-col items-center text-center gap-6 max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-white">Critical Application Exception</h1>
            <p className="text-xs text-slate-400">
              A critical system boundary error occurred. Please refresh the page or reload the application runtime.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reload ToolVerse
          </button>
        </div>
      </body>
    </html>
  );
}
