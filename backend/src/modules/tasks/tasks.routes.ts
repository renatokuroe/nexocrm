// Tasks Routes
import { Router } from "express";
import { TasksController } from "./tasks.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const ctrl = new TasksController();
router.use(authenticate);

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.patch("/:id/toggle", ctrl.toggle);
router.delete("/:id", ctrl.delete);

export default router;
