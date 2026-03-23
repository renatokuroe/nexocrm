// Pipeline Types
export interface CreateDealDto {
    title: string;
    value?: number;
    closeDate?: string;
    description?: string;
    stageId: string;
    clientId?: string;
}

export interface UpdateDealDto extends Partial<CreateDealDto> { }

export interface MoveDealDto {
    stageId: string;
}
