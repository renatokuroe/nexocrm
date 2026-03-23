// Auth Service - Business logic layer
// Handles hashing, comparison, token generation

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../config/app.config";
import { ConflictError, UnauthorizedError } from "../../utils/errors";
import { AuthRepository } from "./auth.repository";
import type { LoginDto, RegisterDto, AuthResponse } from "./auth.types";

export class AuthService {
    private repository: AuthRepository;

    constructor() {
        this.repository = new AuthRepository();
    }

    /**
     * Registers a new user.
     * - Checks for duplicate email
     * - Hashes the password with bcrypt (cost factor 12)
     * - Returns JWT + user info
     */
    async register(dto: RegisterDto): Promise<AuthResponse> {
        // Check if email already exists
        const existing = await this.repository.findByEmail(dto.email);
        if (existing) {
            throw new ConflictError("Email already registered");
        }

        // Hash password with bcrypt (12 rounds is the recommended minimum)
        const hashedPassword = await bcrypt.hash(dto.password, 12);

        // Create the user
        const user = await this.repository.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
        });

        // Sign and return a JWT
        const token = this.signToken(user);

        return { token, user };
    }

    /**
     * Authenticates an existing user.
     * - Finds user by email
     * - Compares password with stored hash
     * - Returns JWT + user info
     */
    async login(dto: LoginDto): Promise<AuthResponse> {
        // Fetch account (includes hashed password)
        const user = await this.repository.findByEmail(dto.email);

        // Use a generic message to avoid email enumeration attacks
        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        // Compare plaintext password against bcrypt hash
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const { password: _pwd, ...safeUser } = user;
        const token = this.signToken(safeUser);

        return { token, user: safeUser };
    }

    /**
     * Returns the authenticated user's profile.
     */
    async getMe(userId: string) {
        return this.repository.findById(userId);
    }

    /**
     * Signs a JWT token with user payload.
     */
    private signToken(user: { id: string; name: string; email: string }): string {
        const options: jwt.SignOptions = {
            expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
        };

        return jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            config.jwt.secret,
            options
        );
    }
}
