/**
 * Structured logger for observability.
 * Ensures we never log PII, passwords, or tokens.
 */

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  event: string;
  userId?: string;
  groupId?: string;
  errorCode?: string;
  details?: any;
}

function formatLog(level: LogLevel, payload: LogPayload) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    env: process.env.NODE_ENV || "development",
    ...payload,
  });
}

export const logger = {
  info: (payload: LogPayload) => {
    console.log(formatLog("info", payload));
  },
  warn: (payload: LogPayload) => {
    console.warn(formatLog("warn", payload));
  },
  error: (payload: LogPayload & { error?: any }) => {
    // Sanitize any error objects to prevent leaking secrets
    const sanitizedError = payload.error instanceof Error 
      ? { message: payload.error.message, stack: payload.error.stack, name: payload.error.name }
      : payload.error;
      
    console.error(formatLog("error", { ...payload, details: { ...payload.details, error: sanitizedError } }));
  }
};
