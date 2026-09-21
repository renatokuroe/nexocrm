import { prisma } from "../../prisma/client";

const CADENCE_INCLUDE = {
    steps: { orderBy: { order: "asc" as const } },
    _count: { select: { enrollments: true } },
};

export class CadencesRepository {
    async findAll(userId: string) {
        return prisma.cadence.findMany({
            where: { userId },
            include: CADENCE_INCLUDE,
            orderBy: { createdAt: "desc" },
        });
    }

    async findById(id: string, userId: string) {
        return prisma.cadence.findFirst({
            where: { id, userId },
            include: { ...CADENCE_INCLUDE, enrollments: { include: { client: true } } },
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

    async enroll(cadenceId: string, clientId: string, userId: string) {
        const cadence = await prisma.cadence.findFirst({
            where: { id: cadenceId, userId, active: true },
            include: { steps: { orderBy: { order: "asc" } } },
        });
        if (!cadence) return null;

        const client = await prisma.client.findFirst({ where: { id: clientId, user: { id: userId } } });
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