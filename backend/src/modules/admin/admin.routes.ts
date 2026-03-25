import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import { AdminController } from "./admin.controller";

const router = Router();
const ctrl = new AdminController();

router.use(authenticate, requireAdmin);

router.get("/users", ctrl.listUsers);
router.post("/users", ctrl.createUser);
router.put("/users/:id", ctrl.updateUser);
router.delete("/users/:id", ctrl.deleteUser);

export default router;
