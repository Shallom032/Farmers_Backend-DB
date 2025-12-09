// src/repositories/buyerRepository.ts
import { getPool } from "../db/config";

export const buyerRepository = {
  getAll: async () => {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM buyers");
    return result.recordset; // MSSQL returns recordset
  },

  getById: async (id: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", id)
      .query("SELECT * FROM buyers WHERE buyer_id = @id");
    return result.recordset[0];
  },

  getByUserId: async (userId: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("user_id", userId)
      .query("SELECT * FROM buyers WHERE user_id = @user_id");
    return result.recordset[0];
  },

  create: async (data: { user_id: number; location?: string }) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("user_id", data.user_id)
      .input("location", data.location || null)
      .query(`
        INSERT INTO buyers (user_id, location)
        OUTPUT INSERTED.*
        VALUES (@user_id, @location)
      `);
    return result.recordset[0];
  },

  update: async (id: number, data: any) => {
    const { location, produce_purchased, quantity, delivery_status } = data;

    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .input("location", location)
      .input("produce_purchased", produce_purchased)
      .input("quantity", quantity)
      .input("delivery_status", delivery_status)
      .query(
        `UPDATE buyers 
         SET location = @location, 
             produce_purchased = @produce_purchased, 
             quantity = @quantity, 
             delivery_status = @delivery_status 
         WHERE buyer_id = @id`
      );
  },

  delete: async (id: number) => {
    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .query("DELETE FROM buyers WHERE buyer_id = @id");
  }
};
