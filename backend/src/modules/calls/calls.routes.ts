import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { CallsController } from "./calls.controller";

const router = Router();
const controller = new CallsController();

// API4Com webhook must stay above authenticate
router.post("/webhook", controller.webhook);

router.use(authenticate);
router.get("/", controller.list);
router.post("/", controller.start);

export default router;
