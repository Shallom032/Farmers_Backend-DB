import { buyerRepository } from '../../../src/repository/buyerRepository';
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

describe('BuyerRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('getAll', () => {
    it('should return all buyers', async () => {
      const mockBuyers = [{ buyer_id: 1 }, { buyer_id: 2 }];
      mockPool.query.mockResolvedValue({ recordset: mockBuyers });

      const result = await buyerRepository.getAll();

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM buyers');
      expect(result).toEqual(mockBuyers);
    });
  });

  describe('getById', () => {
    it('should return buyer by id', async () => {
      const mockBuyer = { buyer_id: 1, user_id: 1 };
      mockPool.query.mockResolvedValue({ recordset: [mockBuyer] });

      const result = await buyerRepository.getById(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockBuyer);
    });
  });

  describe('getByUserId', () => {
    it('should return buyer by user id', async () => {
      const mockBuyer = { buyer_id: 1, user_id: 5 };
      mockPool.query.mockResolvedValue({ recordset: [mockBuyer] });

      const result = await buyerRepository.getByUserId(5);

      expect(mockPool.input).toHaveBeenCalledWith('user_id', 5);
      expect(result).toEqual(mockBuyer);
    });
  });

  describe('create', () => {
    it('should create buyer', async () => {
      const buyerData = { user_id: 1, location: 'Nairobi' };
      const mockCreatedBuyer = { buyer_id: 1, ...buyerData };
      mockPool.query.mockResolvedValue({ recordset: [mockCreatedBuyer] });

      const result = await buyerRepository.create(buyerData);

      expect(result).toEqual(mockCreatedBuyer);
    });
  });

  describe('update', () => {
    it('should update buyer', async () => {
      const updateData = { location: 'New Location', quantity: 10 };

      await buyerRepository.update(1, updateData);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('location', 'New Location');
      expect(mockPool.input).toHaveBeenCalledWith('quantity', 10);
    });
  });

  describe('delete', () => {
    it('should delete buyer', async () => {
      await buyerRepository.delete(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM buyers WHERE buyer_id = @id');
    });
  });
});