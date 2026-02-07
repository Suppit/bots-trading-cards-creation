type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  service: string;
  message: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export function createServerLogger(service: string) {
  function log(level: LogLevel, message: string, options?: { requestId?: string; metadata?: Record<string, unknown> }) {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      service,
      message,
      ...(options?.requestId && { requestId: options.requestId }),
      ...(options?.metadata && { metadata: options.metadata }),
    };
    console.log(JSON.stringify(entry));
  }

  return {
    debug(message: string, options?: { requestId?: string; metadata?: Record<string, unknown> }) {
      log('DEBUG', message, options);
    },
    info(message: string, options?: { requestId?: string; metadata?: Record<string, unknown> }) {
      log('INFO', message, options);
    },
    warn(message: string, options?: { requestId?: string; metadata?: Record<string, unknown> }) {
      log('WARN', message, options);
    },
    error(message: string, options?: { requestId?: string; metadata?: Record<string, unknown> }) {
      log('ERROR', message, options);
    },
  };
}
