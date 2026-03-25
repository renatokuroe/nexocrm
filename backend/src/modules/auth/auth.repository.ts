// Auth Repository - Database access layer
// Only responsible for raw DB queries, no business logic

import { prisma } from "../../prisma/client";

export class AuthRepository {
    /**
     * Find a user by their email address.
     * Used during login to fetch the user for password comparison.
     */
    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
            include: {
                tenant: { select: { id: true, name: true } },
            },
        });
    }

    /**
     * Find a user by their ID.
     * Used to validate JWT tokens and fetch current user.
     */
    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                createdAt: true,
                tenant: { select: { name: true } },
            },
        });
    }

    /**
     * Create a new user record.
     * Password should be hashed BEFORE calling this method.
     */
    async create(data: { name: string; email: string; password: string; companyName: string }) {
        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                tenant: {
                    create: {
                        name: data.companyName,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                tenant: { select: { name: true } },
            },
        });
    }
}
