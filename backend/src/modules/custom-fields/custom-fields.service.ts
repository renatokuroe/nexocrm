// Custom Fields Service
import { FieldType } from "@prisma/client";
import { CustomFieldsRepository } from "./custom-fields.repository";
import { NotFoundError } from "../../utils/errors";

export class CustomFieldsService {
    private repository = new CustomFieldsRepository();

    async list() {
        return this.repository.findAll();
    }

    async create(data: { label: string; type: FieldType; visible?: boolean }) {
        return this.repository.create(data);
    }

    async update(
        id: string,
        data: Partial<{ label: string; type: FieldType; visible: boolean }>
    ) {
        return this.repository.update(id, data);
    }

    async delete(id: string) {
        return this.repository.delete(id);
    }

    async reorder(orderedIds: string[]) {
        return this.repository.reorder(orderedIds);
    }
}
