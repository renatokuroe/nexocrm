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
    port: parseInt(process.env.PORT || process.env.API_PORT || "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    isDev: process.env.NODE_ENV === "development",

    // ── Authentication ────────────────────────────────────────────────────
    jwt: {
        secret: process.env.JWT_SECRET || "fallback-secret-change-in-production",
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },

    // ── CORS ──────────────────────────────────────────────────────────────
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

    // ── API4Com (click-to-call) ───────────────────────────────────────────
    api4com: {
        apiUrl: process.env.API4COM_API_URL || "https://api.api4com.com/api/v1",
        token: process.env.API4COM_API_TOKEN || "",
        // Shared secret sent by API4Com as ?secret= on the webhook URL
        webhookSecret: process.env.API4COM_WEBHOOK_SECRET || "",
    },

    // ── Database ──────────────────────────────────────────────────────────
    databaseUrl: process.env.DATABASE_URL || "",
} as const;

// Warn about missing critical config
if (!process.env.JWT_SECRET) {
    console.warn(
        "⚠️  JWT_SECRET not set in environment. Using fallback (not safe for production)."
    );
}
