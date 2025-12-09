import { cartService } from '../../../src/services/cartServices';
import { getPool } from '../../../src/db/config';

// Mock dependencies
jest.mock('../../../src/db/config');

const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn()
};

const mockGetPool = getPool as jest.MockedFunction<typeof getPool>;
mockGetPool.mockResolvedValue(mockPool as any);

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      mockPool.query.mockResolvedValue({ recordset: [] }); // No existing item

      const result = await cartService.addToCart(1, 101, 5);

      expect(mockPool.query).toHaveBeenCalledTimes(2); // Check existing + insert
      expect(result).toEqual({ message: 'Item added to cart successfully' });
    });

    it('should update quantity of existing item', async () => {
      mockPool.query.mockResolvedValue({ recordset: [{ cart_id: 1 }] }); // Existing item

      const result = await cartService.addToCart(1, 101, 3);

      expect(mockPool.query).toHaveBeenCalledTimes(2); // Check existing + update
      expect(result).toEqual({ message: 'Cart item quantity updated successfully' });
    });
  });

  describe('getCart', () => {
    it('should return cart items', async () => {
      const mockCartItems = [
        { cart_id: 1, product_id: 101, quantity: 2, name: 'Apple', price: 50 }
      ];
      mockPool.query.mockResolvedValue({ recordset: mockCartItems });

      const result = await cartService.getCart(1);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toEqual(mockCartItems);
    });
  });

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      const result = await cartService.updateCartItem(1, 101, 10);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Cart item updated successfully' });
    });

    it('should remove item when quantity is 0', async () => {
      const result = await cartService.updateCartItem(1, 101, 0);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Item removed from cart' });
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const result = await cartService.removeFromCart(1, 101);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Item removed from cart successfully' });
    });
  });

  describe('clearCart', () => {
    it('should clear entire cart', async () => {
      const result = await cartService.clearCart(1);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Cart cleared successfully' });
    });
  });

  describe('getCartTotal', () => {
    it('should return cart total', async () => {
      mockPool.query.mockResolvedValue({ recordset: [{ total: 250 }] });

      const result = await cartService.getCartTotal(1);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toBe(250);
    });

    it('should return 0 for empty cart', async () => {
      mockPool.query.mockResolvedValue({ recordset: [{}] });

      const result = await cartService.getCartTotal(1);

      expect(result).toBe(0);
    });
  });
});