'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { preloadAssets } from '@/lib/preloader';
import type { PreloadResult, PreloadProgress } from '@/lib/preloader';
import { createLogger } from '@/lib/logger';

const log = createLogger('AppContext');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppStep =
  | 'start'
  | 'photo-capture'
  | 'text-entry'
  | 'card-reveal'
  | 'series-swipe'
  | 'export';

interface AppState {
  step: AppStep;
  setStep: (step: AppStep) => void;
  preloadResult: PreloadResult | null;
  preloadProgress: PreloadProgress | null;
  preloadError: string | null;
  isPreloadComplete: boolean;
  retryPreload: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AppContext = createContext<AppState | null>(null);

export function useAppContext(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<AppStep>('start');
  const [preloadResult, setPreloadResult] = useState<PreloadResult | null>(null);
  const [preloadProgress, setPreloadProgress] = useState<PreloadProgress | null>(null);
  const [preloadError, setPreloadError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const runPreload = useCallback(async () => {
    log.info('Preload started');
    setPreloadError(null);
    setPreloadProgress(null);

    try {
      const result = await preloadAssets((progress) => {
        setPreloadProgress(progress);
      });
      setPreloadResult(result);
      log.info('Preload complete', { totalTimeMs: result.totalTimeMs });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPreloadError(message);
      log.error('Preload failed', { error: message });
    }
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    runPreload();
  }, [runPreload]);

  const retryPreload = useCallback(() => {
    hasStartedRef.current = false;
    runPreload();
    hasStartedRef.current = true;
  }, [runPreload]);

  const isPreloadComplete = preloadResult !== null;

  return (
    <AppContext.Provider
      value={{
        step,
        setStep,
        preloadResult,
        preloadProgress,
        preloadError,
        isPreloadComplete,
        retryPreload,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
