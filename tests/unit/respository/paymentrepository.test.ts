import { paymentRepository } from '../../../src/repository/paymentRepository';
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

describe('PaymentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.request.mockReturnThis();
    mockPool.input.mockReturnThis();
  });

  describe('createPayment', () => {
    it('should create payment', async () => {
      const paymentData = {
        order_id: 1,
        amount: 100,
        payment_method: 'card',
        transaction_id: 'txn123'
      };
      mockPool.query.mockResolvedValue({ recordset: [{ payment_id: 456 }] });

      const result = await paymentRepository.createPayment(paymentData);

      expect(result).toBe(456);
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments', async () => {
      const mockPayments = [{ payment_id: 1 }, { payment_id: 2 }];
      mockPool.query.mockResolvedValue({ recordset: mockPayments });

      const result = await paymentRepository.getAllPayments();

      expect(result).toEqual(mockPayments);
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by id', async () => {
      const mockPayment = { payment_id: 1, order_id: 1 };
      mockPool.query.mockResolvedValue({ recordset: [mockPayment] });

      const result = await paymentRepository.getPaymentById(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockPayment);
    });
  });

  describe('getPaymentsByOrder', () => {
    it('should return payments by order', async () => {
      const mockPayments = [{ payment_id: 1, order_id: 5 }];
      mockPool.query.mockResolvedValue({ recordset: mockPayments });

      const result = await paymentRepository.getPaymentsByOrder(5);

      expect(mockPool.input).toHaveBeenCalledWith('order_id', 5);
      expect(result).toEqual(mockPayments);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      await paymentRepository.updatePaymentStatus(1, 'completed', 2, 'Approved');

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('status', 'completed');
      expect(mockPool.input).toHaveBeenCalledWith('processed_by', 2);
      expect(mockPool.input).toHaveBeenCalledWith('notes', 'Approved');
    });

    it('should update payment status without optional params', async () => {
      await paymentRepository.updatePaymentStatus(1, 'failed');

      expect(mockPool.input).toHaveBeenCalledWith('id', 1);
      expect(mockPool.input).toHaveBeenCalledWith('status', 'failed');
    });
  });

  describe('getPendingPayments', () => {
    it('should return pending payments', async () => {
      const mockPayments = [{ payment_id: 1, payment_status: 'pending' }];
      mockPool.query.mockResolvedValue({ recordset: mockPayments });

      const result = await paymentRepository.getPendingPayments();

      expect(result).toEqual(mockPayments);
    });
  });
});