import { getPool } from '../../src/db/config';

// Test database setup utilities
export class TestDatabaseSetup {
  private pool: any;

  async connect() {
    this.pool = await getPool();
    return this.pool;
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.close();
    }
  }

  // Clean up test data
  async cleanup() {
    if (!this.pool) return;

    try {
      // Delete in reverse order of dependencies
      await this.pool.request().query('DELETE FROM email_verification_tokens');
      await this.pool.request().query('DELETE FROM logistics');
      await this.pool.request().query('DELETE FROM payments');
      await this.pool.request().query('DELETE FROM order_items');
      await this.pool.request().query('DELETE FROM orders');
      await this.pool.request().query('DELETE FROM cart');
      await this.pool.request().query('DELETE FROM products');
      await this.pool.request().query('DELETE FROM buyers');
      await this.pool.request().query('DELETE FROM farmers');
      await this.pool.request().query('DELETE FROM users');
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  // Create test user and return user data
  async createTestUser(userData: {
    full_name: string;
    email: string;
    password_hash: string;
    role: string;
    phone?: string;
    location?: string;
  }) {
    const result = await this.pool.request()
      .input('full_name', userData.full_name)
      .input('email', userData.email)
      .input('password_hash', userData.password_hash)
      .input('phone', userData.phone || null)
      .input('role', userData.role)
      .input('location', userData.location || null)
      .input('is_verified', 1)
      .query(`
        INSERT INTO users (full_name, email, password_hash, phone, role, location, is_verified)
        OUTPUT INSERTED.*
        VALUES (@full_name, @email, @password_hash, @phone, @role, @location, @is_verified)
      `);

    return result.recordset[0];
  }

  // Create test farmer profile
  async createTestFarmer(userId: number, farmerData: { location: string; product: string }) {
    const result = await this.pool.request()
      .input('user_id', userId)
      .input('location', farmerData.location)
      .input('product', farmerData.product)
      .query(`
        INSERT INTO farmers (user_id, location, product)
        OUTPUT INSERTED.*
        VALUES (@user_id, @location, @product)
      `);

    return result.recordset[0];
  }

  // Create test buyer profile
  async createTestBuyer(userId: number, buyerData: { location?: string } = {}) {
    const result = await this.pool.request()
      .input('user_id', userId)
      .input('location', buyerData.location || null)
      .query(`
        INSERT INTO buyers (user_id, location)
        OUTPUT INSERTED.*
        VALUES (@user_id, @location)
      `);

    return result.recordset[0];
  }

  // Create test product
  async createTestProduct(productData: {
    farmer_id: number;
    name: string;
    description?: string;
    price: number;
    quantity_available: number;
    unit: string;
    category?: string;
  }) {
    const result = await this.pool.request()
      .input('farmer_id', productData.farmer_id)
      .input('name', productData.name)
      .input('description', productData.description || null)
      .input('price', productData.price)
      .input('quantity_available', productData.quantity_available)
      .input('unit', productData.unit)
      .input('category', productData.category || null)
      .query(`
        INSERT INTO products (farmer_id, name, description, price, quantity_available, unit, category)
        OUTPUT INSERTED.*
        VALUES (@farmer_id, @name, @description, @price, @quantity_available, @unit, @category)
      `);

    return result.recordset[0];
  }

  // Create test cart item
  async createTestCartItem(cartData: {
    buyer_id: number;
    product_id: number;
    quantity: number;
  }) {
    const result = await this.pool.request()
      .input('buyer_id', cartData.buyer_id)
      .input('product_id', cartData.product_id)
      .input('quantity', cartData.quantity)
      .query(`
        INSERT INTO cart (buyer_id, product_id, quantity)
        OUTPUT INSERTED.*
        VALUES (@buyer_id, @product_id, @quantity)
      `);

    return result.recordset[0];
  }

  // Create test order
  async createTestOrder(orderData: {
    buyer_id: number;
    farmer_id: number;
    total_amount: number;
    delivery_address: string;
    delivery_city: string;
    delivery_phone: string;
    status?: string;
  }) {
    const result = await this.pool.request()
      .input('buyer_id', orderData.buyer_id)
      .input('farmer_id', orderData.farmer_id)
      .input('total_amount', orderData.total_amount)
      .input('delivery_address', orderData.delivery_address)
      .input('delivery_city', orderData.delivery_city)
      .input('delivery_phone', orderData.delivery_phone)
      .input('status', orderData.status || 'pending')
      .query(`
        INSERT INTO orders (buyer_id, farmer_id, total_amount, delivery_address, delivery_city, delivery_phone, status)
        OUTPUT INSERTED.*
        VALUES (@buyer_id, @farmer_id, @total_amount, @delivery_address, @delivery_city, @delivery_phone, @status)
      `);

    return result.recordset[0];
  }
}

// Global test setup instance
export const testDb = new TestDatabaseSetup();

// Jest setup and teardown
beforeAll(async () => {
  await testDb.connect();
});

afterAll(async () => {
  await testDb.disconnect();
});

beforeEach(async () => {
  await testDb.cleanup();
});

afterEach(async () => {
  await testDb.cleanup();
});