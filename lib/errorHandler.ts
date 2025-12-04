/**
 * Global Error Handler
 * Catches and logs errors globally
 */

import { logError } from './telemetry';

export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return;

  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    logError(
      `Unhandled Error: ${event.message}`,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      },
      'high'
    );
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      `Unhandled Promise Rejection: ${event.reason}`,
      event.reason,
      'high'
    );
  });
}

