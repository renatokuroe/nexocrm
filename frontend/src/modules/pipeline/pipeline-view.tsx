"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, User } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BoardStage {
    id: string;
    name: string;
    color: string;
    deals: {
        id: string;
        title: string;
        value: number;
        closeDate?: string;
        client?: { name: string };
    }[];
}

// Pipeline view renders the kanban board and handles drag-and-drop stage transitions.
export function PipelineView() {
    const queryClient = useQueryClient();
    const draggingDealIdRef = useRef("");

    const boardQuery = useQuery({
        queryKey: ["pipeline-board"],
        queryFn: async () => {
            const response = await api.get("/pipeline/board");
            return response.data.data as BoardStage[];
        },
    });

    const moveDeal = useMutation({
        mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
            await api.patch(`/pipeline/deals/${dealId}/move`, { stageId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
        },
    });

    const onMoveDeal = (dealId: string, stageId: string) => {
        if (!stageId || !dealId) return;

        // Ignore no-op drag events where item is dropped in same stage.
        const current = (boardQuery.data ?? []).find((stage) =>
            stage.deals.some((deal) => deal.id === dealId)
        );
        if (current?.id === stageId) return;

        moveDeal.mutate({ dealId, stageId });
    };

    return (
        <section>
            <PageHeader
                title="Pipeline de Vendas"
                subtitle="Acompanhe o progresso das suas negociações em tempo real."
                actions={
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Negociação
                    </Button>
                }
            />

            <div className="grid gap-4 overflow-x-auto pb-4" style={{ gridTemplateColumns: "repeat(6, minmax(280px, 1fr))" }}>
                {(boardQuery.data ?? []).map((stage) => {
                    const stageTotal = stage.deals.reduce((sum, deal) => sum + deal.value, 0);
                    return (
                        <div
                            key={stage.id}
                            onDragOver={(e) => {
                                e.preventDefault();
                            }}
                            onDrop={() => {
                                onMoveDeal(draggingDealIdRef.current, stage.id);
                                draggingDealIdRef.current = "";
                            }}
                            className="min-h-[560px] rounded-2xl border border-slate-200 bg-white/70 p-3"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <p className="font-extrabold text-slate-800">{stage.name}</p>
                                <span className="text-sm font-bold" style={{ color: stage.color }}>
                                    R$ {stageTotal.toLocaleString("pt-BR")}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {stage.deals.map((deal) => (
                                    <Card
                                        key={deal.id}
                                        className="cursor-grab"
                                        draggable
                                        onDragStart={() => {
                                            draggingDealIdRef.current = deal.id;
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            <p className="text-lg font-extrabold text-slate-800">{deal.title}</p>
                                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                                <User className="h-4 w-4" />
                                                {deal.client?.name || "Sem cliente"}
                                            </div>
                                            <p className="mt-2 text-lg font-black text-emerald-600">
                                                $ {deal.value.toLocaleString("pt-BR")}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                                                <Calendar className="h-4 w-4" />
                                                {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString("pt-BR") : "Sem previsão"}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
