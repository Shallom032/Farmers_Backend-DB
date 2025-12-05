import { getPool } from "../db/config";

export const userRepository = {
  getAll: async () => {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM users");
    return result.recordset;
  },

  getById: async (id: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", id)
      .query("SELECT * FROM users WHERE user_id=@id");
    return result.recordset[0];
  },

  getByEmail: async (email: string) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("email", email)
      .query("SELECT * FROM users WHERE email=@email");
    return result.recordset[0];
  },

  create: async (data: any) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("full_name", data.full_name)
      .input("email", data.email)
      .input("password_hash", data.password_hash)
      .input("phone", data.phone)
      .input("role", data.role)
      .input("is_verified", 1) // auto-verified
      .query(`
        INSERT INTO users (full_name,email,password_hash,phone,role,is_verified)
        OUTPUT INSERTED.*
        VALUES (@full_name,@email,@password_hash,@phone,@role,@is_verified)
      `);
    return result.recordset[0];
  },

  update: async (id: number, data: any) => {
    const pool = await getPool();
    await pool.request()
      .input("id", id)
      .input("full_name", data.full_name)
      .input("phone", data.phone)
      .input("role", data.role)
      .query(`
        UPDATE users
        SET full_name=@full_name, phone=@phone, role=@role, updated_at=GETDATE()
        WHERE user_id=@id
      `);
    return { message: "User updated" };
  },

  delete: async (id: number) => {
    const pool = await getPool();
    await pool.request()
      .input("id", id)
      .query("DELETE FROM users WHERE user_id=@id");
    return { message: "User deleted" };
  }
};
