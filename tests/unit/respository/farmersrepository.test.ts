import { farmersRepository } from '../../../src/repository/farmersRepository';
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

describe('FarmersRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('getAll', () => {
    it('should return all farmers', async () => {
      const mockFarmers = [{ farmer_id: 1 }, { farmer_id: 2 }];
      mockPool.query.mockResolvedValue({ recordset: mockFarmers });

      const result = await farmersRepository.getAll();

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM farmers');
      expect(result).toEqual(mockFarmers);
    });
  });

  describe('getById', () => {
    it('should return farmer by id', async () => {
      const mockFarmer = { farmer_id: 1, user_id: 1 };
      mockPool.query.mockResolvedValue({ recordset: [mockFarmer] });

      const result = await farmersRepository.getById(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockFarmer);
    });
  });

  describe('getByUserId', () => {
    it('should return farmer by user id', async () => {
      const mockFarmer = { farmer_id: 1, user_id: 5 };
      mockPool.query.mockResolvedValue({ recordset: [mockFarmer] });

      const result = await farmersRepository.getByUserId(5);

      expect(mockPool.input).toHaveBeenCalledWith('user_id', 5);
      expect(result).toEqual(mockFarmer);
    });
  });

  describe('create', () => {
    it('should create farmer', async () => {
      const farmerData = { user_id: 1, location: 'Nairobi', product: 'Maize' };
      const mockCreatedFarmer = { farmer_id: 1, ...farmerData };
      mockPool.query.mockResolvedValue({ recordset: [mockCreatedFarmer] });

      const result = await farmersRepository.create(farmerData);

      expect(result).toEqual(mockCreatedFarmer);
    });
  });

  describe('update', () => {
    it('should update farmer', async () => {
      const updateData = { location: 'New Location', product: 'Wheat' };

      await farmersRepository.update(1, updateData);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('location', 'New Location');
      expect(mockPool.input).toHaveBeenCalledWith('product', 'Wheat');
    });
  });

  describe('delete', () => {
    it('should delete farmer', async () => {
      await farmersRepository.delete(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM farmers WHERE farmer_id = @id');
    });
  });
});