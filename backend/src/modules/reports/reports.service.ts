// Reports Service - Analytics queries
// Aggregates data across modules for the reports dashboard

import { prisma } from "../../prisma/client";
import { DASHBOARD_INSIGHT_META, DASHBOARD_INSIGHT_RULES } from "./dashboard-insight-rules";
import { visibleTasksWhere } from "../tasks/tasks.repository";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(date: Date) {
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / MS_PER_DAY));
}

function daysUntil(date: Date) {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / MS_PER_DAY));
}

export class ReportsService {
    /**
     * Returns all KPI metrics needed for dashboard and reports page.
     */
    async getDashboardStats(userId: string, tenantId: string) {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        const staleClientsCutoff = new Date(now.getTime() - DASHBOARD_INSIGHT_RULES.staleClientsDays * MS_PER_DAY);
        const stalledDealsCutoff = new Date(now.getTime() - DASHBOARD_INSIGHT_RULES.stalledDealsDays * MS_PER_DAY);
        const urgentCloseCutoff = new Date(now.getTime() + DASHBOARD_INSIGHT_RULES.urgentCloseWindowDays * MS_PER_DAY);
        const leadWithoutActionCutoff = new Date(now.getTime() - DASHBOARD_INSIGHT_RULES.leadWithoutActionDays * MS_PER_DAY);
        const activeDealsWhere = {
            user: { tenantId },
            stage: { name: { notIn: [...DASHBOARD_INSIGHT_RULES.closedStageNames] } },
        };

        const [
            totalClients,
            activeDeals,
            totalRevenue,
            pendingTasks,
            recentClients,
            stageDistribution,
            revenueByMonth,
            staleClients,
            stalledDeals,
            urgentClosings,
            lowValueDeals,
            leadFollowUps,
            dailyActions,
        ] = await Promise.all([
            // Total clients count
            prisma.client.count({ where: { user: { tenantId } } }),

            // Active deals (not closed)
            prisma.deal.count({
                where: {
                    ...activeDealsWhere,
                },
            }),

            prisma.deal.aggregate({
                where: {
                    user: { tenantId },
                    stage: { name: "Fechado (Ganho)" },
                },
                _sum: { value: true },
            }),

            // Pending tasks
            prisma.task.count({ where: { ...visibleTasksWhere(tenantId, userId), completed: false } }),

            // Recent 5 clients
            prisma.client.findMany({
                where: { user: { tenantId } },
                orderBy: { createdAt: "desc" },
                take: 5,
                include: {
                    segments: { include: { segment: true } },
                },
            }),

            // Deal count per stage
            prisma.stage.findMany({
                where: { tenantId },
                include: {
                    _count: { select: { deals: true } },
                    deals: { where: { user: { tenantId } }, select: { value: true } },
                },
            }),

            // Revenue per month (last 6 months) - won deals
            prisma.$queryRaw<{ month: string; revenue: number }[]>`
        SELECT
          DATE_FORMAT(d.closeDate, '%Y-%m') AS month,
          SUM(d.value) AS revenue
        FROM deals d
        INNER JOIN stages s ON d.stageId = s.id
        INNER JOIN users u ON d.userId = u.id
        WHERE u.tenantId = ${tenantId}
          AND s.name = 'Fechado (Ganho)'
          AND d.closeDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(d.closeDate, '%Y-%m')
        ORDER BY month ASC
      `,

            prisma.client.findMany({
                where: {
                    user: { tenantId },
                    status: { in: ["ACTIVE", "LEAD"] },
                    updatedAt: { lte: staleClientsCutoff },
                },
                orderBy: { updatedAt: "asc" },
                take: DASHBOARD_INSIGHT_RULES.maxItemsPerInsight,
                include: {
                    segments: { include: { segment: true } },
                },
            }),

            prisma.deal.findMany({
                where: {
                    ...activeDealsWhere,
                    updatedAt: { lte: stalledDealsCutoff },
                },
                orderBy: { updatedAt: "asc" },
                take: DASHBOARD_INSIGHT_RULES.maxItemsPerInsight,
                include: {
                    client: { select: { id: true, name: true, company: true } },
                    stage: { select: { name: true, color: true } },
                },
            }),

            prisma.deal.findMany({
                where: {
                    ...activeDealsWhere,
                    closeDate: {
                        gte: now,
                        lte: urgentCloseCutoff,
                    },
                },
                orderBy: { closeDate: "asc" },
                take: DASHBOARD_INSIGHT_RULES.maxItemsPerInsight,
                include: {
                    client: { select: { id: true, name: true, company: true } },
                    stage: { select: { name: true, color: true } },
                },
            }),

            prisma.deal.findMany({
                where: {
                    ...activeDealsWhere,
                    value: {
                        gt: 0,
                        lte: DASHBOARD_INSIGHT_RULES.lowValueDealThreshold,
                    },
                },
                orderBy: [{ value: "asc" }, { updatedAt: "asc" }],
                take: DASHBOARD_INSIGHT_RULES.maxItemsPerInsight,
                include: {
                    client: { select: { id: true, name: true, company: true } },
                    stage: { select: { name: true, color: true } },
                },
            }),

            prisma.client.findMany({
                where: {
                    user: { tenantId },
                    status: "LEAD",
                    OR: [
                        { updatedAt: { lte: leadWithoutActionCutoff } },
                        { tasks: { none: { completed: false } } },
                    ],
                },
                orderBy: { updatedAt: "asc" },
                take: DASHBOARD_INSIGHT_RULES.maxItemsPerInsight,
                include: {
                    tasks: {
                        where: { completed: false },
                        orderBy: { dueDate: "asc" },
                        take: 1,
                    },
                    segments: { include: { segment: true } },
                },
            }),

            // Cadence steps due today (or overdue) for the current user
            prisma.task.findMany({
                where: {
                    userId,
                    completed: false,
                    dueDate: { lte: endOfToday },
                    cadenceEnrollment: { status: "ACTIVE" },
                },
                orderBy: { dueDate: "asc" },
                include: {
                    client: { select: { id: true, name: true, company: true, phone: true } },
                    cadenceEnrollment: { select: { cadence: { select: { name: true } } } },
                },
            }),
        ]);

        // Calculate conversion rate (won / total)
        const totalDeals = await prisma.deal.count({ where: { user: { tenantId } } });
        const wonDeals = await prisma.deal.count({
            where: { user: { tenantId }, stage: { name: "Fechado (Ganho)" } },
        });

        // Average ticket (total revenue / won deals)
        const revenue = totalRevenue._sum.value ?? 0;
        const avgTicket = wonDeals > 0 ? revenue / wonDeals : 0;

        // Format stage distribution for funnel chart
        const funnelData = stageDistribution.map((stage: any) => ({
            name: stage.name,
            count: stage._count.deals,
            value: stage.deals.reduce((sum: number, d: any) => sum + d.value, 0),
            color: stage.color,
        }));

        const insights = [
            {
                key: "staleClients",
                ...DASHBOARD_INSIGHT_META.staleClients,
                count: staleClients.length,
                items: staleClients.map((client) => ({
                    id: client.id,
                    title: client.name,
                    subtitle: client.company || client.segments[0]?.segment.name || "Sem empresa definida",
                    meta: `${daysSince(client.updatedAt)} dias sem progresso`,
                })),
            },
            {
                key: "stalledDeals",
                ...DASHBOARD_INSIGHT_META.stalledDeals,
                count: stalledDeals.length,
                items: stalledDeals.map((deal) => ({
                    id: deal.id,
                    title: deal.title,
                    subtitle: deal.client?.name || "Sem cliente",
                    meta: `${daysSince(deal.updatedAt)} dias sem atualização`,
                })),
            },
            {
                key: "urgentClosings",
                ...DASHBOARD_INSIGHT_META.urgentClosings,
                count: urgentClosings.length,
                items: urgentClosings.map((deal) => ({
                    id: deal.id,
                    title: deal.title,
                    subtitle: deal.client?.name || "Sem cliente",
                    meta: `fecha em ${daysUntil(deal.closeDate!)} dia(s)`,
                })),
            },
            {
                key: "lowValueDeals",
                ...DASHBOARD_INSIGHT_META.lowValueDeals,
                count: lowValueDeals.length,
                items: lowValueDeals.map((deal) => ({
                    id: deal.id,
                    title: deal.title,
                    subtitle: deal.client?.name || "Sem cliente",
                    meta: `R$ ${deal.value.toLocaleString("pt-BR")}`,
                })),
            },
            {
                key: "leadFollowUps",
                ...DASHBOARD_INSIGHT_META.leadFollowUps,
                count: leadFollowUps.length,
                items: leadFollowUps.map((client) => ({
                    id: client.id,
                    title: client.name,
                    subtitle: client.leadSource || client.company || "Lead sem origem definida",
                    meta: client.tasks[0]?.title
                        ? `próxima tarefa: ${client.tasks[0].title}`
                        : "sem próxima ação cadastrada",
                })),
            },
        ];

        return {
            kpis: {
                totalClients,
                activeDeals,
                totalRevenue: revenue,
                pendingTasks,
                conversionRate: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0,
                avgTicket,
                // LTV estimate: avg ticket * estimated avg purchases per year
                ltv: avgTicket * 3,
            },
            recentClients,
            funnelData,
            revenueByMonth,
            insights,
            dailyActions: dailyActions.map((task) => ({
                id: task.id,
                title: task.title,
                channel: task.channel,
                dueDate: task.dueDate,
                overdueDays: Math.max(0, Math.ceil((startOfToday.getTime() - task.dueDate!.getTime()) / MS_PER_DAY)),
                cadenceName: task.cadenceEnrollment?.cadence.name ?? null,
                client: task.client,
            })),
        };
    }
}
