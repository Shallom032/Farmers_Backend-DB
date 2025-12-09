// src/repository/logisticsRepository.ts
import { getPool } from "../db/config";

export const logisticsRepository = {
  create: async (data: any) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("order_id", data.order_id || null)
      .input("delivery_agent_id", data.delivery_agent_id)
      .input("pickup_location", data.pickup_location)
      .input("dropoff_location", data.dropoff_location)
      .input("delivery_status", data.delivery_status || 'pending')
      .input("delivery_date", data.delivery_date || null)
      .input("estimated_delivery", data.estimated_delivery || null)
      .input("tracking_number", data.tracking_number || null)
      .input("notes", data.notes || null)
      .query(`
        INSERT INTO logistics (order_id, delivery_agent_id, pickup_location, dropoff_location, delivery_status, delivery_date, estimated_delivery, tracking_number, notes)
        OUTPUT INSERTED.logistics_id
        VALUES (@order_id, @delivery_agent_id, @pickup_location, @dropoff_location, @delivery_status, @delivery_date, @estimated_delivery, @tracking_number, @notes)
      `);
    return result.recordset[0].logistics_id;
  },

  getAll: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT l.*, u.full_name as delivery_agent_name, o.delivery_address, o.delivery_city
      FROM logistics l
      JOIN users u ON l.delivery_agent_id = u.user_id
      LEFT JOIN orders o ON l.order_id = o.order_id
      ORDER BY l.created_at DESC
    `);
    return result.recordset;
  },

  getById: async (id: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", id)
      .query(`
        SELECT l.*, u.full_name as delivery_agent_name, o.delivery_address, o.delivery_city
        FROM logistics l
        JOIN users u ON l.delivery_agent_id = u.user_id
        LEFT JOIN orders o ON l.order_id = o.order_id
        WHERE l.logistics_id = @id
      `);

    return result.recordset[0];
  },

  getByOrderId: async (orderId: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("order_id", orderId)
      .query("SELECT * FROM logistics WHERE order_id = @order_id");

    return result.recordset[0];
  },

  getByAgentId: async (agentId: number) => {
    console.log('Repository: Getting deliveries for agent ID:', agentId);
    const pool = await getPool();
    const result = await pool
      .request()
      .input("agent_id", agentId)
      .query(`
        SELECT l.*, o.delivery_address, o.delivery_city, o.total_amount
        FROM logistics l
        LEFT JOIN orders o ON l.order_id = o.order_id
        WHERE l.delivery_agent_id = @agent_id
        ORDER BY l.created_at DESC
      `);

    console.log('Repository: Query result:', result.recordset);
    return result.recordset;
  },

  update: async (id: number, data: any) => {
    const pool = await getPool();
    const request = pool.request().input("id", id);

    let updateFields = [];
    let params = { id };

    if (data.pickup_location !== undefined) {
      updateFields.push("pickup_location = @pickup_location");
      request.input("pickup_location", data.pickup_location);
    }
    if (data.dropoff_location !== undefined) {
      updateFields.push("dropoff_location = @dropoff_location");
      request.input("dropoff_location", data.dropoff_location);
    }
    if (data.delivery_status !== undefined) {
      updateFields.push("delivery_status = @delivery_status");
      request.input("delivery_status", data.delivery_status);
    }
    if (data.delivery_date !== undefined) {
      updateFields.push("delivery_date = @delivery_date");
      request.input("delivery_date", data.delivery_date);
    }
    if (data.estimated_delivery !== undefined) {
      updateFields.push("estimated_delivery = @estimated_delivery");
      request.input("estimated_delivery", data.estimated_delivery);
    }
    if (data.actual_delivery !== undefined) {
      updateFields.push("actual_delivery = @actual_delivery");
      request.input("actual_delivery", data.actual_delivery);
    }
    if (data.tracking_number !== undefined) {
      updateFields.push("tracking_number = @tracking_number");
      request.input("tracking_number", data.tracking_number);
    }
    if (data.notes !== undefined) {
      updateFields.push("notes = @notes");
      request.input("notes", data.notes);
    }

    updateFields.push("updated_at = GETDATE()");

    if (updateFields.length === 1) return; // Only updated_at

    const query = `
      UPDATE logistics
      SET ${updateFields.join(", ")}
      WHERE logistics_id = @id
    `;

    await request.query(query);
  },

  delete: async (id: number) => {
    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .query("DELETE FROM logistics WHERE logistics_id = @id");
  }
};
