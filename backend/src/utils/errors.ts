// Custom Application Error Classes
// Used to throw typed errors that the global error handler can catch

/**
 * Base application error that includes an HTTP status code.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Indicates a known, expected error

        // Maintain proper prototype chain
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

/** 400 Bad Request - Client sent invalid data */
export class BadRequestError extends AppError {
    constructor(message = "Bad request") {
        super(message, 400);
    }
}

/** 401 Unauthorized - Missing or invalid authentication */
export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

/** 403 Forbidden - Authenticated but lacks permission */
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}

/** 404 Not Found - Resource doesn't exist */
export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}

/** 409 Conflict - e.g. duplicate email */
export class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}
