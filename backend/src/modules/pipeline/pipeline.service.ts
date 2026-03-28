// Pipeline Service
import { ConflictError, NotFoundError } from "../../utils/errors";
import { PipelineRepository } from "./pipeline.repository";
import type {
    CreateDealDto,
    DealLabelAssignmentDto,
    LabelDto,
    UpdateDealDto,
} from "./pipeline.types";

export class PipelineService {
    private repository = new PipelineRepository();

    async getBoard(userId: string, tenantId: string) {
        return this.repository.findAllDeals(userId, tenantId);
    }

    async getStages(tenantId: string) {
        return this.repository.findAllStages(tenantId);
    }

    async listLabels(tenantId: string) {
        return this.repository.findAllLabels(tenantId);
    }

    async createLabel(tenantId: string, dto: LabelDto) {
        const sanitizedName = dto.name.trim();
        const finalName = sanitizedName;

        if (finalName) {
            const existing = await this.repository.findAllLabels(tenantId);
            const normalized = finalName.toLowerCase();
            if (existing.some((item) => item.name.trim().toLowerCase() === normalized)) {
                throw new ConflictError("Label already exists");
            }
        }

        return this.repository.createLabel(tenantId, {
            name: finalName,
            color: dto.color,
        });
    }

    async updateLabel(id: string, tenantId: string, dto: Partial<LabelDto>) {
        const label = await this.repository.findLabelById(id, tenantId);
        if (!label) throw new NotFoundError("Label not found");

        const nextName = dto.name?.trim();
        const finalName = nextName;
        if (finalName && finalName.toLowerCase() !== label.name.trim().toLowerCase()) {
            const existing = await this.repository.findAllLabels(tenantId);
            if (existing.some((item) => item.id !== id && item.name.trim().toLowerCase() === finalName.toLowerCase())) {
                throw new ConflictError("Label already exists");
            }
        }

        return this.repository.updateLabel(id, {
            ...(finalName ? { name: finalName } : {}),
            ...(dto.color ? { color: dto.color } : {}),
        });
    }

    async deleteLabel(id: string, tenantId: string) {
        const label = await this.repository.findLabelById(id, tenantId);
        if (!label) throw new NotFoundError("Label not found");
        await this.repository.deleteLabel(id);
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

    async updateDealLabels(
        id: string,
        userId: string,
        tenantId: string,
        labels: DealLabelAssignmentDto[]
    ) {
        const existing = await this.repository.findDealById(id, userId);
        if (!existing) throw new NotFoundError("Deal not found");

        const catalog = await this.repository.findAllLabels(tenantId);
        const catalogIds = new Set(catalog.map((item) => item.id));

        for (const item of labels) {
            if (!catalogIds.has(item.labelId)) {
                throw new NotFoundError("Label not found");
            }
        }

        return this.repository.syncDealLabels(id, labels);
    }
}
