// Clients Controller - HTTP layer

import { Response, NextFunction } from "express";
import { ClientsService } from "./clients.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

export class ClientsController {
    private service: ClientsService;

    constructor() {
        this.service = new ClientsService();
    }

    /** GET /api/clients */
    list = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { total, clients } = await this.service.list(
                req.user!.id,
                req.query as any
            );
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            sendPaginated(res, clients, { page, limit, total });
        } catch (error) {
            next(error);
        }
    };

    /** GET /api/clients/:id */
    getById = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const client = await this.service.getById(req.params.id, req.user!.id);
            sendSuccess(res, client);
        } catch (error) {
            next(error);
        }
    };

    /** POST /api/clients */
    create = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const client = await this.service.create(req.user!.id, req.body);
            sendSuccess(res, client, "Client created successfully", 201);
        } catch (error) {
            next(error);
        }
    };

    /** PUT /api/clients/:id */
    update = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const client = await this.service.update(
                req.params.id,
                req.user!.id,
                req.body
            );
            sendSuccess(res, client, "Client updated successfully");
        } catch (error) {
            next(error);
        }
    };

    /** DELETE /api/clients/:id */
    delete = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            await this.service.delete(req.params.id, req.user!.id);
            sendSuccess(res, null, "Client deleted successfully");
        } catch (error) {
            next(error);
        }
    };
}
