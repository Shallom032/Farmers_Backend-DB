// src/repository/orderRepository.ts
import { getPool } from "../db/config";

export const orderRepository = {
  createOrder: async (orderData: any) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("buyer_id", orderData.buyer_id)
      .input("farmer_id", orderData.farmer_id)
      .input("total_amount", orderData.total_amount)
      .input("delivery_address", orderData.delivery_address)
      .input("delivery_city", orderData.delivery_city)
      .input("delivery_phone", orderData.delivery_phone)
      .input("notes", orderData.notes)
      .query(`
        INSERT INTO orders (buyer_id, farmer_id, total_amount, delivery_address, delivery_city, delivery_phone, notes)
        OUTPUT INSERTED.order_id
        VALUES (@buyer_id, @farmer_id, @total_amount, @delivery_address, @delivery_city, @delivery_phone, @notes)
      `);
    return result.recordset[0].order_id;
  },

  createOrderItems: async (orderId: number, items: any[]) => {
    const pool = await getPool();
    for (const item of items) {
      await pool
        .request()
        .input("order_id", orderId)
        .input("product_id", item.product_id)
        .input("quantity", item.quantity)
        .input("unit_price", item.unit_price)
        .input("total_price", item.total_price)
        .query(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
          VALUES (@order_id, @product_id, @quantity, @unit_price, @total_price)
        `);
    }
  },

  getAllOrders: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT o.*, u.full_name as buyer_name, f.location as farmer_location
      FROM orders o
      JOIN buyers b ON o.buyer_id = b.buyer_id
      JOIN users u ON b.user_id = u.user_id
      JOIN farmers f ON o.farmer_id = f.farmer_id
      ORDER BY o.order_date DESC
    `);
    return result.recordset;
  },

  getOrderById: async (id: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", id)
      .query(`
        SELECT o.*, u.full_name as buyer_name, f.location as farmer_location,
               oi.order_item_id, oi.product_id, oi.quantity, oi.unit_price, oi.total_price,
               p.name as product_name, p.unit
        FROM orders o
        JOIN buyers b ON o.buyer_id = b.buyer_id
        JOIN users u ON b.user_id = u.user_id
        JOIN farmers f ON o.farmer_id = f.farmer_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE o.order_id = @id
      `);
    return result.recordset;
  },

  getOrdersByBuyer: async (buyerId: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("buyer_id", buyerId)
      .query(`
        SELECT o.*, f.location as farmer_location
        FROM orders o
        JOIN farmers f ON o.farmer_id = f.farmer_id
        WHERE o.buyer_id = @buyer_id
        ORDER BY o.order_date DESC
      `);
    return result.recordset;
  },

  getOrdersByFarmer: async (farmerId: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("farmer_id", farmerId)
      .query(`
        SELECT o.*, u.full_name as buyer_name
        FROM orders o
        JOIN buyers b ON o.buyer_id = b.buyer_id
        JOIN users u ON b.user_id = u.user_id
        WHERE o.farmer_id = @farmer_id
        ORDER BY o.order_date DESC
      `);
    return result.recordset;
  },

  updateOrderStatus: async (id: number, status: string) => {
    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .input("status", status)
      .query(`
        UPDATE orders
        SET status = @status, updated_at = GETDATE()
        WHERE order_id = @id
      `);
  },

  getOrdersForLogistics: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT o.*, u.full_name as buyer_name, f.location as farmer_location
      FROM orders o
      JOIN buyers b ON o.buyer_id = b.buyer_id
      JOIN users u ON b.user_id = u.user_id
      JOIN farmers f ON o.farmer_id = f.farmer_id
      WHERE o.status = 'confirmed'
      AND NOT EXISTS (SELECT 1 FROM logistics l WHERE l.order_id = o.order_id)
      ORDER BY o.order_date ASC
    `);
    return result.recordset;
  }
};