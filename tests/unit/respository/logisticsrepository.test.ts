import { logisticsRepository } from '../../../src/repository/logisticsRepository';
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

describe('LogisticsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('create', () => {
    it('should create logistics entry', async () => {
      const logisticsData = {
        order_id: 1,
        delivery_agent_id: 2,
        pickup_location: 'Farm',
        dropoff_location: 'City'
      };
      mockPool.query.mockResolvedValue({ recordset: [{ logistics_id: 123 }] });

      const result = await logisticsRepository.create(logisticsData);

      expect(result).toBe(123);
    });
  });

  describe('getAll', () => {
    it('should return all logistics entries', async () => {
      const mockLogistics = [{ logistics_id: 1 }, { logistics_id: 2 }];
      mockPool.query.mockResolvedValue({ recordset: mockLogistics });

      const result = await logisticsRepository.getAll();

      expect(result).toEqual(mockLogistics);
    });
  });

  describe('getById', () => {
    it('should return logistics by id', async () => {
      const mockLogistics = { logistics_id: 1, order_id: 1 };
      mockPool.query.mockResolvedValue({ recordset: [mockLogistics] });

      const result = await logisticsRepository.getById(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockLogistics);
    });
  });

  describe('getByOrderId', () => {
    it('should return logistics by order id', async () => {
      const mockLogistics = { logistics_id: 1, order_id: 5 };
      mockPool.query.mockResolvedValue({ recordset: [mockLogistics] });

      const result = await logisticsRepository.getByOrderId(5);

      expect(mockPool.input).toHaveBeenCalledWith('order_id', 5);
      expect(result).toEqual(mockLogistics);
    });
  });

  describe('getByAgentId', () => {
    it('should return deliveries by agent id', async () => {
      const mockDeliveries = [{ logistics_id: 1, delivery_agent_id: 2 }];
      mockPool.query.mockResolvedValue({ recordset: mockDeliveries });

      const result = await logisticsRepository.getByAgentId(2);

      expect(mockPool.input).toHaveBeenCalledWith('agent_id', 2);
      expect(result).toEqual(mockDeliveries);
    });
  });

  describe('update', () => {
    it('should update logistics entry', async () => {
      const updateData = { delivery_status: 'delivered', notes: 'Delivered successfully' };

      await logisticsRepository.update(1, updateData);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('delivery_status', 'delivered');
      expect(mockPool.input).toHaveBeenCalledWith('notes', 'Delivered successfully');
    });

    it('should not update if no fields provided', async () => {
      await logisticsRepository.update(1, {});

      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete logistics entry', async () => {
      await logisticsRepository.delete(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM logistics WHERE logistics_id = @id');
    });
  });
});