export interface CreateTenantUserDto {
    name: string;
    email: string;
    password: string;
    companyName: string;
}

export interface UpdateTenantUserDto {
    name?: string;
    email?: string;
    password?: string;
    companyName?: string;
}
