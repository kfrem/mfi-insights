/**
 * Lightweight error reporting module.
 *
 * In production, errors are sent to a configurable endpoint (e.g. Sentry ingest,
 * Supabase edge function, or any logging service). In development, errors are
 * only logged to the console.
 *
 * To integrate with Sentry, set VITE_ERROR_REPORTING_DSN to your Sentry DSN
 * and replace the fetch call with the Sentry SDK.
 */

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  extra?: Record<string, unknown>;
}

const REPORTING_ENDPOINT = import.meta.env.VITE_ERROR_REPORTING_ENDPOINT;

/** Send an error report to the configured endpoint */
async function sendReport(report: ErrorReport): Promise<void> {
  if (!REPORTING_ENDPOINT) return;

  try {
    await fetch(REPORTING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  } catch {
    // Swallow reporting errors — never break the app to report an error
  }
}

/** Build an ErrorReport from an Error object */
function buildReport(
  error: Error,
  extra?: Record<string, unknown>,
): ErrorReport {
  return {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    extra,
  };
}

/** Report a caught error (e.g. from an ErrorBoundary or try/catch) */
export function reportError(
  error: Error,
  extra?: Record<string, unknown>,
): void {
  console.error('[MFI Clarity]', error);

  if (import.meta.env.PROD) {
    sendReport(buildReport(error, extra));
  }
}

/** Report an error with React component stack info (for ErrorBoundary) */
export function reportComponentError(
  error: Error,
  componentStack?: string,
): void {
  console.error('[MFI Clarity] Component Error:', error);

  if (import.meta.env.PROD) {
    const report = buildReport(error);
    report.componentStack = componentStack;
    sendReport(report);
  }
}

/**
 * Install global unhandled error + rejection listeners.
 * Call once at app startup (e.g. in main.tsx).
 */
export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    reportError(
      event.error instanceof Error
        ? event.error
        : new Error(event.message),
      { type: 'unhandled_error', filename: event.filename, lineno: event.lineno },
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
    reportError(error, { type: 'unhandled_rejection' });
  });
}
