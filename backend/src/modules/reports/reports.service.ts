// Reports Service - Analytics queries
// Aggregates data across modules for the reports dashboard

import { prisma } from "../../prisma/client";

export class ReportsService {
    /**
     * Returns all KPI metrics needed for dashboard and reports page.
     */
    async getDashboardStats(userId: string) {
        const [
            totalClients,
            activeDeals,
            totalRevenue,
            pendingTasks,
            recentClients,
            stageDistribution,
            revenueByMonth,
        ] = await Promise.all([
            // Total clients count
            prisma.client.count({ where: { userId } }),

            // Active deals (not closed)
            prisma.deal.count({
                where: {
                    userId,
                    stage: { name: { notIn: ["Fechado (Ganho)", "Fechado (Perdido)"] } },
                },
            }),

            // Revenue from won deals
            prisma.deal.aggregate({
                where: {
                    userId,
                    stage: { name: "Fechado (Ganho)" },
                },
                _sum: { value: true },
            }),

            // Pending tasks
            prisma.task.count({ where: { userId, completed: false } }),

            // Recent 5 clients
            prisma.client.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 5,
                include: {
                    segments: { include: { segment: true } },
                },
            }),

            // Deal count per stage
            prisma.stage.findMany({
                orderBy: { order: "asc" },
                include: {
                    _count: { select: { deals: true } },
                    deals: { where: { userId }, select: { value: true } },
                },
            }),

            // Revenue per month (last 6 months) - won deals
            prisma.$queryRaw<{ month: string; revenue: number }[]>`
        SELECT
          DATE_FORMAT(d.closeDate, '%Y-%m') AS month,
          SUM(d.value) AS revenue
        FROM deals d
        INNER JOIN stages s ON d.stageId = s.id
        WHERE d.userId = ${userId}
          AND s.name = 'Fechado (Ganho)'
          AND d.closeDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(d.closeDate, '%Y-%m')
        ORDER BY month ASC
      `,
        ]);

        // Calculate conversion rate (won / total)
        const totalDeals = await prisma.deal.count({ where: { userId } });
        const wonDeals = await prisma.deal.count({
            where: { userId, stage: { name: "Fechado (Ganho)" } },
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
        };
    }
}
