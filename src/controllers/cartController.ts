// src/controllers/cartController.ts
import { Request, Response } from "express";
import { cartService } from "../services/cartServices";
import { buyerRepository } from "../repository/buyerRepository";

export const cartController = {
  // Add item to cart
  addToCart: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.user_id;
      console.log('Cart add request - User ID:', userId);

      // Get buyer profile to get buyer_id
      let buyer = await buyerRepository.getByUserId(userId);
      console.log('Buyer profile:', buyer);

      if (!buyer) {
        console.log('No buyer profile found for user_id:', userId, '- creating one');
        // Auto-create buyer profile if missing
        await buyerRepository.create({ user_id: userId, location: 'Unknown' });
        buyer = await buyerRepository.getByUserId(userId);
        console.log('Created buyer profile:', buyer);
      }

      if (!buyer) {
        console.error('Failed to create buyer profile for user_id:', userId);
        return res.status(500).json({ message: 'Failed to create buyer profile' });
      }

      const buyerId = buyer.buyer_id;
      console.log('Buyer ID:', buyerId);

      const { product_id, quantity } = req.body;

      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Product ID and valid quantity required" });
      }

      const result = await cartService.addToCart(buyerId, product_id, quantity);
      res.status(201).json(result);
    } catch (err: any) {
      console.error('Cart addToCart error:', err);
      res.status(400).json({ message: err.message });
    }
  },

  // Get cart items for buyer
  getCart: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.user_id;
      const buyer = await buyerRepository.getByUserId(userId);

      if (!buyer) {
        return res.status(404).json({ message: 'Buyer profile not found' });
      }

      const cartItems = await cartService.getCart(buyer.buyer_id);
      res.json(cartItems);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.user_id;
      const buyer = await buyerRepository.getByUserId(userId);

      if (!buyer) {
        return res.status(404).json({ message: 'Buyer profile not found' });
      }

      const { product_id, quantity } = req.body;

      if (!product_id || quantity < 0) {
        return res.status(400).json({ message: "Product ID and valid quantity required" });
      }

      const result = await cartService.updateCartItem(buyer.buyer_id, product_id, quantity);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  // Remove item from cart
  removeFromCart: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.user_id;
      const buyer = await buyerRepository.getByUserId(userId);

      if (!buyer) {
        return res.status(404).json({ message: 'Buyer profile not found' });
      }

      const productId = +req.params.productId;

      const result = await cartService.removeFromCart(buyer.buyer_id, productId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  // Clear entire cart
  clearCart: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.user_id;
      const buyer = await buyerRepository.getByUserId(userId);

      if (!buyer) {
        return res.status(404).json({ message: 'Buyer profile not found' });
      }

      const result = await cartService.clearCart(buyer.buyer_id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get cart total
  getCartTotal: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.user_id;
      const buyer = await buyerRepository.getByUserId(userId);

      if (!buyer) {
        return res.status(404).json({ message: 'Buyer profile not found' });
      }

      const total = await cartService.getCartTotal(buyer.buyer_id);
      res.json({ total });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};