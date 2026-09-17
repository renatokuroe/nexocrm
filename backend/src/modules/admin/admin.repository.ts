import { prisma } from "../../prisma/client";

export class AdminRepository {
    async listUsers(tenantId: string) {
        return prisma.user.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async createTenantUser(tenantId: string, data: {
        name: string;
        email: string;
        password: string;
    }) {
        const user = await prisma.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: "USER",
                    tenantId,
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

        return { user };
    }

    async updateTenantUser(
        id: string,
        data: {
            name?: string;
            email?: string;
            password?: string;
            companyName?: string;
        }
    ) {
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.email !== undefined ? { email: data.email } : {}),
                    ...(data.password !== undefined ? { password: data.password } : {}),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    tenantId: true,
                    tenant: { select: { id: true, name: true } },
                },
            });

            return tx.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    tenantId: true,
                    tenant: { select: { id: true, name: true } },
                    createdAt: true,
                },
            });
        });
    }

    async deleteTenantUser(id: string) {
        return prisma.user.delete({ where: { id } });
    }
}
