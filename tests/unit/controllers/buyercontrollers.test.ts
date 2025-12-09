import { Request, Response } from 'express';
import { buyerController } from '../../../src/controllers/buyerControllers';
import { buyerService } from '../../../src/services/buyerServices';

// Mock the buyerService
jest.mock('../../../src/services/buyerServices', () => ({
  buyerService: {
    getAllBuyers: jest.fn(),
    getBuyerById: jest.fn(),
    updateBuyer: jest.fn(),
    deleteBuyer: jest.fn(),
  },
}));

describe('Buyer Controllers', () => {
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

  describe('getAllBuyers', () => {
    it('should get all buyers successfully', async () => {
      const mockBuyers = [
        { buyer_id: 1, user_id: 2, location: 'Nairobi', business_type: 'Restaurant' },
        { buyer_id: 2, user_id: 3, location: 'Mombasa', business_type: 'Retailer' },
      ];

      (buyerService.getAllBuyers as jest.Mock).mockResolvedValue(mockBuyers);

      await buyerController.getAllBuyers(mockRequest as Request, mockResponse as Response);

      expect(buyerService.getAllBuyers).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockBuyers);
    });

    it('should handle errors when getting all buyers', async () => {
      const mockError = new Error('Database connection failed');
      (buyerService.getAllBuyers as jest.Mock).mockRejectedValue(mockError);

      await buyerController.getAllBuyers(mockRequest as Request, mockResponse as Response);

      expect(buyerService.getAllBuyers).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database connection failed' });
    });
  });

  describe('getBuyerById', () => {
    it('should get buyer by ID successfully', async () => {
      const mockBuyer = { buyer_id: 1, user_id: 2, location: 'Nairobi', business_type: 'Restaurant' };
      mockRequest.params = { id: '1' };

      (buyerService.getBuyerById as jest.Mock).mockResolvedValue(mockBuyer);

      await buyerController.getBuyerById(mockRequest as Request, mockResponse as Response);

      expect(buyerService.getBuyerById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBuyer);
    });

    it('should handle buyer not found', async () => {
      const mockError = new Error('Buyer not found');
      mockRequest.params = { id: '999' };

      (buyerService.getBuyerById as jest.Mock).mockRejectedValue(mockError);

      await buyerController.getBuyerById(mockRequest as Request, mockResponse as Response);

      expect(buyerService.getBuyerById).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Buyer not found' });
    });
  });

  describe('updateBuyer', () => {
    it('should update buyer successfully', async () => {
      const mockUpdateData = { location: 'New Location', business_type: 'Wholesale' };
      const mockResult = { message: 'Buyer updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      (buyerService.updateBuyer as jest.Mock).mockResolvedValue(mockResult);

      await buyerController.updateBuyer(mockRequest as Request, mockResponse as Response);

      expect(buyerService.updateBuyer).toHaveBeenCalledWith(1, mockUpdateData);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle buyer update errors', async () => {
      const mockError = new Error('Buyer not found');
      mockRequest.params = { id: '999' };
      mockRequest.body = { location: 'New Location' };

      (buyerService.updateBuyer as jest.Mock).mockRejectedValue(mockError);

      await buyerController.updateBuyer(mockRequest as Request, mockResponse as Response);

      expect(buyerService.updateBuyer).toHaveBeenCalledWith(999, { location: 'New Location' });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Buyer not found' });
    });
  });

  describe('deleteBuyer', () => {
    it('should delete buyer successfully', async () => {
      const mockResult = { message: 'Buyer deleted successfully' };
      mockRequest.params = { id: '1' };

      (buyerService.deleteBuyer as jest.Mock).mockResolvedValue(mockResult);

      await buyerController.deleteBuyer(mockRequest as Request, mockResponse as Response);

      expect(buyerService.deleteBuyer).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle buyer deletion errors', async () => {
      const mockError = new Error('Buyer not found');
      mockRequest.params = { id: '999' };

      (buyerService.deleteBuyer as jest.Mock).mockRejectedValue(mockError);

      await buyerController.deleteBuyer(mockRequest as Request, mockResponse as Response);

      expect(buyerService.deleteBuyer).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Buyer not found' });
    });
  });
});