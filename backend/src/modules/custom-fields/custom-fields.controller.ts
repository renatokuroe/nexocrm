// Custom Fields Controller
import { Response, NextFunction } from "express";
import { CustomFieldsService } from "./custom-fields.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class CustomFieldsController {
    private service = new CustomFieldsService();

    list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.list(req.user!.tenantId)); } catch (e) { next(e); }
    };

    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.create(req.user!.tenantId, req.body), "Field created", 201); } catch (e) { next(e); }
    };

    update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.update(req.params.id, req.body)); } catch (e) { next(e); }
    };

    delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { await this.service.delete(req.params.id); sendSuccess(res, null, "Field deleted"); } catch (e) { next(e); }
    };

    reorder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.reorder(req.user!.tenantId, req.body.orderedIds)); } catch (e) { next(e); }
    };
}
