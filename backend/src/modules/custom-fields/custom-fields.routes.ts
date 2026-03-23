// Custom Fields Routes
import { Router } from "express";
import { CustomFieldsController } from "./custom-fields.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const ctrl = new CustomFieldsController();
router.use(authenticate);

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/reorder", ctrl.reorder);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.delete);

export default router;
