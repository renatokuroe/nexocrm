export interface CreateTenantUserDto {
    name: string;
    email: string;
    password: string;
}

export interface UpdateTenantUserDto {
    name?: string;
    email?: string;
    password?: string;
}
