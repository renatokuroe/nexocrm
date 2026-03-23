// Auth Controller - HTTP layer
// Handles request parsing, delegates to service, sends response

import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class AuthController {
    private service: AuthService;

    constructor() {
        this.service = new AuthService();
    }

    /**
     * POST /api/auth/register
     * Creates a new user account.
     */
    register = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await this.service.register(req.body);
            sendSuccess(res, result, "Account created successfully", 201);
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /api/auth/login
     * Authenticates a user and returns a JWT.
     */
    login = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await this.service.login(req.body);
            sendSuccess(res, result, "Login successful");
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /api/auth/me
     * Returns the current authenticated user's profile.
     */
    getMe = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const user = await this.service.getMe(req.user!.id);
            sendSuccess(res, user);
        } catch (error) {
            next(error);
        }
    };
}
