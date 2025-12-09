// src/repository/paymentRepository.ts
import { getPool } from "../db/config";

export const paymentRepository = {
  createPayment: async (paymentData: any) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("order_id", paymentData.order_id)
      .input("amount", paymentData.amount)
      .input("payment_method", paymentData.payment_method)
      .input("transaction_id", paymentData.transaction_id)
      .query(`
        INSERT INTO payments (order_id, amount, payment_method, transaction_id)
        OUTPUT INSERTED.payment_id
        VALUES (@order_id, @amount, @payment_method, @transaction_id)
      `);
    return result.recordset[0].payment_id;
  },

  getAllPayments: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.*, o.total_amount as order_amount, u.full_name as buyer_name
      FROM payments p
      JOIN orders o ON p.order_id = o.order_id
      JOIN buyers b ON o.buyer_id = b.buyer_id
      JOIN users u ON b.user_id = u.user_id
      ORDER BY p.payment_date DESC
    `);
    return result.recordset;
  },

  getPaymentById: async (id: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", id)
      .query(`
        SELECT p.*, o.total_amount as order_amount, u.full_name as buyer_name
        FROM payments p
        JOIN orders o ON p.order_id = o.order_id
        JOIN buyers b ON o.buyer_id = b.buyer_id
        JOIN users u ON b.user_id = u.user_id
        WHERE p.payment_id = @id
      `);
    return result.recordset[0];
  },

  getPaymentsByOrder: async (orderId: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("order_id", orderId)
      .query("SELECT * FROM payments WHERE order_id = @order_id ORDER BY payment_date DESC");
    return result.recordset;
  },

  updatePaymentStatus: async (id: number, status: string, processedBy?: number, notes?: string) => {
    const pool = await getPool();
    let query = `
      UPDATE payments
      SET payment_status = @status
    `;
    const request = pool.request().input("id", id).input("status", status);

    if (processedBy) {
      query += ", processed_by = @processed_by";
      request.input("processed_by", processedBy);
    }
    if (notes) {
      query += ", notes = @notes";
      request.input("notes", notes);
    }

    query += " WHERE payment_id = @id";
    await request.query(query);
  },

  getPendingPayments: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.*, o.total_amount as order_amount, u.full_name as buyer_name
      FROM payments p
      JOIN orders o ON p.order_id = o.order_id
      JOIN buyers b ON o.buyer_id = b.buyer_id
      JOIN users u ON b.user_id = u.user_id
      WHERE p.payment_status = 'pending'
      ORDER BY p.payment_date ASC
    `);
    return result.recordset;
  }
};