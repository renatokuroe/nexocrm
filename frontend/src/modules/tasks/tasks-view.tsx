"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
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
    const [openEdit, setOpenEdit] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        dueDate: "",
        priority: "MEDIUM",
        clientId: "",
    });

    const [editForm, setEditForm] = useState({
        id: "",
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

    const deleteTask = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/tasks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            setOpenEdit(false);
        },
    });

    const updateTask = useMutation({
        mutationFn: async () => {
            await api.put(`/tasks/${editForm.id}`, {
                title: editForm.title,
                description: editForm.description || undefined,
                dueDate: editForm.dueDate || undefined,
                priority: editForm.priority,
                clientId: editForm.clientId || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            setOpenEdit(false);
            setEditForm({
                id: "",
                title: "",
                description: "",
                dueDate: "",
                priority: "MEDIUM",
                clientId: "",
            });
        },
    });

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        createTask.mutate();
    };

    const onEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        updateTask.mutate();
    };

    const openEditModal = (task: Task) => {
        setEditForm({
            id: task.id,
            title: task.title,
            description: task.description || "",
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
            priority: task.priority,
            clientId: task.clientId || "",
        });
        setOpenEdit(true);
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
                                        {task.priority === "HIGH" ? "Alta" : task.priority === "MEDIUM" ? "Média" : "Baixa"}
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
                                <div className="mt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-8 px-2"
                                        onClick={() => openEditModal(task)}
                                    >
                                        <Pencil className="mr-1 h-3.5 w-3.5" />
                                        Editar
                                    </Button>
                                </div>
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

            <Modal open={openEdit} onOpenChange={setOpenEdit} title="Editar Tarefa">
                <form className="space-y-3" onSubmit={onEditSubmit}>
                    <Input
                        placeholder="Título"
                        value={editForm.title}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        required
                    />
                    <textarea
                        className="min-h-[120px] w-full rounded-xl border border-slate-200 p-3"
                        placeholder="Descrição"
                        value={editForm.description}
                        onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, dueDate: e.target.value }))
                            }
                        />
                        <select
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3"
                            value={editForm.priority}
                            onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, priority: e.target.value }))
                            }
                        >
                            <option value="LOW">Baixa</option>
                            <option value="MEDIUM">Média</option>
                            <option value="HIGH">Alta</option>
                        </select>
                    </div>

                    <select
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                        value={editForm.clientId}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, clientId: e.target.value }))}
                    >
                        <option value="">Cliente (opcional)</option>
                        {(clientsQuery.data ?? []).map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            disabled={deleteTask.isPending}
                            onClick={() => deleteTask.mutate(editForm.id)}
                        >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            {deleteTask.isPending ? "Excluindo..." : "Excluir"}
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updateTask.isPending}>
                                {updateTask.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
