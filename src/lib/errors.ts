export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(422, "VALIDATION_ERROR", message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthenticated") {
    super(401, "UNAUTHENTICATED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Not Found") {
    super(404, "NOT_FOUND", message);
  }
}

export class IdempotencyConflictError extends ApiError {
  constructor(message: string = "Idempotency Conflict") {
    super(409, "IDEMPOTENCY_CONFLICT", message);
  }
}

export class FinancialIntegrityError extends ApiError {
  constructor(message: string) {
    super(409, "FINANCIAL_INTEGRITY_ERROR", message);
  }
}

export class InvalidSplitError extends ApiError {
  constructor(message: string) {
    super(400, "INVALID_SPLIT", message);
  }
}
