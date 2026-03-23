// Server Entry Point
// Starts the HTTP server and connects to the database

import "dotenv/config";
import app from "./app";
import { config } from "./config/app.config";
import { prisma } from "./prisma/client";

async function bootstrap() {
    try {
        // Test database connection on startup
        await prisma.$connect();
        console.log("✅ Database connected");

        // Start Express server
        const server = app.listen(config.port, () => {
            console.log(`🚀 NexoCRM API running at http://localhost:${config.port}`);
            console.log(`📚 Environment: ${config.nodeEnv}`);
        });

        // Graceful shutdown on termination signals
        const shutdown = async () => {
            console.log("\n🛑 Shutting down gracefully...");
            server.close(async () => {
                await prisma.$disconnect();
                console.log("✅ Database disconnected");
                process.exit(0);
            });
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

bootstrap();
