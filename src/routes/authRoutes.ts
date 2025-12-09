import { Router } from "express";
import { authControllers } from "../controllers/authControllers"; // plural
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.post("/register", authControllers.register);
router.post("/login", authControllers.login);
router.get("/verify-email", authControllers.verifyEmail);

// Protected routes
router.get("/profile", authMiddleware, authControllers.getProfile);

export default router;
