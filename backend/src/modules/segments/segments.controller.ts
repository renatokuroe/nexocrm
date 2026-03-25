// Segments Controller
import { Response, NextFunction } from "express";
import { SegmentsService } from "./segments.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class SegmentsController {
    private service = new SegmentsService();

    list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.list(req.user!.tenantId));
        } catch (e) { next(e); }
    };

    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.create(req.user!.tenantId, req.body), "Segment created", 201);
        } catch (e) { next(e); }
    };

    update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.update(req.params.id, req.user!.tenantId, req.body), "Segment updated");
        } catch (e) { next(e); }
    };

    delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            await this.service.delete(req.params.id, req.user!.tenantId);
            sendSuccess(res, null, "Segment deleted");
        } catch (e) { next(e); }
    };
}
