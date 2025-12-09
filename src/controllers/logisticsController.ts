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

  createLogistics: async (req: Request, res: Response) => {
    try {
      const result = await logisticsService.createLogistics(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  assignOrderToAgent: async (req: Request, res: Response) => {
    try {
      const result = await logisticsService.assignOrderToAgent(req.body.order_id, req.body.delivery_agent_id, req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getMyDeliveries: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      console.log('Get deliveries for user:', user);
      if (user.role !== 'logistics') {
        return res.status(403).json({ message: "Access denied" });
      }
      const deliveries = await logisticsService.getDeliveriesByAgent(user.user_id);
      console.log('Found deliveries:', deliveries);
      res.json(deliveries);
    } catch (err: any) {
      console.error('Error getting deliveries:', err);
      res.status(500).json({ message: err.message });
    }
  },

  updateDeliveryStatus: async (req: Request, res: Response) => {
    try {
      const result = await logisticsService.updateDeliveryStatus(+req.params.id, req.body.status, req.body.notes);
      res.json(result);
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
