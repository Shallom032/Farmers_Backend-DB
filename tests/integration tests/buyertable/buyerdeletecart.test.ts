import { cartService } from '../../../src/services/cartServices';
import { testDb } from '../testsetup';

describe('Buyer Cart Integration Tests', () => {
  let buyerUser: any;
  let buyerProfile: any;
  let farmerUser: any;
  let farmerProfile: any;
  let product1: any;
  let product2: any;

  beforeAll(async () => {
    // Create test buyer user and profile
    buyerUser = await testDb.createTestUser({
      full_name: 'John Buyer',
      email: 'john.buyer@test.com',
      password_hash: '$2b$10$hashedpassword',
      role: 'buyer',
      location: 'Nairobi'
    });
    buyerProfile = await testDb.createTestBuyer(buyerUser.user_id, { location: 'Nairobi' });

    // Create test farmer user and profile
    farmerUser = await testDb.createTestUser({
      full_name: 'Jane Farmer',
      email: 'jane.farmer@test.com',
      password_hash: '$2b$10$hashedpassword',
      role: 'farmer',
      location: 'Kiambu'
    });
    farmerProfile = await testDb.createTestFarmer(farmerUser.user_id, {
      location: 'Kiambu',
      product: 'Vegetables'
    });

    // Create test products
    product1 = await testDb.createTestProduct({
      farmer_id: farmerProfile.farmer_id,
      name: 'Tomatoes',
      description: 'Fresh red tomatoes',
      price: 50,
      quantity_available: 100,
      unit: 'kg',
      category: 'vegetables'
    });

    product2 = await testDb.createTestProduct({
      farmer_id: farmerProfile.farmer_id,
      name: 'Carrots',
      description: 'Organic carrots',
      price: 30,
      quantity_available: 50,
      unit: 'kg',
      category: 'vegetables'
    });
  });

  describe('Cart Operations', () => {
    test('should add item to cart successfully', async () => {
      const result = await cartService.addToCart(buyerProfile.buyer_id, product1.product_id, 5);

      expect(result).toEqual({ message: 'Item added to cart successfully' });

      // Verify item was added to database
      const pool = await testDb.connect();
      const cartResult = await pool.request()
        .input('buyer_id', buyerProfile.buyer_id)
        .input('product_id', product1.product_id)
        .query('SELECT * FROM cart WHERE buyer_id = @buyer_id AND product_id = @product_id');

      expect(cartResult.recordset[0]).toBeDefined();
      expect(cartResult.recordset[0].quantity).toBe(5);
    });

    test('should update quantity when adding existing item to cart', async () => {
      // First add 3 items
      await cartService.addToCart(buyerProfile.buyer_id, product2.product_id, 3);

      // Then add 2 more of the same item
      const result = await cartService.addToCart(buyerProfile.buyer_id, product2.product_id, 2);

      expect(result).toEqual({ message: 'Cart item quantity updated successfully' });

      // Verify quantity was updated
      const pool = await testDb.connect();
      const cartResult = await pool.request()
        .input('buyer_id', buyerProfile.buyer_id)
        .input('product_id', product2.product_id)
        .query('SELECT * FROM cart WHERE buyer_id = @buyer_id AND product_id = @product_id');

      expect(cartResult.recordset[0].quantity).toBe(5);
    });

    test('should get cart items with product details', async () => {
      const cartItems = await cartService.getCart(buyerProfile.buyer_id);

      expect(Array.isArray(cartItems)).toBe(true);
      expect(cartItems.length).toBeGreaterThan(0);

      const cartItem = cartItems.find(item => item.product_id === product1.product_id);
      expect(cartItem).toBeDefined();
      expect(cartItem.quantity).toBe(5);
      expect(cartItem.name).toBe('Tomatoes');
      expect(cartItem.price).toBe(50);
      expect(cartItem.farmer_name).toBe('Jane Farmer');
    });

    test('should update cart item quantity', async () => {
      const result = await cartService.updateCartItem(buyerProfile.buyer_id, product1.product_id, 8);

      expect(result).toEqual({ message: 'Cart item updated successfully' });

      // Verify quantity was updated
      const pool = await testDb.connect();
      const cartResult = await pool.request()
        .input('buyer_id', buyerProfile.buyer_id)
        .input('product_id', product1.product_id)
        .query('SELECT * FROM cart WHERE buyer_id = @buyer_id AND product_id = @product_id');

      expect(cartResult.recordset[0].quantity).toBe(8);
    });

    test('should remove item from cart when quantity set to 0', async () => {
      const result = await cartService.updateCartItem(buyerProfile.buyer_id, product1.product_id, 0);

      expect(result).toEqual({ message: 'Item removed from cart' });

      // Verify item was removed
      const pool = await testDb.connect();
      const cartResult = await pool.request()
        .input('buyer_id', buyerProfile.buyer_id)
        .input('product_id', product1.product_id)
        .query('SELECT * FROM cart WHERE buyer_id = @buyer_id AND product_id = @product_id');

      expect(cartResult.recordset.length).toBe(0);
    });

    test('should remove specific item from cart', async () => {
      const result = await cartService.removeFromCart(buyerProfile.buyer_id, product2.product_id);

      expect(result).toEqual({ message: 'Item removed from cart successfully' });

      // Verify item was removed
      const pool = await testDb.connect();
      const cartResult = await pool.request()
        .input('buyer_id', buyerProfile.buyer_id)
        .input('product_id', product2.product_id)
        .query('SELECT * FROM cart WHERE buyer_id = @buyer_id AND product_id = @product_id');

      expect(cartResult.recordset.length).toBe(0);
    });

    test('should clear entire cart', async () => {
      // Add multiple items first
      await cartService.addToCart(buyerProfile.buyer_id, product1.product_id, 2);
      await cartService.addToCart(buyerProfile.buyer_id, product2.product_id, 3);

      const result = await cartService.clearCart(buyerProfile.buyer_id);

      expect(result).toEqual({ message: 'Cart cleared successfully' });

      // Verify cart is empty
      const pool = await testDb.connect();
      const cartResult = await pool.request()
        .input('buyer_id', buyerProfile.buyer_id)
        .query('SELECT * FROM cart WHERE buyer_id = @buyer_id');

      expect(cartResult.recordset.length).toBe(0);
    });

    test('should calculate cart total correctly', async () => {
      // Add items with known prices
      await cartService.addToCart(buyerProfile.buyer_id, product1.product_id, 2); // 2 * 50 = 100
      await cartService.addToCart(buyerProfile.buyer_id, product2.product_id, 3); // 3 * 30 = 90
      // Total should be 190

      const total = await cartService.getCartTotal(buyerProfile.buyer_id);

      expect(total).toBe(190);
    });

    test('should return 0 for empty cart total', async () => {
      // Clear cart first
      await cartService.clearCart(buyerProfile.buyer_id);

      const total = await cartService.getCartTotal(buyerProfile.buyer_id);

      expect(total).toBe(0);
    });
  });
});