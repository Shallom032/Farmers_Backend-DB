// src/db/config.ts
import dotenv from "dotenv";
import assert from "assert";
import sql from "mssql";

dotenv.config();

// SQL config variables
const { SQL_SERVER, SQL_USER, SQL_PWD, SQL_DB, SQL_PORT, SQL_ENCRYPT, JWT_SECRET, PORT } = process.env;

// Ensure required environment variables exist
assert(SQL_SERVER, "SQL_SERVER is required");
assert(SQL_USER, "SQL_USER is required");
assert(SQL_PWD, "SQL_PWD is required");
assert(SQL_DB, "SQL_DB is required");
assert(JWT_SECRET, "JWT_SECRET is required");

// SQL Server config
const sqlConfig: sql.config = {
  user: SQL_USER,
  password: SQL_PWD,
  database: SQL_DB,
  server: SQL_SERVER!,
  port: SQL_PORT ? parseInt(SQL_PORT) : 1433,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: SQL_ENCRYPT === "true",
    trustServerCertificate: true, // true for local dev
  },
};

// Connection pool creator
export const getPool = async (): Promise<sql.ConnectionPool> => {
  try {
    const pool = await sql.connect(sqlConfig);
    console.log("Connected to SQL Server");
    return pool;
  } catch (error) {
    console.error("SQL Connection Error:", error);
    throw error;
  }
};

// Export centralized config
export const config = {
  sql: sqlConfig,
  jwtSecret: JWT_SECRET!,
  port: PORT ? parseInt(PORT) : 5000,
};

export default sql;
export { sqlConfig };
