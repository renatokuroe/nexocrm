"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Play, Trash2, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ClientPicker, PickedClient } from "@/components/ui/client-picker";
import { useAuth } from "@/hooks/use-auth";

type Channel = "TASK" | "CALL" | "EMAIL" | "WHATSAPP" | "LINKEDIN";
type Step = { id?: string; title: string; channel: Channel; delayDays: number };
type Cadence = { id: string; name: string; description?: string; steps: Step[]; _count: { enrollments: number } };
type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "STOPPED";
type Enrollment = {
    id: string;
    status: EnrollmentStatus;
    enrolledAt: string;
    client: { id: string; name: string; company?: string | null };
    user: { id: string; name: string };
    completedSteps: number;
    totalSteps: number;
    nextStep: { title: string; dueDate: string | null } | null;
};

const statusLabels: Record<EnrollmentStatus, string> = {
    ACTIVE: "Ativa",
    COMPLETED: "Concluída",
    PAUSED: "Pausada",
    STOPPED: "Encerrada",
};

const channelLabels: Record<Channel, string> = {
    TASK: "Tarefa",
    CALL: "Ligação",
    EMAIL: "E-mail",
    WHATSAPP: "WhatsApp",
    LINKEDIN: "LinkedIn",
};

// Day on which each step falls, counting the enrollment day as day 1.
function stepDays(steps: Step[]) {
    let elapsed = 0;
    return steps.map((step) => {
        elapsed += step.delayDays;
        return elapsed + 1;
    });
}

