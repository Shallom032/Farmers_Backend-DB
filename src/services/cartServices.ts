// src/services/cartServices.ts
import { getPool } from "../db/config";

export const cartService = {
  // Add item to cart
  addToCart: async (buyerId: number, productId: number, quantity: number) => {
    const pool = await getPool();

    // Check if item already exists in cart
    const existingItem = await pool
      .request()
      .input("buyer_id", buyerId)
      .input("product_id", productId)
      .query("SELECT * FROM cart WHERE buyer_id = @buyer_id AND product_id = @product_id");

    if (existingItem.recordset.length > 0) {
      // Update quantity
      await pool
        .request()
        .input("buyer_id", buyerId)
        .input("product_id", productId)
        .input("quantity", quantity)
        .query("UPDATE cart SET quantity = quantity + @quantity WHERE buyer_id = @buyer_id AND product_id = @product_id");

      return { message: "Cart item quantity updated successfully" };
    } else {
      // Add new item
      await pool
        .request()
        .input("buyer_id", buyerId)
        .input("product_id", productId)
        .input("quantity", quantity)
        .query("INSERT INTO cart (buyer_id, product_id, quantity) VALUES (@buyer_id, @product_id, @quantity)");

      return { message: "Item added to cart successfully" };
    }
  },

  // Get cart items
  getCart: async (buyerId: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("buyer_id", buyerId)
      .query(`
        SELECT
          c.cart_id,
          c.product_id,
          c.quantity,
          c.added_at,
          p.name,
          p.description,
          p.price,
          p.unit,
          p.image_url,
          p.farmer_id,
          u.full_name as farmer_name,
          f.location as farmer_location
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        JOIN farmers f ON p.farmer_id = f.farmer_id
        JOIN users u ON f.user_id = u.user_id
        WHERE c.buyer_id = @buyer_id AND p.is_active = 1
        ORDER BY c.added_at DESC
      `);

    return result.recordset;
  },

  // Update cart item quantity
  updateCartItem: async (buyerId: number, productId: number, quantity: number) => {
    const pool = await getPool();

    if (quantity === 0) {
      // Remove item if quantity is 0
      await pool
        .request()
        .input("buyer_id", buyerId)
        .input("product_id", productId)
        .query("DELETE FROM cart WHERE buyer_id = @buyer_id AND product_id = @product_id");

      return { message: "Item removed from cart" };
    } else {
      // Update quantity
      await pool
        .request()
        .input("buyer_id", buyerId)
        .input("product_id", productId)
        .input("quantity", quantity)
        .query("UPDATE cart SET quantity = @quantity WHERE buyer_id = @buyer_id AND product_id = @product_id");

      return { message: "Cart item updated successfully" };
    }
  },

  // Remove item from cart
  removeFromCart: async (buyerId: number, productId: number) => {
    const pool = await getPool();
    await pool
      .request()
      .input("buyer_id", buyerId)
      .input("product_id", productId)
      .query("DELETE FROM cart WHERE buyer_id = @buyer_id AND product_id = @product_id");

    return { message: "Item removed from cart successfully" };
  },

  // Clear entire cart
  clearCart: async (buyerId: number) => {
    const pool = await getPool();
    await pool
      .request()
      .input("buyer_id", buyerId)
      .query("DELETE FROM cart WHERE buyer_id = @buyer_id");

    return { message: "Cart cleared successfully" };
  },

  // Get cart total
  getCartTotal: async (buyerId: number) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("buyer_id", buyerId)
      .query(`
        SELECT SUM(c.quantity * p.price) as total
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        WHERE c.buyer_id = @buyer_id AND p.is_active = 1
      `);

    return result.recordset[0]?.total || 0;
  }
};