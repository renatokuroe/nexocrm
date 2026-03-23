// Segments Controller
import { Response, NextFunction } from "express";
import { SegmentsService } from "./segments.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class SegmentsController {
    private service = new SegmentsService();

    list = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.list());
        } catch (e) { next(e); }
    };

    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.create(req.body), "Segment created", 201);
        } catch (e) { next(e); }
    };

    update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.update(req.params.id, req.body), "Segment updated");
        } catch (e) { next(e); }
    };

    delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            await this.service.delete(req.params.id);
            sendSuccess(res, null, "Segment deleted");
        } catch (e) { next(e); }
    };
}
