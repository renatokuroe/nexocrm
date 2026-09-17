import bcrypt from "bcryptjs";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors";
import { prisma } from "../../prisma/client";
import { seedTenantDefaults } from "./tenant-bootstrap";
import { AdminRepository } from "./admin.repository";
import type { CreateTenantUserDto, UpdateTenantUserDto } from "./admin.types";

export class AdminService {
    private repository = new AdminRepository();

    async listUsers(tenantId: string) {
        return this.repository.listUsers(tenantId);
    }

    async createTenantUser(tenantId: string, dto: CreateTenantUserDto) {
        const existing = await this.repository.findByEmail(dto.email);
        if (existing) {
            throw new ConflictError("Email already registered");
        }

        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const { user } = await this.repository.createTenantUser(tenantId, {
            ...dto,
            password: hashedPassword,
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            companyName: user.tenant.name,
        };
    }

    async updateTenantUser(targetUserId: string, dto: UpdateTenantUserDto) {
        const target = await this.repository.findById(targetUserId);
        if (!target) {
            throw new NotFoundError("User not found");
        }

        if (dto.email && dto.email !== target.email) {
            const emailInUse = await this.repository.findByEmail(dto.email);
            if (emailInUse && emailInUse.id !== targetUserId) {
                throw new ConflictError("Email already registered");
            }
        }

        const password = dto.password?.trim()
            ? await bcrypt.hash(dto.password.trim(), 12)
            : undefined;

        const updated = await this.repository.updateTenantUser(targetUserId, {
            name: dto.name,
            email: dto.email,
            password,
        });

        if (!updated) {
            throw new NotFoundError("User not found");
        }

        return updated;
    }

    async deleteTenantUser(requestedByUserId: string, tenantId: string, targetUserId: string) {
        if (requestedByUserId === targetUserId) {
            throw new ForbiddenError("You cannot delete your own admin user");
        }

        const target = await this.repository.findById(targetUserId);
        if (!target || target.tenantId !== tenantId) {
            throw new NotFoundError("User not found");
        }

        if (target.role === "ADMIN") {
            throw new ForbiddenError("Admin users cannot be deleted");
        }

        await this.repository.deleteTenantUser(targetUserId);
    }
}
