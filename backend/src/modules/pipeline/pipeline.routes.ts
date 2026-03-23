// Pipeline Routes
import { Router } from "express";
import { PipelineController } from "./pipeline.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const ctrl = new PipelineController();
router.use(authenticate);

// Board (all stages + their deals)
router.get("/board", ctrl.getBoard);

// Stages
router.get("/stages", ctrl.getStages);
router.post("/stages", ctrl.createStage);
router.put("/stages/:id", ctrl.updateStage);
router.delete("/stages/:id", ctrl.deleteStage);

// Deals
router.post("/deals", ctrl.createDeal);
router.put("/deals/:id", ctrl.updateDeal);
router.patch("/deals/:id/move", ctrl.moveDeal);
router.delete("/deals/:id", ctrl.deleteDeal);

export default router;
