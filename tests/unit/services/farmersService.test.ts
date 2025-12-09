import { farmerService } from '../../../src/services/farmersServices';
import { farmersRepository } from '../../../src/repository/farmersRepository';

// Mock dependencies
jest.mock('../../../src/repository/farmersRepository');

const mockFarmersRepository = farmersRepository as jest.Mocked<typeof farmersRepository>;

describe('FarmerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllFarmers', () => {
    it('should return all farmers', async () => {
      const mockFarmers = [{ id: 1, name: 'Farmer 1' }, { id: 2, name: 'Farmer 2' }];
      mockFarmersRepository.getAll.mockResolvedValue(mockFarmers as any);

      const result = await farmerService.getAllFarmers();

      expect(mockFarmersRepository.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockFarmers);
    });
  });

  describe('getFarmerById', () => {
    it('should return farmer when found', async () => {
      const mockFarmer = { id: 1, name: 'Farmer 1', location: 'Nairobi' };
      mockFarmersRepository.getById.mockResolvedValue(mockFarmer as any);

      const result = await farmerService.getFarmerById(1);

      expect(mockFarmersRepository.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFarmer);
    });

    it('should throw error when farmer not found', async () => {
      mockFarmersRepository.getById.mockResolvedValue(null as any);

      await expect(farmerService.getFarmerById(999)).rejects.toThrow('Farmer not found');
    });
  });

  describe('updateFarmer', () => {
    it('should update farmer successfully', async () => {
      const existingFarmer = { id: 1, location: 'Old Location', product: 'Old Product' };
      const updateData = { location: 'New Location', product: 'New Product' };
      mockFarmersRepository.getById.mockResolvedValue(existingFarmer as any);
      mockFarmersRepository.update.mockResolvedValue(undefined as any);

      const result = await farmerService.updateFarmer(1, updateData);

      expect(mockFarmersRepository.getById).toHaveBeenCalledWith(1);
      expect(mockFarmersRepository.update).toHaveBeenCalledWith(1, {
        location: 'New Location',
        product: 'New Product'
      });
      expect(result).toEqual({ message: 'Farmer updated successfully' });
    });

    it('should use existing values when not provided', async () => {
      const existingFarmer = { id: 1, location: 'Old Location', product: 'Old Product' };
      const updateData = { location: 'New Location' };
      mockFarmersRepository.getById.mockResolvedValue(existingFarmer as any);
      mockFarmersRepository.update.mockResolvedValue(undefined as any);

      await farmerService.updateFarmer(1, updateData);

      expect(mockFarmersRepository.update).toHaveBeenCalledWith(1, {
        location: 'New Location',
        product: 'Old Product'
      });
    });

    it('should throw error when farmer not found', async () => {
      mockFarmersRepository.getById.mockResolvedValue(null as any);

      await expect(farmerService.updateFarmer(999, {})).rejects.toThrow('Farmer not found');
    });
  });

  describe('deleteFarmer', () => {
    it('should delete farmer successfully', async () => {
      const existingFarmer = { id: 1, name: 'Farmer 1' };
      mockFarmersRepository.getById.mockResolvedValue(existingFarmer as any);
      mockFarmersRepository.delete.mockResolvedValue(undefined as any);

      const result = await farmerService.deleteFarmer(1);

      expect(mockFarmersRepository.getById).toHaveBeenCalledWith(1);
      expect(mockFarmersRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Farmer deleted successfully' });
    });

    it('should throw error when farmer not found', async () => {
      mockFarmersRepository.getById.mockResolvedValue(null as any);

      await expect(farmerService.deleteFarmer(999)).rejects.toThrow('Farmer not found');
    });
  });
});
