// Pipeline Repository - Stages and Deals

import { prisma } from "../../prisma/client";

const DEAL_INCLUDE = {
    client: { select: { id: true, name: true, company: true, phone: true } },
    stage: { select: { id: true, name: true, color: true } },
    labels: {
        include: {
            label: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
        },
        orderBy: { createdAt: "asc" as const },
    },
};

export class PipelineRepository {
    // ── Stages ────────────────────────────────────────────────────────────

    async findAllStages(tenantId: string) {
        return prisma.stage.findMany({
            where: { tenantId },
            orderBy: { order: "asc" },
            include: {
                _count: { select: { deals: true } },
            },
        });
    }

    async createStage(tenantId: string, data: { name: string; order: number; color?: string }) {
        return prisma.stage.create({ data: { ...data, tenantId } });
    }

    async findStageById(id: string, tenantId: string) {
        return prisma.stage.findFirst({ where: { id, tenantId } });
    }

    async updateStage(id: string, data: Partial<{ name: string; order: number; color: string }>) {
        return prisma.stage.update({ where: { id }, data });
    }

    async deleteStage(id: string) {
        return prisma.stage.delete({ where: { id } });
    }

    async findAllLabels(tenantId: string) {
        return prisma.label.findMany({
            where: { tenantId },
            orderBy: { name: "asc" },
        });
    }

    async findLabelById(id: string, tenantId: string) {
        return prisma.label.findFirst({ where: { id, tenantId } });
    }

    async createLabel(tenantId: string, data: { name: string; color: string }) {
        return prisma.label.create({
            data: { ...data, tenantId },
        });
    }

    async updateLabel(id: string, data: { name?: string; color?: string }) {
        return prisma.label.update({
            where: { id },
            data,
        });
    }

    async deleteLabel(id: string) {
        return prisma.label.delete({ where: { id } });
    }

    // ── Deals ─────────────────────────────────────────────────────────────

    /**
     * Returns all deals grouped by their stage.
     * Includes related client and stage info.
     */
    async findAllDeals(userId: string, tenantId: string) {
        const stages = await prisma.stage.findMany({
            where: { tenantId },
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

    async syncDealLabels(
        dealId: string,
        labels: { labelId: string }[]
    ) {
        return prisma.$transaction(async (tx) => {
            const labelIds = labels.map((item) => item.labelId);

            if (labelIds.length > 0) {
                await tx.dealLabel.deleteMany({
                    where: {
                        dealId,
                        labelId: { notIn: labelIds },
                    },
                });
            } else {
                await tx.dealLabel.deleteMany({ where: { dealId } });
            }

            for (const item of labels) {
                await tx.dealLabel.upsert({
                    where: {
                        dealId_labelId: {
                            dealId,
                            labelId: item.labelId,
                        },
                    },
                    create: {
                        dealId,
                        labelId: item.labelId,
                    },
                    update: {},
                });
            }

            return tx.deal.findUnique({
                where: { id: dealId },
                include: DEAL_INCLUDE,
            });
        });
    }
}
