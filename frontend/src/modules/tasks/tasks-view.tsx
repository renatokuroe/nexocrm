"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Task } from "@/types/domain";

// Tasks view provides CRUD for tasks with priority and due-date management.
export function TasksView() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        dueDate: "",
        priority: "MEDIUM",
        clientId: "",
    });

    const tasksQuery = useQuery({
        queryKey: ["tasks"],
        queryFn: async () => {
            const response = await api.get("/tasks");
            return response.data.data as Task[];
        },
    });

    const clientsQuery = useQuery({
        queryKey: ["task-clients"],
        queryFn: async () => {
            const response = await api.get("/clients", { params: { limit: 100 } });
            return response.data.data as { id: string; name: string }[];
        },
    });

    const createTask = useMutation({
        mutationFn: async () => {
            await api.post("/tasks", {
                ...form,
                dueDate: form.dueDate || undefined,
                clientId: form.clientId || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            setOpen(false);
            setForm({ title: "", description: "", dueDate: "", priority: "MEDIUM", clientId: "" });
        },
    });

    const toggleTask = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/tasks/${id}/toggle`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        createTask.mutate();
    };

    return (
        <section>
            <PageHeader
                title="Tarefas"
                subtitle="Organize seu dia e nunca perca um prazo."
                actions={
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Tarefa
                    </Button>
                }
            />

            <div className="space-y-3">
                {(tasksQuery.data ?? []).map((task) => (
                    <Card key={task.id}>
                        <CardContent className="flex items-start justify-between gap-4 p-4">
                            <button
                                onClick={() => toggleTask.mutate(task.id)}
                                className={`mt-1 h-5 w-5 rounded-full border ${task.completed ? "bg-primary border-primary" : "border-slate-300"}`}
                            />

                            <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                    <p className={`text-xl font-extrabold ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                        {task.title}
                                    </p>
                                    <Badge
                                        variant={
                                            task.priority === "HIGH"
                                                ? "danger"
                                                : task.priority === "MEDIUM"
                                                    ? "warning"
                                                    : "default"
                                        }
                                    >
                                        {task.priority}
                                    </Badge>
                                </div>
                                <p className="text-slate-500">{task.description || "Sem descrição"}</p>
                            </div>

                            <div className="text-right text-sm text-slate-500">
                                <p className="mb-1 flex items-center gap-1">
                                    <CalendarClock className="h-4 w-4" />
                                    {task.dueDate
                                        ? new Date(task.dueDate).toLocaleDateString("pt-BR")
                                        : "Sem prazo"}
                                </p>
                                <p className="font-semibold text-primary">
                                    cliente: {task.client?.name || "Nenhum"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal open={open} onOpenChange={setOpen} title="Nova Tarefa">
                <form className="space-y-3" onSubmit={onSubmit}>
                    <Input
                        placeholder="Título"
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        required
                    />
                    <textarea
                        className="min-h-[120px] w-full rounded-xl border border-slate-200 p-3"
                        placeholder="Descrição"
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            type="date"
                            value={form.dueDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                        />
                        <select
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3"
                            value={form.priority}
                            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                        >
                            <option value="LOW">Baixa</option>
                            <option value="MEDIUM">Média</option>
                            <option value="HIGH">Alta</option>
                        </select>
                    </div>

                    <select
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                        value={form.clientId}
                        onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                    >
                        <option value="">Cliente (opcional)</option>
                        {(clientsQuery.data ?? []).map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createTask.isPending}>
                            {createTask.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
