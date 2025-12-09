import { Router } from "express";
import { productController } from "../controllers/productController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.get("/", productController.getAllProducts);
router.get("/search", productController.searchProducts);
router.get("/:id", productController.getProductById);

// Protected routes - require authentication
router.use(authMiddleware);

// Farmer-only routes
router.post("/", productController.createProduct);
router.get("/my/products", productController.getMyProducts);
router.get("/my", productController.getMyProducts);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

export default router;