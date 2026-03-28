"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, MessageCircle, Pencil, Plus, Search, Trash2, User } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Client } from "@/types/domain";

interface DealLabelLink {
    labelId: string;
    label: {
        id: string;
        name: string;
        color: string;
    };
}

interface BoardDeal {
    id: string;
    title: string;
    value: number;
    closeDate?: string;
    description?: string | null;
    stageId: string;
    clientId?: string | null;
    client?: { id: string; name: string; company?: string; phone?: string } | null;
    labels: DealLabelLink[];
}

interface BoardStage {
    id: string;
    name: string;
    color: string;
    deals: BoardDeal[];
}

interface LabelCatalogItem {
    id: string;
    name: string;
    color: string;
}

interface DealLabelDraft { labelId: string; }

const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    }).format(value);

const parseBRLInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    return digits ? Number(digits) / 100 : 0;
};

const normalizeBrazilPhone = (raw: string) => raw.replace(/\D/g, "").slice(0, 11);

const buildWhatsAppLink = (phone?: string | null) => {
    const normalized = normalizeBrazilPhone(phone || "");
    if (normalized.length < 10) return null;
    return `https://wa.me/55${normalized}`;
};

// Pipeline view renders the kanban board and handles drag-and-drop stage transitions.
export function PipelineView() {
    const queryClient = useQueryClient();
    const draggingDealIdRef = useRef("");
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [openDetailModal, setOpenDetailModal] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<BoardDeal | null>(null);
    const [labelSearch, setLabelSearch] = useState("");
    const [labelEditor, setLabelEditor] = useState({
        id: "",
        name: "",
        color: "#facc15",
    });
    const [createForm, setCreateForm] = useState({
        title: "",
        value: "",
        clientId: "",
        stageId: "",
        closeDate: "",
        description: "",
    });
    const [detailForm, setDetailForm] = useState({
        title: "",
        clientId: "",
        value: "",
        closeDate: "",
        description: "",
        labels: [] as DealLabelDraft[],
    });

    const boardQuery = useQuery({
        queryKey: ["pipeline-board"],
        queryFn: async () => {
            const response = await api.get("/pipeline/board");
            return response.data.data as BoardStage[];
        },
    });

    const clientsQuery = useQuery({
        queryKey: ["pipeline-clients"],
        queryFn: async () => {
            const response = await api.get("/clients", { params: { limit: 100 } });
            return response.data.data as Client[];
        },
    });

    const labelsQuery = useQuery({
        queryKey: ["pipeline-labels"],
        queryFn: async () => {
            const response = await api.get("/pipeline/labels");
            return response.data.data as LabelCatalogItem[];
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

    const createDeal = useMutation({
        mutationFn: async () => {
            await api.post("/pipeline/deals", {
                title: createForm.title,
                value: parseBRLInput(createForm.value),
                clientId: createForm.clientId || undefined,
                stageId: createForm.stageId,
                closeDate: createForm.closeDate || undefined,
                description: createForm.description || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
            setOpenCreateModal(false);
            setCreateForm({
                title: "",
                value: "",
                clientId: "",
                stageId: boardQuery.data?.[0]?.id ?? "",
                closeDate: "",
                description: "",
            });
        },
    });

    const saveDealDetails = useMutation({
        mutationFn: async () => {
            if (!selectedDeal) return;

            await api.put(`/pipeline/deals/${selectedDeal.id}`, {
                title: detailForm.title,
                clientId: detailForm.clientId || undefined,
                value: parseBRLInput(detailForm.value),
                closeDate: detailForm.closeDate || undefined,
                description: detailForm.description,
            });

            await api.put(`/pipeline/deals/${selectedDeal.id}/labels`, {
                labels: detailForm.labels.map((item) => ({
                    labelId: item.labelId,
                })),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
            setOpenDetailModal(false);
            setSelectedDeal(null);
            setLabelSearch("");
        },
    });

    const createLabel = useMutation({
        mutationFn: async () => {
            const response = await api.post("/pipeline/labels", {
                name: labelEditor.name,
                color: labelEditor.color,
            });
            return response.data.data as LabelCatalogItem;
        },
        onSuccess: (label) => {
            queryClient.invalidateQueries({ queryKey: ["pipeline-labels"] });
            setDetailForm((prev) => ({
                ...prev,
                labels: prev.labels.some((item) => item.labelId === label.id)
                    ? prev.labels
                    : [...prev.labels, { labelId: label.id }],
            }));
            setLabelEditor({ id: "", name: "", color: "#facc15" });
        },
    });

    const updateLabel = useMutation({
        mutationFn: async () => {
            await api.put(`/pipeline/labels/${labelEditor.id}`, {
                name: labelEditor.name,
                color: labelEditor.color,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pipeline-labels"] });
            queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
            setLabelEditor({ id: "", name: "", color: "#facc15" });
        },
    });

    const deleteLabel = useMutation({
        mutationFn: async (labelId: string) => {
            await api.delete(`/pipeline/labels/${labelId}`);
        },
        onSuccess: (_data, labelId) => {
            queryClient.invalidateQueries({ queryKey: ["pipeline-labels"] });
            queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
            setDetailForm((prev) => ({
                ...prev,
                labels: prev.labels.filter((item) => item.labelId !== labelId),
            }));
            if (labelEditor.id === labelId) {
                setLabelEditor({ id: "", name: "", color: "#facc15" });
            }
        },
    });

    const filteredLabels = useMemo(() => {
        const term = labelSearch.trim().toLowerCase();
        if (!term) return labelsQuery.data ?? [];
        return (labelsQuery.data ?? []).filter((label) =>
            label.name.toLowerCase().includes(term)
        );
    }, [labelSearch, labelsQuery.data]);

    const selectedLabelIds = useMemo(
        () => new Set(detailForm.labels.map((item) => item.labelId)),
        [detailForm.labels]
    );

    const onCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createDeal.mutate();
    };

    const onSaveDealDetails = (e: FormEvent) => {
        e.preventDefault();
        saveDealDetails.mutate();
    };

    const onSaveLabel = () => {
        if (!labelEditor.id) {
            createLabel.mutate();
            return;
        }
        updateLabel.mutate();
    };

    const openNewDealModal = () => {
        setCreateForm((prev) => ({
            ...prev,
            stageId: prev.stageId || boardQuery.data?.[0]?.id || "",
        }));
        setOpenCreateModal(true);
    };

    const openDealModal = (deal: BoardDeal) => {
        setSelectedDeal(deal);
        setDetailForm({
            title: deal.title,
            clientId: deal.clientId || "",
            value: formatBRL(deal.value ?? 0),
            closeDate: deal.closeDate ? new Date(deal.closeDate).toISOString().slice(0, 10) : "",
            description: deal.description || "",
            labels: deal.labels.map((item) => ({
                labelId: item.labelId,
            })),
        });
        setLabelEditor({ id: "", name: "", color: "#facc15" });
        setLabelSearch("");
        setOpenDetailModal(true);
    };

    const onMoveDeal = (dealId: string, stageId: string) => {
        if (!stageId || !dealId) return;

        const current = (boardQuery.data ?? []).find((stage) =>
            stage.deals.some((deal) => deal.id === dealId)
        );
        if (current?.id === stageId) return;

        moveDeal.mutate({ dealId, stageId });
    };

    const toggleLabel = (labelId: string) => {
        setDetailForm((prev) => {
            if (prev.labels.some((item) => item.labelId === labelId)) {
                return {
                    ...prev,
                    labels: prev.labels.filter((item) => item.labelId !== labelId),
                };
            }

            return {
                ...prev,
                labels: [...prev.labels, { labelId }],
            };
        });
    };

    const startEditingLabel = (label: LabelCatalogItem) => {
        setLabelEditor({
            id: label.id,
            name: label.name,
            color: label.color,
        });
    };

    const currentLabelMeta = (labelId: string) =>
        (labelsQuery.data ?? []).find((item) => item.id === labelId);

    return (
        <section>
            <PageHeader
                title="Pipeline de Vendas"
                subtitle="Acompanhe o progresso das suas negociações em tempo real."
                actions={
                    <Button onClick={openNewDealModal}>
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
                                        className="cursor-pointer"
                                        draggable
                                        onClick={() => openDealModal(deal)}
                                        onDragStart={() => {
                                            draggingDealIdRef.current = deal.id;
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            {deal.labels.length > 0 ? (
                                                <div className="mb-3 flex flex-wrap gap-2">
                                                    {deal.labels.map((item) => (
                                                        <span
                                                            key={item.labelId}
                                                            className="inline-flex min-h-6 min-w-14 items-center justify-center rounded-lg px-2 py-1 text-xs font-bold"
                                                            style={{
                                                                backgroundColor: item.label.color,
                                                                color: "#111827",
                                                            }}
                                                        >
                                                            {item.label.name || ""}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}

                                            <p className="text-lg font-extrabold text-slate-800">{deal.title}</p>
                                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                                <User className="h-4 w-4" />
                                                {deal.client?.name || "Sem cliente"}
                                            </div>
                                            <p className="mt-2 text-lg font-black text-emerald-600">
                                                R$ {deal.value.toLocaleString("pt-BR")}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString("pt-BR") : "Sem previsão"}
                                                </div>
                                                {buildWhatsAppLink(deal.client?.phone) ? (
                                                    <a
                                                        href={buildWhatsAppLink(deal.client?.phone) || undefined}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        aria-label="Enviar mensagem no WhatsApp"
                                                        className="inline-flex rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onDragStart={(e) => e.stopPropagation()}
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </a>
                                                ) : null}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                open={openCreateModal}
                onOpenChange={setOpenCreateModal}
                title="Nova Negociação"
                description="Cadastre uma nova oportunidade no pipeline."
            >
                <form className="space-y-4" onSubmit={onCreateSubmit}>
                    <Input
                        placeholder="Título da negociação"
                        value={createForm.title}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                        required
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            type="text"
                            placeholder="Valor"
                            value={createForm.value}
                            onChange={(e) => {
                                const parsed = parseBRLInput(e.target.value);
                                setCreateForm((prev) => ({ ...prev, value: formatBRL(parsed) }));
                            }}
                        />
                        <Input
                            type="date"
                            value={createForm.closeDate}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, closeDate: e.target.value }))}
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <select
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                            value={createForm.stageId}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, stageId: e.target.value }))}
                            required
                        >
                            <option value="">Selecione a etapa</option>
                            {(boardQuery.data ?? []).map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                            value={createForm.clientId}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, clientId: e.target.value }))}
                        >
                            <option value="">Sem cliente</option>
                            {(clientsQuery.data ?? []).map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <textarea
                        className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Descrição (opcional)"
                        value={createForm.description}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                    />

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpenCreateModal(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createDeal.isPending || !createForm.stageId}>
                            {createDeal.isPending ? "Salvando..." : "Salvar Negociação"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={openDetailModal}
                onOpenChange={(open) => {
                    setOpenDetailModal(open);
                    if (!open) {
                        setSelectedDeal(null);
                        setLabelEditor({ id: "", name: "", color: "#facc15" });
                        setLabelSearch("");
                    }
                }}
                title="Editar negociação"
                description="Atualize o nome, as etiquetas reutilizáveis e a descrição do card."
            >
                {selectedDeal ? (
                    <form className="space-y-6" onSubmit={onSaveDealDetails}>
                        <div>
                            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Nome da negociação</p>
                            <Input
                                value={detailForm.title}
                                onChange={(e) => setDetailForm((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="Nome da negociação"
                                required
                            />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Cliente</p>
                                <select
                                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                                    value={detailForm.clientId}
                                    onChange={(e) => setDetailForm((prev) => ({ ...prev, clientId: e.target.value }))}
                                >
                                    <option value="">Sem cliente</option>
                                    {(clientsQuery.data ?? []).map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Valor</p>
                                <Input
                                    className="mt-2"
                                    type="text"
                                    value={detailForm.value}
                                    onChange={(e) => {
                                        const parsed = parseBRLInput(e.target.value);
                                        setDetailForm((prev) => ({ ...prev, value: formatBRL(parsed) }));
                                    }}
                                />
                            </div>
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Previsão</p>
                                <Input
                                    className="mt-2"
                                    type="date"
                                    value={detailForm.closeDate}
                                    onChange={(e) => setDetailForm((prev) => ({ ...prev, closeDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        {detailForm.labels.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {detailForm.labels.map((item) => {
                                    const meta = currentLabelMeta(item.labelId);
                                    if (!meta) return null;
                                    return (
                                        <span
                                            key={item.labelId}
                                            className="inline-flex min-h-7 min-w-14 items-center justify-center rounded-lg px-3 py-1 text-sm font-bold text-slate-900"
                                            style={{ backgroundColor: meta.color }}
                                        >
                                            {meta.name || ""}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : null}

                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-lg font-black text-slate-900">Gerenciar Etiquetas</p>
                                    <p className="text-sm text-slate-500">Crie etiquetas reutilizáveis e aplique nos cards.</p>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input
                                    className="pl-10"
                                    placeholder="Buscar etiquetas..."
                                    value={labelSearch}
                                    onChange={(e) => setLabelSearch(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                                <Input
                                    placeholder="Nome da etiqueta"
                                    value={labelEditor.name}
                                    onChange={(e) => setLabelEditor((prev) => ({ ...prev, name: e.target.value }))}
                                />
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3">
                                    <input
                                        type="color"
                                        value={labelEditor.color}
                                        onChange={(e) => setLabelEditor((prev) => ({ ...prev, color: e.target.value }))}
                                        className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <span className="text-sm font-semibold text-slate-500">Cor</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" onClick={onSaveLabel} disabled={createLabel.isPending || updateLabel.isPending}>
                                        {labelEditor.id ? "Salvar" : "Criar"}
                                    </Button>
                                    {labelEditor.id ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setLabelEditor({ id: "", name: "", color: "#facc15" })}
                                        >
                                            Cancelar
                                        </Button>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {filteredLabels.map((label) => {
                                    const selected = selectedLabelIds.has(label.id);
                                    return (
                                        <div key={label.id} className="rounded-2xl border border-slate-200 p-3">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => toggleLabel(label.id)}
                                                    className="h-5 w-5 rounded border-slate-300"
                                                />
                                                <button
                                                    type="button"
                                                    className="flex min-h-12 flex-1 items-center rounded-xl px-4 py-3 text-left text-lg font-bold text-slate-900"
                                                    style={{ backgroundColor: label.color }}
                                                    onClick={() => toggleLabel(label.id)}
                                                >
                                                    {label.name || ""}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                                    onClick={() => startEditingLabel(label)}
                                                    aria-label="Editar etiqueta"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                                                    onClick={() => deleteLabel.mutate(label.id)}
                                                    aria-label="Excluir etiqueta"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredLabels.length === 0 ? (
                                    <p className="text-sm text-slate-400">Nenhuma etiqueta encontrada.</p>
                                ) : null}
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Descrição</p>
                            <textarea
                                className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                placeholder="Adicione uma descrição mais detalhada..."
                                value={detailForm.description}
                                onChange={(e) => setDetailForm((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpenDetailModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saveDealDetails.isPending}>
                                {saveDealDetails.isPending ? "Salvando..." : "Salvar alterações"}
                            </Button>
                        </div>
                    </form>
                ) : null}
            </Modal>
        </section>
    );
}
