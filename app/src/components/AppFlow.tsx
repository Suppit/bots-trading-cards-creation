'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { StartScreen } from './StartScreen';
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

  switch (step) {
    case 'start':
      return <StartScreen />;
    default:
      return <PlaceholderScreen step={step} />;
  }
}
