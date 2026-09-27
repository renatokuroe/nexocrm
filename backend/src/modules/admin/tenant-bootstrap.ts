import { PrismaClient } from "@prisma/client";

const defaultStages = [
    { name: "Prospecção", order: 1, color: "#ff0000" },
    { name: "Tentativa de conexão", order: 2, color: "#f97316" },
    { name: "Conexão estabelecida", order: 3, color: "#f59e0b" },
    { name: "Reunião agendada", order: 4, color: "#3b82f6" },
    { name: "No Show", order: 5, color: "#ef4444" },
    { name: "Reunião realizada", order: 6, color: "#10b981" },
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
