// Clients Service - Business logic layer
// Validates, transforms, and delegates to repository

import { NotFoundError } from "../../utils/errors";
import { ClientsRepository } from "./clients.repository";
import type {
    CreateClientDto,
    UpdateClientDto,
    ClientFilters,
} from "./clients.types";

export class ClientsService {
    private repository: ClientsRepository;

    constructor() {
        this.repository = new ClientsRepository();
    }

    /**
     * Returns a paginated list of clients with applied filters.
     */
    async list(userId: string, filters: ClientFilters) {
        const page = Number(filters.page) || 1;
        const limit = Math.min(Number(filters.limit) || 20, 100); // cap at 100
        return this.repository.findAll(userId, { ...filters, page, limit });
    }

    /**
     * Returns a single client or throws 404.
     */
    async getById(id: string, userId: string) {
        const client = await this.repository.findById(id, userId);
        if (!client) {
            throw new NotFoundError(`Client not found`);
        }
        return client;
    }

    /**
     * Creates a new client.
     */
    async create(userId: string, dto: CreateClientDto) {
        const { segmentIds, customFields, ...clientData } = dto;

        // Convert birthday string to Date if provided
        const data = {
            ...clientData,
            birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        };

        return this.repository.create(userId, data, segmentIds, customFields);
    }

    /**
     * Updates an existing client, ensuring it belongs to the user.
     */
    async update(id: string, userId: string, dto: UpdateClientDto) {
        // Verify ownership first
        await this.getById(id, userId);

        const { segmentIds, customFields, ...clientData } = dto;

        const data = {
            ...clientData,
            birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        };

        return this.repository.update(id, userId, data, segmentIds, customFields);
    }

    /**
     * Deletes a client, ensuring it belongs to the user.
     */
    async delete(id: string, userId: string) {
        await this.getById(id, userId);
        return this.repository.delete(id, userId);
    }
}
