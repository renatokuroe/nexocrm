// Auth Module - Type Definitions
// Shared interfaces for request/response shapes

export interface RegisterDto {
    name: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}
