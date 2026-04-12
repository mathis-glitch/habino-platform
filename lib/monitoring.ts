import * as Sentry from "@sentry/nextjs";

/** Capture an exception + optional context tags */
export function captureError(err: unknown, context?: Record<string, string>) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[error]", err, context);
    return;
  }
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([k, v]) => scope.setTag(k, v));
    }
    Sentry.captureException(err);
  });
}

/** Log a named event (replaces bare console.error in catch blocks) */
export function captureMessage(msg: string, level: "info" | "warning" | "error" = "error") {
  if (process.env.NODE_ENV !== "production") {
    const method = level === "info" ? "log" : level === "warning" ? "warn" : "error";
    console[method]("[sentry]", msg);
    return;
  }
  Sentry.captureMessage(msg, level);
}
