import type { CallStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";

export class CallsRepository {
    async findUserExtension(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { phoneExtension: true } });
        return user?.phoneExtension?.trim() || null;
    }

    async findClient(clientId: string, tenantId: string) {
        return prisma.client.findFirst({
            where: { id: clientId, user: { tenantId } },
            select: { id: true, name: true, phone: true },
        });
    }

    async findDeal(dealId: string, tenantId: string) {
        return prisma.deal.findFirst({ where: { id: dealId, user: { tenantId } }, select: { id: true } });
    }

    async findById(id: string) {
        return prisma.call.findUnique({ where: { id } });
    }

    async create(data: { userId: string; clientId: string; dealId?: string | null; phone: string }) {
        return prisma.call.create({ data });
    }

    async update(id: string, data: Prisma.CallUpdateInput) {
        return prisma.call.update({ where: { id }, data });
    }

    async listByClient(clientId: string, tenantId: string) {
        return prisma.call.findMany({
            where: { clientId, client: { user: { tenantId } } },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { user: { select: { id: true, name: true } } },
        });
    }
}

export type { CallStatus };
