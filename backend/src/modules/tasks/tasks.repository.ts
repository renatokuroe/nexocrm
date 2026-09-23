// Tasks Repository
import { prisma } from "../../prisma/client";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const TASK_INCLUDE = {
    client: { select: { id: true, name: true, company: true } },
};

// Tasks are shared across the tenant, except cadence tasks, which belong only
// to the user who enrolled the client in the cadence.
export function visibleTasksWhere(tenantId: string, userId: string) {
    return {
        user: { tenantId },
        OR: [{ cadenceEnrollmentId: null }, { userId }],
    };
}

export class TasksRepository {
    async findAll(
        tenantId: string,
        userId: string,
        filters: {
            completed?: boolean;
            priority?: TaskPriority;
            clientId?: string;
        } = {}
    ) {
        const where: Record<string, unknown> = {
            ...visibleTasksWhere(tenantId, userId),
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

    async findById(id: string, tenantId: string, userId: string) {
        return prisma.task.findFirst({ where: { id, ...visibleTasksWhere(tenantId, userId) }, include: TASK_INCLUDE });
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
        tenantId: string,
        data: Partial<{
            title: string;
            description: string;
            dueDate: Date;
            priority: TaskPriority;
            completed: boolean;
            clientId: string;
        }>
    ) {
        const task = await prisma.task.findFirst({ where: { id, user: { tenantId } } });
        return task ? prisma.task.update({
            where: { id },
            data,
            include: TASK_INCLUDE,
        }) : null;
    }

    async delete(id: string, tenantId: string) {
        const task = await prisma.task.findFirst({ where: { id, user: { tenantId } } });
        return task ? prisma.task.delete({ where: { id } }) : null;
    }

    async countPending(tenantId: string) {
        return prisma.task.count({ where: { user: { tenantId }, completed: false } });
    }
}
