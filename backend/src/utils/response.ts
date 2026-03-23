// Standardized API Response Utility
// All endpoints should use these helpers for consistent response format

import { Response } from "express";

/**
 * Sends a successful JSON response.
 * @param res - Express Response object
 * @param data - Payload to return
 * @param message - Optional human-readable message
 * @param statusCode - HTTP status (default 200)
 */
export function sendSuccess<T>(
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200
): void {
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

/**
 * Sends a paginated successful response.
 */
export function sendPaginated<T>(
    res: Response,
    data: T[],
    pagination: { page: number; limit: number; total: number },
    message = "Success"
): void {
    const { page, limit, total } = pagination;
    res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
}

/**
 * Sends an error JSON response.
 * @param res - Express Response object
 * @param message - Human-readable error message
 * @param statusCode - HTTP status (default 500)
 * @param errors - Optional field-level validation errors
 */
export function sendError(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: unknown
): void {
    const payload: { success: boolean; message: string; errors?: unknown } = {
        success: false,
        message,
    };

    if (errors !== undefined) {
        payload.errors = errors;
    }

    res.status(statusCode).json(payload);
}
