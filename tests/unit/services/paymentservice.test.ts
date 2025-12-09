import { paymentService } from '../../../src/services/paymentServices';
import { paymentRepository } from '../../../src/repository/paymentRepository';
import { orderService } from '../../../src/services/orderServices';

// Mock dependencies
jest.mock('../../../src/repository/paymentRepository');
jest.mock('../../../src/services/orderServices');

const mockPaymentRepository = paymentRepository as jest.Mocked<typeof paymentRepository>;
const mockOrderService = orderService as jest.Mocked<typeof orderService>;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment successfully when order exists', async () => {
      const paymentData = { order_id: 1, amount: 100, payment_method: 'card' };
      const mockOrder = { id: 1, status: 'confirmed' };
      const paymentId = 123;

      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);
      mockPaymentRepository.createPayment.mockResolvedValue(paymentId);

      const result = await paymentService.createPayment(paymentData);

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(1);
      expect(mockPaymentRepository.createPayment).toHaveBeenCalledWith(paymentData);
      expect(result).toEqual({ paymentId, message: 'Payment created successfully' });
    });

    it('should throw error when order not found', async () => {
      const paymentData = { order_id: 999, amount: 100 };

      mockOrderService.getOrderById.mockResolvedValue(null as any);

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow('Order not found');
      expect(mockPaymentRepository.createPayment).not.toHaveBeenCalled();
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments', async () => {
      const mockPayments = [{ id: 1 }, { id: 2 }];
      mockPaymentRepository.getAllPayments.mockResolvedValue(mockPayments as any);

      const result = await paymentService.getAllPayments();

      expect(mockPaymentRepository.getAllPayments).toHaveBeenCalled();
      expect(result).toEqual(mockPayments);
    });
  });

  describe('getPaymentById', () => {
    it('should return payment when found', async () => {
      const mockPayment = { id: 1, amount: 100 };
      mockPaymentRepository.getPaymentById.mockResolvedValue(mockPayment as any);

      const result = await paymentService.getPaymentById(1);

      expect(mockPaymentRepository.getPaymentById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPayment);
    });

    it('should throw error when payment not found', async () => {
      mockPaymentRepository.getPaymentById.mockResolvedValue(null as any);

      await expect(paymentService.getPaymentById(999)).rejects.toThrow('Payment not found');
    });
  });

  describe('getPaymentsByOrder', () => {
    it('should return payments for order', async () => {
      const mockPayments = [{ id: 1, order_id: 5 }];
      mockPaymentRepository.getPaymentsByOrder.mockResolvedValue(mockPayments as any);

      const result = await paymentService.getPaymentsByOrder(5);

      expect(mockPaymentRepository.getPaymentsByOrder).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockPayments);
    });
  });

  describe('approvePayment', () => {
    it('should approve payment and update order status', async () => {
      const mockPayment = { id: 1, order_id: 10, payment_status: 'pending' };
      mockPaymentRepository.getPaymentById.mockResolvedValue(mockPayment as any);
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue(undefined as any);
      mockOrderService.updateOrderStatus.mockResolvedValue({ message: 'Updated' } as any);

      const result = await paymentService.approvePayment(1, 2, 'Approved by admin');

      expect(mockPaymentRepository.getPaymentById).toHaveBeenCalledWith(1);
      expect(mockPaymentRepository.updatePaymentStatus).toHaveBeenCalledWith(1, 'completed', 2, 'Approved by admin');
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(10, 'confirmed');
      expect(result).toEqual({ message: 'Payment approved and order confirmed' });
    });

    it('should throw error when payment not found', async () => {
      mockPaymentRepository.getPaymentById.mockResolvedValue(null as any);

      await expect(paymentService.approvePayment(999, 2)).rejects.toThrow('Payment not found');
    });

    it('should throw error when payment not in pending status', async () => {
      const mockPayment = { id: 1, payment_status: 'completed' };
      mockPaymentRepository.getPaymentById.mockResolvedValue(mockPayment as any);

      await expect(paymentService.approvePayment(1, 2)).rejects.toThrow('Payment is not in pending status');
    });
  });

  describe('rejectPayment', () => {
    it('should reject payment and cancel order', async () => {
      const mockPayment = { id: 1, order_id: 10, payment_status: 'pending' };
      mockPaymentRepository.getPaymentById.mockResolvedValue(mockPayment as any);
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue(undefined as any);
      mockOrderService.updateOrderStatus.mockResolvedValue({ message: 'Updated' } as any);

      const result = await paymentService.rejectPayment(1, 2, 'Rejected by admin');

      expect(mockPaymentRepository.updatePaymentStatus).toHaveBeenCalledWith(1, 'failed', 2, 'Rejected by admin');
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(10, 'cancelled');
      expect(result).toEqual({ message: 'Payment rejected and order cancelled' });
    });
  });

  describe('getPendingPayments', () => {
    it('should return pending payments', async () => {
      const mockPayments = [{ id: 1, status: 'pending' }];
      mockPaymentRepository.getPendingPayments.mockResolvedValue(mockPayments as any);

      const result = await paymentService.getPendingPayments();

      expect(mockPaymentRepository.getPendingPayments).toHaveBeenCalled();
      expect(result).toEqual(mockPayments);
    });
  });
});