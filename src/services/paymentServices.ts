// src/services/paymentServices.ts
import { paymentRepository } from "../repository/paymentRepository";
import { orderService } from "./orderServices";

export const paymentService = {
  createPayment: async (paymentData: any) => {
    // Verify order exists
    const order = await orderService.getOrderById(paymentData.order_id);
    if (!order) throw new Error("Order not found");

    const paymentId = await paymentRepository.createPayment(paymentData);
    return { paymentId, message: "Payment created successfully" };
  },

  getAllPayments: async () => await paymentRepository.getAllPayments(),

  getPaymentById: async (id: number) => {
    const payment = await paymentRepository.getPaymentById(id);
    if (!payment) throw new Error("Payment not found");
    return payment;
  },

  getPaymentsByOrder: async (orderId: number) => await paymentRepository.getPaymentsByOrder(orderId),

  approvePayment: async (id: number, adminId: number, notes?: string) => {
    const payment = await paymentRepository.getPaymentById(id);
    if (!payment) throw new Error("Payment not found");

    if (payment.payment_status !== 'pending') {
      throw new Error("Payment is not in pending status");
    }

    await paymentRepository.updatePaymentStatus(id, 'completed', adminId, notes);

    // Update order status to confirmed
    await orderService.updateOrderStatus(payment.order_id, 'confirmed');

    return { message: "Payment approved and order confirmed" };
  },

  rejectPayment: async (id: number, adminId: number, notes?: string) => {
    const payment = await paymentRepository.getPaymentById(id);
    if (!payment) throw new Error("Payment not found");

    if (payment.payment_status !== 'pending') {
      throw new Error("Payment is not in pending status");
    }

    await paymentRepository.updatePaymentStatus(id, 'failed', adminId, notes);

    // Update order status to cancelled
    await orderService.updateOrderStatus(payment.order_id, 'cancelled');

    return { message: "Payment rejected and order cancelled" };
  },

  getPendingPayments: async () => await paymentRepository.getPendingPayments()
};