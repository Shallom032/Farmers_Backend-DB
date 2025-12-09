import { Router } from "express";
import { paymentController } from "../controllers/paymentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create payment for order
router.post("/", paymentController.createPayment);

// Get all payments (admin only)
router.get("/", paymentController.getAllPayments);

// Get specific payment
router.get("/:id", paymentController.getPaymentById);

// Get payments for specific order
router.get("/order/:orderId", paymentController.getPaymentsByOrder);

// Approve payment (admin only)
router.put("/:id/approve", paymentController.approvePayment);

// Reject payment (admin only)
router.put("/:id/reject", paymentController.rejectPayment);

// Get pending payments for approval (admin only)
router.get("/pending/approvals", paymentController.getPendingPayments);

export default router;