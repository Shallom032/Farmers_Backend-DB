import { Request, Response } from 'express';
import { productController } from '../../../src/controllers/productController';
import { productService } from '../../../src/services/productServices';
import { farmersRepository } from '../../../src/repository/farmersRepository';

// Mock the services and repositories
jest.mock('../../../src/services/productServices', () => ({
  productService: {
    createProduct: jest.fn(),
    getAllProducts: jest.fn(),
    getProductById: jest.fn(),
    getProductsByFarmer: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    searchProducts: jest.fn(),
  },
}));

jest.mock('../../../src/repository/farmersRepository', () => ({
  farmersRepository: {
    getByUserId: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Product Controllers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create product successfully with existing farmer profile', async () => {
      const mockUser = { user_id: 1 };
      const mockFarmer = { farmer_id: 2, user_id: 1 };
      const mockProductData = {
        name: 'Fresh Tomatoes',
        description: 'Organic tomatoes',
        price: 50,
        stock_quantity: 100,
        quantity_unit: 'kg',
        category: 'Vegetables',
        image_url: 'tomatoes.jpg',
      };

      const mockResult = {
        product_id: 1,
        farmer_id: 2,
        name: 'Fresh Tomatoes',
        message: 'Product created successfully',
      };

      mockRequest.body = mockProductData;
      (mockRequest as any).user = mockUser;

      (farmersRepository.getByUserId as jest.Mock).mockResolvedValue(mockFarmer);
      (productService.createProduct as jest.Mock).mockResolvedValue(mockResult);

      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      expect(farmersRepository.getByUserId).toHaveBeenCalledWith(1);
      expect(productService.createProduct).toHaveBeenCalledWith({
        farmer_id: 2,
        name: 'Fresh Tomatoes',
        description: 'Organic tomatoes',
        price: 50,
        quantity_available: 100,
        unit: 'kg',
        category: 'Vegetables',
        image_url: 'tomatoes.jpg',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should create farmer profile if not exists and then create product', async () => {
      const mockUser = { user_id: 1 };
      const mockFarmer = { farmer_id: 3, user_id: 1 };
      const mockProductData = {
        name: 'Fresh Maize',
        description: 'Yellow maize',
        price: 30,
        stock_quantity: 200,
        quantity_unit: 'bags',
        category: 'Grains',
      };

      mockRequest.body = mockProductData;
      (mockRequest as any).user = mockUser;

      (farmersRepository.getByUserId as jest.Mock)
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce(mockFarmer); // Second call returns farmer

      (farmersRepository.create as jest.Mock).mockResolvedValue(undefined);
      (productService.createProduct as jest.Mock).mockResolvedValue({ product_id: 2 });

      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      expect(farmersRepository.getByUserId).toHaveBeenCalledTimes(2);
      expect(farmersRepository.create).toHaveBeenCalledWith({
        user_id: 1,
        location: 'Unknown',
        product: 'General',
      });
      expect(productService.createProduct).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return 401 if no user authentication', async () => {
      mockRequest.body = { name: 'Test Product' };
      (mockRequest as any).user = undefined;

      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    it('should handle farmer profile creation failure', async () => {
      const mockUser = { user_id: 1 };
      mockRequest.body = { name: 'Test Product' };
      (mockRequest as any).user = mockUser;

      (farmersRepository.getByUserId as jest.Mock).mockResolvedValue(null);
      (farmersRepository.create as jest.Mock).mockResolvedValue(undefined);
      (farmersRepository.getByUserId as jest.Mock).mockResolvedValue(null); // Still null after creation

      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to create farmer profile' });
    });

    it('should handle product creation errors', async () => {
      const mockUser = { user_id: 1 };
      const mockFarmer = { farmer_id: 2, user_id: 1 };
      const mockProductData = { name: 'Test Product' };

      mockRequest.body = mockProductData;
      (mockRequest as any).user = mockUser;

      (farmersRepository.getByUserId as jest.Mock).mockResolvedValue(mockFarmer);
      (productService.createProduct as jest.Mock).mockRejectedValue(new Error('Invalid product data'));

      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid product data' });
    });
  });

  describe('getAllProducts', () => {
    it('should get all products successfully', async () => {
      const mockProducts = [
        { product_id: 1, name: 'Tomatoes', price: 50 },
        { product_id: 2, name: 'Maize', price: 30 },
      ];

      (productService.getAllProducts as jest.Mock).mockResolvedValue(mockProducts);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(productService.getAllProducts).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should handle errors when getting all products', async () => {
      const mockError = new Error('Database connection failed');
      (productService.getAllProducts as jest.Mock).mockRejectedValue(mockError);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database connection failed' });
    });
  });

  describe('getProductById', () => {
    it('should get product by ID successfully', async () => {
      const mockProduct = { product_id: 1, name: 'Tomatoes', price: 50 };
      mockRequest.params = { id: '1' };

      (productService.getProductById as jest.Mock).mockResolvedValue(mockProduct);

      await productController.getProductById(mockRequest as Request, mockResponse as Response);

      expect(productService.getProductById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle product not found', async () => {
      const mockError = new Error('Product not found');
      mockRequest.params = { id: '999' };

      (productService.getProductById as jest.Mock).mockRejectedValue(mockError);

      await productController.getProductById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });
  });

  describe('getMyProducts', () => {
    it('should get products by farmer successfully', async () => {
      const mockProducts = [
        { product_id: 1, name: 'Tomatoes', farmer_id: 2 },
        { product_id: 3, name: 'Cabbage', farmer_id: 2 },
      ];

      (mockRequest as any).user = { farmer_id: 2 };
      (productService.getProductsByFarmer as jest.Mock).mockResolvedValue(mockProducts);

      await productController.getMyProducts(mockRequest as Request, mockResponse as Response);

      expect(productService.getProductsByFarmer).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should handle errors when getting farmer products', async () => {
      const mockError = new Error('Database error');
      (mockRequest as any).user = { farmer_id: 2 };
      (productService.getProductsByFarmer as jest.Mock).mockRejectedValue(mockError);

      await productController.getMyProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const mockUpdateData = { price: 60, quantity_available: 80 };
      const mockResult = { message: 'Product updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      (productService.updateProduct as jest.Mock).mockResolvedValue(mockResult);

      await productController.updateProduct(mockRequest as Request, mockResponse as Response);

      expect(productService.updateProduct).toHaveBeenCalledWith(1, mockUpdateData);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle product update errors', async () => {
      const mockError = new Error('Product not found');
      mockRequest.params = { id: '999' };
      mockRequest.body = { price: 60 };

      (productService.updateProduct as jest.Mock).mockRejectedValue(mockError);

      await productController.updateProduct(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const mockResult = { message: 'Product deleted successfully' };
      mockRequest.params = { id: '1' };

      (productService.deleteProduct as jest.Mock).mockResolvedValue(mockResult);

      await productController.deleteProduct(mockRequest as Request, mockResponse as Response);

      expect(productService.deleteProduct).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle product deletion errors', async () => {
      const mockError = new Error('Product not found');
      mockRequest.params = { id: '999' };

      (productService.deleteProduct as jest.Mock).mockRejectedValue(mockError);

      await productController.deleteProduct(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });
  });

  describe('searchProducts', () => {
    it('should search products with query and category', async () => {
      const mockProducts = [
        { product_id: 1, name: 'Organic Tomatoes', category: 'Vegetables' },
      ];

      mockRequest.query = { q: 'tomatoes', category: 'Vegetables' };
      (productService.searchProducts as jest.Mock).mockResolvedValue(mockProducts);

      await productController.searchProducts(mockRequest as Request, mockResponse as Response);

      expect(productService.searchProducts).toHaveBeenCalledWith('tomatoes', 'Vegetables');
      expect(mockResponse.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should search products with only query', async () => {
      const mockProducts = [
        { product_id: 2, name: 'Yellow Maize', category: 'Grains' },
      ];

      mockRequest.query = { q: 'maize' };
      (productService.searchProducts as jest.Mock).mockResolvedValue(mockProducts);

      await productController.searchProducts(mockRequest as Request, mockResponse as Response);

      expect(productService.searchProducts).toHaveBeenCalledWith('maize', undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should handle search errors', async () => {
      const mockError = new Error('Search failed');
      mockRequest.query = { q: 'test' };
      (productService.searchProducts as jest.Mock).mockRejectedValue(mockError);

      await productController.searchProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Search failed' });
    });
  });
});