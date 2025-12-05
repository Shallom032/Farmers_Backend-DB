import { Router } from "express";
import { farmerController } from "../controllers/farmersController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, farmerController.getAllFarmers);
router.get("/:id", authMiddleware, farmerController.getFarmerById);
router.put("/:id", authMiddleware, farmerController.updateFarmer);
router.delete("/:id", authMiddleware, farmerController.deleteFarmer);

export default router;
