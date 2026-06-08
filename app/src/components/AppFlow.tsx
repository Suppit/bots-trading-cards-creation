'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { WizardStepper } from './WizardStepper';
import { HomePage } from './HomePage';
import { PhotoCapture } from './PhotoCapture';
import { TextEntry } from './TextEntry';
import { CardReveal } from './CardReveal';
import { Export } from './Export';
import { PlaceholderScreen } from './PlaceholderScreen';
import { createLogger } from '@/lib/logger';

const log = createLogger('AppFlow');

export function AppFlow() {
  const { step } = useAppContext();
  const prevStepRef = useRef(step);

  useEffect(() => {
    if (prevStepRef.current !== step) {
      log.info(`Step changed: ${prevStepRef.current} → ${step}`);
      prevStepRef.current = step;
    }
  }, [step]);

  if (step === 'start') {
    return <HomePage />;
  }

  function renderScreen() {
    switch (step) {
      case 'photo-capture':
        return <PhotoCapture />;
      case 'text-entry':
        return <TextEntry />;
      case 'card-reveal':
        return <CardReveal />;
      case 'export':
        return <Export />;
      default:
        return <PlaceholderScreen step={step} />;
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <WizardStepper />
      {renderScreen()}
    </div>
  );
}
