/**
 * Structured logger for MFI Clarity.
 * In production, replace the transport with a remote logging service (e.g. Sentry, Datadog).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL: LogLevel = import.meta.env.PROD ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  const parts = [`[${entry.level.toUpperCase()}]`, `[${entry.timestamp}]`];
  if (entry.context) parts.push(`[${entry.context}]`);
  parts.push(entry.message);
  return parts.join(' ');
}

function log(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'debug':
      console.debug(formatted, data ?? '');
      break;
    case 'info':
      console.info(formatted, data ?? '');
      break;
    case 'warn':
      console.warn(formatted, data ?? '');
      break;
    case 'error':
      console.error(formatted, data ?? '');
      break;
  }
}

export const logger = {
  debug: (message: string, context?: string, data?: Record<string, unknown>) =>
    log('debug', message, context, data),
  info: (message: string, context?: string, data?: Record<string, unknown>) =>
    log('info', message, context, data),
  warn: (message: string, context?: string, data?: Record<string, unknown>) =>
    log('warn', message, context, data),
  error: (message: string, context?: string, data?: Record<string, unknown>) =>
    log('error', message, context, data),
};
