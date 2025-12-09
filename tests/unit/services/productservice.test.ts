import { productService } from '../../../src/services/productServices';
import { productRepository } from '../../../src/repository/productRepository';

// Mock dependencies
jest.mock('../../../src/repository/productRepository');

const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>;

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const productData = { name: 'Apple', price: 50, farmer_id: 1 };
      const productId = 123;
      mockProductRepository.createProduct.mockResolvedValue(productId);

      const result = await productService.createProduct(productData);

      expect(mockProductRepository.createProduct).toHaveBeenCalledWith(productData);
      expect(result).toEqual({ productId, message: 'Product created successfully' });
    });

    it('should throw error on creation failure', async () => {
      const productData = { name: 'Apple', price: 50 };
      const error = new Error('Database error');
      mockProductRepository.createProduct.mockRejectedValue(error);

      await expect(productService.createProduct(productData)).rejects.toThrow('Database error');
    });
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const mockProducts = [{ id: 1 }, { id: 2 }];
      mockProductRepository.getAllProducts.mockResolvedValue(mockProducts as any);

      const result = await productService.getAllProducts();

      expect(mockProductRepository.getAllProducts).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const mockProduct = { id: 1, name: 'Apple' };
      mockProductRepository.getProductById.mockResolvedValue(mockProduct as any);

      const result = await productService.getProductById(1);

      expect(mockProductRepository.getProductById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      mockProductRepository.getProductById.mockResolvedValue(null as any);

      await expect(productService.getProductById(999)).rejects.toThrow('Product not found');
    });
  });

  describe('getProductsByFarmer', () => {
    it('should return products by farmer', async () => {
      const mockProducts = [{ id: 1 }];
      mockProductRepository.getProductsByFarmer.mockResolvedValue(mockProducts as any);

      const result = await productService.getProductsByFarmer(5);

      expect(mockProductRepository.getProductsByFarmer).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockProducts);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const existingProduct = { id: 1, name: 'Apple' };
      const updateData = { price: 60 };
      mockProductRepository.getProductById.mockResolvedValue(existingProduct as any);
      mockProductRepository.updateProduct.mockResolvedValue(undefined as any);

      const result = await productService.updateProduct(1, updateData);

      expect(mockProductRepository.updateProduct).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual({ message: 'Product updated successfully' });
    });

    it('should throw error when product not found', async () => {
      mockProductRepository.getProductById.mockResolvedValue(null as any);

      await expect(productService.updateProduct(999, {})).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const existingProduct = { id: 1 };
      mockProductRepository.getProductById.mockResolvedValue(existingProduct as any);
      mockProductRepository.deleteProduct.mockResolvedValue(undefined as any);

      const result = await productService.deleteProduct(1);

      expect(mockProductRepository.deleteProduct).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });

    it('should throw error when product not found', async () => {
      mockProductRepository.getProductById.mockResolvedValue(null as any);

      await expect(productService.deleteProduct(999)).rejects.toThrow('Product not found');
    });
  });

  describe('searchProducts', () => {
    it('should search products', async () => {
      const mockProducts = [{ id: 1 }];
      mockProductRepository.searchProducts.mockResolvedValue(mockProducts as any);

      const result = await productService.searchProducts('apple', 'fruit');

      expect(mockProductRepository.searchProducts).toHaveBeenCalledWith('apple', 'fruit');
      expect(result).toEqual(mockProducts);
    });
  });
});