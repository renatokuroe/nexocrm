// Thin HTTP client for the API4Com voice API (https://developers.api4com.com)

import { config } from "../../config/app.config";
import { AppError } from "../../utils/errors";

// Identifies our calls in API4Com; the webhook integration only forwards calls carrying it.
export const API4COM_GATEWAY = "nexocrm";

async function request<T>(method: string, path: string, body: unknown): Promise<T> {
    if (!config.api4com.token) {
        throw new AppError("Integração com a API4Com não configurada no servidor.", 503);
    }

    let response: Response;
    try {
        response = await fetch(`${config.api4com.apiUrl}${path}`, {
            method,
            headers: {
                // API4Com expects the raw token, without "Bearer"
                Authorization: config.api4com.token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });
    } catch {
        throw new AppError("Não foi possível falar com a API4Com. Tente novamente.", 502);
    }

    const text = await response.text();
    if (!response.ok) {
        console.error(`API4Com ${method} ${path} failed (${response.status}):`, text);
        // Never forward API4Com's 401: the frontend logs the user out on any 401
        throw new AppError(`A API4Com recusou a ligação (erro ${response.status}).`, 502);
    }

    return (text ? JSON.parse(text) : {}) as T;
}

/**
 * Starts a click-to-call: API4Com rings the user's extension and, once answered,
 * dials the lead. Returns the API4Com call id.
 */
export async function startApi4comCall(params: {
    extension: string;
    called: string;
    metadata: Record<string, string>;
}): Promise<string | null> {
    const result = await request<{ id?: string }>("POST", "/calls", {
        caller: params.extension,
        called: params.called,
        extension: params.extension,
        metadata: { gateway: API4COM_GATEWAY, ...params.metadata },
    });
    return result.id ?? null;
}

/**
 * Registers (or updates) the webhook that reports finished calls.
 * Run once per environment:
 *   docker exec nexocrm-backend node -e "require('./dist/modules/calls/api4com.client').configureApi4comWebhook('https://crm.aria.social.br').then(console.log)"
 */
export async function configureApi4comWebhook(publicBaseUrl: string) {
    if (!config.api4com.webhookSecret) {
        throw new Error("API4COM_WEBHOOK_SECRET is not set");
    }

    const webhookUrl = `${publicBaseUrl.replace(/\/$/, "")}/api/calls/webhook?secret=${encodeURIComponent(config.api4com.webhookSecret)}`;
    const result = await request<Record<string, unknown>>("PATCH", "/integrations", {
        gateway: API4COM_GATEWAY,
        webhook: true,
        webhookConstraint: { metadata: { gateway: API4COM_GATEWAY } },
        metadata: {
            webhookUrl,
            webhookVersion: "v1.4",
            webhookTypes: ["channel-hangup"],
        },
    });
    return { ...result, metadata: "(hidden: contains the webhook secret)" };
}
