"use client";

import { FormEvent, useState } from "react";
import { Plus, Play, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClientPicker, PickedClient } from "@/components/ui/client-picker";
import { useAuth } from "@/hooks/use-auth";

type Channel = "TASK" | "CALL" | "EMAIL" | "WHATSAPP" | "LINKEDIN";
type Step = { title: string; channel: Channel; delayDays: number };
type Cadence = { id: string; name: string; description?: string; steps: Step[]; _count: { enrollments: number } };

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
    const [clientByCadence, setClientByCadence] = useState<Record<string, PickedClient | null>>({});

    const cadencesQuery = useQuery({
        queryKey: ["cadences"],
        queryFn: async () => (await api.get("/cadences")).data.data as Cadence[],
    });
    const createCadence = useMutation({
        mutationFn: async () => api.post("/cadences", { name, description: description || undefined, steps }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cadences"] });
            setName("");
            setDescription("");
            setSteps([{ title: "Primeiro contato", channel: "CALL", delayDays: 0 }]);
        },
    });
    const enroll = useMutation({
        mutationFn: async ({ cadenceId, clientId }: { cadenceId: string; clientId: string }) => api.post(`/cadences/${cadenceId}/enroll`, { clientId }),
        onSuccess: (_, { cadenceId }) => {
            queryClient.invalidateQueries({ queryKey: ["cadences"] });
            setClientByCadence((current) => ({ ...current, [cadenceId]: null }));
        },
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        createCadence.mutate();
    };

    return (
        <section className="space-y-6">
            <PageHeader title="Cadências" subtitle="Planeje uma sequência de contatos e transforme cada etapa em uma tarefa executável." />

            {isAdmin ? (
                <Card>
                    <CardHeader><CardTitle>Nova cadência</CardTitle></CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={submit}>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Input placeholder="Nome da cadência" value={name} onChange={(event) => setName(event.target.value)} required />
                                <Input placeholder="Descrição (opcional)" value={description} onChange={(event) => setDescription(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                {steps.map((step, index) => (
                                    <div className="grid gap-2 md:grid-cols-[1fr_9rem_6rem_auto]" key={index}>
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
                                <Button type="submit" disabled={createCadence.isPending}>{createCadence.isPending ? "Salvando..." : "Salvar cadência"}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
                {(cadencesQuery.data ?? []).map((cadence) => (
                    <Card key={cadence.id}>
                        <CardHeader><CardTitle>{cadence.name}</CardTitle><p className="text-sm text-slate-500">{cadence.description || "Sem descrição"}</p></CardHeader>
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
                                    onChange={(client) => setClientByCadence((current) => ({ ...current, [cadence.id]: client }))}
                                    placeholder="Inscrever cliente..."
                                    allowClear={false}
                                />
                                <Button disabled={!clientByCadence[cadence.id] || enroll.isPending} onClick={() => enroll.mutate({ cadenceId: cadence.id, clientId: clientByCadence[cadence.id]!.id })}><Play className="mr-2 h-4 w-4" />Inscrever</Button>
                            </div>
                            <p className="text-xs text-slate-500">{cadence._count.enrollments} cliente(s) inscrito(s)</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}