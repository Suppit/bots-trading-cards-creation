'use client';

import Lottie from 'lottie-react';
import confettiAnimation from '@/lib/animations/confetti.json';

interface ConfettiBurstProps {
  onComplete: () => void;
}

export function ConfettiBurst({ onComplete }: ConfettiBurstProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-hidden="true">
      <Lottie
        animationData={confettiAnimation}
        loop={false}
        autoplay
        onComplete={onComplete}
        className="h-full w-full"
      />
    </div>
  );
}
