// Main Express Application
// Registers all middleware and routes

import express from "express";
import cors from "cors";
import { config } from "./config/app.config";
import { errorHandler } from "./middleware/error.middleware";

// Route modules
import authRoutes from "./modules/auth/auth.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import segmentsRoutes from "./modules/segments/segments.routes";
import customFieldsRoutes from "./modules/custom-fields/custom-fields.routes";
import pipelineRoutes from "./modules/pipeline/pipeline.routes";
import tasksRoutes from "./modules/tasks/tasks.routes";
import reportsRoutes from "./modules/reports/reports.routes";

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────

// CORS: allow requests from the frontend origin
app.use(
    cors({
        origin: config.frontendUrl,
        credentials: true,
    })
);

// Parse JSON request bodies (max 10mb)
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────────────────
const API_PREFIX = "/api";

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/clients`, clientsRoutes);
app.use(`${API_PREFIX}/segments`, segmentsRoutes);
app.use(`${API_PREFIX}/custom-fields`, customFieldsRoutes);
app.use(`${API_PREFIX}/pipeline`, pipelineRoutes);
app.use(`${API_PREFIX}/tasks`, tasksRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);

// 404 handler for unknown routes
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler (must be last) ───────────────────────────────────
app.use(errorHandler);

export default app;
