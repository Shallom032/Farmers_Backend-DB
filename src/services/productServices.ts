// src/services/productServices.ts
import { productRepository } from "../repository/productRepository";

export const productService = {
  createProduct: async (productData: any) => {
    console.log('ProductService.createProduct called with:', productData);
    try {
      const productId = await productRepository.createProduct(productData);
      console.log('ProductService: Product created with ID:', productId);
      return { productId, message: "Product created successfully" };
    } catch (error) {
      console.error('ProductService.createProduct error:', error);
      throw error;
    }
  },

  getAllProducts: async () => await productRepository.getAllProducts(),

  getProductById: async (id: number) => {
    const product = await productRepository.getProductById(id);
    if (!product) throw new Error("Product not found");
    return product;
  },

  getProductsByFarmer: async (farmerId: number) => await productRepository.getProductsByFarmer(farmerId),

  updateProduct: async (id: number, productData: any) => {
    const existing = await productRepository.getProductById(id);
    if (!existing) throw new Error("Product not found");

    await productRepository.updateProduct(id, productData);
    return { message: "Product updated successfully" };
  },

  deleteProduct: async (id: number) => {
    const existing = await productRepository.getProductById(id);
    if (!existing) throw new Error("Product not found");

    await productRepository.deleteProduct(id);
    return { message: "Product deleted successfully" };
  },

  searchProducts: async (searchTerm: string, category?: string) => {
    return await productRepository.searchProducts(searchTerm, category);
  }
};