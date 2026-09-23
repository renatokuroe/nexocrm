// Pipeline Types
export interface CreateDealDto {
    title: string;
    value?: number;
    closeDate?: string;
    description?: string;
    stageId: string;
    clientId?: string;
}

export interface UpdateDealDto extends Partial<Omit<CreateDealDto, "clientId">> {
    // null unlinks the client from the deal
    clientId?: string | null;
}

export interface MoveDealDto {
    stageId: string;
}

export interface LabelDto {
    name: string;
    color: string;
}

export interface DealLabelAssignmentDto {
    labelId: string;
}

export interface UpdateDealLabelsDto {
    labels: DealLabelAssignmentDto[];
}
