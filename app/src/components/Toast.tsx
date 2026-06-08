'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, onDismiss, duration = 10000 }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  function dismiss() {
    setExiting(true);
    setTimeout(onDismiss, 380);
  }

  useEffect(() => {
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, [duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-6 z-50 flex max-w-[320px] items-start gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg sm:bottom-auto sm:top-6 ${
        exiting ? 'toast-exit' : 'toast-enter'
      }`}
    >
      <p className="flex-1 text-sm font-semibold leading-snug text-[#171717]">
        {message}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[#171717]/50 transition-colors hover:text-[#171717]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
