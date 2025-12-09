import { productRepository } from '../../../src/repository/productRepository';
import { getPool } from '../../../src/db/config';

// Mock dependencies
jest.mock('../../../src/db/config');

const mockGetPool = getPool as jest.MockedFunction<typeof getPool>;
const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn()
};
mockGetPool.mockResolvedValue(mockPool as any);

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('ProductRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const productData = {
        farmer_id: 1,
        name: 'Apple',
        description: 'Fresh apples',
        price: 50,
        quantity_available: 100,
        unit: 'kg',
        category: 'fruit',
        image_url: 'image.jpg'
      };
      mockPool.query.mockResolvedValue({ recordset: [{ product_id: 123 }] });

      const result = await productRepository.createProduct(productData);

      expect(mockConsoleLog).toHaveBeenCalledWith('ProductRepository.createProduct called with:', productData);
      expect(result).toBe(123);
    });

    it('should handle creation error', async () => {
      const productData = { farmer_id: 1, name: 'Apple', price: 50, quantity_available: 100, unit: 'kg' };
      const error = new Error('Database error');
      mockPool.query.mockRejectedValue(error);

      await expect(productRepository.createProduct(productData)).rejects.toThrow('Database error');
      expect(mockConsoleError).toHaveBeenCalledWith('ProductRepository.createProduct error:', error);
    });
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const mockProducts = [{ product_id: 1 }, { product_id: 2 }];
      mockPool.query.mockResolvedValue({ recordset: mockProducts });

      const result = await productRepository.getAllProducts();

      expect(result).toEqual(mockProducts);
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const mockProduct = { product_id: 1, name: 'Apple' };
      mockPool.query.mockResolvedValue({ recordset: [mockProduct] });

      const result = await productRepository.getProductById(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getProductsByFarmer', () => {
    it('should return products by farmer', async () => {
      const mockProducts = [{ product_id: 1, farmer_id: 5 }];
      mockPool.query.mockResolvedValue({ recordset: mockProducts });

      const result = await productRepository.getProductsByFarmer(5);

      expect(mockPool.input).toHaveBeenCalledWith('farmer_id', 5);
      expect(result).toEqual(mockProducts);
    });
  });

  describe('updateProduct', () => {
    it('should update product with provided fields', async () => {
      const updateData = { name: 'New Apple', price: 60 };

      await productRepository.updateProduct(1, updateData);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('name', 'New Apple');
      expect(mockPool.input).toHaveBeenCalledWith('price', 60);
    });

    it('should not update if no fields provided', async () => {
      await productRepository.updateProduct(1, {});

      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product', async () => {
      await productRepository.deleteProduct(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.query).toHaveBeenCalledWith('UPDATE products SET is_active = 0 WHERE product_id = @id');
    });
  });

  describe('searchProducts', () => {
    it('should search products without category', async () => {
      const mockProducts = [{ product_id: 1, name: 'Apple' }];
      mockPool.query.mockResolvedValue({ recordset: mockProducts });

      const result = await productRepository.searchProducts('apple');

      expect(mockPool.input).toHaveBeenCalledWith('search', '%apple%');
      expect(result).toEqual(mockProducts);
    });

    it('should search products with category', async () => {
      const mockProducts = [{ product_id: 1, name: 'Apple', category: 'fruit' }];
      mockPool.query.mockResolvedValue({ recordset: mockProducts });

      const result = await productRepository.searchProducts('apple', 'fruit');

      expect(mockPool.input).toHaveBeenCalledWith('search', '%apple%');
      expect(mockPool.input).toHaveBeenCalledWith('category', 'fruit');
      expect(result).toEqual(mockProducts);
    });
  });
});