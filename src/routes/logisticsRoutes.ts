import { Router } from "express";
import { logisticsController } from "../controllers/logisticsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// General logistics management
router.get("/", logisticsController.getAllLogistics);
router.get("/:id", logisticsController.getLogisticsById);
router.post("/", logisticsController.createLogistics);
router.put("/:id", logisticsController.updateLogistics);
router.delete("/:id", logisticsController.deleteLogistics);

// Order assignment (admin/logistics)
router.post("/assign-order", logisticsController.assignOrderToAgent);

// Agent-specific routes
router.get("/agent/my-deliveries", logisticsController.getMyDeliveries);

// Update delivery status
router.put("/:id/status", logisticsController.updateDeliveryStatus);

export default router;
