'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('Global');

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    log.info('Application initialized', {
      env: process.env.NODE_ENV,
      logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'DEBUG',
    });

    const handleError = (event: ErrorEvent) => {
      log.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      log.error('Unhandled promise rejection', {
        reason: String(event.reason),
        stack: event.reason?.stack,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return <>{children}</>;
}
