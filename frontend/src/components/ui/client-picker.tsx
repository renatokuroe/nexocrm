"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Search, User, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export type PickedClient = { id: string; name: string; company?: string | null };

type ClientsPage = {
    data: PickedClient[];
    pagination: { page: number; totalPages: number; total: number };
};

const PAGE_SIZE = 10;

// Field that opens a searchable, paginated client picker backed by /clients.
export function ClientPicker({
    value,
    onChange,
    placeholder = "Selecionar cliente",
    allowClear = true,
    className,
}: {
    value: PickedClient | null;
    onChange: (client: PickedClient | null) => void;
    placeholder?: string;
    allowClear?: boolean;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const clientsQuery = useQuery({
        queryKey: ["client-picker", debouncedSearch, page],
        queryFn: async () => {
            const response = await api.get("/clients", {
                params: {
                    search: debouncedSearch || undefined,
                    page,
                    limit: PAGE_SIZE,
                    sortBy: "name",
                    sortOrder: "asc",
                },
            });
            return response.data as ClientsPage;
        },
        enabled: open,
        placeholderData: keepPreviousData,
    });

    const openPicker = () => {
        setSearch("");
        setDebouncedSearch("");
        setPage(1);
        setOpen(true);
    };

    const pick = (client: PickedClient | null) => {
        onChange(client);
        setOpen(false);
    };

    const totalPages = Math.max(1, clientsQuery.data?.pagination.totalPages ?? 1);
    const clients = clientsQuery.data?.data ?? [];

    return (
        <>
            <button
                type="button"
                onClick={openPicker}
                className={cn(
                    "flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm hover:bg-slate-50",
                    className
                )}
            >
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <span className={cn("min-w-0 flex-1 truncate", value ? "font-semibold text-slate-700" : "text-slate-400")}>
                    {value ? value.name : placeholder}
                </span>
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
            </button>

            <Modal open={open} onOpenChange={setOpen} title="Selecionar cliente" description="Busque por nome, e-mail, telefone, empresa ou CNPJ.">
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            autoFocus
                            className="pl-9"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                        {allowClear && value ? (
                            <button
                                type="button"
                                onClick={() => pick(null)}
                                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-200 p-3 text-left text-sm text-slate-500 hover:bg-slate-50"
                            >
                                <X className="h-4 w-4" />
                                Remover cliente selecionado
                            </button>
                        ) : null}

                        {clientsQuery.isLoading ? (
                            <p className="p-4 text-sm text-slate-500">Carregando...</p>
                        ) : clients.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                Nenhum cliente encontrado.
                            </p>
                        ) : (
                            clients.map((client) => {
                                const selected = client.id === value?.id;
                                return (
                                    <button
                                        key={client.id}
                                        type="button"
                                        onClick={() => pick({ id: client.id, name: client.name, company: client.company })}
                                        className={cn(
                                            "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left hover:bg-slate-50",
                                            selected ? "border-primary/40 bg-primary/5" : "border-slate-100"
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-slate-800">{client.name}</p>
                                            <p className="truncate text-sm text-slate-500">{client.company || "Sem empresa"}</p>
                                        </div>
                                        {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
                        <span>
                            {clientsQuery.data?.pagination.total ?? 0} cliente(s) · página {page} de {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || clientsQuery.isFetching}
                                onClick={() => setPage((current) => current - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || clientsQuery.isFetching}
                                onClick={() => setPage((current) => current + 1)}
                            >
                                Próxima
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
