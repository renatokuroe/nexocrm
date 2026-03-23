// Tasks Controller
import { Response, NextFunction } from "express";
import { TasksService } from "./tasks.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class TasksController {
    private service = new TasksService();

    list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.list(req.user!.id, req.query as any)); } catch (e) { next(e); }
    };

    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.create(req.user!.id, req.body), "Task created", 201); } catch (e) { next(e); }
    };

    update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.update(req.params.id, req.user!.id, req.body)); } catch (e) { next(e); }
    };

    toggle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.toggle(req.params.id, req.user!.id)); } catch (e) { next(e); }
    };

    delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { await this.service.delete(req.params.id, req.user!.id); sendSuccess(res, null, "Task deleted"); } catch (e) { next(e); }
    };
}
