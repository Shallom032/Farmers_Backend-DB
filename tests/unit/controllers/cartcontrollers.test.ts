import { Request, Response } from 'express';
import { cartController } from '../../../src/controllers/cartController';
import { cartService } from '../../../src/services/cartServices';
import { buyerRepository } from '../../../src/repository/buyerRepository';

// Mock the services and repositories
jest.mock('../../../src/services/cartServices', () => ({
  cartService: {
    addToCart: jest.fn(),
    getCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    getCartTotal: jest.fn(),
  },
}));

jest.mock('../../../src/repository/buyerRepository', () => ({
  buyerRepository: {
    getByUserId: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Cart Controllers', () => {
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

  describe('addToCart', () => {
    it('should add item to cart successfully with existing buyer profile', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockCartData = { product_id: 10, quantity: 5 };
      const mockResult = { message: 'Item added to cart successfully' };

      mockRequest.body = mockCartData;
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);
      (cartService.addToCart as jest.Mock).mockResolvedValue(mockResult);

      await cartController.addToCart(mockRequest as Request, mockResponse as Response);

      expect(buyerRepository.getByUserId).toHaveBeenCalledWith(1);
      expect(cartService.addToCart).toHaveBeenCalledWith(2, 10, 5);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should create buyer profile if not exists and then add to cart', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 3, user_id: 1 };
      const mockCartData = { product_id: 20, quantity: 3 };

      mockRequest.body = mockCartData;
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock)
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce(mockBuyer); // Second call returns buyer

      (buyerRepository.create as jest.Mock).mockResolvedValue(undefined);
      (cartService.addToCart as jest.Mock).mockResolvedValue({ message: 'Added to cart' });

      await cartController.addToCart(mockRequest as Request, mockResponse as Response);

      expect(buyerRepository.getByUserId).toHaveBeenCalledTimes(2);
      expect(buyerRepository.create).toHaveBeenCalledWith({
        user_id: 1,
        location: 'Unknown',
      });
      expect(cartService.addToCart).toHaveBeenCalledWith(3, 20, 3);
    });

    it('should return 400 for invalid product_id', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockCartData = { quantity: 5 }; // Missing product_id

      mockRequest.body = mockCartData;
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);

      await cartController.addToCart(mockRequest as Request, mockResponse as Response);

      expect(cartService.addToCart).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Product ID and valid quantity required' });
    });

    it('should return 400 for invalid quantity', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockCartData = { product_id: 10, quantity: 0 }; // Invalid quantity

      mockRequest.body = mockCartData;
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);

      await cartController.addToCart(mockRequest as Request, mockResponse as Response);

      expect(cartService.addToCart).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Product ID and valid quantity required' });
    });

    it('should handle buyer profile creation failure', async () => {
      const mockUser = { user_id: 1 };
      mockRequest.body = { product_id: 10, quantity: 2 };
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(null);
      (buyerRepository.create as jest.Mock).mockResolvedValue(undefined);
      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(null); // Still null

      await cartController.addToCart(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to create buyer profile' });
    });

    it('should handle cart service errors', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockCartData = { product_id: 10, quantity: 5 };

      mockRequest.body = mockCartData;
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);
      (cartService.addToCart as jest.Mock).mockRejectedValue(new Error('Product out of stock'));

      await cartController.addToCart(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Product out of stock' });
    });
  });

  describe('getCart', () => {
    it('should get cart items successfully', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockCartItems = [
        { cart_id: 1, product_id: 10, quantity: 2, product_name: 'Tomatoes' },
        { cart_id: 2, product_id: 20, quantity: 1, product_name: 'Maize' },
      ];

      (mockRequest as any).user = mockUser;
      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);
      (cartService.getCart as jest.Mock).mockResolvedValue(mockCartItems);

      await cartController.getCart(mockRequest as Request, mockResponse as Response);

      expect(buyerRepository.getByUserId).toHaveBeenCalledWith(1);
      expect(cartService.getCart).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCartItems);
    });

    it('should return 404 if buyer profile not found', async () => {
      const mockUser = { user_id: 1 };
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(null);

      await cartController.getCart(mockRequest as Request, mockResponse as Response);

      expect(cartService.getCart).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Buyer profile not found' });
    });

    it('should handle cart service errors', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };

      (mockRequest as any).user = mockUser;
      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);
      (cartService.getCart as jest.Mock).mockRejectedValue(new Error('Database error'));

      await cartController.getCart(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity successfully', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockUpdateData = { product_id: 10, quantity: 3 };
      const mockResult = { message: 'Cart item updated successfully' };

      (mockRequest as any).user = mockUser;
      mockRequest.body = mockUpdateData;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);
      (cartService.updateCartItem as jest.Mock).mockResolvedValue(mockResult);

      await cartController.updateCartItem(mockRequest as Request, mockResponse as Response);

      expect(buyerRepository.getByUserId).toHaveBeenCalledWith(1);
      expect(cartService.updateCartItem).toHaveBeenCalledWith(2, 10, 3);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 for invalid product_id', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockUpdateData = { quantity: 3 }; // Missing product_id

      (mockRequest as any).user = mockUser;
      mockRequest.body = mockUpdateData;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);

      await cartController.updateCartItem(mockRequest as Request, mockResponse as Response);

      expect(cartService.updateCartItem).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Product ID and valid quantity required' });
    });

    it('should return 400 for negative quantity', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockUpdateData = { product_id: 10, quantity: -1 };

      (mockRequest as any).user = mockUser;
      mockRequest.body = mockUpdateData;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);

      await cartController.updateCartItem(mockRequest as Request, mockResponse as Response);

      expect(cartService.updateCartItem).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Product ID and valid quantity required' });
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart successfully', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockResult = { message: 'Item removed from cart successfully' };

      (mockRequest as any).user = mockUser;
      mockRequest.params = { productId: '10' };

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);
      (cartService.removeFromCart as jest.Mock).mockResolvedValue(mockResult);

      await cartController.removeFromCart(mockRequest as Request, mockResponse as Response);

      expect(buyerRepository.getByUserId).toHaveBeenCalledWith(1);
      expect(cartService.removeFromCart).toHaveBeenCalledWith(2, 10);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 404 if buyer profile not found', async () => {
      const mockUser = { user_id: 1 };
      (mockRequest as any).user = mockUser;
      mockRequest.params = { productId: '10' };

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(null);

      await cartController.removeFromCart(mockRequest as Request, mockResponse as Response);

      expect(cartService.removeFromCart).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Buyer profile not found' });
    });
  });

  describe('clearCart', () => {
    it('should clear entire cart successfully', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockResult = { message: 'Cart cleared successfully' };

      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);
      (cartService.clearCart as jest.Mock).mockResolvedValue(mockResult);

      await cartController.clearCart(mockRequest as Request, mockResponse as Response);

      expect(buyerRepository.getByUserId).toHaveBeenCalledWith(1);
      expect(cartService.clearCart).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 404 if buyer profile not found', async () => {
      const mockUser = { user_id: 1 };
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(null);

      await cartController.clearCart(mockRequest as Request, mockResponse as Response);

      expect(cartService.clearCart).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Buyer profile not found' });
    });
  });

  describe('getCartTotal', () => {
    it('should get cart total successfully', async () => {
      const mockUser = { user_id: 1 };
      const mockBuyer = { buyer_id: 2, user_id: 1 };
      const mockTotal = 150.75;

      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(mockBuyer);
      (cartService.getCartTotal as jest.Mock).mockResolvedValue(mockTotal);

      await cartController.getCartTotal(mockRequest as Request, mockResponse as Response);

      expect(buyerRepository.getByUserId).toHaveBeenCalledWith(1);
      expect(cartService.getCartTotal).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith({ total: mockTotal });
    });

    it('should return 404 if buyer profile not found', async () => {
      const mockUser = { user_id: 1 };
      (mockRequest as any).user = mockUser;

      (buyerRepository.getByUserId as jest.Mock).mockResolvedValue(null);

      await cartController.getCartTotal(mockRequest as Request, mockResponse as Response);

      expect(cartService.getCartTotal).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Buyer profile not found' });
    });
  });
});