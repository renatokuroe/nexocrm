// Reports Routes
import { Router } from "express";
import { ReportsController } from "./reports.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const ctrl = new ReportsController();
router.use(authenticate);

router.get("/dashboard", ctrl.getDashboard);

export default router;
