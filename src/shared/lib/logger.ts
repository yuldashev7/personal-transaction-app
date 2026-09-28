type LogLevel = 'debug' | 'warn' | 'error';

const PREFIX = '[personal-transaction]';

function write(level: LogLevel, message: string, context?: unknown): void {
  if (!__DEV__) return;

  const log = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (context === undefined) {
    log(`${PREFIX} ${message}`);
  } else {
    log(`${PREFIX} ${message}`, context);
  }
}

/** Development-only diagnostics. Nothing is logged in production builds. */
export const logger = {
  debug: (message: string, context?: unknown) => write('debug', message, context),
  warn: (message: string, context?: unknown) => write('warn', message, context),
  error: (message: string, context?: unknown) => write('error', message, context),
};
