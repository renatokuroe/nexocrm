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
        });
    }

    /**
     * Find a user by their ID.
     * Used to validate JWT tokens and fetch current user.
     */
    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, createdAt: true },
        });
    }

    /**
     * Create a new user record.
     * Password should be hashed BEFORE calling this method.
     */
    async create(data: { name: string; email: string; password: string }) {
        return prisma.user.create({
            data,
            select: { id: true, name: true, email: true },
        });
    }
}
