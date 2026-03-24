// Clients Module - Type Definitions

export type ClientStatus = "ACTIVE" | "INACTIVE" | "LEAD";

export interface CreateClientDto {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    status?: ClientStatus;
    leadSource?: string;
    birthday?: string;
    notes?: string;
    segmentIds?: string[];
    customFields?: { fieldId: string; value: string }[];
}

export interface UpdateClientDto extends Partial<CreateClientDto> { }

export interface ClientFilters {
    search?: string;
    status?: ClientStatus;
    segmentId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}
