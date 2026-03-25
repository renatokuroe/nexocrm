import { PrismaClient } from "@prisma/client";

const defaultStages = [
    { name: "Prospecção", order: 1, color: "#6366f1" },
    { name: "Qualificação", order: 2, color: "#8b5cf6" },
    { name: "Proposta", order: 3, color: "#f59e0b" },
    { name: "Negociação", order: 4, color: "#f97316" },
    { name: "Fechado (Ganho)", order: 5, color: "#10b981" },
    { name: "Fechado (Perdido)", order: 6, color: "#ef4444" },
];

const defaultSegments = [
    { name: "VIP", color: "#ef4444", description: "Clientes de alto valor" },
    { name: "Novo", color: "#10b981", description: "Clientes prospectados recentemente" },
    { name: "Inativo", color: "#6b7280", description: "Sem contato há mais de 3 meses" },
    { name: "Potencial", color: "#f59e0b", description: "Grande chance de fechamento" },
];

const defaultFields = [
    { label: "Email", type: "TEXT" as const, visible: true, order: 1 },
    { label: "Telefone", type: "TEXT" as const, visible: true, order: 2 },
    { label: "Empresa", type: "TEXT" as const, visible: true, order: 3 },
];

export async function seedTenantDefaults(prisma: PrismaClient, tenantId: string) {
    await prisma.stage.createMany({
        data: defaultStages.map((stage) => ({ ...stage, tenantId })),
    });

    await prisma.segment.createMany({
        data: defaultSegments.map((segment) => ({ ...segment, tenantId })),
    });

    await prisma.customField.createMany({
        data: defaultFields.map((field) => ({ ...field, tenantId })),
    });
}
