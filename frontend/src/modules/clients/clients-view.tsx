"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Client, CustomField, Segment } from "@/types/domain";

// Clients view manages searching, filtering, CRUD operations, and dynamic custom fields.
export function ClientsView() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [openClientModal, setOpenClientModal] = useState(false);
    const [openFieldsModal, setOpenFieldsModal] = useState(false);

    // Form state for creating clients with dynamic fields.
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "ACTIVE",
        leadSource: "",
        birthday: "",
        notes: "",
        segmentIds: [] as string[],
        customFieldValues: {} as Record<string, string>,
    });

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
                phone: form.phone || undefined,
                company: form.company || undefined,
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
            setOpenClientModal(false);
            setForm({
                name: "",
                email: "",
                phone: "",
                company: "",
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

    const createCustomField = useMutation({
        mutationFn: async (payload: { label: string; type: string }) => {
            await api.post("/custom-fields", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
        },
    });

    const visibleCustomFields = useMemo(
        () => (customFieldsQuery.data ?? []).filter((f) => f.visible),
        [customFieldsQuery.data]
    );

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        createClient.mutate();
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
                            <option value="LEAD">Lead</option>
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
                                                <Badge
                                                    variant={
                                                        client.status === "ACTIVE"
                                                            ? "success"
                                                            : client.status === "LEAD"
                                                                ? "warning"
                                                                : "neutral"
                                                    }
                                                >
                                                    {client.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {client.segments.map((segment) => (
                                                        <span
                                                            key={segment.segment.id}
                                                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                                            style={{
                                                                backgroundColor: `${segment.segment.color}1A`,
                                                                color: segment.segment.color,
                                                            }}
                                                        >
                                                            {segment.segment.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            {visibleCustomFields.map((field) => (
                                                <td key={field.id} className="px-4 py-3 text-slate-600">
                                                    {fieldMap.get(field.id) || "-"}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-right">
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
                            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                        <Input
                            placeholder="Origem do lead"
                            value={form.leadSource}
                            onChange={(e) => setForm((prev) => ({ ...prev, leadSource: e.target.value }))}
                        />
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
                        {(customFieldsQuery.data ?? []).map((field) => (
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
