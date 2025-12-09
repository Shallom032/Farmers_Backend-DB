// src/routes/cartRoutes.ts
import { Router } from "express";
import { cartController } from "../controllers/cartController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = Router();

// All cart routes require authentication and buyer role
router.use(authMiddleware);
router.use(requireRole(['buyer']));

// Cart management routes
router.get("/", cartController.getCart);                    // Get cart items
router.post("/", cartController.addToCart);                 // Add item to cart
router.put("/", cartController.updateCartItem);             // Update cart item quantity
router.delete("/:productId", cartController.removeFromCart); // Remove item from cart
router.delete("/", cartController.clearCart);               // Clear entire cart
router.get("/total", cartController.getCartTotal);          // Get cart total

export default router;