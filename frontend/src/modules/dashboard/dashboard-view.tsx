"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, DollarSign, ListTodo, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardInsightsPanel } from "./dashboard-insights-panel";

// Dashboard view aggregates KPIs and recent activity cards.
export function DashboardView() {
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard"],
        queryFn: async () => {
            const response = await api.get("/reports/dashboard");
            return response.data.data;
        },
    });

    const kpis = [
        {
            label: "Clientes Totais",
            value: data?.kpis.totalClients ?? 0,
            icon: Users,
        },
        {
            label: "Negociações Ativas",
            value: data?.kpis.activeDeals ?? 0,
            icon: Activity,
        },
        {
            label: "Receita Total",
            value: `R$ ${(data?.kpis.totalRevenue ?? 0).toLocaleString("pt-BR")}`,
            icon: DollarSign,
        },
        {
            label: "Tarefas Pendentes",
            value: data?.kpis.pendingTasks ?? 0,
            icon: ListTodo,
        },
    ];

    return (
        <section>
            <PageHeader
                title="Dashboard"
                subtitle="Bem-vindo ao NexusCRM. Aqui está o resumo do seu negócio."
            />

            <div className="crm-grid mb-6">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <Card key={kpi.label}>
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500">{kpi.label}</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900">{isLoading ? "..." : kpi.value}</p>
                                </div>
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <DashboardInsightsPanel insights={data?.insights ?? []} />

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Desempenho de Receita</CardTitle>
                        <CardDescription>Crescimento mensal nos últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(data?.revenueByMonth ?? []).map((item: { month: string; revenue: number }) => (
                                <div key={item.month} className="flex items-center gap-4">
                                    <div className="w-24 text-sm text-slate-500">{item.month}</div>
                                    <div className="h-3 flex-1 rounded-full bg-slate-100">
                                        <div
                                            className="h-3 rounded-full bg-primary"
                                            style={{ width: `${Math.min(100, item.revenue / 200)}%` }}
                                        />
                                    </div>
                                    <div className="w-28 text-right text-sm font-semibold text-slate-700">
                                        R$ {item.revenue.toLocaleString("pt-BR")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Clientes Recentes</CardTitle>
                        <CardDescription>Últimos cadastros</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(data?.recentClients ?? []).map((client: any) => (
                            <div key={client.id} className="rounded-xl border border-slate-100 p-3">
                                <p className="font-semibold text-slate-800">{client.name}</p>
                                <p className="text-sm text-slate-500">{client.company || "Sem empresa"}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
