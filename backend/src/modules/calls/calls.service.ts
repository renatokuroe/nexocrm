import { BadRequestError, NotFoundError } from "../../utils/errors";
import { startApi4comCall } from "./api4com.client";
import { CallsRepository, type CallStatus } from "./calls.repository";

// Subset of the API4Com "channel-hangup" webhook we rely on
export interface Api4comHangupEvent {
    eventType?: string;
    id?: string;
    answeredAt?: string | null;
    duration?: number | string | null;
    hangupCause?: string | null;
    recordUrl?: string | null;
    metadata?: { callId?: string } | null;
}

const statusRank: Record<CallStatus, number> = { DIALING: 0, FAILED: 1, NOT_ANSWERED: 2, BUSY: 2, ANSWERED: 3 };

/**
 * Converts a stored Brazilian phone into E.164 (+55DDDNUMBER).
 * Accepts numbers with or without country code, trunk zero or formatting.
 */
export function toE164BrazilPhone(raw: string | null | undefined): string | null {
    let digits = (raw || "").replace(/\D/g, "").replace(/^0+/, "");
    if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
        digits = digits.slice(2);
    }
    if (digits.length !== 10 && digits.length !== 11) return null;
    return `+55${digits}`;
}

function statusFromHangup(event: Api4comHangupEvent, duration: number): CallStatus {
    const cause = (event.hangupCause || "").toUpperCase();
    if (cause === "USER_BUSY") return "BUSY";
    if (event.answeredAt && duration > 0) return "ANSWERED";
    if (["NO_ANSWER", "NO_USER_RESPONSE", "ORIGINATOR_CANCEL", "NORMAL_CLEARING"].includes(cause)) return "NOT_ANSWERED";
    return "FAILED";
}

export class CallsService {
    private repository = new CallsRepository();

    async start(userId: string, tenantId: string, body: { clientId?: string; dealId?: string | null }) {
        if (!body.clientId) throw new BadRequestError("Cliente não informado.");

        const extension = await this.repository.findUserExtension(userId);
        if (!extension) {
            throw new BadRequestError("Seu usuário não tem ramal da API4Com. Peça ao administrador para cadastrar em Admin > Usuários.");
        }

        const client = await this.repository.findClient(body.clientId, tenantId);
        if (!client) throw new NotFoundError("Cliente não encontrado.");

        const phone = toE164BrazilPhone(client.phone);
        if (!phone) throw new BadRequestError("O cliente não tem um telefone válido (DDD + número).");

        const dealId = body.dealId && (await this.repository.findDeal(body.dealId, tenantId)) ? body.dealId : null;
        const call = await this.repository.create({ userId, clientId: client.id, dealId, phone });

        try {
            const api4comId = await startApi4comCall({
                extension,
                called: phone,
                metadata: { callId: call.id, clientId: client.id, userId },
            });
            return this.repository.update(call.id, { api4comId });
        } catch (error) {
            await this.repository.update(call.id, {
                status: "FAILED",
                hangupCause: error instanceof Error ? error.message.slice(0, 190) : "Erro desconhecido",
                endedAt: new Date(),
            });
            throw error;
        }
    }

    async listByClient(clientId: string | undefined, tenantId: string) {
        if (!clientId) throw new BadRequestError("clientId is required");
        return this.repository.listByClient(clientId, tenantId);
    }

    /**
     * Applies a "channel-hangup" event. Click-to-call has two legs (user extension and lead),
     * so the same call may be reported more than once: keep the best status, the longest
     * duration and any recording.
     */
    async handleWebhook(event: Api4comHangupEvent) {
        const callId = event.metadata?.callId;
        if (event.eventType !== "channel-hangup" || !callId) return;

        const call = await this.repository.findById(callId);
        if (!call) return;

        const duration = Math.max(0, Math.round(Number(event.duration) || 0));
        const status = statusFromHangup(event, duration);
        const endedAt = new Date();
        const keepStatus = statusRank[call.status] > statusRank[status];

        await this.repository.update(call.id, {
            status: keepStatus ? call.status : status,
            hangupCause: keepStatus ? call.hangupCause : event.hangupCause || null,
            duration: Math.max(call.duration ?? 0, duration),
            recordUrl: event.recordUrl || call.recordUrl,
            // API4Com sends local timestamps without a timezone, so derive them from arrival time
            answeredAt: call.answeredAt ?? (status === "ANSWERED" ? new Date(endedAt.getTime() - duration * 1000) : null),
            endedAt,
        });
    }
}
