import { Router } from "express";
import { authControllers } from "../controllers/authControllers"; // plural
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.post("/register", authControllers.register); // auto-verify inside controller
router.post("/login", authControllers.login);

// Protected routes
router.get("/profile", authMiddleware, authControllers.getProfile);

export default router;
