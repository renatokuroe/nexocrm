// Segments Service
import { NotFoundError } from "../../utils/errors";
import { SegmentsRepository } from "./segments.repository";

export class SegmentsService {
    private repository = new SegmentsRepository();

    async list() {
        return this.repository.findAll();
    }

    async getById(id: string) {
        const seg = await this.repository.findById(id);
        if (!seg) throw new NotFoundError("Segment not found");
        return seg;
    }

    async create(data: { name: string; color: string; description?: string }) {
        return this.repository.create(data);
    }

    async update(
        id: string,
        data: Partial<{ name: string; color: string; description: string }>
    ) {
        await this.getById(id);
        return this.repository.update(id, data);
    }

    async delete(id: string) {
        await this.getById(id);
        return this.repository.delete(id);
    }
}
