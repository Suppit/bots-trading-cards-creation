'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { BotsLogo } from './BotsLogo';
import { createLogger } from '@/lib/logger';

const log = createLogger('StartScreen');

export function StartScreen() {
  const {
    isPreloadComplete,
    preloadProgress,
    preloadError,
    setStep,
    retryPreload,
  } = useAppContext();

  const [pendingStart, setPendingStart] = useState(false);

  useEffect(() => {
    log.info('Start screen mounted');
  }, []);

  // Auto-navigate when preload finishes and user already tapped Start
  useEffect(() => {
    if (pendingStart && isPreloadComplete) {
      log.info('Preload finished — navigating to photo-capture');
      setStep('photo-capture');
    }
  }, [pendingStart, isPreloadComplete, setStep]);

  function handleStart() {
    log.info('User tapped Start');

    if (preloadError) {
      retryPreload();
      return;
    }

    if (isPreloadComplete) {
      setStep('photo-capture');
    } else {
      setPendingStart(true);
    }
  }

  const progressPercent = preloadProgress
    ? Math.round(preloadProgress.percent * 100)
    : 0;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <BotsLogo className="w-48" />

      <p className="text-center text-lg font-medium text-foreground/70">
        Create Your Trading Card
      </p>

      <button
        onClick={handleStart}
        className="min-h-[48px] min-w-[200px] rounded-full bg-[#035ba7] px-12 py-4 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73]"
      >
        {preloadError
          ? 'Retry'
          : pendingStart
            ? 'Loading…'
            : 'Start'}
      </button>

      {/* Subtle preload progress bar */}
      {!isPreloadComplete && !preloadError && (
        <div className="w-48">
          <div className="h-1 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-[#035ba7] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-foreground/40">
            Loading assets…
          </p>
        </div>
      )}

      {preloadError && (
        <p className="text-center text-sm text-red-500">
          Failed to load assets. Tap Retry.
        </p>
      )}
    </main>
  );
}
