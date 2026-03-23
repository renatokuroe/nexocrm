// JWT Authentication Middleware
// Validates Bearer token on protected routes

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/app.config";
import { UnauthorizedError } from "../utils/errors";

/**
 * Extends Express Request to include the authenticated user's data.
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

/**
 * Middleware that validates the JWT from the Authorization header.
 * Attaches decoded user info to req.user.
 */
export function authenticate(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): void {
    try {
        // Extract token from "Bearer <token>" header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("No authentication token provided");
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify and decode the token
        const decoded = jwt.verify(token, config.jwt.secret) as {
            id: string;
            email: string;
            name: string;
        };

        // Attach user info to the request for downstream handlers
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError("Invalid or expired token"));
        } else {
            next(error);
        }
    }
}
