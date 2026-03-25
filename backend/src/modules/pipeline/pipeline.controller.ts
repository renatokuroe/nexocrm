// Pipeline Controller
import { Response, NextFunction } from "express";
import { PipelineService } from "./pipeline.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class PipelineController {
    private service = new PipelineService();

    getBoard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.getBoard(req.user!.id, req.user!.tenantId)); } catch (e) { next(e); }
    };

    getStages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.getStages(req.user!.tenantId)); } catch (e) { next(e); }
    };

    createStage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.createStage(req.user!.tenantId, req.body), "Stage created", 201); } catch (e) { next(e); }
    };

    updateStage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.updateStage(req.params.id, req.user!.tenantId, req.body)); } catch (e) { next(e); }
    };

    deleteStage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { await this.service.deleteStage(req.params.id, req.user!.tenantId); sendSuccess(res, null, "Stage deleted"); } catch (e) { next(e); }
    };

    createDeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.createDeal(req.user!.id, req.user!.tenantId, req.body), "Deal created", 201); } catch (e) { next(e); }
    };

    updateDeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.updateDeal(req.params.id, req.user!.id, req.body)); } catch (e) { next(e); }
    };

    moveDeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.moveDeal(req.params.id, req.user!.id, req.user!.tenantId, req.body.stageId)); } catch (e) { next(e); }
    };

    deleteDeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { await this.service.deleteDeal(req.params.id, req.user!.id); sendSuccess(res, null, "Deal deleted"); } catch (e) { next(e); }
    };
}
