"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Clipboard, MessageCircle, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Client, CustomField, Segment } from "@/types/domain";

type ClientStatus = Client["status"];
type QuickEditState = {
    clientId: string;
    clientName: string;
    type: "status" | "segment";
    currentStatus?: ClientStatus;
    currentSegmentId?: string;
};

const statusLabel: Record<ClientStatus, string> = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    LEAD: "LEAD",
};

const baseClientFieldLabels = new Set(["email", "telefone", "empresa"]);

const emptyClientFields = {
    category: "",
    website: "",
    address: "",
    city: "",
    state: "",
    cnpj: "",
    legalName: "",
    rating: "",
    reviewCount: "",
    companySize: "",
    socialCapital: "",
};

function isBaseClientFieldLabel(label: string): boolean {
    return baseClientFieldLabels.has(label.trim().toLowerCase());
}

function formatBrazilPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizeBrazilPhone(raw: string): string {
    return raw.replace(/\D/g, "").slice(0, 11);
}

function buildWhatsAppLink(phone: string): string | null {
    const normalized = normalizeBrazilPhone(phone);
    if (normalized.length < 10) return null;
    return `https://wa.me/55${normalized}`;
}

// Clients view manages searching, filtering, CRUD operations, and dynamic custom fields.
export function ClientsView() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [openClientModal, setOpenClientModal] = useState(false);
    const [openEditClientModal, setOpenEditClientModal] = useState(false);
    const [openFieldsModal, setOpenFieldsModal] = useState(false);
    const [quickEdit, setQuickEdit] = useState<QuickEditState | null>(null);
    const [copiedClientData, setCopiedClientData] = useState(false);

    // Form state for creating clients with dynamic fields.
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        ...emptyClientFields,
        status: "ACTIVE",
        leadSource: "",
        birthday: "",
        notes: "",
        segmentIds: [] as string[],
        customFieldValues: {} as Record<string, string>,
    });

    const [editingClient, setEditingClient] = useState<{
        id: string;
        name: string;
        email: string;
        phone: string;
        company: string;
        category: string;
        website: string;
        address: string;
        city: string;
        state: string;
        cnpj: string;
        legalName: string;
        rating: string;
        reviewCount: string;
        companySize: string;
        socialCapital: string;
        status: ClientStatus;
        leadSource: string;
        birthday: string;
        notes: string;
        segmentIds: string[];
        customFieldValues: Record<string, string>;
    } | null>(null);

    const clientsQuery = useQuery({
        queryKey: ["clients", search, statusFilter],
        queryFn: async () => {
            const response = await api.get("/clients", {
                params: {
                    search: search || undefined,
                    status: statusFilter || undefined,
                    limit: 100,
                },
            });
            return response.data.data as Client[];
        },
    });

    const segmentsQuery = useQuery({
        queryKey: ["segments"],
        queryFn: async () => {
            const response = await api.get("/segments");
            return response.data.data as Segment[];
        },
    });

    const customFieldsQuery = useQuery({
        queryKey: ["custom-fields"],
        queryFn: async () => {
            const response = await api.get("/custom-fields");
            return response.data.data as CustomField[];
        },
    });

    const createClient = useMutation({
        mutationFn: async () => {
            await api.post("/clients", {
                name: form.name,
                email: form.email || undefined,
                phone: form.phone ? normalizeBrazilPhone(form.phone) : undefined,
                company: form.company || undefined,
                category: form.category || undefined,
                website: form.website || undefined,
                address: form.address || undefined,
                city: form.city || undefined,
                state: form.state || undefined,
                cnpj: form.cnpj || undefined,
                legalName: form.legalName || undefined,
                rating: form.rating ? Number(form.rating) : undefined,
                reviewCount: form.reviewCount ? Number(form.reviewCount) : undefined,
                companySize: form.companySize || undefined,
                socialCapital: form.socialCapital ? Number(form.socialCapital) : undefined,
                status: form.status,
                leadSource: form.leadSource || undefined,
                birthday: form.birthday || undefined,
                notes: form.notes || undefined,
                segmentIds: form.segmentIds,
                customFields: Object.entries(form.customFieldValues)
                    .filter(([, value]) => value.trim().length > 0)
                    .map(([fieldId, value]) => ({ fieldId, value })),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            // Creating a client also creates a deal, so refresh the pipeline caches too.
            queryClient.invalidateQueries({ queryKey: ["client-picker"] });
            queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
            setOpenClientModal(false);
            setForm({
                name: "",
                email: "",
                phone: "",
                company: "",
                ...emptyClientFields,
                status: "ACTIVE",
                leadSource: "",
                birthday: "",
                notes: "",
                segmentIds: [],
                customFieldValues: {},
            });
        },
    });

    const deleteClient = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/clients/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
    });

    const updateClient = useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: string;
            payload: {
                name?: string;
                email?: string;
                phone?: string;
                company?: string;
                category?: string;
                website?: string;
                address?: string;
                city?: string;
                state?: string;
                cnpj?: string;
                legalName?: string;
                rating?: number;
                reviewCount?: number;
                companySize?: string;
                socialCapital?: number;
                status?: ClientStatus;
                leadSource?: string;
                birthday?: string;
                notes?: string;
                segmentIds?: string[];
                customFields?: { fieldId: string; value: string }[];
            };
        }) => {
            await api.put(`/clients/${id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
    });

    const createCustomField = useMutation({
        mutationFn: async (payload: { label: string; type: string }) => {
            await api.post("/custom-fields", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
        },
    });

    const dynamicCustomFields = useMemo(
        () =>
            (customFieldsQuery.data ?? []).filter(
                (field) => !isBaseClientFieldLabel(field.label)
            ),
        [customFieldsQuery.data]
    );

    const visibleCustomFields = useMemo(
        () => dynamicCustomFields.filter((field) => field.visible),
        [dynamicCustomFields]
    );

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        createClient.mutate();
    };

    const openEditModal = (client: Client) => {
        const customFieldValues = Object.fromEntries(
            client.customFieldValues.map((field) => [field.customField.id, field.value])
        );

        setEditingClient({
            id: client.id,
            name: client.name,
            email: client.email || "",
            phone: formatBrazilPhone(client.phone || ""),
            company: client.company || "",
            category: client.category || "",
            website: client.website || "",
            address: client.address || "",
            city: client.city || "",
            state: client.state || "",
            cnpj: client.cnpj || "",
            legalName: client.legalName || "",
            rating: client.rating?.toString() || "",
            reviewCount: client.reviewCount?.toString() || "",
            companySize: client.companySize || "",
            socialCapital: client.socialCapital?.toString() || "",
            status: client.status,
            leadSource: client.leadSource || "",
            birthday: client.birthday ? client.birthday.slice(0, 10) : "",
            notes: client.notes || "",
            segmentIds: client.segments.map((segment) => segment.segment.id),
            customFieldValues,
        });
        setOpenEditClientModal(true);
    };

    const onEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;

        updateClient.mutate(
            {
                id: editingClient.id,
                payload: {
                    name: editingClient.name,
                    email: editingClient.email || undefined,
                    phone: editingClient.phone ? normalizeBrazilPhone(editingClient.phone) : undefined,
                    company: editingClient.company || undefined,
                    category: editingClient.category || undefined,
                    website: editingClient.website || undefined,
                    address: editingClient.address || undefined,
                    city: editingClient.city || undefined,
                    state: editingClient.state || undefined,
                    cnpj: editingClient.cnpj || undefined,
                    legalName: editingClient.legalName || undefined,
                    rating: editingClient.rating ? Number(editingClient.rating) : undefined,
                    reviewCount: editingClient.reviewCount ? Number(editingClient.reviewCount) : undefined,
                    companySize: editingClient.companySize || undefined,
                    socialCapital: editingClient.socialCapital ? Number(editingClient.socialCapital) : undefined,
                    status: editingClient.status,
                    leadSource: editingClient.leadSource || undefined,
                    birthday: editingClient.birthday || undefined,
                    notes: editingClient.notes || undefined,
                    segmentIds: editingClient.segmentIds,
                    customFields: Object.entries(editingClient.customFieldValues)
                        .filter(([, value]) => value.trim().length > 0)
                        .map(([fieldId, value]) => ({ fieldId, value })),
                },
            },
            {
                onSuccess: () => {
                    setOpenEditClientModal(false);
                    setEditingClient(null);
                },
            }
        );
    };

    const copyClientData = async () => {
        if (!editingClient) return;

        const customFields = dynamicCustomFields
            .map((field) => `${field.label}: ${editingClient.customFieldValues[field.id] || "-"}`)
            .join("\n");
        const segments = editingClient.segmentIds
            .map((id) => segmentsQuery.data?.find((segment) => segment.id === id)?.name)
            .filter(Boolean)
            .join(", ");
        const text = [
            `Nome: ${editingClient.name || "-"}`,
            `Email: ${editingClient.email || "-"}`,
            `Telefone: ${editingClient.phone || "-"}`,
            `Empresa: ${editingClient.company || "-"}`,
            `Categoria: ${editingClient.category || "-"}`,
            `Site: ${editingClient.website || "-"}`,
            `Endereço completo: ${editingClient.address || "-"}`,
            `Cidade: ${editingClient.city || "-"}`,
            `Estado: ${editingClient.state || "-"}`,
            `CNPJ: ${editingClient.cnpj || "-"}`,
            `Razão social: ${editingClient.legalName || "-"}`,
            `Rating: ${editingClient.rating || "-"}`,
            `Número de reviews: ${editingClient.reviewCount || "-"}`,
            `Porte da empresa: ${editingClient.companySize || "-"}`,
            `Capital social: ${editingClient.socialCapital || "-"}`,
            `Status: ${statusLabel[editingClient.status]}`,
            `Origem do lead: ${editingClient.leadSource || "-"}`,
            `Aniversário: ${editingClient.birthday || "-"}`,
            `Observações: ${editingClient.notes || "-"}`,
            `Segmentos: ${segments || "-"}`,
            customFields ? `Campos personalizados:\n${customFields}` : "",
        ].filter(Boolean).join("\n");

        await navigator.clipboard.writeText(text);
        setCopiedClientData(true);
        window.setTimeout(() => setCopiedClientData(false), 2000);
    };

    return (
        <section>
            <PageHeader
                title="Clientes"
                subtitle="Gerencie sua base de contatos com campos personalizados."
                actions={
                    <>
                        <Button variant="outline" onClick={() => setOpenFieldsModal(true)}>
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Personalizar Campos
                        </Button>
                        <Button onClick={() => setOpenClientModal(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Cliente
                        </Button>
                    </>
                }
            />

            <Card className="mb-4">
                <CardContent className="p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                                className="pl-10"
                                placeholder="Buscar por nome ou qualquer campo visível..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Todos Status</option>
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                            <option value="LEAD">LEAD</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Nome</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Telefone</th>
                                    <th className="px-4 py-3">Empresa</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Segmentos</th>
                                    {visibleCustomFields.map((field) => (
                                        <th key={field.id} className="px-4 py-3">
                                            {field.label}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {(clientsQuery.data ?? []).map((client) => {
                                    const fieldMap = new Map(
                                        client.customFieldValues.map((f) => [f.customField.id, f.value])
                                    );
                                    return (
                                        <tr key={client.id} className="border-b border-slate-100 text-sm">
                                            <td className="px-4 py-3 font-semibold text-slate-800">{client.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{client.email || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600">{client.phone || "-"}</td>
                                            <td className="px-4 py-3 text-slate-600">{client.company || "-"}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    className="rounded-full"
                                                    onClick={() =>
                                                        setQuickEdit({
                                                            clientId: client.id,
                                                            clientName: client.name,
                                                            type: "status",
                                                            currentStatus: client.status,
                                                        })
                                                    }
                                                    disabled={updateClient.isPending}
                                                >
                                                    <Badge
                                                        variant={
                                                            client.status === "ACTIVE"
                                                                ? "success"
                                                                : client.status === "LEAD"
                                                                    ? "warning"
                                                                    : "neutral"
                                                        }
                                                    >
                                                        {statusLabel[client.status]}
                                                    </Badge>
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {client.segments.map((segment) => (
                                                        <button
                                                            key={segment.segment.id}
                                                            type="button"
                                                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                                            onClick={() =>
                                                                setQuickEdit({
                                                                    clientId: client.id,
                                                                    clientName: client.name,
                                                                    type: "segment",
                                                                    currentSegmentId:
                                                                        client.segments[0]?.segment.id || "",
                                                                })
                                                            }
                                                            disabled={updateClient.isPending}
                                                            style={{
                                                                backgroundColor: `${segment.segment.color}1A`,
                                                                color: segment.segment.color,
                                                            }}
                                                        >
                                                            {segment.segment.name}
                                                        </button>
                                                    ))}
                                                    {client.segments.length === 0 ? (
                                                        <button
                                                            type="button"
                                                            className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-500"
                                                            onClick={() =>
                                                                setQuickEdit({
                                                                    clientId: client.id,
                                                                    clientName: client.name,
                                                                    type: "segment",
                                                                    currentSegmentId: "",
                                                                })
                                                            }
                                                            disabled={updateClient.isPending}
                                                        >
                                                            Sem segmento
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                            {visibleCustomFields.map((field) => (
                                                <td key={field.id} className="px-4 py-3 text-slate-600">
                                                    {fieldMap.get(field.id) || "-"}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-right">
                                                {buildWhatsAppLink(client.phone || "") ? (
                                                    <a
                                                        className="mr-1 inline-flex rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                        href={buildWhatsAppLink(client.phone || "") || undefined}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        aria-label="Enviar mensagem no WhatsApp"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </a>
                                                ) : (
                                                    <span
                                                        className="mr-1 inline-flex rounded-lg p-2 text-slate-300"
                                                        aria-label="Cliente sem telefone para WhatsApp"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </span>
                                                )}
                                                <button
                                                    className="mr-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                    onClick={() => openEditModal(client)}
                                                    aria-label="Editar cliente"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                    onClick={() => deleteClient.mutate(client.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                open={openClientModal}
                onOpenChange={setOpenClientModal}
                title="Novo Cliente"
                description="Preencha os dados e personalize com campos dinâmicos."
            >
                <form className="space-y-4" onSubmit={onSubmit}>
                    <Input
                        placeholder="Nome completo"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            placeholder="Empresa"
                            value={form.company}
                            onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                        />
                        <Input
                            placeholder="Email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                        <Input
                            placeholder="Telefone"
                            value={form.phone}
                            onChange={(e) => setForm((prev) => ({ ...prev, phone: formatBrazilPhone(e.target.value) }))}
                        />
                        <Input
                            placeholder="Origem do lead"
                            value={form.leadSource}
                            onChange={(e) => setForm((prev) => ({ ...prev, leadSource: e.target.value }))}
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <Input placeholder="Categoria" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
                        <Input placeholder="Site" type="url" value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} />
                        <Input placeholder="Endereço completo" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                        <Input placeholder="Cidade" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
                        <Input placeholder="Estado" value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
                        <Input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm((prev) => ({ ...prev, cnpj: e.target.value }))} />
                        <Input placeholder="Razão social" value={form.legalName} onChange={(e) => setForm((prev) => ({ ...prev, legalName: e.target.value }))} />
                        <Input placeholder="Porte da empresa" value={form.companySize} onChange={(e) => setForm((prev) => ({ ...prev, companySize: e.target.value }))} />
                        <Input placeholder="Rating" type="number" min="0" step="0.1" value={form.rating} onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))} />
                        <Input placeholder="Número de reviews" type="number" min="0" step="1" value={form.reviewCount} onChange={(e) => setForm((prev) => ({ ...prev, reviewCount: e.target.value }))} />
                        <Input placeholder="Capital social" type="number" min="0" step="0.01" value={form.socialCapital} onChange={(e) => setForm((prev) => ({ ...prev, socialCapital: e.target.value }))} />
                    </div>

                    <div>
                        <p className="mb-2 text-sm font-semibold text-slate-600">Segmentos</p>
                        <div className="flex flex-wrap gap-2">
                            {(segmentsQuery.data ?? []).map((segment) => {
                                const selected = form.segmentIds.includes(segment.id);
                                return (
                                    <button
                                        key={segment.id}
                                        type="button"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                segmentIds: selected
                                                    ? prev.segmentIds.filter((id) => id !== segment.id)
                                                    : [...prev.segmentIds, segment.id],
                                            }))
                                        }
                                        className="rounded-full border px-3 py-1 text-sm font-semibold"
                                        style={{
                                            borderColor: selected ? segment.color : "#e2e8f0",
                                            backgroundColor: selected ? `${segment.color}1A` : "white",
                                            color: selected ? segment.color : "#475569",
                                        }}
                                    >
                                        {segment.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {dynamicCustomFields.map((field) => (
                            <Input
                                key={field.id}
                                placeholder={field.label}
                                value={form.customFieldValues[field.id] || ""}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        customFieldValues: {
                                            ...prev.customFieldValues,
                                            [field.id]: e.target.value,
                                        },
                                    }))
                                }
                            />
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenClientModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createClient.isPending}>
                            {createClient.isPending ? "Salvando..." : "Salvar Cliente"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={openEditClientModal}
                onOpenChange={(open) => {
                    setOpenEditClientModal(open);
                    if (!open) setEditingClient(null);
                }}
                title="Editar Cliente"
                description="Atualize os dados principais do cliente."
            >
                {editingClient && (
                    <form className="space-y-4" onSubmit={onEditSubmit}>
                        <label className="block space-y-1 text-sm font-semibold text-slate-600">
                            Nome completo
                            <Input value={editingClient.name} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, name: e.target.value } : prev)} required />
                        </label>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Empresa<Input value={editingClient.company} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, company: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Email<Input type="email" value={editingClient.email} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, email: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Telefone<Input value={editingClient.phone} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, phone: formatBrazilPhone(e.target.value) } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Origem do lead<Input value={editingClient.leadSource} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, leadSource: e.target.value } : prev)} /></label>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Categoria<Input value={editingClient.category} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, category: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Site<Input type="url" value={editingClient.website} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, website: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Endereço completo<Input value={editingClient.address} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, address: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Cidade<Input value={editingClient.city} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, city: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Estado<Input value={editingClient.state} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, state: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">CNPJ<Input value={editingClient.cnpj} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, cnpj: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Razão social<Input value={editingClient.legalName} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, legalName: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Porte da empresa<Input value={editingClient.companySize} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, companySize: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Rating<Input type="number" min="0" step="0.1" value={editingClient.rating} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, rating: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Número de reviews<Input type="number" min="0" step="1" value={editingClient.reviewCount} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, reviewCount: e.target.value } : prev)} /></label>
                            <label className="space-y-1 text-sm font-semibold text-slate-600">Capital social<Input type="number" min="0" step="0.01" value={editingClient.socialCapital} onChange={(e) => setEditingClient((prev) => prev ? { ...prev, socialCapital: e.target.value } : prev)} /></label>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-semibold text-slate-600">Segmentos</p>
                            <div className="flex flex-wrap gap-2">
                                {(segmentsQuery.data ?? []).map((segment) => {
                                    const selected = editingClient.segmentIds.includes(segment.id);
                                    return (
                                        <button
                                            key={segment.id}
                                            type="button"
                                            onClick={() =>
                                                setEditingClient((prev) =>
                                                    prev
                                                        ? {
                                                            ...prev,
                                                            segmentIds: selected
                                                                ? prev.segmentIds.filter((id) => id !== segment.id)
                                                                : [...prev.segmentIds, segment.id],
                                                        }
                                                        : prev
                                                )
                                            }
                                            className="rounded-full border px-3 py-1 text-sm font-semibold"
                                            style={{
                                                borderColor: selected ? segment.color : "#e2e8f0",
                                                backgroundColor: selected ? `${segment.color}1A` : "white",
                                                color: selected ? segment.color : "#475569",
                                            }}
                                        >
                                            {segment.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            {dynamicCustomFields.map((field) => (
                                <label key={field.id} className="space-y-1 text-sm font-semibold text-slate-600">
                                    {field.label}
                                    <Input
                                        value={editingClient.customFieldValues[field.id] || ""}
                                        onChange={(e) =>
                                            setEditingClient((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        customFieldValues: {
                                                            ...prev.customFieldValues,
                                                            [field.id]: e.target.value,
                                                        },
                                                    }
                                                    : prev
                                            )
                                        }
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-between gap-2">
                            <Button type="button" variant="outline" onClick={copyClientData}>
                                {copiedClientData ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                                {copiedClientData ? "Dados copiados" : "Copiar dados"}
                            </Button>
                            <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setOpenEditClientModal(false);
                                    setEditingClient(null);
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updateClient.isPending}>
                                {updateClient.isPending ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>

            <Dialog.Root open={Boolean(quickEdit)} onOpenChange={(open) => !open && setQuickEdit(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/30 bg-white p-4 shadow-2xl">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <Dialog.Title className="text-lg font-black text-slate-900">
                                    {quickEdit?.type === "status" ? "Alterar status" : "Alterar segmento"}
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-slate-500">
                                    {quickEdit?.clientName}
                                </Dialog.Description>
                            </div>
                            <Dialog.Close className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <X className="h-4 w-4" />
                            </Dialog.Close>
                        </div>

                        <div className="space-y-2">
                            {quickEdit?.type === "status" ? (
                                (["ACTIVE", "INACTIVE", "LEAD"] as ClientStatus[]).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        onClick={() => {
                                            if (!quickEdit || quickEdit.currentStatus === status) {
                                                setQuickEdit(null);
                                                return;
                                            }

                                            updateClient.mutate(
                                                {
                                                    id: quickEdit.clientId,
                                                    payload: { status },
                                                },
                                                {
                                                    onSuccess: () => setQuickEdit(null),
                                                }
                                            );
                                        }}
                                        disabled={updateClient.isPending}
                                    >
                                        <span>{statusLabel[status]}</span>
                                        {quickEdit.currentStatus === status ? (
                                            <span className="text-xs text-slate-400">Atual</span>
                                        ) : null}
                                    </button>
                                ))
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        onClick={() => {
                                            if (!quickEdit || quickEdit.currentSegmentId === "") {
                                                setQuickEdit(null);
                                                return;
                                            }

                                            updateClient.mutate(
                                                {
                                                    id: quickEdit.clientId,
                                                    payload: { segmentIds: [] },
                                                },
                                                {
                                                    onSuccess: () => setQuickEdit(null),
                                                }
                                            );
                                        }}
                                        disabled={updateClient.isPending}
                                    >
                                        <span>Sem segmento</span>
                                        {quickEdit?.currentSegmentId === "" ? (
                                            <span className="text-xs text-slate-400">Atual</span>
                                        ) : null}
                                    </button>
                                    {(segmentsQuery.data ?? []).map((segment) => (
                                        <button
                                            key={segment.id}
                                            type="button"
                                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                            onClick={() => {
                                                if (!quickEdit || quickEdit.currentSegmentId === segment.id) {
                                                    setQuickEdit(null);
                                                    return;
                                                }

                                                updateClient.mutate(
                                                    {
                                                        id: quickEdit.clientId,
                                                        payload: { segmentIds: [segment.id] },
                                                    },
                                                    {
                                                        onSuccess: () => setQuickEdit(null),
                                                    }
                                                );
                                            }}
                                            disabled={updateClient.isPending}
                                        >
                                            <span>{segment.name}</span>
                                            {quickEdit?.currentSegmentId === segment.id ? (
                                                <span className="text-xs text-slate-400">Atual</span>
                                            ) : null}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <FieldsModal
                open={openFieldsModal}
                onOpenChange={setOpenFieldsModal}
                fields={customFieldsQuery.data ?? []}
                onCreate={(payload) => createCustomField.mutate(payload)}
            />
        </section>
    );
}

// Dedicated modal component for custom field management.
function FieldsModal({
    open,
    onOpenChange,
    fields,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fields: CustomField[];
    onCreate: (payload: { label: string; type: string }) => void;
}) {
    const [label, setLabel] = useState("");
    const [type, setType] = useState("TEXT");

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Personalizar Campos"
            description="Adapte o CRM ao seu fluxo de trabalho."
        >
            <div className="space-y-4">
                <div className="space-y-2 rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-500">Novo campo</p>
                    <div className="grid gap-2 md:grid-cols-[1fr_160px_auto]">
                        <Input
                            placeholder="Rótulo do campo"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                        <select
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="TEXT">Texto</option>
                            <option value="NUMBER">Número</option>
                            <option value="DATE">Data</option>
                            <option value="BOOLEAN">Booleano</option>
                        </select>
                        <Button
                            type="button"
                            onClick={() => {
                                if (!label.trim()) return;
                                onCreate({ label, type });
                                setLabel("");
                                setType("TEXT");
                            }}
                        >
                            Adicionar
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    {fields.map((field) => (
                        <div
                            key={field.id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                        >
                            <p className="font-semibold text-slate-700">{field.label}</p>
                            <Badge variant="neutral">{field.type}</Badge>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
