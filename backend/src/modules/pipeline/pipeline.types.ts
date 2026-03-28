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
