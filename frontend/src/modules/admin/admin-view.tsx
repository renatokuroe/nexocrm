"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
    createdAt: string;
    tenant: {
        id: string;
        name: string;
    } | null;
}

export function AdminView() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        companyName: "",
    });
    const [editForm, setEditForm] = useState({
        id: "",
        name: "",
        email: "",
        password: "",
        companyName: "",
    });

    const usersQuery = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const response = await api.get("/admin/users");
            const payload = response?.data?.data;
            if (!Array.isArray(payload)) {
                return [] as AdminUser[];
            }
            return payload.filter((item): item is AdminUser => Boolean(item && item.id));
        },
        enabled: user?.role === "ADMIN",
    });

    const createUser = useMutation({
        mutationFn: async () => {
            await api.post("/admin/users", form);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setOpen(false);
            setForm({ name: "", email: "", password: "", companyName: "" });
        },
    });

    const updateUser = useMutation({
        mutationFn: async () => {
            await api.put(`/admin/users/${editForm.id}`, {
                name: editForm.name,
                email: editForm.email,
                password: editForm.password || undefined,
                companyName: editForm.companyName,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setOpenEdit(false);
            setEditForm({ id: "", name: "", email: "", password: "", companyName: "" });
        },
    });

    const deleteUser = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
    });

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        createUser.mutate();
    };

    const onEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        updateUser.mutate();
    };

    const openEditModal = (row: AdminUser) => {
        setEditForm({
            id: row.id,
            name: row.name,
            email: row.email,
            password: "",
            companyName: row.tenant?.name ?? "",
        });
        setOpenEdit(true);
    };

    if (user?.role !== "ADMIN") {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-lg font-semibold text-slate-700">Acesso restrito ao administrador.</p>
                </CardContent>
            </Card>
        );
    }

    if (usersQuery.isLoading) {
        return (
            <section>
                <PageHeader
                    title="Admin"
                    subtitle="Gerencie usuários e ambientes (tenants) do SaaS."
                />
                <Card>
                    <CardContent className="p-6">
                        <p className="text-slate-600">Carregando usuários...</p>
                    </CardContent>
                </Card>
            </section>
        );
    }

    if (usersQuery.isError) {
        return (
            <section>
                <PageHeader
                    title="Admin"
                    subtitle="Gerencie usuários e ambientes (tenants) do SaaS."
                />
                <Card>
                    <CardContent className="p-6">
                        <p className="text-rose-600">Não foi possível carregar os usuários.</p>
                    </CardContent>
                </Card>
            </section>
        );
    }

    return (
        <section>
            <PageHeader
                title="Admin"
                subtitle="Gerencie usuários e ambientes (tenants) do SaaS."
                actions={
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Usuário
                    </Button>
                }
            />

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Nome</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Empresa</th>
                                    <th className="px-4 py-3">Perfil</th>
                                    <th className="px-4 py-3">Criado em</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {(usersQuery.data ?? []).map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100 text-sm">
                                        <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.email}</td>
                                        <td className="px-4 py-3 text-slate-700">{row.tenant?.name ?? "Sem tenant"}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.role}</td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-8 px-2"
                                                    onClick={() => openEditModal(row)}
                                                    disabled={!row.tenant}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                                                    onClick={() => deleteUser.mutate(row.id)}
                                                    disabled={row.role === "ADMIN" || row.id === user?.id}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                open={open}
                onOpenChange={setOpen}
                title="Novo Usuário"
                description="Criar um novo cliente/tenant com ambiente isolado."
            >
                <form className="space-y-3" onSubmit={onSubmit}>
                    <Input
                        placeholder="Nome"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <Input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Senha"
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                        required
                    />
                    <Input
                        placeholder="Nome da empresa"
                        value={form.companyName}
                        onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                        required
                    />

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createUser.isPending}>
                            {createUser.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={openEdit}
                onOpenChange={setOpenEdit}
                title="Editar Usuário"
                description="Atualize os dados do usuário e da empresa."
            >
                <form className="space-y-3" onSubmit={onEditSubmit}>
                    <Input
                        placeholder="Nome"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <Input
                        type="email"
                        placeholder="Email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Nova senha (opcional)"
                        value={editForm.password}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                    <Input
                        placeholder="Nome da empresa"
                        value={editForm.companyName}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                        required
                    />

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={updateUser.isPending}>
                            {updateUser.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
