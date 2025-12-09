import { buyerService } from '../../../src/services/buyerServices';
import { buyerRepository } from '../../../src/repository/buyerRepository';

// Mock dependencies
jest.mock('../../../src/repository/buyerRepository');

const mockBuyerRepository = buyerRepository as jest.Mocked<typeof buyerRepository>;

describe('BuyerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBuyers', () => {
    it('should return all buyers', async () => {
      const mockBuyers = [{ id: 1, name: 'Buyer 1' }, { id: 2, name: 'Buyer 2' }];
      mockBuyerRepository.getAll.mockResolvedValue(mockBuyers as any);

      const result = await buyerService.getAllBuyers();

      expect(mockBuyerRepository.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockBuyers);
    });
  });

  describe('getBuyerById', () => {
    it('should return buyer when found', async () => {
      const mockBuyer = { id: 1, name: 'Buyer 1', location: 'Nairobi' };
      mockBuyerRepository.getById.mockResolvedValue(mockBuyer as any);

      const result = await buyerService.getBuyerById(1);

      expect(mockBuyerRepository.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBuyer);
    });

    it('should throw error when buyer not found', async () => {
      mockBuyerRepository.getById.mockResolvedValue(null as any);

      await expect(buyerService.getBuyerById(999)).rejects.toThrow('Buyer not found');
    });
  });

  describe('updateBuyer', () => {
    it('should update buyer successfully', async () => {
      const existingBuyer = { id: 1, location: 'Old Location', produce_purchased: 'Old', quantity: 10 };
      const updateData = { location: 'New Location', quantity: 20 };
      mockBuyerRepository.getById.mockResolvedValue(existingBuyer as any);
      mockBuyerRepository.update.mockResolvedValue(undefined as any);

      const result = await buyerService.updateBuyer(1, updateData);

      expect(mockBuyerRepository.getById).toHaveBeenCalledWith(1);
      expect(mockBuyerRepository.update).toHaveBeenCalledWith(1, {
        location: 'New Location',
        produce_purchased: 'Old',
        quantity: 20,
        delivery_status: undefined
      });
      expect(result).toEqual({ message: 'Buyer updated successfully' });
    });

    it('should throw error when buyer not found', async () => {
      mockBuyerRepository.getById.mockResolvedValue(null as any);

      await expect(buyerService.updateBuyer(999, {})).rejects.toThrow('Buyer not found');
    });
  });

  describe('deleteBuyer', () => {
    it('should delete buyer successfully', async () => {
      const existingBuyer = { id: 1, name: 'Buyer 1' };
      mockBuyerRepository.getById.mockResolvedValue(existingBuyer as any);
      mockBuyerRepository.delete.mockResolvedValue(undefined as any);

      const result = await buyerService.deleteBuyer(1);

      expect(mockBuyerRepository.getById).toHaveBeenCalledWith(1);
      expect(mockBuyerRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Buyer deleted successfully' });
    });

    it('should throw error when buyer not found', async () => {
      mockBuyerRepository.getById.mockResolvedValue(null as any);

      await expect(buyerService.deleteBuyer(999)).rejects.toThrow('Buyer not found');
    });
  });
});