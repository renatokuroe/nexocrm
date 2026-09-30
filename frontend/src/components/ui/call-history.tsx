"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type CallStatus = "DIALING" | "ANSWERED" | "NOT_ANSWERED" | "BUSY" | "FAILED";

interface CallRecord {
    id: string;
    phone: string;
    status: CallStatus;
    duration: number | null;
    recordUrl: string | null;
    createdAt: string;
    user: { id: string; name: string };
}

const statusMeta: Record<CallStatus, { label: string; className: string }> = {
    DIALING: { label: "Em andamento", className: "bg-sky-100 text-sky-700" },
    ANSWERED: { label: "Atendida", className: "bg-emerald-100 text-emerald-700" },
    NOT_ANSWERED: { label: "Não atendida", className: "bg-amber-100 text-amber-700" },
    BUSY: { label: "Ocupado", className: "bg-amber-100 text-amber-700" },
    FAILED: { label: "Falhou", className: "bg-rose-100 text-rose-700" },
};

function formatDuration(seconds: number | null) {
    if (!seconds) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// Calls made to a client through API4Com, newest first, with the recording when available.
export function CallHistory({ clientId }: { clientId: string }) {
    const callsQuery = useQuery({
        queryKey: ["calls", clientId],
        queryFn: async () => {
            const response = await api.get("/calls", { params: { clientId } });
            return (response.data?.data ?? []) as CallRecord[];
        },
        // Keep polling while a call is still waiting for the API4Com webhook
        refetchInterval: (query) =>
            (query.state.data ?? []).some((call) => call.status === "DIALING") ? 5000 : false,
    });

    const calls = callsQuery.data ?? [];

    return (
        <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Ligações</p>
            {callsQuery.isLoading ? (
                <p className="text-sm text-slate-500">Carregando...</p>
            ) : calls.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma ligação registrada.</p>
            ) : (
                <div className="space-y-2">
                    {calls.map((call) => {
                        const meta = statusMeta[call.status] ?? statusMeta.FAILED;
                        return (
                            <div key={call.id} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-slate-800">
                                        {new Date(call.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                                        <span className="font-normal text-slate-500"> · {call.user.name}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-500">{formatDuration(call.duration)}</span>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                                    </div>
                                </div>
                                {call.recordUrl ? (
                                    <audio className="mt-2 w-full" controls preload="none" src={call.recordUrl} />
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
