'use client';

import { useAppContext } from '@/contexts/AppContext';
import type { AppStep } from '@/contexts/AppContext';

const STEPS = ['Photo', 'Crop', 'Text'] as const;

function getActiveIndex(step: AppStep, subStep: 'select' | 'crop'): number {
  if (step === 'photo-capture' && subStep === 'select') return 0;
  if (step === 'photo-capture' && subStep === 'crop') return 1;
  if (step === 'text-entry') return 2;
  if (step === 'card-reveal') return 3; // all fulfilled
  return -1;
}

export function WizardStepper() {
  const { step, photoCaptureSubStep } = useAppContext();

  if (step === 'start') return null;

  const activeIndex = getActiveIndex(step, photoCaptureSubStep);

  return (
    <nav
      aria-label="Progress"
      className="flex w-full items-center justify-center py-4"
    >
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;

          return (
            <div key={label} className="flex items-center">
              {/* Connecting dash before each step except the first */}
              {i > 0 && (
                <div
                  className={`mx-1 h-[3px] w-[80px] rounded-full transition-colors sm:w-[120px] ${
                    i <= activeIndex ? 'bg-[#035ba7]' : 'bg-black/15'
                  }`}
                />
              )}

              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-[44px] w-[44px] items-center justify-center rounded-full transition-all ${
                    isCompleted
                      ? 'bg-[#035ba7] text-white'
                      : isActive
                      ? 'bg-[#035ba7] text-white'
                      : 'border-2 border-black/20 bg-white/60 text-black/40'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8.5L6.5 12L13 4"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isActive
                      ? 'text-[#035ba7]'
                      : isCompleted
                      ? 'text-black/50'
                      : 'text-black/30'
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
