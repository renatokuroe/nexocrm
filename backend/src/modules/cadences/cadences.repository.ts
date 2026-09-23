import { prisma } from "../../prisma/client";

const CADENCE_INCLUDE = {
    steps: { orderBy: { order: "asc" as const } },
    _count: { select: { enrollments: true } },
};

export class CadencesRepository {
    // Cadences are shared by everyone in the tenant; only admins create them.
    async findAll(tenantId: string) {
        return prisma.cadence.findMany({
            where: { user: { tenantId }, active: true },
            include: CADENCE_INCLUDE,
            orderBy: { createdAt: "desc" },
        });
    }

    async findById(id: string, tenantId: string) {
        return prisma.cadence.findFirst({
            where: { id, user: { tenantId } },
            include: { ...CADENCE_INCLUDE, enrollments: { include: { client: true } } },
        });
    }

    async findEnrollments(cadenceId: string, tenantId: string) {
        const cadence = await prisma.cadence.findFirst({ where: { id: cadenceId, user: { tenantId } }, select: { id: true } });
        if (!cadence) return null;

        return prisma.cadenceEnrollment.findMany({
            where: { cadenceId },
            orderBy: { enrolledAt: "desc" },
            select: {
                id: true,
                status: true,
                enrolledAt: true,
                client: { select: { id: true, name: true, company: true } },
                user: { select: { id: true, name: true } },
                tasks: { select: { title: true, dueDate: true, completed: true }, orderBy: { dueDate: "asc" } },
            },
        });
    }

    async create(userId: string, data: {
        name: string;
        description?: string;
        steps: Array<{
            title: string;
            description?: string;
            channel: "TASK" | "CALL" | "EMAIL" | "WHATSAPP" | "LINKEDIN";
            order: number;
            delayDays: number;
        }>;
    }) {
        return prisma.cadence.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                steps: { create: data.steps },
            },
            include: CADENCE_INCLUDE,
        });
    }

    async enroll(cadenceId: string, clientId: string, userId: string, tenantId: string) {
        const cadence = await prisma.cadence.findFirst({
            where: { id: cadenceId, user: { tenantId }, active: true },
            include: { steps: { orderBy: { order: "asc" } } },
        });
        if (!cadence) return null;

        const client = await prisma.client.findFirst({ where: { id: clientId, user: { tenantId } } });
        if (!client) return undefined;

        return prisma.$transaction(async (transaction) => {
            const enrollment = await transaction.cadenceEnrollment.create({
                data: { cadenceId, clientId, userId },
            });
            let delay = 0;
            for (const step of cadence.steps) {
                delay += step.delayDays;
                const dueDate = new Date();
                dueDate.setHours(9, 0, 0, 0);
                dueDate.setDate(dueDate.getDate() + delay);
                await transaction.task.create({
                    data: {
                        title: step.title,
                        description: step.description,
                        channel: step.channel,
                        dueDate,
                        clientId,
                        userId,
                        cadenceStepId: step.id,
                        cadenceEnrollmentId: enrollment.id,
                    },
                });
            }
            return enrollment;
        });
    }
}