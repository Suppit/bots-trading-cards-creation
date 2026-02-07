type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel: LogLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'DEBUG';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, component: string, message: string, metadata?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const meta = metadata ? ` | ${JSON.stringify(metadata)}` : '';
  return `[${level}]  [${timestamp}] [${component}] ${message}${meta}`;
}

export function createLogger(component: string) {
  return {
    debug(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog('DEBUG')) {
        console.debug(formatMessage('DEBUG', component, message, metadata));
      }
    },
    info(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog('INFO')) {
        console.info(formatMessage('INFO', component, message, metadata));
      }
    },
    warn(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog('WARN')) {
        console.warn(formatMessage('WARN', component, message, metadata));
      }
    },
    error(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog('ERROR')) {
        console.error(formatMessage('ERROR', component, message, metadata));
      }
    },
  };
}
