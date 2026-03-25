// Database seed script
// Run with: npm run prisma:seed

import bcrypt from "bcryptjs";
import { prisma } from "./client";
import { seedTenantDefaults } from "../modules/admin/tenant-bootstrap";

async function main() {
    console.log("🌱 Starting seed...");

    const adminPassword = await bcrypt.hash("admin123", 10);
    const demoPassword = await bcrypt.hash("demo123", 10);

    const admin = await prisma.user.findUnique({ where: { email: "admin@nexocrm.com" } });
    if (!admin) {
        const adminTenant = await prisma.tenant.create({ data: { name: "NexoCRM Admin" } });
        await prisma.user.create({
            data: {
                name: "Platform Admin",
                email: "admin@nexocrm.com",
                password: adminPassword,
                role: "ADMIN",
                tenantId: adminTenant.id,
            },
        });
        await seedTenantDefaults(prisma, adminTenant.id);
    }

    const demo = await prisma.user.findUnique({ where: { email: "demo@nexocrm.com" } });
    let demoUserId = "";
    let demoTenantId = "";

    if (!demo) {
        const demoTenant = await prisma.tenant.create({ data: { name: "Demo Company" } });
        const user = await prisma.user.create({
            data: {
                name: "Demo User",
                email: "demo@nexocrm.com",
                password: demoPassword,
                role: "USER",
                tenantId: demoTenant.id,
            },
        });
        demoUserId = user.id;
        demoTenantId = demoTenant.id;
        await seedTenantDefaults(prisma, demoTenant.id);
    } else {
        demoUserId = demo.id;
        demoTenantId = demo.tenantId;
    }

    const allStages = await prisma.stage.findMany({
        where: { tenantId: demoTenantId },
        orderBy: { order: "asc" },
    });
    const allSegments = await prisma.segment.findMany({
        where: { tenantId: demoTenantId },
        orderBy: { name: "asc" },
    });

    const vip = allSegments.find((s) => s.name === "VIP");
    const novo = allSegments.find((s) => s.name === "Novo");
    const potencial = allSegments.find((s) => s.name === "Potencial");
    const inativo = allSegments.find((s) => s.name === "Inativo");

    const existingClients = await prisma.client.count({ where: { userId: demoUserId } });
    if (existingClients === 0) {
        const clientsData = [
            {
                name: "Ana Silva",
                email: "ana.silva@techsolutions.com",
                phone: "(11) 98765-4321",
                company: "Tech Solutions",
                status: "ACTIVE" as const,
                leadSource: "Indicação",
                segments: [vip, novo],
            },
            {
                name: "Bruno Oliveira",
                email: "bruno.o@designstudio.com",
                phone: "(21) 99887-7665",
                company: "Design Studio",
                status: "ACTIVE" as const,
                leadSource: "Instagram",
                segments: [novo, potencial],
            },
        ];

        const createdClients: { id: string; name: string }[] = [];

        for (const clientData of clientsData) {
            const { segments, ...data } = clientData;
            const client = await prisma.client.create({
                data: {
                    ...data,
                    userId: demoUserId,
                    segments: {
                        create: (segments || []).filter(Boolean).map((seg) => ({ segmentId: seg!.id })),
                    },
                },
            });
            createdClients.push({ id: client.id, name: client.name });
        }

        const stageMap = Object.fromEntries(allStages.map((s) => [s.name, s.id]));
        const clientMap = Object.fromEntries(createdClients.map((c) => [c.name, c.id]));

        await prisma.deal.createMany({
            data: [
                {
                    title: "Implementação CRM",
                    value: 15000,
                    stageId: stageMap["Fechado (Ganho)"],
                    clientId: clientMap["Ana Silva"],
                    userId: demoUserId,
                    closeDate: new Date("2026-01-26"),
                },
                {
                    title: "Identidade Visual",
                    value: 3500,
                    stageId: stageMap["Negociação"],
                    clientId: clientMap["Bruno Oliveira"],
                    userId: demoUserId,
                    closeDate: new Date("2026-02-26"),
                },
            ],
        });

        await prisma.task.createMany({
            data: [
                {
                    title: "Follow-up com Ana",
                    description: "Validar próximos passos da implementação",
                    dueDate: new Date("2026-03-02"),
                    priority: "HIGH",
                    userId: demoUserId,
                    clientId: clientMap["Ana Silva"],
                },
                {
                    title: "Enviar proposta para Bruno",
                    description: "Anexar escopo revisado",
                    dueDate: new Date("2026-03-05"),
                    priority: "MEDIUM",
                    userId: demoUserId,
                    clientId: clientMap["Bruno Oliveira"],
                },
            ],
        });
    }

    console.log("🎉 Seed complete!");
    console.log("📧 Admin: admin@nexocrm.com / admin123");
    console.log("📧 Demo: demo@nexocrm.com / demo123");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
