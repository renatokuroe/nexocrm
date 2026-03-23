// Domain types that mirror backend entities.
// These interfaces keep data contracts explicit and reusable across modules.

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Segment {
    id: string;
    name: string;
    color: string;
    description?: string;
}

export interface CustomField {
    id: string;
    label: string;
    type: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "BOOLEAN";
    visible: boolean;
    order: number;
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    status: "ACTIVE" | "INACTIVE" | "LEAD";
    leadSource?: string;
    birthday?: string;
    notes?: string;
    createdAt: string;
    segments: { segment: Segment }[];
    customFieldValues: {
        customField: CustomField;
        value: string;
    }[];
}

export interface Stage {
    id: string;
    name: string;
    order: number;
    color: string;
}

export interface Deal {
    id: string;
    title: string;
    value: number;
    closeDate?: string;
    description?: string;
    stageId: string;
    clientId?: string;
    client?: { id: string; name: string; company?: string };
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    completed: boolean;
    clientId?: string;
    client?: { id: string; name: string; company?: string };
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
