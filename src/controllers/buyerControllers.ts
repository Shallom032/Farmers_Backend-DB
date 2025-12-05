// src/controllers/buyerController.ts
import { Request, Response } from "express";
import { buyerService } from "../services/buyerServices";

export const buyerController = {
  getAllBuyers: async (req: Request, res: Response) => {
    try {
      const buyers = await buyerService.getAllBuyers();
      res.json(buyers);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  getBuyerById: async (req: Request, res: Response) => {
    try {
      const buyer = await buyerService.getBuyerById(+req.params.id);
      res.json(buyer);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  updateBuyer: async (req: Request, res: Response) => {
    try {
      const result = await buyerService.updateBuyer(+req.params.id, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  deleteBuyer: async (req: Request, res: Response) => {
    try {
      const result = await buyerService.deleteBuyer(+req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
};
