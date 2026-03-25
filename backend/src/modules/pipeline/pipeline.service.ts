// Pipeline Service
import { NotFoundError } from "../../utils/errors";
import { PipelineRepository } from "./pipeline.repository";
import type { CreateDealDto, UpdateDealDto } from "./pipeline.types";

export class PipelineService {
    private repository = new PipelineRepository();

    async getBoard(userId: string, tenantId: string) {
        return this.repository.findAllDeals(userId, tenantId);
    }

    async getStages(tenantId: string) {
        return this.repository.findAllStages(tenantId);
    }

    async createStage(tenantId: string, data: { name: string; order: number; color?: string }) {
        return this.repository.createStage(tenantId, data);
    }

    async updateStage(
        id: string,
        tenantId: string,
        data: Partial<{ name: string; order: number; color: string }>
    ) {
        const stage = await this.repository.findStageById(id, tenantId);
        if (!stage) throw new NotFoundError("Stage not found");
        return this.repository.updateStage(id, data);
    }

    async deleteStage(id: string, tenantId: string) {
        const stage = await this.repository.findStageById(id, tenantId);
        if (!stage) throw new NotFoundError("Stage not found");
        return this.repository.deleteStage(id);
    }

    async createDeal(userId: string, tenantId: string, dto: CreateDealDto) {
        const stage = await this.repository.findStageById(dto.stageId, tenantId);
        if (!stage) throw new NotFoundError("Stage not found");

        return this.repository.createDeal(userId, {
            ...dto,
            closeDate: dto.closeDate ? new Date(dto.closeDate) : undefined,
        });
    }

    async updateDeal(id: string, userId: string, dto: UpdateDealDto) {
        const existing = await this.repository.findDealById(id, userId);
        if (!existing) throw new NotFoundError("Deal not found");

        return this.repository.updateDeal(id, userId, {
            ...dto,
            closeDate: dto.closeDate ? new Date(dto.closeDate) : undefined,
        });
    }

    async moveDeal(id: string, userId: string, tenantId: string, stageId: string) {
        const existing = await this.repository.findDealById(id, userId);
        if (!existing) throw new NotFoundError("Deal not found");

        const stage = await this.repository.findStageById(stageId, tenantId);
        if (!stage) throw new NotFoundError("Stage not found");

        return this.repository.updateDeal(id, userId, { stageId });
    }

    async deleteDeal(id: string, userId: string) {
        const existing = await this.repository.findDealById(id, userId);
        if (!existing) throw new NotFoundError("Deal not found");
        return this.repository.deleteDeal(id, userId);
    }
}
