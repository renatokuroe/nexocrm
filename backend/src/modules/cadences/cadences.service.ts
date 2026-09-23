import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors";
import { CadencesRepository } from "./cadences.repository";

type CadenceChannel = "TASK" | "CALL" | "EMAIL" | "WHATSAPP" | "LINKEDIN";

export interface CreateCadenceDto {
    name: string;
    description?: string;
    steps: Array<{
        title: string;
        description?: string;
        channel?: CadenceChannel;
        delayDays?: number;
    }>;
}

export class CadencesService {
    private repository = new CadencesRepository();

    list(tenantId: string) {
        return this.repository.findAll(tenantId);
    }

    async create(userId: string, dto: CreateCadenceDto) {
        if (!dto.name?.trim()) throw new BadRequestError("Cadence name is required");
        if (!dto.steps?.length) throw new BadRequestError("A cadence needs at least one step");

        return this.repository.create(userId, {
            name: dto.name.trim(),
            description: dto.description,
            steps: dto.steps.map((step, index) => ({
                title: step.title,
                description: step.description,
                channel: step.channel || "TASK",
                order: index + 1,
                delayDays: Math.max(0, step.delayDays || 0),
            })),
        });
    }

    async enrollments(cadenceId: string, tenantId: string) {
        const enrollments = await this.repository.findEnrollments(cadenceId, tenantId);
        if (!enrollments) throw new NotFoundError("Cadence not found");

        return enrollments.map(({ tasks, ...enrollment }) => {
            const nextTask = tasks.find((task) => !task.completed);
            return {
                ...enrollment,
                completedSteps: tasks.filter((task) => task.completed).length,
                totalSteps: tasks.length,
                nextStep: nextTask ? { title: nextTask.title, dueDate: nextTask.dueDate } : null,
            };
        });
    }

    async enroll(cadenceId: string, userId: string, tenantId: string, clientId: string) {
        if (!clientId) throw new BadRequestError("Client is required");
        try {
            const enrollment = await this.repository.enroll(cadenceId, clientId, userId, tenantId);
            if (enrollment === null) throw new NotFoundError("Cadence not found");
            if (enrollment === undefined) throw new NotFoundError("Client not found");
            return enrollment;
        } catch (error) {
            if ((error as { code?: string }).code === "P2002") {
                throw new ConflictError("Client is already enrolled in this cadence");
            }
            throw error;
        }
    }
}