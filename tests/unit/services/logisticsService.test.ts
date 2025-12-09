import { logisticsService } from '../../../src/services/logisticsServices';
import { logisticsRepository } from '../../../src/repository/logisticsRepository';
import { orderService } from '../../../src/services/orderServices';

// Mock dependencies
jest.mock('../../../src/repository/logisticsRepository');
jest.mock('../../../src/services/orderServices');

const mockLogisticsRepository = logisticsRepository as jest.Mocked<typeof logisticsRepository>;
const mockOrderService = orderService as jest.Mocked<typeof orderService>;

describe('LogisticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLogistics', () => {
    it('should return all logistics', async () => {
      const mockLogistics = [{ id: 1 }, { id: 2 }];
      mockLogisticsRepository.getAll.mockResolvedValue(mockLogistics as any);

      const result = await logisticsService.getAllLogistics();

      expect(mockLogisticsRepository.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockLogistics);
    });
  });

  describe('getLogisticsById', () => {
    it('should return logistics when found', async () => {
      const mockLogistics = { id: 1 };
      mockLogisticsRepository.getById.mockResolvedValue(mockLogistics as any);

      const result = await logisticsService.getLogisticsById(1);

      expect(mockLogisticsRepository.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLogistics);
    });

    it('should throw error when logistics not found', async () => {
      mockLogisticsRepository.getById.mockResolvedValue(null as any);

      await expect(logisticsService.getLogisticsById(999)).rejects.toThrow('Delivery not found');
    });
  });

  describe('createLogistics', () => {
    it('should create logistics successfully', async () => {
      const data = { order_id: 1 };
      const logisticsId = 123;
      mockLogisticsRepository.create.mockResolvedValue(logisticsId);

      const result = await logisticsService.createLogistics(data);

      expect(mockLogisticsRepository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual({ logisticsId, message: 'Logistics entry created successfully' });
    });
  });

  describe('assignOrderToAgent', () => {
    it('should assign order to agent successfully', async () => {
      const orderId = 1;
      const agentId = 2;
      const logisticsData = { delivery_date: '2023-12-01' };
      const mockOrder = [{ status: 'confirmed', farmer_location: 'Farm', delivery_address: 'City' }];
      const logisticsId = 123;

      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);
      mockLogisticsRepository.getByOrderId.mockResolvedValue(null as any);
      mockLogisticsRepository.create.mockResolvedValue(logisticsId);
      mockOrderService.updateOrderStatus.mockResolvedValue({ message: 'Updated' });

      const result = await logisticsService.assignOrderToAgent(orderId, agentId, logisticsData);

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(orderId);
      expect(mockLogisticsRepository.create).toHaveBeenCalled();
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(orderId, 'shipped');
      expect(result).toEqual({ logisticsId, message: 'Order assigned to delivery agent successfully' });
    });

    it('should throw error when order not found', async () => {
      mockOrderService.getOrderById.mockResolvedValue(null as any);

      await expect(logisticsService.assignOrderToAgent(999, 2, {})).rejects.toThrow('Order not found');
    });

    it('should throw error when order not ready', async () => {
      const mockOrder = [{ status: 'pending' }];
      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await expect(logisticsService.assignOrderToAgent(1, 2, {})).rejects.toThrow('Order not ready for logistics assignment');
    });

    it('should throw error when logistics already assigned', async () => {
      const mockOrder = [{ status: 'confirmed' }];
      const existingLogistics = { id: 1 };
      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);
      mockLogisticsRepository.getByOrderId.mockResolvedValue(existingLogistics as any);

      await expect(logisticsService.assignOrderToAgent(1, 2, {})).rejects.toThrow('Logistics already assigned to this order');
    });
  });

  describe('getDeliveriesByAgent', () => {
    it('should return deliveries by agent', async () => {
      const mockDeliveries = [{ id: 1 }];
      mockLogisticsRepository.getByAgentId.mockResolvedValue(mockDeliveries as any);

      const result = await logisticsService.getDeliveriesByAgent(2);

      expect(mockLogisticsRepository.getByAgentId).toHaveBeenCalledWith(2);
      expect(result).toEqual(mockDeliveries);
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update delivery status to delivered', async () => {
      const mockDelivery = { id: 1, order_id: 10 };
      mockLogisticsRepository.getById.mockResolvedValue(mockDelivery as any);
      mockLogisticsRepository.update.mockResolvedValue(undefined as any);
      mockOrderService.updateOrderStatus.mockResolvedValue({ message: 'Updated' });

      const result = await logisticsService.updateDeliveryStatus(1, 'delivered', 'Delivered successfully');

      expect(mockLogisticsRepository.update).toHaveBeenCalled();
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(10, 'delivered');
      expect(result).toEqual({ message: 'Delivery status updated successfully' });
    });

    it('should throw error when delivery not found', async () => {
      mockLogisticsRepository.getById.mockResolvedValue(null as any);

      await expect(logisticsService.updateDeliveryStatus(999, 'pending')).rejects.toThrow('Delivery not found');
    });
  });

  describe('updateLogistics', () => {
    it('should update logistics successfully', async () => {
      const existing = { id: 1, pickup_location: 'Old' };
      const updateData = { pickup_location: 'New' };
      mockLogisticsRepository.getById.mockResolvedValue(existing as any);
      mockLogisticsRepository.update.mockResolvedValue(undefined as any);

      const result = await logisticsService.updateLogistics(1, updateData);

      expect(mockLogisticsRepository.update).toHaveBeenCalledWith(1, expect.objectContaining(updateData));
      expect(result).toEqual({ message: 'Delivery updated successfully' });
    });
  });

  describe('deleteLogistics', () => {
    it('should delete logistics successfully', async () => {
      const existing = { id: 1 };
      mockLogisticsRepository.getById.mockResolvedValue(existing as any);
      mockLogisticsRepository.delete.mockResolvedValue(undefined as any);

      const result = await logisticsService.deleteLogistics(1);

      expect(mockLogisticsRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Delivery deleted successfully' });
    });

    it('should throw error when logistics not found', async () => {
      mockLogisticsRepository.getById.mockResolvedValue(null as any);

      await expect(logisticsService.deleteLogistics(999)).rejects.toThrow('Delivery not found');
    });
  });
});
