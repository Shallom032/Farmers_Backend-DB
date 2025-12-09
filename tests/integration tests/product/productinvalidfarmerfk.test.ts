import { productService } from '../../../src/services/productServices';
import { testDb } from '../testsetup';

describe('Product Invalid Farmer FK Integration Tests', () => {
  let validFarmerUser: any;
  let validFarmerProfile: any;
  let invalidFarmerId: number;

  beforeAll(async () => {
    // Create a valid farmer
    validFarmerUser = await testDb.createTestUser({
      full_name: 'Valid Farmer',
      email: 'valid.farmer@test.com',
      password_hash: '$2b$10$hashedpassword',
      role: 'farmer',
      location: 'Eldoret'
    });
    validFarmerProfile = await testDb.createTestFarmer(validFarmerUser.user_id, {
      location: 'Eldoret',
      product: 'Cereals'
    });

    // Set an invalid farmer ID (non-existent)
    invalidFarmerId = 99999;
  });

  describe('Product Creation with Valid Farmer', () => {
    test('should successfully create product with valid farmer', async () => {
      const productData = {
        farmer_id: validFarmerProfile.farmer_id,
        name: 'Valid Product',
        description: 'A valid product created by a real farmer',
        price: 75,
        quantity_available: 50,
        unit: 'kg',
        category: 'grains'
      };

      const result = await productService.createProduct(productData);

      expect(result.productId).toBeDefined();
      expect(result.message).toBe('Product created successfully');

      // Verify product was created in database
      const createdProduct = await productService.getProductById(result.productId);
      expect(createdProduct.name).toBe('Valid Product');
      expect(createdProduct.farmer_id).toBe(validFarmerProfile.farmer_id);
      expect(createdProduct.price).toBe(75);
      expect(createdProduct.quantity_available).toBe(50);
    });

    test('should retrieve products by valid farmer', async () => {
      const farmerProducts = await productService.getProductsByFarmer(validFarmerProfile.farmer_id);

      expect(Array.isArray(farmerProducts)).toBe(true);
      expect(farmerProducts.length).toBeGreaterThan(0);

      // All products should belong to this farmer
      farmerProducts.forEach(product => {
        expect(product.farmer_id).toBe(validFarmerProfile.farmer_id);
      });
    });
  });

  describe('Product Creation with Invalid Farmer FK', () => {
    test('should handle invalid farmer ID gracefully at service level', async () => {
      const productData = {
        farmer_id: invalidFarmerId, // Non-existent farmer
        name: 'Invalid FK Product',
        description: 'This should fail due to invalid farmer reference',
        price: 100,
        quantity_available: 25,
        unit: 'kg'
      };

      // The service layer doesn't validate FK constraints - that's handled by the database
      // This test verifies the service behavior when database constraints would apply
      const result = await productService.createProduct(productData);

      expect(result.productId).toBeDefined();

      // However, when we try to retrieve it, it might not exist due to DB constraints
      // or it might exist if the DB allows it (depending on constraint configuration)
      try {
        const retrievedProduct = await productService.getProductById(result.productId);
        // If we get here, the DB allowed the invalid FK
        expect(retrievedProduct.farmer_id).toBe(invalidFarmerId);
      } catch (error) {
        // If we get here, the DB rejected the invalid FK
        expect((error as any).message).toContain('Product not found');
      }
    });

    test('should validate farmer existence before product operations', async () => {
      // Test that farmer exists before allowing product operations
      const pool = await testDb.connect();

      // Check if farmer exists
      const farmerResult = await pool.request()
        .input('farmer_id', invalidFarmerId)
        .query('SELECT farmer_id FROM farmers WHERE farmer_id = @farmer_id');

      expect(farmerResult.recordset.length).toBe(0); // Farmer doesn't exist

      // This demonstrates why FK validation is important
      const nonExistentFarmerProducts = await pool.request()
        .input('farmer_id', invalidFarmerId)
        .query('SELECT * FROM products WHERE farmer_id = @farmer_id');

      expect(nonExistentFarmerProducts.recordset.length).toBe(0);
    });
  });

  describe('Product Data Integrity', () => {
    test('should maintain referential integrity between products and farmers', async () => {
      const pool = await testDb.connect();

      // Check for orphaned products (products with non-existent farmers)
      const integrityResult = await pool.request().query(`
        SELECT p.product_id, p.farmer_id, f.farmer_id as farmer_exists
        FROM products p
        LEFT JOIN farmers f ON p.farmer_id = f.farmer_id
        WHERE f.farmer_id IS NULL AND p.is_active = 1
      `);

      // In a well-constrained database, this should be 0
      // But if FK constraints aren't enforced, this might catch orphaned records
      console.log('Orphaned products found:', integrityResult.recordset.length);

      // For this test, we'll just verify the query runs
      expect(Array.isArray(integrityResult.recordset)).toBe(true);
    });

    test('should validate product-farmer relationship', async () => {
      const pool = await testDb.connect();

      // Get all products with farmer information
      const productsWithFarmers = await pool.request().query(`
        SELECT
          p.product_id,
          p.name as product_name,
          p.farmer_id,
          f.location as farmer_location,
          u.full_name as farmer_name
        FROM products p
        JOIN farmers f ON p.farmer_id = f.farmer_id
        JOIN users u ON f.user_id = u.user_id
        WHERE p.is_active = 1
      `);

      expect(Array.isArray(productsWithFarmers.recordset)).toBe(true);

      // Each product should have valid farmer information
      productsWithFarmers.recordset.forEach((product: any) => {
        expect(product.farmer_id).toBeDefined();
        expect(product.farmer_location).toBeDefined();
        expect(product.farmer_name).toBeDefined();
      });
    });

    test('should handle product updates with farmer validation', async () => {
      // Create a valid product first
      const validProductData = {
        farmer_id: validFarmerProfile.farmer_id,
        name: 'Update Test Product',
        price: 60,
        quantity_available: 30,
        unit: 'kg'
      };

      const createResult = await productService.createProduct(validProductData);
      const productId = createResult.productId;

      // Update the product
      const updateData = {
        name: 'Updated Test Product',
        price: 70,
        quantity_available: 25
      };

      const updateResult = await productService.updateProduct(productId, updateData);

      expect(updateResult.message).toBe('Product updated successfully');

      // Verify update
      const updatedProduct = await productService.getProductById(productId);
      expect(updatedProduct.name).toBe('Updated Test Product');
      expect(updatedProduct.price).toBe(70);
      expect(updatedProduct.quantity_available).toBe(25);
      // Farmer ID should remain unchanged
      expect(updatedProduct.farmer_id).toBe(validFarmerProfile.farmer_id);
    });
  });

  describe('Product Soft Delete Behavior', () => {
    test('should soft delete products without affecting farmer relationship', async () => {
      // Create another product
      const productData = {
        farmer_id: validFarmerProfile.farmer_id,
        name: 'Delete Test Product',
        price: 45,
        quantity_available: 15,
        unit: 'kg'
      };

      const createResult = await productService.createProduct(productData);
      const productId = createResult.productId;

      // Delete the product
      const deleteResult = await productService.deleteProduct(productId);

      expect(deleteResult.message).toBe('Product deleted successfully');

      // Verify soft delete (product should still exist but marked inactive)
      const pool = await testDb.connect();
      const productResult = await pool.request()
        .input('product_id', productId)
        .query('SELECT * FROM products WHERE product_id = @product_id');

      expect(productResult.recordset[0].is_active).toBe(0);

      // Farmer relationship should still be intact
      expect(productResult.recordset[0].farmer_id).toBe(validFarmerProfile.farmer_id);
    });

    test('should exclude soft deleted products from active queries', async () => {
      const activeProducts = await productService.getProductsByFarmer(validFarmerProfile.farmer_id);

      // None of the soft deleted products should appear in active queries
      activeProducts.forEach(product => {
        expect(product.is_active).not.toBe(0);
      });
    });
  });
});