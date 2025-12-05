import { Router } from "express";
import { buyerController } from "../controllers/buyerControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, buyerController.getAllBuyers);
router.get("/:id", authMiddleware, buyerController.getBuyerById);
router.put("/:id", authMiddleware, buyerController.updateBuyer);
router.delete("/:id", authMiddleware, buyerController.deleteBuyer);

export default router;
