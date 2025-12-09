import { orderService } from '../../../src/services/orderServices';
import { orderRepository } from '../../../src/repository/orderRepository';
import { getPool } from '../../../src/db/config';

// Mock dependencies
jest.mock('../../../src/repository/orderRepository');
jest.mock('../../../src/db/config');

const mockOrderRepository = orderRepository as jest.Mocked<typeof orderRepository>;
const mockGetPool = getPool as jest.MockedFunction<typeof getPool>;

const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn()
};
mockGetPool.mockResolvedValue(mockPool as any);

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('createOrderFromCart', () => {
    it('should create orders from cart successfully', async () => {
      const buyerId = 1;
      const deliveryInfo = { delivery_address: 'Address', delivery_city: 'City', delivery_phone: '123', notes: 'Notes' };
      const cartItems = [
        { cart_id: 1, product_id: 101, quantity: 2, price: 50, farmer_id: 5, product_name: 'Apple', unit: 'kg', total_price: 100 }
      ];
      const orderId = 123;

      mockPool.query.mockResolvedValueOnce({ recordset: cartItems }); // Cart items
      mockOrderRepository.createOrder.mockResolvedValue(orderId);
      mockOrderRepository.createOrderItems.mockResolvedValue(undefined);

      const result = await orderService.createOrderFromCart(buyerId, deliveryInfo);

      expect(mockPool.query).toHaveBeenCalledTimes(2); // Cart query and clear cart
      expect(mockOrderRepository.createOrder).toHaveBeenCalled();
      expect(mockOrderRepository.createOrderItems).toHaveBeenCalled();
      expect(result).toEqual([expect.objectContaining({ orderId, farmerId: 5 })]);
    });

    it('should throw error when cart is empty', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      await expect(orderService.createOrderFromCart(1, {})).rejects.toThrow('Cart is empty');
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders', async () => {
      const mockOrders = [{ id: 1 }, { id: 2 }];
      mockOrderRepository.getAllOrders.mockResolvedValue(mockOrders as any);

      const result = await orderService.getAllOrders();

      expect(mockOrderRepository.getAllOrders).toHaveBeenCalled();
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = [{ id: 1 }];
      mockOrderRepository.getOrderById.mockResolvedValue(mockOrder as any);

      const result = await orderService.getOrderById(1);

      expect(mockOrderRepository.getOrderById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrder);
    });

    it('should throw error when order not found', async () => {
      mockOrderRepository.getOrderById.mockResolvedValue([] as any);

      await expect(orderService.getOrderById(999)).rejects.toThrow('Order not found');
    });
  });

  describe('getOrdersByBuyer', () => {
    it('should return orders by buyer', async () => {
      const mockOrders = [{ id: 1 }];
      mockOrderRepository.getOrdersByBuyer.mockResolvedValue(mockOrders as any);

      const result = await orderService.getOrdersByBuyer(1);

      expect(mockOrderRepository.getOrdersByBuyer).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrdersByFarmer', () => {
    it('should return orders by farmer', async () => {
      const mockOrders = [{ id: 1 }];
      mockOrderRepository.getOrdersByFarmer.mockResolvedValue(mockOrders as any);

      const result = await orderService.getOrdersByFarmer(5);

      expect(mockOrderRepository.getOrdersByFarmer).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockOrders);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = [{ id: 1 }];
      mockOrderRepository.getOrderById.mockResolvedValue(mockOrder as any);
      mockOrderRepository.updateOrderStatus.mockResolvedValue(undefined as any);

      const result = await orderService.updateOrderStatus(1, 'confirmed');

      expect(mockOrderRepository.updateOrderStatus).toHaveBeenCalledWith(1, 'confirmed');
      expect(result).toEqual({ message: 'Order status updated successfully' });
    });

    it('should throw error when order not found', async () => {
      mockOrderRepository.getOrderById.mockResolvedValue([] as any);

      await expect(orderService.updateOrderStatus(999, 'confirmed')).rejects.toThrow('Order not found');
    });
  });

  describe('getOrdersForLogistics', () => {
    it('should return orders for logistics', async () => {
      const mockOrders = [{ id: 1 }];
      mockOrderRepository.getOrdersForLogistics.mockResolvedValue(mockOrders as any);

      const result = await orderService.getOrdersForLogistics();

      expect(mockOrderRepository.getOrdersForLogistics).toHaveBeenCalled();
      expect(result).toEqual(mockOrders);
    });
  });
});