"use client";

/**
 * useMediaProcessor — Custom hook for FFmpeg-based media processing.
 * 
 * Manages the full processing lifecycle:
 * - Engine loading with download progress
 * - Processing with progress tracking
 * - Cancel/abort support
 * - Watchdog timeout (60s no-progress)
 * - Memory cleanup (URL.revokeObjectURL, FFmpeg FS cleanup)
 * - Error mapping to user-friendly messages
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { isWebAssemblySupported, terminateFFmpeg } from "@/lib/ffmpeg/ffmpeg-client";
import { WatchdogTimeoutError, OperationCancelledError } from "@/lib/ffmpeg/errors";

export type ProcessorState = "idle" | "loading-engine" | "processing" | "complete" | "error" | "cancelled";

export interface ProcessorResult {
  blob: Blob;
  url: string;
  size: number;
  metadata?: Record<string, unknown>;
}

export type ProgressCallback = (p: { progress: number; time?: number }) => void;

export interface ProcessorCallbacks {
  onProcessProgress: ProgressCallback;
  onDownloadProgress: (p: { url: string; received?: number; total?: number; ratio: number }) => void;
}

interface UseMediaProcessorReturn {
  state: ProcessorState;
  engineProgress: number;       // 0-100 for FFmpeg download
  processProgress: number;      // 0-100 for operation
  statusDetail: string;         // e.g. "35% • 28s processed"
  elapsedTime: number;          // seconds
  result: ProcessorResult | null;
  error: string | null;
  isWasmSupported: boolean;
  execute: (operation: (callbacks: ProcessorCallbacks) => Promise<{ blob: Blob; metadata: { size: number } }>, mediaDuration?: number) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const WATCHDOG_TIMEOUT_MS = 60_000;

export function useMediaProcessor(): UseMediaProcessorReturn {
  const [state, setState] = useState<ProcessorState>("idle");
  const [engineProgress, setEngineProgress] = useState(0);
  const [processProgress, setProcessProgress] = useState(0);
  const [statusDetail, setStatusDetail] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<ProcessorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef<ProcessorState>("idle");
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const resultUrlRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const isWasmSupported = typeof window !== "undefined" ? isWebAssemblySupported() : true;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
        resultUrlRef.current = null;
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }
    };
  }, []);

  const resetWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
    }
    watchdogRef.current = setTimeout(() => {
      if (stateRef.current === "processing" || stateRef.current === "loading-engine") {
        setError(new WatchdogTimeoutError(WATCHDOG_TIMEOUT_MS / 1000).message);
        setState("error");
        terminateFFmpeg();
      }
    }, WATCHDOG_TIMEOUT_MS);
  }, []);

  const execute = useCallback(async (
    operation: (callbacks: ProcessorCallbacks) => Promise<{ blob: Blob; metadata: { size: number } }>,
    mediaDuration?: number
  ) => {
    // Revoke previous result URL
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }

    cancelledRef.current = false;
    setResult(null);
    setError(null);
    setEngineProgress(0);
    setProcessProgress(0);
    setStatusDetail("Starting operation...");
    setElapsedTime(0);
    setState("processing");

    // Start elapsed timer
    startTimeRef.current = Date.now();
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Start watchdog
    resetWatchdog();

    const callbacks: ProcessorCallbacks = {
      onProcessProgress: ({ progress, time }) => {
        if (cancelledRef.current) return;
        let pct = Math.round(progress * 100);
        const secs = time && time > 0 ? (time > 10000 ? Math.round(time / 1000000) : Math.round(time)) : 0;
        if (pct <= 0 && secs > 0 && mediaDuration && mediaDuration > 0) {
          pct = Math.round((secs / mediaDuration) * 100);
        }
        pct = Math.min(99, Math.max(1, pct || 1));
        setProcessProgress(pct);
        if (secs > 0) {
          setStatusDetail(`${pct}% • ${secs}s processed`);
        } else {
          setStatusDetail(`${pct}%`);
        }
        resetWatchdog();
      },
      onDownloadProgress: (p) => {
        if (cancelledRef.current) return;
        const pct = Math.round(p.ratio * 100);
        setEngineProgress(pct);
        setStatusDetail(`Downloading engine: ${pct}%`);
        resetWatchdog();
      },
    };

    try {
      const res = await operation(callbacks);

      if (cancelledRef.current) {
        return;
      }

      // Clear timers
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }

      const url = URL.createObjectURL(res.blob);
      resultUrlRef.current = url;

      setResult({
        blob: res.blob,
        url,
        size: res.metadata.size,
      });
      setProcessProgress(100);
      setStatusDetail("Complete");
      setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
      setState("complete");
    } catch (err) {
      if (cancelledRef.current) {
        setState("cancelled");
        return;
      }

      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }

      const message = err instanceof Error ? err.message : "An unexpected error occurred during processing.";
      setError(message);
      setState("error");
    }
  }, [resetWatchdog]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    terminateFFmpeg();

    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    setError(new OperationCancelledError().message);
    setState("cancelled");
  }, []);

  const reset = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    setState("idle");
    setEngineProgress(0);
    setProcessProgress(0);
    setStatusDetail("");
    setElapsedTime(0);
    setResult(null);
    setError(null);
    cancelledRef.current = false;
  }, []);

  return {
    state,
    engineProgress,
    processProgress,
    statusDetail,
    elapsedTime,
    result,
    error,
    isWasmSupported,
    execute,
    cancel,
    reset,
  };
}
