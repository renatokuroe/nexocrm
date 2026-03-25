import { Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { AdminService } from "./admin.service";

export class AdminController {
    private service = new AdminService();

    listUsers = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.listUsers());
        } catch (e) {
            next(e);
        }
    };

    createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.createTenantUser(req.body), "User created", 201);
        } catch (e) {
            next(e);
        }
    };

    updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, await this.service.updateTenantUser(req.params.id, req.body), "User updated");
        } catch (e) {
            next(e);
        }
    };

    deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            await this.service.deleteTenantUser(req.user!.id, req.params.id);
            sendSuccess(res, null, "User deleted");
        } catch (e) {
            next(e);
        }
    };
}
