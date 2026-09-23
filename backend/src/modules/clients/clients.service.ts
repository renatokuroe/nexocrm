// Clients Service - Business logic layer
// Validates, transforms, and delegates to repository

import { NotFoundError } from "../../utils/errors";
import { ClientsRepository } from "./clients.repository";
import type {
    CreateClientDto,
    UpdateClientDto,
    ClientFilters,
} from "./clients.types";

function normalizeDigits(value?: string | null) {
    return (value ?? "").replace(/\D/g, "");
}

// CNPJs arrive with and without leading zeros, so compare them without them.
function normalizeCnpj(value?: string | null) {
    return normalizeDigits(value).replace(/^0+/, "");
}

export class ClientsService {
    private repository: ClientsRepository;

    constructor() {
        this.repository = new ClientsRepository();
    }

    /**
     * Returns a paginated list of clients with applied filters.
     */
    async list(tenantId: string, filters: ClientFilters) {
        const page = Number(filters.page) || 1;
        const limit = Math.min(Number(filters.limit) || 20, 100); // cap at 100
        return this.repository.findAll(tenantId, { ...filters, page, limit });
    }

    /**
     * Returns a single client or throws 404.
     */
    async getById(id: string, tenantId: string) {
        const client = await this.repository.findById(id, tenantId);
        if (!client) {
            throw new NotFoundError(`Client not found`);
        }
        return client;
    }

    /**
     * Creates a new client, or returns the existing one when it is a duplicate
     * (same Google place_id, or same CNPJ and phone within the tenant).
     */
    async create(userId: string, tenantId: string, dto: CreateClientDto) {
        const existing = await this.findDuplicate(tenantId, dto);
        if (existing) {
            if (dto.placeId && !existing.placeId) {
                await this.repository.setPlaceId(existing.id, dto.placeId);
            }
            return { client: await this.getById(existing.id, tenantId), created: false };
        }

        const { segmentIds, customFields, ...clientData } = dto;

        // Convert birthday string to Date if provided
        const data = {
            ...clientData,
            birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        };

        return { client: await this.repository.create(userId, data, segmentIds, customFields), created: true };
    }

    private async findDuplicate(tenantId: string, dto: CreateClientDto) {
        if (dto.placeId) {
            const byPlace = await this.repository.findByPlaceId(tenantId, dto.placeId);
            if (byPlace) return byPlace;
        }

        const cnpj = normalizeCnpj(dto.cnpj);
        if (!cnpj) return null;

        // Chains share a CNPJ across branches, so the phone must match too.
        const phone = normalizeDigits(dto.phone);
        const candidates = await this.repository.findByCnpjSuffix(tenantId, cnpj);
        return candidates.find((candidate) =>
            normalizeCnpj(candidate.cnpj) === cnpj && normalizeDigits(candidate.phone) === phone
        ) ?? null;
    }

    /**
     * Updates an existing client, ensuring it belongs to the user.
     */
    async update(id: string, tenantId: string, dto: UpdateClientDto) {
        // Verify ownership first
        await this.getById(id, tenantId);

        const { segmentIds, customFields, ...clientData } = dto;

        const data = {
            ...clientData,
            birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        };

        return this.repository.update(id, tenantId, data, segmentIds, customFields);
    }

    /**
     * Deletes a client, ensuring it belongs to the user.
     */
    async delete(id: string, tenantId: string) {
        await this.getById(id, tenantId);
        return this.repository.delete(id, tenantId);
    }
}
