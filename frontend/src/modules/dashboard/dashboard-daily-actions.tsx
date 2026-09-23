import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, Linkedin, Mail, MessageCircle, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Channel = "TASK" | "CALL" | "EMAIL" | "WHATSAPP" | "LINKEDIN";

export type DailyAction = {
    id: string;
    title: string;
    channel: Channel;
    dueDate: string;
    overdueDays: number;
    cadenceName: string | null;
    client: { id: string; name: string; company?: string | null; phone?: string | null } | null;
};

const channelMeta: Record<Channel, { label: string; icon: typeof Phone }> = {
    TASK: { label: "Tarefa", icon: ClipboardList },
    CALL: { label: "Ligação", icon: Phone },
    EMAIL: { label: "E-mail", icon: Mail },
    WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
    LINKEDIN: { label: "LinkedIn", icon: Linkedin },
};

export function DashboardDailyActions({ actions }: { actions: DailyAction[] }) {
    const queryClient = useQueryClient();
    const overdueCount = actions.filter((action) => action.overdueDays > 0).length;

    const completeAction = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/tasks/${id}/toggle`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });

    return (
        <Card className="mb-6 overflow-hidden border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,0,0,0.10),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#fff8f8_100%)]">
            <CardHeader className="border-b border-slate-200/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black text-slate-900">Ações do dia</CardTitle>
                        <CardDescription className="mt-1 max-w-2xl text-sm text-slate-600">
                            Etapas das suas cadências programadas para hoje, incluindo as que ficaram pendentes de dias anteriores.
                        </CardDescription>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-right shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Para hoje</p>
                        <p className="mt-1 text-3xl font-black text-slate-900">{actions.length}</p>
                        {overdueCount > 0 && (
                            <p className="text-xs font-semibold text-rose-600">{overdueCount} atrasada(s)</p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {actions.length > 0 ? (
                    <div className="grid gap-3 xl:grid-cols-2">
                        {actions.map((action) => {
                            const { label, icon: Icon } = channelMeta[action.channel] ?? channelMeta.TASK;
                            const overdue = action.overdueDays > 0;

                            return (
                                <div
                                    key={action.id}
                                    className={`rounded-2xl border bg-white/90 p-4 shadow-sm ${overdue ? "border-rose-200" : "border-slate-200"}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900">{action.title}</p>
                                                <p className="mt-0.5 text-sm text-slate-600">
                                                    {action.client?.name || "Sem cliente"}
                                                    {action.client?.company ? ` · ${action.client.company}` : ""}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                                        {label}
                                                    </span>
                                                    {action.cadenceName && (
                                                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm">
                                                            {action.cadenceName}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${overdue ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                                                    >
                                                        {overdue ? `atrasada ${action.overdueDays} dia(s)` : "hoje"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0"
                                            disabled={completeAction.isPending}
                                            onClick={() => completeAction.mutate(action.id)}
                                        >
                                            <Check className="mr-1 h-4 w-4" />
                                            Concluir
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                        Nenhuma ação de cadência para hoje.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
