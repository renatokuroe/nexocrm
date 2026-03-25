import { prisma } from "../../prisma/client";

export class AdminRepository {
    async listUsers() {
        return prisma.user.findMany({
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

    async createTenantUser(data: {
        name: string;
        email: string;
        password: string;
        companyName: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: { name: data.companyName },
            });

            const user = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: "USER",
                    tenantId: tenant.id,
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

            return { tenant, user };
        });
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

            if (data.companyName !== undefined) {
                await tx.tenant.update({
                    where: { id: user.tenantId },
                    data: { name: data.companyName },
                });
            }

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
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id },
                select: { id: true, tenantId: true },
            });

            if (!user) return null;

            await tx.user.delete({ where: { id } });
            await tx.tenant.delete({ where: { id: user.tenantId } });

            return user;
        });
    }
}
