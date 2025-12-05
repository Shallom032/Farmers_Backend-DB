import { getPool } from "../db/config";

export const authRepository = {
  // ------------------------------
  // EXISTING METHODS (unchanged)
  // ------------------------------

  getByEmail: async (email: string) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("email", email)
      .query("SELECT * FROM users WHERE email = @email");
    return result.recordset[0];
  },

  getById: async (user_id: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("user_id", user_id)
      .query("SELECT * FROM users WHERE user_id = @user_id");
    return result.recordset[0];
  },

  getUserByRole: async (role: string) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("role", role)
      .query("SELECT * FROM users WHERE role = @role");
    return result.recordset[0];
  },

  createUser: async (data: {
    full_name: string;
    email: string;
    phone?: string;
    location: string;
    role: "farmer" | "buyer" | "logistics" | "admin";
    password_hash: string;
  }) => {
    const { full_name, email, phone, location, role, password_hash } = data;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("full_name", full_name)
      .input("email", email)
      .input("phone", phone || null)
      .input("location", location)
      .input("role", role)
      .input("password_hash", password_hash)
      .input("is_verified", 0)
      .query(`
        INSERT INTO users (full_name, email, phone, location, role, password_hash, is_verified)
        OUTPUT INSERTED.*
        VALUES (@full_name, @email, @phone, @location, @role, @password_hash, @is_verified)
      `);
    return result.recordset[0];
  },

  updateUser: async (user_id: number, data: Record<string, any>) => {
    const pool = await getPool();
    const request = Object.entries(data).reduce((req, [key, value]) => {
      req.input(key, value);
      return req;
    }, pool.request() as any);

    const setClause = Object.keys(data).map(key => `${key} = @${key}`).join(", ");

    await request.input("user_id", user_id).query(
      `UPDATE users SET ${setClause}, updated_at = GETDATE() WHERE user_id = @user_id`
    );
  },

  createFarmerProfile: async (user_id: number) => {
    const pool = await getPool();
    await pool.request().input("user_id", user_id).query(
      "INSERT INTO farmers (user_id) VALUES (@user_id)"
    );
  },

  createBuyerProfile: async (user_id: number) => {
    const pool = await getPool();
    await pool.request().input("user_id", user_id).query(
      "INSERT INTO buyers (user_id) VALUES (@user_id)"
    );
  },

  createLogisticsProfile: async (user_id: number) => {
    const pool = await getPool();
    await pool.request().input("user_id", user_id).query(
      "INSERT INTO logistics (delivery_agent_id) VALUES (@user_id)"
    );
  },

  // ------------------------------
  // ⭐ NEW VERIFICATION FUNCTIONS
  // ------------------------------

  // Store verification token
  saveVerificationToken: async (user_id: number, token: string) => {
    const pool = await getPool();
    await pool
      .request()
      .input("user_id", user_id)
      .input("token", token)
      .query(`
        INSERT INTO email_verification_tokens (user_id, token)
        VALUES (@user_id, @token)
      `);
  },

  // Get a token record + user email + role
  getTokenRecord: async (token: string) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("token", token)
      .query(`
        SELECT evt.*, u.email, u.role
        FROM email_verification_tokens evt
        INNER JOIN users u ON evt.user_id = u.user_id
        WHERE evt.token = @token
      `);

    return result.recordset[0];
  },

  // Delete token after successful verification
  deleteToken: async (token: string) => {
    const pool = await getPool();
    await pool
      .request()
      .input("token", token)
      .query(`
        DELETE FROM email_verification_tokens WHERE token = @token
      `);
  }
};
