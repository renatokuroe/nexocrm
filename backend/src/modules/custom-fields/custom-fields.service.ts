// Custom Fields Service
import { CustomFieldsRepository } from "./custom-fields.repository";
import { NotFoundError } from "../../utils/errors";

type FieldType = "TEXT" | "NUMBER" | "DATE" | "SELECT" | "BOOLEAN";

export class CustomFieldsService {
    private repository = new CustomFieldsRepository();

    async list(tenantId: string) {
        return this.repository.findAll(tenantId);
    }

    async create(tenantId: string, data: { label: string; type: FieldType; visible?: boolean }) {
        return this.repository.create({ ...data, tenantId });
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

    async reorder(tenantId: string, orderedIds: string[]) {
        return this.repository.reorder(tenantId, orderedIds);
    }
}
