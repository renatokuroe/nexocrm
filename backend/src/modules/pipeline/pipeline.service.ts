// Pipeline Service
import { NotFoundError } from "../../utils/errors";
import { PipelineRepository } from "./pipeline.repository";
import type { CreateDealDto, UpdateDealDto } from "./pipeline.types";

export class PipelineService {
    private repository = new PipelineRepository();

    async getBoard(userId: string) {
        return this.repository.findAllDeals(userId);
    }

    async getStages() {
        return this.repository.findAllStages();
    }

    async createStage(data: { name: string; order: number; color?: string }) {
        return this.repository.createStage(data);
    }

    async updateStage(
        id: string,
        data: Partial<{ name: string; order: number; color: string }>
    ) {
        return this.repository.updateStage(id, data);
    }

    async deleteStage(id: string) {
        return this.repository.deleteStage(id);
    }

    async createDeal(userId: string, dto: CreateDealDto) {
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

    async moveDeal(id: string, userId: string, stageId: string) {
        const existing = await this.repository.findDealById(id, userId);
        if (!existing) throw new NotFoundError("Deal not found");

        return this.repository.updateDeal(id, userId, { stageId });
    }

    async deleteDeal(id: string, userId: string) {
        const existing = await this.repository.findDealById(id, userId);
        if (!existing) throw new NotFoundError("Deal not found");
        return this.repository.deleteDeal(id, userId);
    }
}
