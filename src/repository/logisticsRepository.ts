// src/repositories/logisticsRepository.ts
import { getPool } from "../db/config";

export const logisticsRepository = {
  getAll: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT l.*, u.full_name as delivery_agent_name
      FROM logistics l
      JOIN users u ON l.delivery_agent_id = u.user_id
    `);
    return result.recordset;
  },

  getById: async (id: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", id)
      .query("SELECT * FROM logistics WHERE logistics_id = @id");

    return result.recordset[0];
  },

  update: async (id: number, data: any) => {
    const { pickup_location, dropoff_location, delivery_status, delivery_date } = data;

    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .input("pickup_location", pickup_location)
      .input("dropoff_location", dropoff_location)
      .input("delivery_status", delivery_status)
      .input("delivery_date", delivery_date)
      .query(`
        UPDATE logistics 
        SET pickup_location = @pickup_location,
            dropoff_location = @dropoff_location,
            delivery_status = @delivery_status,
            delivery_date = @delivery_date
        WHERE logistics_id = @id
      `);
  },

  delete: async (id: number) => {
    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .query("DELETE FROM logistics WHERE logistics_id = @id");
  }
};
