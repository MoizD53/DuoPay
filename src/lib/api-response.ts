import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";
import { logger } from "./logger";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(error: unknown) {
  logger.error({ event: "api_error_response", error });

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please check the information you entered.",
          details: error.issues,
        },
      },
      { status: 422 }
    );
  }

  if (error instanceof ApiError) {
    // Transform specific error codes to user-friendly UI language
    let friendlyMessage = error.message;
    
    if (error.code === "IDEMPOTENCY_CONFLICT") {
      friendlyMessage = "This action was already completed.";
    } else if (error.code === "FINANCIAL_INTEGRITY_ERROR") {
      friendlyMessage = "Something went wrong recalculating the debt. No money was changed.";
    } else if (error.code === "UNAUTHENTICATED") {
      friendlyMessage = "Please log in to continue.";
    } else if (error.code === "FORBIDDEN") {
      friendlyMessage = "You don't have permission to do this.";
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: friendlyMessage,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle Idempotency libSQL/SQLite Unique Constraint error
  const isUniqueConstraint = 
    (typeof error === "object" && error !== null && "code" in error && String((error as any).code).includes("SQLITE_CONSTRAINT")) ||
    (error instanceof Error && error.message.includes("UNIQUE constraint failed"));

  if (isUniqueConstraint) {
    logger.warn({ event: "idempotency_conflict_sqlite" });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "IDEMPOTENCY_CONFLICT",
          message: "This action was already completed.",
        },
      },
      { status: 409 }
    );
  }

  // Fallback for unhandled internal errors
  logger.error({ event: "unhandled_internal_error", error });
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. No money was changed.",
      },
    },
    { status: 500 }
  );
}
