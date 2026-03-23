// Clients Routes

import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const controller = new ClientsController();

// All client routes require authentication
router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
