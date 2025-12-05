// src/controllers/logisticsController.ts
import { Request, Response } from "express";
import { logisticsService } from "../services/logisticsServices";

export const logisticsController = {
  getAllLogistics: async (req: Request, res: Response) => {
    try {
      const logistics = await logisticsService.getAllLogistics();
      res.json(logistics);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  getLogisticsById: async (req: Request, res: Response) => {
    try {
      const delivery = await logisticsService.getLogisticsById(+req.params.id);
      res.json(delivery);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  updateLogistics: async (req: Request, res: Response) => {
    try {
      const result = await logisticsService.updateLogistics(+req.params.id, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  deleteLogistics: async (req: Request, res: Response) => {
    try {
      const result = await logisticsService.deleteLogistics(+req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
};
