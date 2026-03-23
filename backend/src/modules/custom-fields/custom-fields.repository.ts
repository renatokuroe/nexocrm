// Custom Fields Repository
import { FieldType } from "@prisma/client";
import { prisma } from "../../prisma/client";

export class CustomFieldsRepository {
    async findAll() {
        return prisma.customField.findMany({ orderBy: { order: "asc" } });
    }

    async create(data: {
        label: string;
        type: FieldType;
        visible?: boolean;
        order?: number;
    }) {
        return prisma.customField.create({ data });
    }

    async update(
        id: string,
        data: Partial<{ label: string; type: FieldType; visible: boolean; order: number }>
    ) {
        return prisma.customField.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.customField.delete({ where: { id } });
    }

    async reorder(orderedIds: string[]) {
        // Update order index for each field
        const updates = orderedIds.map((id, idx) =>
            prisma.customField.update({ where: { id }, data: { order: idx + 1 } })
        );
        return prisma.$transaction(updates);
    }
}
