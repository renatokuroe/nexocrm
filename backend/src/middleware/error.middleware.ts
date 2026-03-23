// Global Error Handler Middleware
// Catches all errors thrown throughout the app and returns consistent JSON responses

import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { config } from "../config/app.config";

/**
 * Global Express error handling middleware.
 * Must be registered AFTER all routes.
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // ── Known operational errors (thrown by our code) ────────────────────
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // ── Prisma unique constraint violation ────────────────────────────────
    if ((err as any).code === "P2002") {
        res.status(409).json({
            success: false,
            message: "A record with this value already exists",
        });
        return;
    }

    // ── Prisma record not found ───────────────────────────────────────────
    if ((err as any).code === "P2025") {
        res.status(404).json({
            success: false,
            message: "Record not found",
        });
        return;
    }

    // ── Unknown / unexpected errors ───────────────────────────────────────
    console.error("Unhandled error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error",
        // Only expose stack trace in development
        ...(config.isDev && { stack: err.stack }),
    });
}
