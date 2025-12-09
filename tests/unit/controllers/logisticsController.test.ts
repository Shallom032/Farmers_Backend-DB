import { Request, Response } from 'express';
import { logisticsController } from '../../../src/controllers/logisticsController';
import { logisticsService } from '../../../src/services/logisticsServices';

// Mock the logisticsService
jest.mock('../../../src/services/logisticsServices', () => ({
  logisticsService: {
    getAllLogistics: jest.fn(),
    getLogisticsById: jest.fn(),
    createLogistics: jest.fn(),
    assignOrderToAgent: jest.fn(),
    getDeliveriesByAgent: jest.fn(),
    updateDeliveryStatus: jest.fn(),
    updateLogistics: jest.fn(),
    deleteLogistics: jest.fn(),
  },
}));

describe('Logistics Controllers', () => {
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

  describe('getAllLogistics', () => {
    it('should get all logistics successfully', async () => {
      const mockLogistics = [
        { logistics_id: 1, order_id: 100, delivery_agent_id: 5, delivery_status: 'pending' },
        { logistics_id: 2, order_id: 101, delivery_agent_id: 6, delivery_status: 'in_progress' },
      ];

      (logisticsService.getAllLogistics as jest.Mock).mockResolvedValue(mockLogistics);

      await logisticsController.getAllLogistics(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.getAllLogistics).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockLogistics);
    });

    it('should handle errors when getting all logistics', async () => {
      const mockError = new Error('Database connection failed');
      (logisticsService.getAllLogistics as jest.Mock).mockRejectedValue(mockError);

      await logisticsController.getAllLogistics(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.getAllLogistics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database connection failed' });
    });
  });

  describe('getLogisticsById', () => {
    it('should get logistics by ID successfully', async () => {
      const mockLogistics = { logistics_id: 1, order_id: 100, delivery_agent_id: 5, delivery_status: 'pending' };
      mockRequest.params = { id: '1' };

      (logisticsService.getLogisticsById as jest.Mock).mockResolvedValue(mockLogistics);

      await logisticsController.getLogisticsById(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.getLogisticsById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLogistics);
    });

    it('should handle logistics not found', async () => {
      const mockError = new Error('Logistics record not found');
      mockRequest.params = { id: '999' };

      (logisticsService.getLogisticsById as jest.Mock).mockRejectedValue(mockError);

      await logisticsController.getLogisticsById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logistics record not found' });
    });
  });

  describe('createLogistics', () => {
    it('should create logistics successfully', async () => {
      const mockLogisticsData = {
        order_id: 100,
        delivery_agent_id: 5,
        pickup_location: 'Nairobi Warehouse',
        dropoff_location: 'Customer Address',
        delivery_status: 'pending',
      };

      const mockResult = {
        logistics_id: 1,
        message: 'Logistics record created successfully',
      };

      mockRequest.body = mockLogisticsData;
      (logisticsService.createLogistics as jest.Mock).mockResolvedValue(mockResult);

      await logisticsController.createLogistics(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.createLogistics).toHaveBeenCalledWith(mockLogisticsData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle logistics creation errors', async () => {
      const mockLogisticsData = { order_id: 100, delivery_agent_id: 5 };
      const mockError = new Error('Invalid logistics data');

      mockRequest.body = mockLogisticsData;
      (logisticsService.createLogistics as jest.Mock).mockRejectedValue(mockError);

      await logisticsController.createLogistics(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.createLogistics).toHaveBeenCalledWith(mockLogisticsData);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid logistics data' });
    });
  });

  describe('assignOrderToAgent', () => {
    it('should assign order to agent successfully', async () => {
      const mockAssignmentData = {
        order_id: 100,
        delivery_agent_id: 5,
        pickup_location: 'Warehouse A',
        dropoff_location: 'Customer B',
        estimated_delivery: '2024-01-15',
      };

      const mockResult = {
        logistics_id: 1,
        message: 'Order assigned to delivery agent successfully',
      };

      mockRequest.body = mockAssignmentData;
      (logisticsService.assignOrderToAgent as jest.Mock).mockResolvedValue(mockResult);

      await logisticsController.assignOrderToAgent(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.assignOrderToAgent).toHaveBeenCalledWith(100, 5, mockAssignmentData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle assignment errors', async () => {
      const mockAssignmentData = { order_id: 100, delivery_agent_id: 5 };
      const mockError = new Error('Agent not available');

      mockRequest.body = mockAssignmentData;
      (logisticsService.assignOrderToAgent as jest.Mock).mockRejectedValue(mockError);

      await logisticsController.assignOrderToAgent(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.assignOrderToAgent).toHaveBeenCalledWith(100, 5, mockAssignmentData);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Agent not available' });
    });
  });

  describe('getMyDeliveries', () => {
    it('should get deliveries for logistics agent successfully', async () => {
      const mockUser = { user_id: 5, role: 'logistics' };
      const mockDeliveries = [
        { logistics_id: 1, order_id: 100, delivery_status: 'pending' },
        { logistics_id: 2, order_id: 101, delivery_status: 'in_progress' },
      ];

      (mockRequest as any).user = mockUser;
      (logisticsService.getDeliveriesByAgent as jest.Mock).mockResolvedValue(mockDeliveries);

      await logisticsController.getMyDeliveries(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.getDeliveriesByAgent).toHaveBeenCalledWith(5);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDeliveries);
    });

    it('should deny access for non-logistics users', async () => {
      const mockUser = { user_id: 1, role: 'farmer' };
      (mockRequest as any).user = mockUser;

      await logisticsController.getMyDeliveries(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.getDeliveriesByAgent).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });

    it('should handle errors when getting deliveries', async () => {
      const mockUser = { user_id: 5, role: 'logistics' };
      const mockError = new Error('Database error');

      (mockRequest as any).user = mockUser;
      (logisticsService.getDeliveriesByAgent as jest.Mock).mockRejectedValue(mockError);

      await logisticsController.getMyDeliveries(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.getDeliveriesByAgent).toHaveBeenCalledWith(5);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update delivery status successfully', async () => {
      const mockUpdateData = { status: 'delivered', notes: 'Package delivered successfully' };
      const mockResult = { message: 'Delivery status updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      (logisticsService.updateDeliveryStatus as jest.Mock).mockResolvedValue(mockResult);

      await logisticsController.updateDeliveryStatus(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.updateDeliveryStatus).toHaveBeenCalledWith(1, 'delivered', 'Package delivered successfully');
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle delivery status update errors', async () => {
      const mockError = new Error('Delivery not found');
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: 'delivered' };

      (logisticsService.updateDeliveryStatus as jest.Mock).mockRejectedValue(mockError);

      await logisticsController.updateDeliveryStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Delivery not found' });
    });
  });

  describe('updateLogistics', () => {
    it('should update logistics successfully', async () => {
      const mockUpdateData = { delivery_status: 'in_progress', notes: 'On the way' };
      const mockResult = { message: 'Logistics updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      (logisticsService.updateLogistics as jest.Mock).mockResolvedValue(mockResult);

      await logisticsController.updateLogistics(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.updateLogistics).toHaveBeenCalledWith(1, mockUpdateData);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle logistics update errors', async () => {
      const mockError = new Error('Logistics record not found');
      mockRequest.params = { id: '999' };
      mockRequest.body = { delivery_status: 'completed' };

      (logisticsService.updateLogistics as jest.Mock).mockRejectedValue(mockError);

      await logisticsController.updateLogistics(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logistics record not found' });
    });
  });

  describe('deleteLogistics', () => {
    it('should delete logistics successfully', async () => {
      const mockResult = { message: 'Logistics record deleted successfully' };
      mockRequest.params = { id: '1' };

      (logisticsService.deleteLogistics as jest.Mock).mockResolvedValue(mockResult);

      await logisticsController.deleteLogistics(mockRequest as Request, mockResponse as Response);

      expect(logisticsService.deleteLogistics).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle logistics deletion errors', async () => {
      const mockError = new Error('Logistics record not found');
      mockRequest.params = { id: '999' };

      (logisticsService.deleteLogistics as jest.Mock).mockRejectedValue(mockError);

      await logisticsController.deleteLogistics(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logistics record not found' });
    });
  });
});
