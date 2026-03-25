// Segments Repository
import { prisma } from "../../prisma/client";

export class SegmentsRepository {
    async findAll(tenantId: string) {
        return prisma.segment.findMany({
            where: { tenantId },
            include: { _count: { select: { clients: true } } },
            orderBy: { name: "asc" },
        });
    }

    async findById(id: string, tenantId: string) {
        return prisma.segment.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { clients: true } } },
        });
    }

    async create(tenantId: string, data: { name: string; color: string; description?: string }) {
        return prisma.segment.create({ data: { ...data, tenantId } });
    }

    async update(
        id: string,
        data: Partial<{ name: string; color: string; description: string }>
    ) {
        return prisma.segment.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.segment.delete({ where: { id } });
    }
}
