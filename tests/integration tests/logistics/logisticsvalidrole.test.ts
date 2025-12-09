import { logisticsService } from '../../../src/services/logisticsServices';
import { orderService } from '../../../src/services/orderServices';
import { testDb } from '../testsetup';

describe('Logistics Valid Role Integration Tests', () => {
  let logisticsUser: any;
  let logisticsProfile: any;
  let farmerUser: any;
  let farmerProfile: any;
  let buyerUser: any;
  let buyerProfile: any;
  let testOrder: any;
  let testProduct: any;

  beforeAll(async () => {
    // Create logistics user
    logisticsUser = await testDb.createTestUser({
      full_name: 'Logistics Agent',
      email: 'logistics@test.com',
      password_hash: '$2b$10$hashedpassword',
      role: 'logistics',
      location: 'Nairobi'
    });

    // Create farmer
    farmerUser = await testDb.createTestUser({
      full_name: 'Test Farmer',
      email: 'farmer@test.com',
      password_hash: '$2b$10$hashedpassword',
      role: 'farmer',
      location: 'Kiambu'
    });
    farmerProfile = await testDb.createTestFarmer(farmerUser.user_id, {
      location: 'Kiambu',
      product: 'Vegetables'
    });

    // Create buyer
    buyerUser = await testDb.createTestUser({
      full_name: 'Test Buyer',
      email: 'buyer@test.com',
      password_hash: '$2b$10$hashedpassword',
      role: 'buyer',
      location: 'Nairobi'
    });
    buyerProfile = await testDb.createTestBuyer(buyerUser.user_id, { location: 'Nairobi' });

    // Create product
    testProduct = await testDb.createTestProduct({
      farmer_id: farmerProfile.farmer_id,
      name: 'Delivery Test Product',
      price: 100,
      quantity_available: 10,
      unit: 'kg'
    });

    // Create order
    testOrder = await testDb.createTestOrder({
      buyer_id: buyerProfile.buyer_id,
      farmer_id: farmerProfile.farmer_id,
      total_amount: 500,
      delivery_address: '123 Test Street',
      delivery_city: 'Nairobi',
      delivery_phone: '0712345678',
      status: 'confirmed'
    });
  });

  describe('Logistics Agent Operations', () => {
    test('should allow logistics agent to assign order to themselves', async () => {
      const logisticsData = {
        pickup_location: 'Kiambu Farm',
        dropoff_location: 'Nairobi Warehouse',
        delivery_date: new Date('2024-12-15'),
        estimated_delivery: new Date('2024-12-16'),
        notes: 'Handle with care'
      };

      const result = await logisticsService.assignOrderToAgent(
        testOrder.order_id,
        logisticsUser.user_id,
        logisticsData
      );

      expect(result.logisticsId).toBeDefined();
      expect(result.message).toContain('assigned to delivery agent');

      // Verify logistics entry was created
      const pool = await testDb.connect();
      const logisticsResult = await pool.request()
        .input('order_id', testOrder.order_id)
        .query('SELECT * FROM logistics WHERE order_id = @order_id');

      expect(logisticsResult.recordset.length).toBe(1);
      const logisticsEntry = logisticsResult.recordset[0];
      expect(logisticsEntry.delivery_agent_id).toBe(logisticsUser.user_id);
      expect(logisticsEntry.pickup_location).toBe('Kiambu Farm');
      expect(logisticsEntry.dropoff_location).toBe('Nairobi Warehouse');
      expect(logisticsEntry.delivery_status).toBe('pending');
    });

    test('should update order status to shipped when assigned', async () => {
      const updatedOrder = await orderService.getOrderById(testOrder.order_id);
      expect(updatedOrder[0].status).toBe('shipped');
    });

    test('should prevent duplicate logistics assignment', async () => {
      const logisticsData = {
        pickup_location: 'Duplicate Location',
        dropoff_location: 'Duplicate Destination',
        delivery_date: new Date('2024-12-17'),
        estimated_delivery: new Date('2024-12-18')
      };

      await expect(logisticsService.assignOrderToAgent(
        testOrder.order_id,
        logisticsUser.user_id,
        logisticsData
      )).rejects.toThrow('Logistics already assigned to this order');
    });

    test('should allow logistics agent to view their deliveries', async () => {
      const deliveries = await logisticsService.getDeliveriesByAgent(logisticsUser.user_id);

      expect(Array.isArray(deliveries)).toBe(true);
      expect(deliveries.length).toBeGreaterThan(0);

      const delivery = deliveries.find(d => d.order_id === testOrder.order_id);
      expect(delivery).toBeDefined();
      expect(delivery.delivery_status).toBe('pending');
    });

    test('should allow logistics agent to update delivery status', async () => {
      // Get the logistics entry
      const pool = await testDb.connect();
      const logisticsResult = await pool.request()
        .input('order_id', testOrder.order_id)
        .query('SELECT logistics_id FROM logistics WHERE order_id = @order_id');

      const logisticsId = logisticsResult.recordset[0].logistics_id;

      const result = await logisticsService.updateDeliveryStatus(
        logisticsId,
        'in_transit',
        'Package picked up from farmer'
      );

      expect(result.message).toContain('updated successfully');

      // Verify status was updated
      const updatedLogistics = await logisticsService.getLogisticsById(logisticsId);
      expect(updatedLogistics.delivery_status).toBe('in_transit');
      expect(updatedLogistics.notes).toBe('Package picked up from farmer');
    });

    test('should update order status to delivered when delivery is completed', async () => {
      // Get the logistics entry
      const pool = await testDb.connect();
      const logisticsResult = await pool.request()
        .input('order_id', testOrder.order_id)
        .query('SELECT logistics_id FROM logistics WHERE order_id = @order_id');

      const logisticsId = logisticsResult.recordset[0].logistics_id;

      await logisticsService.updateDeliveryStatus(logisticsId, 'delivered');

      // Verify order status was updated
      const updatedOrder = await orderService.getOrderById(testOrder.order_id);
      expect(updatedOrder[0].status).toBe('delivered');

      // Verify actual delivery date was set
      const updatedLogistics = await logisticsService.getLogisticsById(logisticsId);
      expect(updatedLogistics.actual_delivery).toBeDefined();
    });

    test('should allow logistics agent to update logistics details', async () => {
      // Get the logistics entry
      const pool = await testDb.connect();
      const logisticsResult = await pool.request()
        .input('order_id', testOrder.order_id)
        .query('SELECT logistics_id FROM logistics WHERE order_id = @order_id');

      const logisticsId = logisticsResult.recordset[0].logistics_id;

      const updateData = {
        pickup_location: 'Updated Farm Location',
        tracking_number: 'TRK123456',
        notes: 'Updated delivery notes'
      };

      const result = await logisticsService.updateLogistics(logisticsId, updateData);

      expect(result.message).toContain('updated successfully');

      // Verify updates
      const updatedLogistics = await logisticsService.getLogisticsById(logisticsId);
      expect(updatedLogistics.pickup_location).toBe('Updated Farm Location');
      expect(updatedLogistics.tracking_number).toBe('TRK123456');
      expect(updatedLogistics.notes).toBe('Updated delivery notes');
    });
  });

  describe('Logistics Data Integrity', () => {
    test('should maintain referential integrity between orders and logistics', async () => {
      const pool = await testDb.connect();

      // Check that all logistics entries have valid orders
      const integrityResult = await pool.request().query(`
        SELECT l.logistics_id, l.order_id, o.order_id as order_exists
        FROM logistics l
        LEFT JOIN orders o ON l.order_id = o.order_id
        WHERE o.order_id IS NULL
      `);

      expect(integrityResult.recordset.length).toBe(0); // No orphaned logistics records
    });

    test('should validate logistics agent role', async () => {
      // Logistics operations should work with logistics user
      // This test validates that the user has the correct role for logistics operations
      const pool = await testDb.connect();
      const userResult = await pool.request()
        .input('user_id', logisticsUser.user_id)
        .query('SELECT role FROM users WHERE user_id = @user_id');

      expect(userResult.recordset[0].role).toBe('logistics');
    });

    test('should prevent invalid order assignment', async () => {
      // Try to assign logistics to non-existent order
      const logisticsData = {
        pickup_location: 'Test Location',
        dropoff_location: 'Test Destination',
        delivery_date: new Date('2024-12-20'),
        estimated_delivery: new Date('2024-12-21')
      };

      await expect(logisticsService.assignOrderToAgent(
        99999, // Non-existent order
        logisticsUser.user_id,
        logisticsData
      )).rejects.toThrow('Order not found');
    });
  });
});