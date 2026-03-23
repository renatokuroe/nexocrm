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
        userId: string,
        filters: { completed?: string; priority?: TaskPriority; clientId?: string }
    ) {
        return this.repository.findAll(userId, {
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
        userId: string,
        dto: Partial<CreateTaskDto & { completed: boolean }>
    ) {
        const existing = await this.repository.findById(id, userId);
        if (!existing) throw new NotFoundError("Task not found");

        return this.repository.update(id, userId, {
            ...dto,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        });
    }

    async toggle(id: string, userId: string) {
        const existing = await this.repository.findById(id, userId);
        if (!existing) throw new NotFoundError("Task not found");
        return this.repository.update(id, userId, { completed: !existing.completed });
    }

    async delete(id: string, userId: string) {
        const existing = await this.repository.findById(id, userId);
        if (!existing) throw new NotFoundError("Task not found");
        return this.repository.delete(id, userId);
    }
}
