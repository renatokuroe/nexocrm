import { timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";
import { config } from "../../config/app.config";
import { sendSuccess } from "../../utils/response";
import { AppError, ForbiddenError } from "../../utils/errors";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { CallsService } from "./calls.service";

function isValidSecret(received: unknown): boolean {
    const expected = Buffer.from(config.api4com.webhookSecret);
    const actual = Buffer.from(typeof received === "string" ? received : "");
    return expected.length > 0 && actual.length === expected.length && timingSafeEqual(actual, expected);
}

export class CallsController {
    private service = new CallsService();

    list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.listByClient(req.query.clientId as string | undefined, req.user!.tenantId));
        } catch (error) { next(error); }
    };

    start = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.start(req.user!.id, req.user!.tenantId, req.body), "Call started", 201);
        } catch (error) { next(error); }
    };

    // Public endpoint called by API4Com; authenticated by the ?secret= query parameter
    webhook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!config.api4com.webhookSecret) throw new AppError("Webhook not configured", 503);
            if (!isValidSecret(req.query.secret)) throw new ForbiddenError("Invalid webhook secret");
            await this.service.handleWebhook(req.body ?? {});
            sendSuccess(res, null, "Webhook received");
        } catch (error) { next(error); }
    };
}
