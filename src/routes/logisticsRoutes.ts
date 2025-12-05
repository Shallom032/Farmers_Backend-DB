import { Router } from "express";
import { logisticsController } from "../controllers/logisticsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, logisticsController.getAllLogistics);
router.get("/:id", authMiddleware, logisticsController.getLogisticsById);
router.put("/:id", authMiddleware, logisticsController.updateLogistics);
router.delete("/:id", authMiddleware, logisticsController.deleteLogistics);

export default router;
