'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { WizardStepper } from './WizardStepper';
import { StartScreen } from './StartScreen';
import { PhotoCapture } from './PhotoCapture';
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

  function renderScreen() {
    switch (step) {
      case 'start':
        return <StartScreen />;
      case 'photo-capture':
        return <PhotoCapture />;
      default:
        return <PlaceholderScreen step={step} />;
    }
  }

  return (
    <>
      <WizardStepper currentStep={step} />
      {renderScreen()}
    </>
  );
}