export function CadencesView() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState<Step[]>([
        { title: "Primeiro contato", channel: "CALL", delayDays: 0 },
    ]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [clientByCadence, setClientByCadence] = useState<Record<string, PickedClient | null>>({});
    const [enrollFeedback, setEnrollFeedback] = useState<Record<string, { ok: boolean; text: string }>>({});
    const [enrollmentsCadence, setEnrollmentsCadence] = useState<Cadence | null>(null);

    const cadencesQuery = useQuery({
        queryKey: ["cadences"],
        queryFn: async () => (await api.get("/cadences")).data.data as Cadence[],
    });
    const enrollmentsQuery = useQuery({
        queryKey: ["cadence-enrollments", enrollmentsCadence?.id],
        queryFn: async () => (await api.get(`/cadences/${enrollmentsCadence!.id}/enrollments`)).data.data as Enrollment[],
        enabled: Boolean(enrollmentsCadence),
    });
    const resetForm = () => {
        setEditingId(null);
        setName("");
        setDescription("");
        setSteps([{ title: "Primeiro contato", channel: "CALL", delayDays: 0 }]);
    };
    const startEdit = (cadence: Cadence) => {
        setEditingId(cadence.id);
        setName(cadence.name);
        setDescription(cadence.description || "");
        setSteps(cadence.steps.map(({ id, title, channel, delayDays }) => ({ id, title, channel, delayDays })));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const saveCadence = useMutation({
        mutationFn: async () => {
            const payload = { name, description: description || undefined, steps };
            return editingId ? api.put(`/cadences/${editingId}`, payload) : api.post("/cadences", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cadences"] });
            resetForm();
        },
    });
    const enroll = useMutation({
        mutationFn: async ({ cadenceId, client }: { cadenceId: string; client: PickedClient }) => api.post(`/cadences/${cadenceId}/enroll`, { clientId: client.id }),
        onSuccess: (_, { cadenceId, client }) => {
            queryClient.invalidateQueries({ queryKey: ["cadences"] });
            queryClient.invalidateQueries({ queryKey: ["cadence-enrollments", cadenceId] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setClientByCadence((current) => ({ ...current, [cadenceId]: null }));
            setEnrollFeedback((current) => ({ ...current, [cadenceId]: { ok: true, text: `${client.name} inscrito(a) com sucesso.` } }));
        },
        onError: (error: { response?: { status?: number } }, { cadenceId, client }) => {
            const text = error.response?.status === 409
                ? `${client.name} já está inscrito(a) nesta cadência.`
                : `Não foi possível inscrever ${client.name}.`;
            setEnrollFeedback((current) => ({ ...current, [cadenceId]: { ok: false, text } }));
        },
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        saveCadence.mutate();
    };

    return (
        <section className="space-y-6">
            <PageHeader title="Cadências" subtitle="Planeje uma sequência de contatos e transforme cada etapa em uma tarefa executável." />

            {isAdmin ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? "Editar cadência" : "Nova cadência"}</CardTitle>
                        {editingId ? (
                            <p className="text-sm text-slate-500">As alterações valem para as próximas inscrições. Tarefas já geradas não mudam.</p>
                        ) : null}
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={submit}>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Input placeholder="Nome da cadência" value={name} onChange={(event) => setName(event.target.value)} required />
                                <Input placeholder="Descrição (opcional)" value={description} onChange={(event) => setDescription(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                {steps.map((step, index) => (
                                    <div className="grid gap-2 md:grid-cols-[1fr_9rem_6rem_auto]" key={step.id ?? `new-${index}`}>
                                        <Input placeholder="Título da atividade" value={step.title} required onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} />
                                        <select className="h-11 rounded-xl border border-slate-200 bg-white px-3" value={step.channel} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, channel: event.target.value as Channel } : item))}>
                                            {Object.entries(channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                        <Input type="number" min="0" title="Dias após a etapa anterior" value={step.delayDays} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, delayDays: Number(event.target.value) } : item))} />
                                        <Button type="button" variant="ghost" size="icon" aria-label="Remover etapa" disabled={steps.length === 1} onClick={() => setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={() => setSteps((current) => [...current, { title: "Nova atividade", channel: "TASK", delayDays: 1 }])}><Plus className="mr-2 h-4 w-4" />Adicionar etapa</Button>
                                <Button type="submit" disabled={saveCadence.isPending}>{saveCadence.isPending ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar cadência"}</Button>
                                {editingId ? <Button type="button" variant="ghost" onClick={resetForm}>Cancelar edição</Button> : null}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
                {(cadencesQuery.data ?? []).map((cadence) => (
                    <Card key={cadence.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <CardTitle>{cadence.name}</CardTitle>
                                {isAdmin ? (
                                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(cadence)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </Button>
                                ) : null}
                            </div>
                            <p className="text-sm text-slate-500">{cadence.description || "Sem descrição"}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ol className="space-y-2 text-sm text-slate-600">
                                {cadence.steps.map((step, index) => (
                                    <li key={index} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
                                        <span className="flex min-w-0 items-start gap-2">
                                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Dia {stepDays(cadence.steps)[index]}</span>
                                            <span>{index + 1}. {step.title}</span>
                                        </span>
                                        <span className="shrink-0 font-semibold text-primary">{channelLabels[step.channel]}</span>
                                    </li>
                                ))}
                            </ol>
                            <div className="flex gap-2">
                                <ClientPicker
                                    className="flex-1"
                                    value={clientByCadence[cadence.id] ?? null}
                                    onChange={(client) => {
                                        setClientByCadence((current) => ({ ...current, [cadence.id]: client }));
                                        setEnrollFeedback(({ [cadence.id]: _, ...rest }) => rest);
                                    }}
                                    placeholder="Inscrever cliente..."
                                    allowClear={false}
                                />
                                <Button disabled={!clientByCadence[cadence.id] || enroll.isPending} onClick={() => enroll.mutate({ cadenceId: cadence.id, client: clientByCadence[cadence.id]! })}><Play className="mr-2 h-4 w-4" />Inscrever</Button>
                            </div>
                            {enrollFeedback[cadence.id] ? (
                                <p className={`text-sm font-semibold ${enrollFeedback[cadence.id].ok ? "text-emerald-600" : "text-rose-600"}`}>
                                    {enrollFeedback[cadence.id].text}
                                </p>
                            ) : null}
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-slate-500">{cadence._count.enrollments} cliente(s) inscrito(s)</p>
                                <Button type="button" variant="outline" size="sm" onClick={() => setEnrollmentsCadence(cadence)}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Ver inscritos
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal
                open={Boolean(enrollmentsCadence)}
                onOpenChange={(open) => { if (!open) setEnrollmentsCadence(null); }}
                title={enrollmentsCadence?.name ?? "Inscritos"}
                description="Clientes inscritos nesta cadência e o andamento de cada um."
            >
                <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                    {enrollmentsQuery.isLoading ? (
                        <p className="p-4 text-sm text-slate-500">Carregando...</p>
                    ) : (enrollmentsQuery.data ?? []).length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                            Nenhum cliente inscrito ainda.
                        </p>
                    ) : (
                        (enrollmentsQuery.data ?? []).map((enrollment) => (
                            <div key={enrollment.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-slate-800">{enrollment.client.name}</p>
                                        <p className="truncate text-sm text-slate-500">
                                            {enrollment.client.company || "Sem empresa"} · inscrito por {enrollment.user.name} em{" "}
                                            {new Date(enrollment.enrolledAt).toLocaleDateString("pt-BR")}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm">
                                        {statusLabels[enrollment.status]} · {enrollment.completedSteps}/{enrollment.totalSteps} etapas
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                    {enrollment.nextStep
                                        ? `Próxima: ${enrollment.nextStep.title}${enrollment.nextStep.dueDate ? ` — ${new Date(enrollment.nextStep.dueDate).toLocaleDateString("pt-BR")}` : ""}`
                                        : "Todas as etapas concluídas."}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </section>
    );
}