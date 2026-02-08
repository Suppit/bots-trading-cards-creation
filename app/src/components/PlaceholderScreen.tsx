'use client';

import { useAppContext } from '@/contexts/AppContext';
import type { AppStep } from '@/contexts/AppContext';

const STEP_LABELS: Record<AppStep, string> = {
  start: 'Start',
  'photo-capture': 'Photo Capture & Crop',
  'text-entry': 'Text Entry',
  'card-reveal': 'Card Reveal',
  'series-swipe': 'Series Swipe',
  export: 'Export & Share',
};

export function PlaceholderScreen({ step }: { step: AppStep }) {
  const { setStep } = useAppContext();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">{STEP_LABELS[step]}</h1>
      <p className="text-foreground/50">Coming soon — Phase {getPhaseNumber(step)}</p>
      <button
        onClick={() => setStep('start')}
        className="min-h-[48px] rounded-full border border-foreground/20 px-8 py-3 text-sm font-medium transition-colors hover:bg-foreground/5"
      >
        Back to Start
      </button>
    </main>
  );
}

function getPhaseNumber(step: AppStep): number {
  const phases: Record<AppStep, number> = {
    start: 3,
    'photo-capture': 4,
    'text-entry': 6,
    'card-reveal': 7,
    'series-swipe': 8,
    export: 9,
  };
  return phases[step] ?? 0;
}
