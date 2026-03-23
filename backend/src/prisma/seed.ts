// Database seed script
// Run with: npm run prisma:seed
// Creates initial stages, segments, and a demo user

import bcrypt from "bcryptjs";
import { prisma } from "./client";

async function main() {
    console.log("🌱 Starting seed...");

    // ── 1. Create demo user ──────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash("demo123", 10);

    const user = await prisma.user.upsert({
        where: { email: "demo@nexocrm.com" },
        update: {},
        create: {
            name: "Demo User",
            email: "demo@nexocrm.com",
            password: hashedPassword,
        },
    });

    console.log(`✅ User created: ${user.email}`);

    // ── 2. Create default pipeline stages ────────────────────────────────
    const stages = [
        { name: "Prospecção", order: 1, color: "#6366f1" },
        { name: "Qualificação", order: 2, color: "#8b5cf6" },
        { name: "Proposta", order: 3, color: "#f59e0b" },
        { name: "Negociação", order: 4, color: "#f97316" },
        { name: "Fechado (Ganho)", order: 5, color: "#10b981" },
        { name: "Fechado (Perdido)", order: 6, color: "#ef4444" },
    ];

    // Clear stages to keep deterministic seed order and avoid duplicates.
    await prisma.stage.deleteMany();
    await prisma.stage.createMany({ data: stages });

    const allStages = await prisma.stage.findMany({ orderBy: { order: "asc" } });
    console.log(`✅ ${allStages.length} pipeline stages created`);

    // ── 3. Create default segments ────────────────────────────────────────
    const segments = [
        { name: "VIP", color: "#ef4444", description: "Clientes de alto valor" },
        {
            name: "Novo",
            color: "#10b981",
            description: "Clientes prospectados recentemente",
        },
        {
            name: "Inativo",
            color: "#6b7280",
            description: "Sem contato há mais de 3 meses",
        },
        {
            name: "Potencial",
            color: "#f59e0b",
            description: "Grande chance de fechamento",
        },
    ];

    await prisma.segment.deleteMany();
    await prisma.segment.createMany({ data: segments });

    console.log(`✅ Segments created`);

    // ── 4. Create default custom fields ──────────────────────────────────
    const customFields = [
        { label: "Email", type: "TEXT" as const, visible: true, order: 1 },
        { label: "Telefone", type: "TEXT" as const, visible: true, order: 2 },
        { label: "Empresa", type: "TEXT" as const, visible: true, order: 3 },
    ];

    await prisma.customField.deleteMany();
    await prisma.customField.createMany({ data: customFields });

    console.log(`✅ Custom fields created`);

    // ── 5. Create sample clients ──────────────────────────────────────────
    const allSegments = await prisma.segment.findMany();
    const vip = allSegments.find((s: any) => s.name === "VIP");
    const novo = allSegments.find((s: any) => s.name === "Novo");
    const potencial = allSegments.find((s: any) => s.name === "Potencial");
    const inativo = allSegments.find((s: any) => s.name === "Inativo");

    const clientsData = [
        {
            name: "Ana Silva",
            email: "ana.silva@techsolutions.com",
            phone: "(11) 98765-4321",
            company: "Tech Solutions",
            status: "ACTIVE" as const,
            leadSource: "Indicação",
            segments: [vip!, novo!],
        },
        {
            name: "Bruno Oliveira",
            email: "bruno.o@designstudio.com",
            phone: "(21) 99887-7665",
            company: "Design Studio",
            status: "ACTIVE" as const,
            leadSource: "Instagram",
            segments: [novo!, potencial!],
        },
        {
            name: "Carla Santos",
            email: "contato@santosadvocacia.com.br",
            phone: "(31) 3344-5566",
            company: "Santos Advocacia",
            status: "ACTIVE" as const,
            leadSource: "Google Search",
            segments: [vip!],
        },
        {
            name: "Diego Costa",
            email: "diego.costa@industriametal.com",
            phone: "(41) 91234-5678",
            company: "Indústrias Metal",
            status: "ACTIVE" as const,
            leadSource: "LinkedIn",
            segments: [inativo!],
        },
        {
            name: "Elena Martins",
            email: "elena@academiafit.com.br",
            phone: "(51) 98555-1234",
            company: "Academia Fit",
            status: "LEAD" as const,
            leadSource: "Saúde/Fitness",
            segments: [potencial!],
        },
        {
            name: "Fábio Junior",
            email: "fabio@frotaveiculos.com",
            phone: "(11) 97654-3210",
            company: "Frota de Veículos",
            status: "ACTIVE" as const,
            leadSource: "Indicação",
            segments: [vip!],
        },
        {
            name: "Gisele Bündchen",
            email: "gisele@agenciacentral.com",
            phone: "(11) 99234-5678",
            company: "Agência Central",
            status: "ACTIVE" as const,
            leadSource: "Instagram",
            segments: [novo!],
        },
        {
            name: "Hugo Souza",
            email: "hugo@reformassousa.com.br",
            phone: "(31) 98765-4321",
            company: "Reformas Souza",
            status: "INACTIVE" as const,
            leadSource: "Indicação",
            segments: [inativo!],
        },
        {
            name: "Isabela Rocha",
            email: "isabela@modaemais.com.br",
            phone: "(21) 97654-8765",
            company: "Moda e Mais",
            status: "LEAD" as const,
            leadSource: "Facebook",
            segments: [potencial!],
        },
        {
            name: "João Pereira",
            email: "joao@restaurantepereira.com.br",
            phone: "(41) 3456-7890",
            company: "Restaurante Pereira",
            status: "ACTIVE" as const,
            leadSource: "Indicação",
            segments: [novo!],
        },
    ];

    const createdClients: { id: string; name: string }[] = [];

    for (const clientData of clientsData) {
        const { segments: clientSegments, ...data } = clientData;
        const client = await prisma.client.create({
            data: {
                ...data,
                userId: user.id,
                segments: {
                    create: clientSegments
                        .filter(Boolean)
                        .map((seg) => ({ segmentId: seg.id })),
                },
            },
        });
        createdClients.push({ id: client.id, name: client.name });
    }

    console.log(`✅ ${createdClients.length} clients created`);

    // ── 6. Create sample deals ────────────────────────────────────────────
    const stageMap = Object.fromEntries(allStages.map((s: any) => [s.name, s.id]));
    const clientMap = Object.fromEntries(
        createdClients.map((c) => [c.name, c.id])
    );

    const deals = [
        {
            title: "Frota de Veículos",
            value: 250000,
            stageId: stageMap["Prospecção"],
            clientId: clientMap["Fábio Junior"],
            closeDate: new Date("2026-02-26"),
        },
        {
            title: "Plano Corporativo",
            value: 8000,
            stageId: stageMap["Qualificação"],
            clientId: clientMap["Elena Martins"],
            closeDate: new Date("2026-02-26"),
        },
        {
            title: "Manutenção Industrial",
            value: 12000,
            stageId: stageMap["Proposta"],
            clientId: clientMap["Diego Costa"],
            closeDate: new Date("2026-02-26"),
        },
        {
            title: "Reforma Escritório",
            value: 45000,
            stageId: stageMap["Proposta"],
            clientId: clientMap["Hugo Souza"],
            closeDate: new Date("2026-02-26"),
        },
        {
            title: "Consultoria Jurídica Anual",
            value: 48000,
            stageId: stageMap["Negociação"],
            clientId: clientMap["Carla Santos"],
            closeDate: new Date("2026-02-26"),
        },
        {
            title: "Campanha Verão",
            value: 15000,
            stageId: stageMap["Negociação"],
            clientId: clientMap["Gisele Bündchen"],
            closeDate: new Date("2026-02-26"),
        },
        {
            title: "Identidade Visual",
            value: 3500,
            stageId: stageMap["Fechado (Ganho)"],
            clientId: clientMap["Bruno Oliveira"],
            closeDate: new Date("2026-01-26"),
        },
        {
            title: "Implementação CRM",
            value: 15000,
            stageId: stageMap["Fechado (Ganho)"],
            clientId: clientMap["Ana Silva"],
            closeDate: new Date("2025-12-26"),
        },
    ];

    for (const deal of deals) {
        await prisma.deal.create({ data: { ...deal, userId: user.id } });
    }

    console.log(`✅ ${deals.length} deals created`);

    // ── 7. Create sample tasks ────────────────────────────────────────────
    const tasks = [
        {
            title: "Ligar para Carla",
            description: "Discutir termos da consultoria jurídica",
            dueDate: new Date("2026-02-27"),
            priority: "HIGH" as const,
            clientId: clientMap["Carla Santos"],
        },
        {
            title: "Enviar proposta para Diego",
            description: "Proposta de manutenção industrial revisada",
            dueDate: new Date("2026-02-28"),
            priority: "MEDIUM" as const,
            clientId: clientMap["Diego Costa"],
        },
        {
            title: "Follow-up Elena",
            description: "Verificar interesse no plano corporativo",
            dueDate: new Date("2026-03-01"),
            priority: "LOW" as const,
            clientId: clientMap["Elena Martins"],
        },
        {
            title: "Reunião João",
            description: "Apresentação de novos pratos",
            dueDate: new Date("2026-03-02"),
            priority: "MEDIUM" as const,
            clientId: clientMap["João Pereira"],
        },
    ];

    for (const task of tasks) {
        await prisma.task.create({ data: { ...task, userId: user.id } });
    }

    console.log(`✅ ${tasks.length} tasks created`);
    console.log("\n🎉 Seed complete!");
    console.log("📧 Login: demo@nexocrm.com");
    console.log("🔑 Password: demo123");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
