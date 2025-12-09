import { Request, Response } from 'express';
import { farmerController } from '../../../src/controllers/farmersController';
import { farmerService } from '../../../src/services/farmersServices';

// Mock the farmerService
jest.mock('../../../src/services/farmersServices', () => ({
  farmerService: {
    getAllFarmers: jest.fn(),
    getFarmerById: jest.fn(),
    updateFarmer: jest.fn(),
    deleteFarmer: jest.fn(),
  },
}));

describe('Farmer Controllers', () => {
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

  describe('getAllFarmers', () => {
    it('should get all farmers successfully', async () => {
      const mockFarmers = [
        { farmer_id: 1, user_id: 2, location: 'Nairobi', product: 'Maize' },
        { farmer_id: 2, user_id: 3, location: 'Kiambu', product: 'Tomatoes' },
      ];

      (farmerService.getAllFarmers as jest.Mock).mockResolvedValue(mockFarmers);

      await farmerController.getAllFarmers(mockRequest as Request, mockResponse as Response);

      expect(farmerService.getAllFarmers).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockFarmers);
    });

    it('should handle errors when getting all farmers', async () => {
      const mockError = new Error('Database connection failed');
      (farmerService.getAllFarmers as jest.Mock).mockRejectedValue(mockError);

      await farmerController.getAllFarmers(mockRequest as Request, mockResponse as Response);

      expect(farmerService.getAllFarmers).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Database connection failed' });
    });
  });

  describe('getFarmerById', () => {
    it('should get farmer by ID successfully', async () => {
      const mockFarmer = { farmer_id: 1, user_id: 2, location: 'Nairobi', product: 'Maize' };
      mockRequest.params = { id: '1' };

      (farmerService.getFarmerById as jest.Mock).mockResolvedValue(mockFarmer);

      await farmerController.getFarmerById(mockRequest as Request, mockResponse as Response);

      expect(farmerService.getFarmerById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockFarmer);
    });

    it('should handle farmer not found', async () => {
      const mockError = new Error('Farmer not found');
      mockRequest.params = { id: '999' };

      (farmerService.getFarmerById as jest.Mock).mockRejectedValue(mockError);

      await farmerController.getFarmerById(mockRequest as Request, mockResponse as Response);

      expect(farmerService.getFarmerById).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Farmer not found' });
    });
  });

  describe('updateFarmer', () => {
    it('should update farmer with location successfully', async () => {
      const mockUpdateData = { location: 'New Location' };
      const mockResult = { message: 'Farmer updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      (farmerService.updateFarmer as jest.Mock).mockResolvedValue(mockResult);

      await farmerController.updateFarmer(mockRequest as Request, mockResponse as Response);

      expect(farmerService.updateFarmer).toHaveBeenCalledWith(1, { location: 'New Location', product: undefined });
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should update farmer with product successfully', async () => {
      const mockUpdateData = { product: 'Rice' };
      const mockResult = { message: 'Farmer updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      (farmerService.updateFarmer as jest.Mock).mockResolvedValue(mockResult);

      await farmerController.updateFarmer(mockRequest as Request, mockResponse as Response);

      expect(farmerService.updateFarmer).toHaveBeenCalledWith(1, { location: undefined, product: 'Rice' });
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should update farmer with both location and product', async () => {
      const mockUpdateData = { location: 'Mombasa', product: 'Coconut' };
      const mockResult = { message: 'Farmer updated successfully' };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      (farmerService.updateFarmer as jest.Mock).mockResolvedValue(mockResult);

      await farmerController.updateFarmer(mockRequest as Request, mockResponse as Response);

      expect(farmerService.updateFarmer).toHaveBeenCalledWith(1, { location: 'Mombasa', product: 'Coconut' });
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 when no fields provided', async () => {
      const mockUpdateData = {}; // Empty object
      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      await farmerController.updateFarmer(mockRequest as Request, mockResponse as Response);

      expect(farmerService.updateFarmer).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'At least one field (location or product) is required' });
    });

    it('should return 400 when null values provided', async () => {
      const mockUpdateData = { location: null, product: null };
      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;

      await farmerController.updateFarmer(mockRequest as Request, mockResponse as Response);

      expect(farmerService.updateFarmer).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'At least one field (location or product) is required' });
    });

    it('should handle farmer update errors', async () => {
      const mockUpdateData = { location: 'New Location' };
      const mockError = new Error('Farmer not found');

      mockRequest.params = { id: '999' };
      mockRequest.body = mockUpdateData;

      (farmerService.updateFarmer as jest.Mock).mockRejectedValue(mockError);

      await farmerController.updateFarmer(mockRequest as Request, mockResponse as Response);

      expect(farmerService.updateFarmer).toHaveBeenCalledWith(999, { location: 'New Location', product: undefined });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Farmer not found' });
    });
  });

  describe('deleteFarmer', () => {
    it('should delete farmer successfully', async () => {
      const mockResult = { message: 'Farmer deleted successfully' };
      mockRequest.params = { id: '1' };

      (farmerService.deleteFarmer as jest.Mock).mockResolvedValue(mockResult);

      await farmerController.deleteFarmer(mockRequest as Request, mockResponse as Response);

      expect(farmerService.deleteFarmer).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle farmer deletion errors', async () => {
      const mockError = new Error('Farmer not found');
      mockRequest.params = { id: '999' };

      (farmerService.deleteFarmer as jest.Mock).mockRejectedValue(mockError);

      await farmerController.deleteFarmer(mockRequest as Request, mockResponse as Response);

      expect(farmerService.deleteFarmer).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Farmer not found' });
    });
  });
});