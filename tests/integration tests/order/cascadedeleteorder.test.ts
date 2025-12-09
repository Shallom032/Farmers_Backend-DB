import { orderService } from '../../../src/services/orderServices';
import { testDb } from '../testsetup';

describe('Order Cascade Delete Integration Tests', () => {
  let farmerUser: any;
  let farmerProfile: any;
  let buyerUser: any;
  let buyerProfile: any;
  let testOrder: any;
  let orderItems: any[];

  beforeAll(async () => {
    // Create farmer
    farmerUser = await testDb.createTestUser({
      full_name: 'Cascade Farmer',
      email: 'cascade.farmer@test.com',
      password_hash: '$2b$10$hashedpassword',
      role: 'farmer',
      location: 'Nakuru'
    });
    farmerProfile = await testDb.createTestFarmer(farmerUser.user_id, {
      location: 'Nakuru',
      product: 'Fruits'
    });

    // Create buyer
    buyerUser = await testDb.createTestUser({
      full_name: 'Cascade Buyer',
      email: 'cascade.buyer@test.com',
      password_hash: '$2b$10$hashedpassword',
      role: 'buyer',
      location: 'Nairobi'
    });
    buyerProfile = await testDb.createTestBuyer(buyerUser.user_id, { location: 'Nairobi' });

    // Create products
    const product1 = await testDb.createTestProduct({
      farmer_id: farmerProfile.farmer_id,
      name: 'Apples',
      price: 50,
      quantity_available: 100,
      unit: 'kg'
    });

    const product2 = await testDb.createTestProduct({
      farmer_id: farmerProfile.farmer_id,
      name: 'Oranges',
      price: 40,
      quantity_available: 80,
      unit: 'kg'
    });

    // Add items to cart
    await testDb.createTestCartItem({
      buyer_id: buyerProfile.buyer_id,
      product_id: product1.product_id,
      quantity: 5
    });

    await testDb.createTestCartItem({
      buyer_id: buyerProfile.buyer_id,
      product_id: product2.product_id,
      quantity: 3
    });

    // Create order from cart
    const createdOrders = await orderService.createOrderFromCart(buyerProfile.buyer_id, {
      delivery_address: '456 Cascade Street',
      delivery_city: 'Nairobi',
      delivery_phone: '0723456789',
      notes: 'Test cascade delete'
    });

    testOrder = createdOrders[0];
    orderItems = createdOrders[0].items;
  });

  describe('Order Creation and Data Relationships', () => {
    test('should create order with related order items', async () => {
      expect(testOrder).toBeDefined();
      expect(testOrder.orderId).toBeDefined();
      expect(orderItems).toBeDefined();
      expect(orderItems.length).toBe(2);

      // Verify order was created
      const order = await orderService.getOrderById(testOrder.orderId);
      expect(order[0].buyer_id).toBe(buyerProfile.buyer_id);
      expect(order[0].farmer_id).toBe(farmerProfile.farmer_id);
      expect(order[0].status).toBe('pending');
    });

    test('should clear cart after order creation', async () => {
      const pool = await testDb.connect();
      const cartResult = await pool.request()
        .input('buyer_id', buyerProfile.buyer_id)
        .query('SELECT * FROM cart WHERE buyer_id = @buyer_id');

      expect(cartResult.recordset.length).toBe(0);
    });

    test('should create order items with correct relationships', async () => {
      const pool = await testDb.connect();
      const itemsResult = await pool.request()
        .input('order_id', testOrder.orderId)
        .query('SELECT * FROM order_items WHERE order_id = @order_id');

      expect(itemsResult.recordset.length).toBe(2);

      // Verify item details
      const item1 = itemsResult.recordset.find((item: any) => item.quantity === 5);
      const item2 = itemsResult.recordset.find((item: any) => item.quantity === 3);

      expect(item1).toBeDefined();
      expect(item2).toBeDefined();
      expect(item1.unit_price).toBe(50); // Apples price
      expect(item2.unit_price).toBe(40); // Oranges price
    });
  });

  describe('Order Status Updates', () => {
    test('should update order status correctly', async () => {
      const result = await orderService.updateOrderStatus(testOrder.orderId, 'confirmed');

      expect(result.message).toContain('updated successfully');

      // Verify status update
      const updatedOrder = await orderService.getOrderById(testOrder.orderId);
      expect(updatedOrder[0].status).toBe('confirmed');
    });

    test('should handle multiple status transitions', async () => {
      // Update to shipped
      await orderService.updateOrderStatus(testOrder.orderId, 'shipped');
      let order = await orderService.getOrderById(testOrder.orderId);
      expect(order[0].status).toBe('shipped');

      // Update to delivered
      await orderService.updateOrderStatus(testOrder.orderId, 'delivered');
      order = await orderService.getOrderById(testOrder.orderId);
      expect(order[0].status).toBe('delivered');
    });
  });

  describe('Order Retrieval and Filtering', () => {
    test('should retrieve orders by buyer', async () => {
      const buyerOrders = await orderService.getOrdersByBuyer(buyerProfile.buyer_id);

      expect(Array.isArray(buyerOrders)).toBe(true);
      expect(buyerOrders.length).toBeGreaterThan(0);

      const order = buyerOrders.find(o => o.order_id === testOrder.orderId);
      expect(order).toBeDefined();
      expect(order.buyer_id).toBe(buyerProfile.buyer_id);
    });

    test('should retrieve orders by farmer', async () => {
      const farmerOrders = await orderService.getOrdersByFarmer(farmerProfile.farmer_id);

      expect(Array.isArray(farmerOrders)).toBe(true);
      expect(farmerOrders.length).toBeGreaterThan(0);

      const order = farmerOrders.find(o => o.order_id === testOrder.orderId);
      expect(order).toBeDefined();
      expect(order.farmer_id).toBe(farmerProfile.farmer_id);
    });

    test('should retrieve all orders for admin view', async () => {
      const allOrders = await orderService.getAllOrders();

      expect(Array.isArray(allOrders)).toBe(true);
      expect(allOrders.length).toBeGreaterThan(0);

      const order = allOrders.find(o => o.order_id === testOrder.orderId);
      expect(order).toBeDefined();
    });

    test('should retrieve orders ready for logistics', async () => {
      // Update order to confirmed status (ready for logistics)
      await orderService.updateOrderStatus(testOrder.orderId, 'confirmed');

      const logisticsOrders = await orderService.getOrdersForLogistics();

      expect(Array.isArray(logisticsOrders)).toBe(true);
      const logisticsOrder = logisticsOrders.find(o => o.order_id === testOrder.orderId);
      expect(logisticsOrder).toBeDefined();
      expect(logisticsOrder.status).toBe('confirmed');
    });
  });

  describe('Data Integrity and Constraints', () => {
    test('should maintain referential integrity', async () => {
      const pool = await testDb.connect();

      // Check that order items reference valid orders
      const integrityResult = await pool.request().query(`
        SELECT oi.order_item_id, oi.order_id, o.order_id as order_exists
        FROM order_items oi
        LEFT JOIN orders o ON oi.order_id = o.order_id
        WHERE o.order_id IS NULL
      `);

      expect(integrityResult.recordset.length).toBe(0); // No orphaned order items
    });

    test('should validate order data consistency', async () => {
      const pool = await testDb.connect();

      // Check that order total matches sum of order items
      const consistencyResult = await pool.request()
        .input('order_id', testOrder.orderId)
        .query(`
          SELECT
            o.total_amount as order_total,
            SUM(oi.total_price) as items_total
          FROM orders o
          LEFT JOIN order_items oi ON o.order_id = oi.order_id
          WHERE o.order_id = @order_id
          GROUP BY o.total_amount
        `);

      const result = consistencyResult.recordset[0];
      expect(result.order_total).toBe(result.items_total);
    });

    test('should handle invalid order operations', async () => {
      // Try to get non-existent order
      await expect(orderService.getOrderById(99999)).rejects.toThrow('Order not found');

      // Try to update non-existent order
      await expect(orderService.updateOrderStatus(99999, 'confirmed')).rejects.toThrow('Order not found');
    });
  });
});