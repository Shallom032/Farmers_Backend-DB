import { Router } from "express";
import { userController } from "../controllers/userControllers";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Protected routes with role restrictions
router.get("/", authMiddleware, requireRole(['admin']), userController.getAllUsers);
router.get("/:id", authMiddleware, userController.getUserById);
router.put("/:id", authMiddleware, userController.updateUser);
router.delete("/:id", authMiddleware, requireRole(['admin']), userController.deleteUser);

export default router;
