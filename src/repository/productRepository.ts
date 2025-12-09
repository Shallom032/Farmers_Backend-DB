// src/repository/productRepository.ts
import { getPool } from "../db/config";

export const productRepository = {
  createProduct: async (productData: any) => {
    console.log('ProductRepository.createProduct called with:', productData);
    try {
      const pool = await getPool();
      console.log('Database pool obtained');

      const result = await pool
        .request()
        .input("farmer_id", productData.farmer_id)
        .input("name", productData.name)
        .input("description", productData.description || null)
        .input("price", productData.price)
        .input("quantity_available", productData.quantity_available)
        .input("unit", productData.unit)
        .input("category", productData.category || null)
        .input("image_url", productData.image_url || null)
        .query(`
          INSERT INTO products (farmer_id, name, description, price, quantity_available, unit, category, image_url)
          OUTPUT INSERTED.product_id
          VALUES (@farmer_id, @name, @description, @price, @quantity_available, @unit, @category, @image_url)
        `);

      console.log('SQL insert result:', result.recordset);
      const productId = result.recordset[0].product_id;
      console.log('Product created with ID:', productId);
      return productId;
    } catch (error) {
      console.error('ProductRepository.createProduct error:', error);
      throw error;
    }
  },

  getAllProducts: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.*, u.full_name as farmer_name, f.location as farmer_location
      FROM products p
      JOIN farmers f ON p.farmer_id = f.farmer_id
      JOIN users u ON f.user_id = u.user_id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
    `);
    return result.recordset;
  },

  getProductById: async (id: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", id)
      .query(`
        SELECT p.*, u.full_name as farmer_name, f.location as farmer_location
        FROM products p
        JOIN farmers f ON p.farmer_id = f.farmer_id
        JOIN users u ON f.user_id = u.user_id
        WHERE p.product_id = @id AND p.is_active = 1
      `);
    return result.recordset[0];
  },

  getProductsByFarmer: async (farmerId: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("farmer_id", farmerId)
      .query(`
        SELECT p.*, u.full_name as farmer_name, f.location as farmer_location
        FROM products p
        JOIN farmers f ON p.farmer_id = f.farmer_id
        JOIN users u ON f.user_id = u.user_id
        WHERE p.farmer_id = @farmer_id AND p.is_active = 1
        ORDER BY p.created_at DESC
      `);
    return result.recordset;
  },

  updateProduct: async (id: number, productData: any) => {
    const pool = await getPool();
    const request = pool.request().input("id", id);

    let updateFields = [];
    let params: any = { id };

    if (productData.name !== undefined) {
      updateFields.push("name = @name");
      request.input("name", productData.name);
    }
    if (productData.description !== undefined) {
      updateFields.push("description = @description");
      request.input("description", productData.description);
    }
    if (productData.price !== undefined) {
      updateFields.push("price = @price");
      request.input("price", productData.price);
    }
    if (productData.quantity_available !== undefined) {
      updateFields.push("quantity_available = @quantity_available");
      request.input("quantity_available", productData.quantity_available);
    }
    if (productData.unit !== undefined) {
      updateFields.push("unit = @unit");
      request.input("unit", productData.unit);
    }
    if (productData.category !== undefined) {
      updateFields.push("category = @category");
      request.input("category", productData.category);
    }
    if (productData.image_url !== undefined) {
      updateFields.push("image_url = @image_url");
      request.input("image_url", productData.image_url);
    }

    updateFields.push("updated_at = GETDATE()");

    if (updateFields.length === 1) return; // Only updated_at

    const query = `
      UPDATE products
      SET ${updateFields.join(", ")}
      WHERE product_id = @id
    `;

    await request.query(query);
  },

  deleteProduct: async (id: number) => {
    const pool = await getPool();
    // Soft delete by setting is_active to 0
    await pool
      .request()
      .input("id", id)
      .query("UPDATE products SET is_active = 0 WHERE product_id = @id");
  },

  searchProducts: async (searchTerm: string, category?: string) => {
    const pool = await getPool();
    let query = `
      SELECT p.*, u.full_name as farmer_name, f.location as farmer_location
      FROM products p
      JOIN farmers f ON p.farmer_id = f.farmer_id
      JOIN users u ON f.user_id = u.user_id
      WHERE p.is_active = 1
      AND (p.name LIKE @search OR p.description LIKE @search OR p.category LIKE @search)
    `;

    const request = pool.request().input("search", `%${searchTerm}%`);

    if (category) {
      query += " AND p.category = @category";
      request.input("category", category);
    }

    query += " ORDER BY p.created_at DESC";

    const result = await request.query(query);
    return result.recordset;
  }
};