// Segments Routes
import { Router } from "express";
import { SegmentsController } from "./segments.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const ctrl = new SegmentsController();
router.use(authenticate);

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.delete);

export default router;
