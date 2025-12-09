import { Router } from "express";
import { uploadController } from "../controllers/uploadController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Upload routes - require authentication
router.post("/product-image", authMiddleware, uploadController.uploadProductImage);
router.delete("/product-image/:filename", authMiddleware, uploadController.deleteProductImage);

export default router;