import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import { CadencesController } from "./cadences.controller";

const router = Router();
const controller = new CadencesController();

router.use(authenticate);
router.get("/", controller.list);
router.post("/", requireAdmin, controller.create);
router.post("/:id/enroll", controller.enroll);

export default router;