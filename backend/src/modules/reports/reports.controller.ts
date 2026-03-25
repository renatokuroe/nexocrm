// Reports Controller
import { Response, NextFunction } from "express";
import { ReportsService } from "./reports.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class ReportsController {
    private service = new ReportsService();

    getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try { sendSuccess(res, await this.service.getDashboardStats(req.user!.id, req.user!.tenantId)); } catch (e) { next(e); }
    };
}
