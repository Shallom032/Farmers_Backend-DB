import { orderRepository } from '../../../src/repository/orderRepository';
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

describe('OrderRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('createOrder', () => {
    it('should create order', async () => {
      const orderData = {
        buyer_id: 1,
        farmer_id: 2,
        total_amount: 100,
        delivery_address: 'Address',
        delivery_city: 'City',
        delivery_phone: '123',
        notes: 'Notes'
      };
      mockPool.query.mockResolvedValue({ recordset: [{ order_id: 123 }] });

      const result = await orderRepository.createOrder(orderData);

      expect(result).toBe(123);
    });
  });

  describe('createOrderItems', () => {
    it('should create order items', async () => {
      const items = [
        { product_id: 1, quantity: 2, unit_price: 50, total_price: 100 }
      ];

      await orderRepository.createOrderItems(123, items);

      expect(mockPool.input).toHaveBeenCalledWith('order_id', 123);
      expect(mockPool.input).toHaveBeenCalledWith('product_id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('quantity', 2);
      expect(mockPool.input).toHaveBeenCalledWith('unit_price', 50);
      expect(mockPool.input).toHaveBeenCalledWith('total_price', 100);
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders', async () => {
      const mockOrders = [{ order_id: 1 }, { order_id: 2 }];
      mockPool.query.mockResolvedValue({ recordset: mockOrders });

      const result = await orderRepository.getAllOrders();

      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      const mockOrder = [{ order_id: 1, buyer_name: 'John' }];
      mockPool.query.mockResolvedValue({ recordset: mockOrder });

      const result = await orderRepository.getOrderById(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getOrdersByBuyer', () => {
    it('should return orders by buyer', async () => {
      const mockOrders = [{ order_id: 1, buyer_id: 5 }];
      mockPool.query.mockResolvedValue({ recordset: mockOrders });

      const result = await orderRepository.getOrdersByBuyer(5);

      expect(mockPool.input).toHaveBeenCalledWith('buyer_id', 5);
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrdersByFarmer', () => {
    it('should return orders by farmer', async () => {
      const mockOrders = [{ order_id: 1, farmer_id: 3 }];
      mockPool.query.mockResolvedValue({ recordset: mockOrders });

      const result = await orderRepository.getOrdersByFarmer(3);

      expect(mockPool.input).toHaveBeenCalledWith('farmer_id', 3);
      expect(result).toEqual(mockOrders);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      await orderRepository.updateOrderStatus(1, 'confirmed');

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('status', 'confirmed');
    });
  });

  describe('getOrdersForLogistics', () => {
    it('should return orders for logistics', async () => {
      const mockOrders = [{ order_id: 1, status: 'confirmed' }];
      mockPool.query.mockResolvedValue({ recordset: mockOrders });

      const result = await orderRepository.getOrdersForLogistics();

      expect(result).toEqual(mockOrders);
    });
  });
});