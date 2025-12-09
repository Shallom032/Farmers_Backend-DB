// src/controllers/orderController.ts
import { Request, Response } from "express";
import { orderService } from "../services/orderServices";
import { buyerRepository } from "../repository/buyerRepository";
import { farmersRepository } from "../repository/farmersRepository";

export const orderController = {
  createOrder: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.user_id;
      console.log('Order creation - User ID:', userId);

      // Get buyer profile to get buyer_id
      const buyer = await buyerRepository.getByUserId(userId);
      console.log('Buyer profile:', buyer);

      if (!buyer) {
        console.error('No buyer profile found for user_id:', userId);
        return res.status(404).json({ message: 'Buyer profile not found' });
      }

      const buyerId = buyer.buyer_id;
      console.log('Buyer ID:', buyerId);

      const orders = await orderService.createOrderFromCart(buyerId, req.body);
      console.log('Orders created:', orders);
      res.status(201).json({ message: "Orders created successfully", orders });
    } catch (err: any) {
      console.error('Order creation error:', err);
      res.status(400).json({ message: err.message });
    }
  },

  getAllOrders: async (req: Request, res: Response) => {
    try {
      const orders = await orderService.getAllOrders();
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  getOrderById: async (req: Request, res: Response) => {
    try {
      const order = await orderService.getOrderById(+req.params.id);
      res.json(order);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  getMyOrders: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      let orders;

      if (user.role === 'buyer') {
        // Get buyer profile to get buyer_id
        const buyer = await buyerRepository.getByUserId(user.user_id);
        if (!buyer) {
          return res.status(404).json({ message: 'Buyer profile not found' });
        }
        orders = await orderService.getOrdersByBuyer(buyer.buyer_id);
      } else if (user.role === 'farmer') {
        // Get farmer profile to get farmer_id
        const farmer = await farmersRepository.getByUserId(user.user_id);
        if (!farmer) {
          return res.status(404).json({ message: 'Farmer profile not found' });
        }
        orders = await orderService.getOrdersByFarmer(farmer.farmer_id);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  updateOrderStatus: async (req: Request, res: Response) => {
    try {
      const result = await orderService.updateOrderStatus(+req.params.id, req.body.status);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  getOrdersForLogistics: async (req: Request, res: Response) => {
    try {
      const orders = await orderService.getOrdersForLogistics();
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};