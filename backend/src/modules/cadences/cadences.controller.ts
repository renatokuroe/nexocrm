import { Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { CadencesService } from "./cadences.service";

export class CadencesController {
    private service = new CadencesService();

    list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.list(req.user!.tenantId)); } catch (error) { next(error); }
    };

    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.create(req.user!.id, req.body), "Cadence created", 201); } catch (error) { next(error); }
    };

    enrollments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.enrollments(req.params.id, req.user!.tenantId)); } catch (error) { next(error); }
    };

    enroll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.enroll(req.params.id, req.user!.id, req.user!.tenantId, req.body.clientId), "Client enrolled", 201);
        } catch (error) { next(error); }
    };
}