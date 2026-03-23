// Auth Routes
// Registers all authentication endpoints

import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const controller = new AuthController();

// Public routes (no authentication required)
router.post("/register", controller.register);
router.post("/login", controller.login);

// Protected routes (JWT required)
router.get("/me", authenticate, controller.getMe);

export default router;
