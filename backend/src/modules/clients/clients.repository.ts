// Clients Repository - Database access layer
// All Prisma queries for the clients domain are isolated here

import { prisma } from "../../prisma/client";
import type { ClientFilters } from "./clients.types";

// Reusable include block to fetch related data with every client
const CLIENT_INCLUDE = {
    segments: {
        include: {
            segment: true,
        },
    },
    customFieldValues: {
        include: {
            customField: true,
        },
    },
    _count: {
        select: { deals: true, tasks: true },
    },
};

export class ClientsRepository {
    /**
     * Fetch a paginated, filtered list of clients for a given user.
     */
    async findAll(userId: string, filters: ClientFilters) {
        const {
            search,
            status,
            segmentId,
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 20,
        } = filters;

        // Build dynamic WHERE clause
        const where: Record<string, unknown> = {
            userId,
            ...(status && { status }),
            // Filter by segment via join table
            ...(segmentId && {
                segments: { some: { segmentId } },
            }),
            // Search across name, email, phone, company
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { phone: { contains: search } },
                    { company: { contains: search } },
                ],
            }),
        };

        // Run count and data queries in parallel for efficiency
        const [total, clients] = await Promise.all([
            prisma.client.count({ where }),
            prisma.client.findMany({
                where,
                include: CLIENT_INCLUDE,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return { total, clients };
    }

    /**
     * Fetch a single client by ID (scoped to user).
     */
    async findById(id: string, userId: string) {
        return prisma.client.findFirst({
            where: { id, userId },
            include: CLIENT_INCLUDE,
        });
    }

    /**
     * Create a new client with optional segments and custom field values.
     */
    async create(
        userId: string,
        data: {
            name: string;
            email?: string;
            phone?: string;
            company?: string;
            status?: "ACTIVE" | "INACTIVE" | "LEAD";
            leadSource?: string;
            birthday?: Date;
            notes?: string;
        },
        segmentIds: string[] = [],
        customFields: { fieldId: string; value: string }[] = []
    ) {
        return prisma.client.create({
            data: {
                ...data,
                user: { connect: { id: userId } },
                // Create segment associations via join table
                segments: {
                    create: segmentIds.map((segmentId) => ({ segmentId })),
                },
                // Create custom field values
                customFieldValues: {
                    create: customFields.map((cf) => ({
                        value: cf.value,
                        customFieldId: cf.fieldId,
                    })),
                },
            },
            include: CLIENT_INCLUDE,
        });
    }

    /**
     * Update a client's data.
     * Replaces all segments and custom field values.
     */
    async update(
        id: string,
        userId: string,
        data: {
            name?: string;
            email?: string;
            phone?: string;
            company?: string;
            status?: "ACTIVE" | "INACTIVE" | "LEAD";
            leadSource?: string;
            birthday?: Date;
            notes?: string;
        },
        segmentIds?: string[],
        customFields?: { fieldId: string; value: string }[]
    ) {
        return prisma.$transaction(async (tx: any) => {
            // Replace segments if provided
            if (segmentIds !== undefined) {
                await tx.clientSegment.deleteMany({ where: { clientId: id } });
                if (segmentIds.length > 0) {
                    await tx.clientSegment.createMany({
                        data: segmentIds.map((segmentId) => ({ clientId: id, segmentId })),
                    });
                }
            }

            // Replace custom field values if provided
            if (customFields !== undefined) {
                await tx.customFieldValue.deleteMany({ where: { clientId: id } });
                if (customFields.length > 0) {
                    await tx.customFieldValue.createMany({
                        data: customFields.map((cf) => ({
                            clientId: id,
                            customFieldId: cf.fieldId,
                            value: cf.value,
                        })),
                    });
                }
            }

            // Update base client fields
            return tx.client.update({
                where: { id, userId },
                data,
                include: CLIENT_INCLUDE,
            });
        });
    }

    /**
     * Delete a client by ID (cascades to segments, tasks, field values).
     */
    async delete(id: string, userId: string) {
        return prisma.client.delete({
            where: { id, userId },
        });
    }

    /**
     * Count clients recently created (last 30 days) for dashboard stats.
     */
    async countByStatus(userId: string) {
        return prisma.client.groupBy({
            by: ["status"],
            where: { userId },
            _count: true,
        });
    }
}
