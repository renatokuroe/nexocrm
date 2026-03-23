// Prisma Client Singleton
// Prevents multiple instances during development hot-reloads

import { PrismaClient } from "@prisma/client";

/**
 * Extend the NodeJS global type to hold our Prisma instance.
 * This is necessary to avoid creating multiple connections in dev.
 */
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

/**
 * In development, reuse the existing prisma instance stored on `global`.
 * In production, always create a new instance.
 */
export const prisma =
    global.prisma ||
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}
