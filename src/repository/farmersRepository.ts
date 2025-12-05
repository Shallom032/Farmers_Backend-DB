// src/repository/farmersRepository.ts
import { getPool } from "../db/config";

export interface FarmerData {
  user_id: number;
  location: string;
  product: string;
}

export interface FarmerUpdateData {
  location?: string;
  product?: string;
}

export const farmersRepository = {
  getAll: async () => {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM farmers");
    return result.recordset;
  },

  getById: async (id: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", id)
      .query("SELECT * FROM farmers WHERE farmer_id = @id");
    return result.recordset[0];
  },

  create: async (data: FarmerData) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("user_id", data.user_id)
      .input("location", data.location)
      .input("product", data.product)
      .query(`
        INSERT INTO farmers (user_id, location, product)
        OUTPUT INSERTED.*
        VALUES (@user_id, @location, @product)
      `);
    return result.recordset[0];
  },

  update: async (id: number, data: FarmerUpdateData) => {
    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .input("location", data.location)
      .input("product", data.product)
      .query(`
        UPDATE farmers 
        SET location = @location, product = @product 
        WHERE farmer_id = @id
      `);
  },

  delete: async (id: number) => {
    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .query("DELETE FROM farmers WHERE farmer_id = @id");
  }
};
