"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, DollarSign, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

// Reports view displays analytics metrics and funnel distribution.
export function ReportsView() {
    const { data } = useQuery({
        queryKey: ["reports-dashboard"],
        queryFn: async () => {
            const response = await api.get("/reports/dashboard");
            return response.data.data;
        },
    });

    const cards = [
        {
            label: "CAC Médio",
            value: `R$ ${(data?.kpis?.totalClients ? (data.kpis.totalRevenue / data.kpis.totalClients).toFixed(0) : 0).toLocaleString("pt-BR")}`,
            icon: Users,
        },
        {
            label: "LTV Estimado",
            value: `R$ ${(data?.kpis?.ltv ?? 0).toLocaleString("pt-BR")}`,
            icon: TrendingUp,
        },
        {
            label: "Ciclo de Venda",
            value: "14 dias",
            icon: Activity,
        },
        {
            label: "Ticket Médio",
            value: `R$ ${(data?.kpis?.avgTicket ?? 0).toLocaleString("pt-BR")}`,
            icon: DollarSign,
        },
    ];

    return (
        <section>
            <PageHeader
                title="Relatórios e Análises"
                subtitle="Visualize o desempenho do seu negócio em tempo real."
            />

            <div className="mb-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Conversão de Vendas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(data?.revenueByMonth ?? []).map((item: { month: string; revenue: number }) => (
                                <div key={item.month}>
                                    <div className="mb-1 flex justify-between text-sm text-slate-500">
                                        <span>{item.month}</span>
                                        <span>R$ {item.revenue.toLocaleString("pt-BR")}</span>
                                    </div>
                                    <div className="h-4 rounded-full bg-slate-100">
                                        <div className="h-4 rounded-full bg-primary" style={{ width: `${Math.min(100, item.revenue / 200)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição do Funil</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {(data?.funnelData ?? []).map((item: any) => (
                            <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <span className="font-semibold" style={{ color: item.color }}>
                                    {item.name}
                                </span>
                                <span className="font-bold text-slate-700">{item.count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="crm-grid">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.label}>
                            <CardContent className="flex items-center justify-between p-5">
                                <div>
                                    <p className="text-sm text-slate-500">{card.label}</p>
                                    <p className="mt-1 text-4xl font-black text-slate-900">{card.value}</p>
                                </div>
                                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}
