// Pipeline Repository - Stages and Deals

import { prisma } from "../../prisma/client";

const DEAL_INCLUDE = {
    client: { select: { id: true, name: true, company: true } },
    stage: { select: { id: true, name: true, color: true } },
};

export class PipelineRepository {
    // ── Stages ────────────────────────────────────────────────────────────

    async findAllStages() {
        return prisma.stage.findMany({
            orderBy: { order: "asc" },
            include: {
                _count: { select: { deals: true } },
            },
        });
    }

    async createStage(data: { name: string; order: number; color?: string }) {
        return prisma.stage.create({ data });
    }

    async updateStage(
        id: string,
        data: Partial<{ name: string; order: number; color: string }>
    ) {
        return prisma.stage.update({ where: { id }, data });
    }

    async deleteStage(id: string) {
        return prisma.stage.delete({ where: { id } });
    }

    // ── Deals ─────────────────────────────────────────────────────────────

    /**
     * Returns all deals grouped by their stage.
     * Includes related client and stage info.
     */
    async findAllDeals(userId: string) {
        const stages = await prisma.stage.findMany({
            orderBy: { order: "asc" },
            include: {
                deals: {
                    where: { userId },
                    include: DEAL_INCLUDE,
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        return stages;
    }

    async findDealById(id: string, userId: string) {
        return prisma.deal.findFirst({
            where: { id, userId },
            include: DEAL_INCLUDE,
        });
    }

    async createDeal(
        userId: string,
        data: {
            title: string;
            value?: number;
            closeDate?: Date;
            description?: string;
            stageId: string;
            clientId?: string;
        }
    ) {
        return prisma.deal.create({
            data: { ...data, userId },
            include: DEAL_INCLUDE,
        });
    }

    async updateDeal(
        id: string,
        userId: string,
        data: Partial<{
            title: string;
            value: number;
            closeDate: Date;
            description: string;
            stageId: string;
            clientId: string;
        }>
    ) {
        return prisma.deal.update({
            where: { id, userId },
            data,
            include: DEAL_INCLUDE,
        });
    }

    async deleteDeal(id: string, userId: string) {
        return prisma.deal.delete({ where: { id, userId } });
    }
}
