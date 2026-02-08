'use client';

import type { AppStep } from '@/contexts/AppContext';

const WIZARD_STEPS = [
  { label: 'Photo', steps: ['photo-capture'] },
  { label: 'Text', steps: ['text-entry'] },
  { label: 'Card', steps: ['card-reveal', 'series-swipe', 'export'] },
] as const;

function getActiveIndex(currentStep: AppStep): number {
  return WIZARD_STEPS.findIndex((ws) =>
    (ws.steps as readonly string[]).includes(currentStep),
  );
}

interface WizardStepperProps {
  currentStep: AppStep;
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
  if (currentStep === 'start') return null;

  const activeIndex = getActiveIndex(currentStep);

  return (
    <nav aria-label="Progress" className="flex w-full items-center justify-center gap-2 px-6 py-4">
      {WIZARD_STEPS.map((ws, i) => {
        const isCompleted = i < activeIndex;
        const isActive = i === activeIndex;

        return (
          <div key={ws.label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-0.5 w-6 transition-colors ${
                  isCompleted ? 'bg-[#035ba7]' : 'bg-foreground/15'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-[#035ba7] text-white'
                    : isActive
                      ? 'border-2 border-[#035ba7] text-[#035ba7]'
                      : 'border-2 border-foreground/20 text-foreground/40'
                }`}
              >
                {isCompleted ? (
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.5 8.5L6.5 11.5L12.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-[#035ba7]' : isCompleted ? 'text-foreground/60' : 'text-foreground/40'
                }`}
              >
                {ws.label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
