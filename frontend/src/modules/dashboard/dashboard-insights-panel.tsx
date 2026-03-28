import { AlertTriangle, Clock3, HandCoins, Siren, UserRoundSearch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InsightSeverity = "critical" | "warning" | "opportunity";

type DashboardInsight = {
    key: string;
    title: string;
    description: string;
    emptyMessage: string;
    severity: InsightSeverity;
    count: number;
    items: Array<{
        id: string;
        title: string;
        subtitle: string;
        meta: string;
    }>;
};

const severityStyles: Record<InsightSeverity, { chip: string; border: string }> = {
    critical: {
        chip: "bg-rose-100 text-rose-700",
        border: "border-rose-200",
    },
    warning: {
        chip: "bg-amber-100 text-amber-700",
        border: "border-amber-200",
    },
    opportunity: {
        chip: "bg-emerald-100 text-emerald-700",
        border: "border-emerald-200",
    },
};

const insightIcons = {
    staleClients: UserRoundSearch,
    stalledDeals: Siren,
    urgentClosings: Clock3,
    lowValueDeals: HandCoins,
    leadFollowUps: AlertTriangle,
} as const;

export function DashboardInsightsPanel({ insights }: { insights: DashboardInsight[] }) {
    const totalAlerts = insights.reduce((sum, insight) => sum + insight.count, 0);

    return (
        <Card className="mb-6 overflow-hidden border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)]">
            <CardHeader className="border-b border-slate-200/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black text-slate-900">Insights Prioritários</CardTitle>
                        <CardDescription className="mt-1 max-w-2xl text-sm text-slate-600">
                            Sinais acionáveis inspirados em práticas comuns de CRM: estagnação, urgência, valor em risco e leads sem próxima ação.
                        </CardDescription>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-right shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total monitorado</p>
                        <p className="mt-1 text-3xl font-black text-slate-900">{totalAlerts}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid gap-4 xl:grid-cols-2">
                    {insights.map((insight) => {
                        const Icon = insightIcons[insight.key as keyof typeof insightIcons] ?? AlertTriangle;
                        const styles = severityStyles[insight.severity];

                        return (
                            <div
                                key={insight.key}
                                className={`rounded-2xl border bg-white/90 p-5 shadow-sm ${styles.border}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-slate-900">{insight.title}</p>
                                            <p className="mt-1 text-sm text-slate-600">{insight.description}</p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles.chip}`}>
                                        {insight.count}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {insight.items.length > 0 ? (
                                        insight.items.map((item) => (
                                            <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{item.title}</p>
                                                        <p className="text-sm text-slate-500">{item.subtitle}</p>
                                                    </div>
                                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm">
                                                        {item.meta}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                                            {insight.emptyMessage}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
