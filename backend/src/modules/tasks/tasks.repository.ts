// Tasks Repository
import { prisma } from "../../prisma/client";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const TASK_INCLUDE = {
    client: { select: { id: true, name: true, company: true } },
};

export class TasksRepository {
    async findAll(
        userId: string,
        filters: {
            completed?: boolean;
            priority?: TaskPriority;
            clientId?: string;
        } = {}
    ) {
        const where: Record<string, unknown> = {
            userId,
            ...(filters.completed !== undefined && { completed: filters.completed }),
            ...(filters.priority && { priority: filters.priority }),
            ...(filters.clientId && { clientId: filters.clientId }),
        };

        return prisma.task.findMany({
            where,
            include: TASK_INCLUDE,
            orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { priority: "desc" }],
        });
    }

    async findById(id: string, userId: string) {
        return prisma.task.findFirst({ where: { id, userId }, include: TASK_INCLUDE });
    }

    async create(
        userId: string,
        data: {
            title: string;
            description?: string;
            dueDate?: Date;
            priority?: TaskPriority;
            clientId?: string;
        }
    ) {
        return prisma.task.create({
            data: { ...data, userId },
            include: TASK_INCLUDE,
        });
    }

    async update(
        id: string,
        userId: string,
        data: Partial<{
            title: string;
            description: string;
            dueDate: Date;
            priority: TaskPriority;
            completed: boolean;
            clientId: string;
        }>
    ) {
        return prisma.task.update({
            where: { id, userId },
            data,
            include: TASK_INCLUDE,
        });
    }

    async delete(id: string, userId: string) {
        return prisma.task.delete({ where: { id, userId } });
    }

    async countPending(userId: string) {
        return prisma.task.count({ where: { userId, completed: false } });
    }
}
