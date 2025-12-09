import { Router } from "express";
import { orderController } from "../controllers/orderController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Buyer creates order from cart
router.post("/", orderController.createOrder);

// Get all orders (admin only)
router.get("/", orderController.getAllOrders);

// Get specific order
router.get("/:id", orderController.getOrderById);

// Get orders for current user (buyer/farmer)
router.get("/my/orders", orderController.getMyOrders);

// Update order status (admin/farmer)
router.put("/:id/status", orderController.updateOrderStatus);

// Get orders ready for logistics assignment (admin/logistics)
router.get("/logistics/pending", orderController.getOrdersForLogistics);

// Get farmer's orders
router.get("/farmer", authMiddleware, requireRole(['farmer']), orderController.getMyOrders);

export default router;