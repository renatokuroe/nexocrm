// Segments Repository
import { prisma } from "../../prisma/client";

export class SegmentsRepository {
    async findAll() {
        return prisma.segment.findMany({
            include: { _count: { select: { clients: true } } },
            orderBy: { name: "asc" },
        });
    }

    async findById(id: string) {
        return prisma.segment.findUnique({
            where: { id },
            include: { _count: { select: { clients: true } } },
        });
    }

    async create(data: { name: string; color: string; description?: string }) {
        return prisma.segment.create({ data });
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
