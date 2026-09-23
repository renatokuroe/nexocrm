// Tasks Service
import { NotFoundError } from "../../utils/errors";
import { TasksRepository } from "./tasks.repository";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface CreateTaskDto {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: TaskPriority;
    clientId?: string;
}

export class TasksService {
    private repository = new TasksRepository();

    async list(
        tenantId: string,
        userId: string,
        filters: { completed?: string; priority?: TaskPriority; clientId?: string }
    ) {
        return this.repository.findAll(tenantId, userId, {
            ...filters,
            completed:
                filters.completed !== undefined
                    ? filters.completed === "true"
                    : undefined,
        });
    }

    async create(userId: string, dto: CreateTaskDto) {
        return this.repository.create(userId, {
            ...dto,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        });
    }

    async update(
        id: string,
        tenantId: string,
        userId: string,
        dto: Partial<CreateTaskDto & { completed: boolean }>
    ) {
        const existing = await this.repository.findById(id, tenantId, userId);
        if (!existing) throw new NotFoundError("Task not found");

        return this.repository.update(id, tenantId, {
            ...dto,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        });
    }

    async toggle(id: string, tenantId: string, userId: string) {
        const existing = await this.repository.findById(id, tenantId, userId);
        if (!existing) throw new NotFoundError("Task not found");
        return this.repository.update(id, tenantId, { completed: !existing.completed });
    }

    async delete(id: string, tenantId: string, userId: string) {
        const existing = await this.repository.findById(id, tenantId, userId);
        if (!existing) throw new NotFoundError("Task not found");
        return this.repository.delete(id, tenantId);
    }
}
