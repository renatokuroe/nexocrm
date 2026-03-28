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
router.get("/labels", ctrl.listLabels);
router.post("/stages", ctrl.createStage);
router.post("/labels", ctrl.createLabel);
router.put("/stages/:id", ctrl.updateStage);
router.put("/labels/:id", ctrl.updateLabel);
router.delete("/stages/:id", ctrl.deleteStage);
router.delete("/labels/:id", ctrl.deleteLabel);

// Deals
router.post("/deals", ctrl.createDeal);
router.put("/deals/:id", ctrl.updateDeal);
router.put("/deals/:id/labels", ctrl.updateDealLabels);
router.patch("/deals/:id/move", ctrl.moveDeal);
router.delete("/deals/:id", ctrl.deleteDeal);

export default router;
