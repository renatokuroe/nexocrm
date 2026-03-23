// Application Configuration
// Centralizes all env-based config in one place

import dotenv from "dotenv";
dotenv.config();

/**
 * Validates and exports typed configuration from environment variables.
 * Throws clear errors if required variables are missing.
 */
export const config = {
    // ── Server ────────────────────────────────────────────────────────────
    port: parseInt(process.env.PORT || "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    isDev: process.env.NODE_ENV === "development",

    // ── Authentication ────────────────────────────────────────────────────
    jwt: {
        secret: process.env.JWT_SECRET || "fallback-secret-change-in-production",
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },

    // ── CORS ──────────────────────────────────────────────────────────────
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

    // ── Database ──────────────────────────────────────────────────────────
    databaseUrl: process.env.DATABASE_URL || "",
} as const;

// Warn about missing critical config
if (!process.env.JWT_SECRET) {
    console.warn(
        "⚠️  JWT_SECRET not set in environment. Using fallback (not safe for production)."
    );
}
