// src/controllers/paymentController.ts
import { Request, Response } from "express";
import { paymentService } from "../services/paymentServices";

export const paymentController = {
  createPayment: async (req: Request, res: Response) => {
    try {
      const result = await paymentService.createPayment(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getAllPayments: async (req: Request, res: Response) => {
    try {
      const payments = await paymentService.getAllPayments();
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  getPaymentById: async (req: Request, res: Response) => {
    try {
      const payment = await paymentService.getPaymentById(+req.params.id);
      res.json(payment);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  getPaymentsByOrder: async (req: Request, res: Response) => {
    try {
      const payments = await paymentService.getPaymentsByOrder(+req.params.orderId);
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  approvePayment: async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user.user_id;
      const result = await paymentService.approvePayment(+req.params.id, adminId, req.body.notes);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  rejectPayment: async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user.user_id;
      const result = await paymentService.rejectPayment(+req.params.id, adminId, req.body.notes);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getPendingPayments: async (req: Request, res: Response) => {
    try {
      const payments = await paymentService.getPendingPayments();
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};