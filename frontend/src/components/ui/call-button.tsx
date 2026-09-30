"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, PhoneCall } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CallButtonProps {
    clientId: string;
    phone?: string | null;
    dealId?: string;
    className?: string;
}

// Click-to-call through API4Com: the user's extension rings first, then the lead is dialed.
export function CallButton({ clientId, phone, dealId, className }: CallButtonProps) {
    const queryClient = useQueryClient();
    const [ringing, setRinging] = useState(false);
    const hasPhone = (phone || "").replace(/\D/g, "").length >= 10;

    useEffect(() => {
        if (!ringing) return;
        const timer = setTimeout(() => setRinging(false), 8000);
        return () => clearTimeout(timer);
    }, [ringing]);

    const startCall = useMutation({
        mutationFn: async () => {
            await api.post("/calls", { clientId, dealId });
        },
        onSuccess: () => {
            setRinging(true);
            queryClient.invalidateQueries({ queryKey: ["calls", clientId] });
        },
        onError: (error: any) => {
            window.alert(error?.response?.data?.message || "Não foi possível iniciar a ligação.");
        },
    });

    if (!hasPhone) {
        return (
            <span className={cn("inline-flex rounded-lg p-2 text-slate-300", className)} aria-label="Cliente sem telefone para ligar">
                <Phone className="h-4 w-4" />
            </span>
        );
    }

    return (
        <button
            type="button"
            className={cn(
                "inline-flex rounded-lg p-2 text-sky-600 transition hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50",
                ringing && "animate-pulse bg-sky-50",
                className
            )}
            title={ringing ? "Atenda o seu ramal para falar com o lead" : "Ligar pela API4Com"}
            aria-label="Ligar para o cliente"
            disabled={startCall.isPending}
            onClick={(e) => {
                e.stopPropagation();
                startCall.mutate();
            }}
            onDragStart={(e) => e.stopPropagation()}
        >
            {ringing ? <PhoneCall className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
        </button>
    );
}
