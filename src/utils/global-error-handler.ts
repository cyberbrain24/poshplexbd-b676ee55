/**
 * Global Error Capture Layer
 * Logs unhandled errors and promise rejections for production monitoring
 */

let initialized = false;

export function initGlobalErrorHandler() {
  if (initialized) return;
  initialized = true;

  // Capture unhandled errors
  window.addEventListener("error", (event) => {
    // Skip script loading errors (e.g. ad blockers)
    if (event.message === "Script error." && !event.filename) return;

    console.error("[GlobalError]", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    
    // Skip AbortError (cancelled fetch requests)
    if (reason?.name === "AbortError") return;
    // Skip cancelled React Query requests
    if (reason?.message === "cancelled") return;

    console.error("[UnhandledRejection]", {
      message: reason?.message || String(reason),
      stack: reason?.stack,
    });
  });
}
