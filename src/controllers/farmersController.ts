// src/controllers/farmerController.ts
import { Request, Response } from "express";
import { farmerService } from "../services/farmersServices";

export const farmerController = {
  getAllFarmers: async (_req: Request, res: Response) => {
    try {
      const farmers = await farmerService.getAllFarmers();
      res.json(farmers);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  getFarmerById: async (req: Request, res: Response) => {
    try {
      const farmer = await farmerService.getFarmerById(Number(req.params.id));
      res.json(farmer);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  updateFarmer: async (req: Request, res: Response) => {
    try {
      const { location, product } = req.body;

      if (!location && !product) {
        return res.status(400).json({ message: "At least one field (location or product) is required" });
      }

      const result = await farmerService.updateFarmer(Number(req.params.id), { location, product });
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  deleteFarmer: async (req: Request, res: Response) => {
    try {
      const result = await farmerService.deleteFarmer(Number(req.params.id));
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
};
