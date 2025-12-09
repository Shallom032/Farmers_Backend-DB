// src/controllers/productController.ts
import { Request, Response } from "express";
import { productService } from "../services/productServices";
import { farmersRepository } from "../repository/farmersRepository";

export const productController = {
  createProduct: async (req: Request, res: Response) => {
    try {
      console.log('Product creation request received');
      console.log('User from auth:', (req as any).user);
      console.log('Request body:', req.body);

      const userId = (req as any).user.user_id;
      console.log('User ID:', userId);

      if (!userId) {
        console.error('No user_id found in user object');
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get farmer profile to get farmer_id
      let farmer = await farmersRepository.getByUserId(userId);
      console.log('Farmer profile:', farmer);

      if (!farmer) {
        console.log('No farmer profile found for user_id:', userId, '- creating one');
        // Auto-create farmer profile if missing
        await farmersRepository.create({ user_id: userId, location: 'Unknown', product: 'General' });
        farmer = await farmersRepository.getByUserId(userId);
        console.log('Created farmer profile:', farmer);
      }

      if (!farmer) {
        console.error('Failed to create farmer profile for user_id:', userId);
        return res.status(500).json({ message: 'Failed to create farmer profile' });
      }

      const farmerId = farmer.farmer_id;
      console.log('Farmer ID:', farmerId);

      // Map frontend field names to database column names
      const productData = {
        farmer_id: farmerId,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        quantity_available: req.body.stock_quantity,
        unit: req.body.quantity_unit,
        category: req.body.category,
        image_url: req.body.image_url
      };
      console.log('Product data to create:', productData);

      const result = await productService.createProduct(productData);
      console.log('Product created successfully:', result);
      res.status(201).json(result);
    } catch (err: any) {
      console.error('Error in createProduct controller:', err);
      res.status(400).json({ message: err.message });
    }
  },

  getAllProducts: async (req: Request, res: Response) => {
    try {
      const products = await productService.getAllProducts();
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  getProductById: async (req: Request, res: Response) => {
    try {
      const product = await productService.getProductById(+req.params.id);
      res.json(product);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  getMyProducts: async (req: Request, res: Response) => {
    try {
      const farmerId = (req as any).user.farmer_id;
      const products = await productService.getProductsByFarmer(farmerId);
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  updateProduct: async (req: Request, res: Response) => {
    try {
      const result = await productService.updateProduct(+req.params.id, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  deleteProduct: async (req: Request, res: Response) => {
    try {
      const result = await productService.deleteProduct(+req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  searchProducts: async (req: Request, res: Response) => {
    try {
      const { q: searchTerm, category } = req.query;
      const products = await productService.searchProducts(
        searchTerm as string,
        category as string
      );
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};