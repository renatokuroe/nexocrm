// Segments Service
import { NotFoundError } from "../../utils/errors";
import { SegmentsRepository } from "./segments.repository";

export class SegmentsService {
    private repository = new SegmentsRepository();

    async list(tenantId: string) {
        return this.repository.findAll(tenantId);
    }

    async getById(id: string, tenantId: string) {
        const seg = await this.repository.findById(id, tenantId);
        if (!seg) throw new NotFoundError("Segment not found");
        return seg;
    }

    async create(tenantId: string, data: { name: string; color: string; description?: string }) {
        return this.repository.create(tenantId, data);
    }

    async update(
        id: string,
        tenantId: string,
        data: Partial<{ name: string; color: string; description: string }>
    ) {
        await this.getById(id, tenantId);
        return this.repository.update(id, data);
    }

    async delete(id: string, tenantId: string) {
        await this.getById(id, tenantId);
        return this.repository.delete(id);
    }
}
