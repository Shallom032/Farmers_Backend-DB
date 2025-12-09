-- =========================================
-- AFRI TECH AGROSOLUTION DATABASE SCHEMA
-- Complete database setup for farmers digital market
-- =========================================

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Afri_Tech_AgroSolution')
BEGINATE DATABASE [Afri_Tech_AgroSolution];
END
    CRE
GO

USE [Afri_Tech_AgroSolution];
GO

-- =========================================
-- USERS TABLE (Core authentication)
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        location NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK (role IN ('farmer','buyer','logistics','admin')),
        is_verified BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    )
END

-- Add location column to existing users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'location')
BEGIN
    ALTER TABLE users ADD location NVARCHAR(255);
    -- Set default location for existing users
    UPDATE users SET location = 'Nairobi, Kenya' WHERE location IS NULL;
    -- Make it NOT NULL
    ALTER TABLE users ALTER COLUMN location NVARCHAR(255) NOT NULL;
END

-- =========================================
-- EMAIL VERIFICATION TOKENS
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[email_verification_tokens]') AND type in (N'U'))
BEGIN
    CREATE TABLE email_verification_tokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token NVARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_email_verification_tokens_users
            FOREIGN KEY (user_id) REFERENCES users(user_id)
            ON DELETE CASCADE
    )
END

-- =========================================
-- FARMERS PROFILE TABLE
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[farmers]') AND type in (N'U'))
BEGIN
    CREATE TABLE farmers (
        farmer_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        location NVARCHAR(255),
        product NVARCHAR(255), -- Keep original column for backward compatibility
        farm_size NVARCHAR(100),
        specialization NVARCHAR(255),
        experience_years INT,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_farmers_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
END

-- =========================================
-- BUYERS PROFILE TABLE
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[buyers]') AND type in (N'U'))
BEGIN
    CREATE TABLE buyers (
        buyer_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        location NVARCHAR(255),
        produce_purchased NVARCHAR(255), -- Keep original columns
        quantity INT DEFAULT 0,
        delivery_status NVARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending','in_progress','delivered')),
        business_type NVARCHAR(100), -- New columns
        preferred_products NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_buyers_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
END

-- Add new columns to existing buyers table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[buyers]') AND name = 'business_type')
BEGIN
    ALTER TABLE buyers ADD business_type NVARCHAR(100);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[buyers]') AND name = 'preferred_products')
BEGIN
    ALTER TABLE buyers ADD preferred_products NVARCHAR(500);
END

-- =========================================
-- PRODUCTS TABLE
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
BEGIN
    CREATE TABLE products (
        product_id INT IDENTITY(1,1) PRIMARY KEY,
        farmer_id INT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(1000),
        price DECIMAL(10,2) NOT NULL CHECK (price > 0),
        quantity_available INT NOT NULL CHECK (quantity_available >= 0),
        unit NVARCHAR(50) NOT NULL, -- kg, pieces, crates, etc.
        category NVARCHAR(100),
        image_url NVARCHAR(500),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_products_farmers FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE
    )
END

-- =========================================
-- CART TABLE
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cart]') AND type in (N'U'))
BEGIN
    CREATE TABLE cart (
        cart_id INT IDENTITY(1,1) PRIMARY KEY,
        buyer_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        added_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_cart_buyers FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE,
        CONSTRAINT FK_cart_products FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE NO ACTION,
        CONSTRAINT UQ_cart_buyer_product UNIQUE (buyer_id, product_id)
    )
END

-- =========================================
-- ORDERS TABLE
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[orders]') AND type in (N'U'))
BEGIN
    CREATE TABLE orders (
        order_id INT IDENTITY(1,1) PRIMARY KEY,
        buyer_id INT NOT NULL,
        farmer_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
        status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
        order_date DATETIME DEFAULT GETDATE(),
        delivery_address NVARCHAR(500),
        delivery_city NVARCHAR(100),
        delivery_phone NVARCHAR(50),
        notes NVARCHAR(1000),
        CONSTRAINT FK_orders_buyers FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id),
        CONSTRAINT FK_orders_farmers FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id)
    )
END

-- =========================================
-- ORDER ITEMS TABLE (Junction table)
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[order_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE order_items (
        order_item_id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
        total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
        CONSTRAINT FK_order_items_orders FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        CONSTRAINT FK_order_items_products FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE NO ACTION
    )
END

-- =========================================
-- PAYMENTS TABLE
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[payments]') AND type in (N'U'))
BEGIN
    CREATE TABLE payments (
        payment_id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
        payment_method NVARCHAR(50) NOT NULL CHECK (payment_method IN ('mpesa','card','bank_transfer','cash')),
        payment_status NVARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending','completed','failed','refunded')),
        transaction_id NVARCHAR(255),
        payment_date DATETIME DEFAULT GETDATE(),
        processed_by INT, -- admin user_id who approved
        notes NVARCHAR(500),
        CONSTRAINT FK_payments_orders FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        CONSTRAINT FK_payments_admin FOREIGN KEY (processed_by) REFERENCES users(user_id)
    )
END

-- =========================================
-- LOGISTICS TABLE
-- =========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistics]') AND type in (N'U'))
BEGIN
    CREATE TABLE logistics (
        logistics_id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT,
        delivery_agent_id INT NOT NULL,
        pickup_location NVARCHAR(255),
        dropoff_location NVARCHAR(255),
        delivery_status NVARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending','in_progress','delivered','cancelled')),
        delivery_date DATE,
        estimated_delivery DATETIME,
        actual_delivery DATETIME,
        tracking_number NVARCHAR(100),
        notes NVARCHAR(1000),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_logistics_orders FOREIGN KEY (order_id) REFERENCES orders(order_id),
        CONSTRAINT FK_logistics_users FOREIGN KEY (delivery_agent_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
END

-- =========================================
-- SAMPLE DATA INSERTION
-- =========================================

-- Insert admin user first
INSERT INTO users (full_name, email, password_hash, phone, location, role, is_verified)
VALUES
('System Admin', 'admin@afriagro.co.ke', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+254700000000', 'Nairobi, Kenya', 'admin', 1);

-- Insert sample farmers
INSERT INTO users (full_name, email, password_hash, phone, location, role, is_verified)
VALUES
('John Mwangi', 'john.mwangi@farm.co.ke', '$2b$10$hash1', '+254712345678', 'Nairobi County, Kenya', 'farmer', 1),
('Grace Wanjiku', 'grace.wanjiku@farm.co.ke', '$2b$10$hash2', '+254723456789', 'Kiambu County, Kenya', 'farmer', 1);

-- Insert sample buyers
INSERT INTO users (full_name, email, password_hash, phone, location, role, is_verified)
VALUES
('Mary Achieng', 'mary.achieng@buyer.co.ke', '$2b$10$hash3', '+254734567890', 'Nairobi CBD, Kenya', 'buyer', 1),
('David Kiprop', 'david.kiprop@buyer.co.ke', '$2b$10$hash4', '+254745678901', 'Westlands, Kenya', 'buyer', 1);

-- Insert sample logistics agent
INSERT INTO users (full_name, email, password_hash, phone, location, role, is_verified)
VALUES
('Peter Otieno', 'peter.otieno@logistics.co.ke', '$2b$10$hash5', '+254756789012', 'Nairobi, Kenya', 'logistics', 1);

-- Add new columns to existing farmers table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[farmers]') AND name = 'farm_size')
BEGIN
    ALTER TABLE farmers ADD farm_size NVARCHAR(100);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[farmers]') AND name = 'specialization')
BEGIN
    ALTER TABLE farmers ADD specialization NVARCHAR(255);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[farmers]') AND name = 'experience_years')
BEGIN
    ALTER TABLE farmers ADD experience_years INT;
END

-- Insert farmer profiles (using original columns)
INSERT INTO farmers (user_id, location, product)
VALUES
(2, 'Nairobi County', 'Maize'),
(3, 'Kiambu County', 'Tomatoes');

-- Insert buyer profiles (using original columns)
INSERT INTO buyers (user_id, location, produce_purchased, quantity, delivery_status)
VALUES
(4, 'Nairobi CBD', 'Vegetables', 0, 'pending'),
(5, 'Westlands', 'Grains', 0, 'pending');

-- Insert sample products
INSERT INTO products (farmer_id, name, description, price, quantity_available, unit, category, image_url)
VALUES
(1, 'Fresh Maize', 'High quality white maize, freshly harvested from Nairobi farms', 2500.00, 500, '50kg bag', 'Grains', '/images/maize.jpg'),
(1, 'Tomatoes', 'Ripe red tomatoes, perfect for restaurants and households', 150.00, 200, 'kg', 'Vegetables', '/images/tomatoes.jpg'),
(1, 'Onions', 'Sweet red onions, long shelf life', 120.00, 300, 'kg', 'Vegetables', '/images/onions.jpg'),
(2, 'Kales (Sukuma Wiki)', 'Fresh green kales, rich in nutrients', 80.00, 150, 'bunch', 'Vegetables', '/images/kales.jpg'),
(2, 'Spinach', 'Tender spinach leaves, perfect for cooking', 60.00, 100, 'bunch', 'Vegetables', '/images/spinach.jpg');

-- =========================================
-- USEFUL QUERIES FOR TESTING
-- =========================================

-- Check all tables
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Check users
SELECT user_id, full_name, email, role, is_verified FROM users;

-- Check products
SELECT p.product_id, f.farmer_id, u.full_name as farmer_name, p.name, p.price, p.quantity_available, p.unit
FROM products p
JOIN farmers f ON p.farmer_id = f.farmer_id
JOIN users u ON f.user_id = u.user_id;

PRINT 'Database schema created successfully!';
PRINT 'Sample data inserted for testing.';
PRINT 'You can now add products through the dashboard.';


select * from 

ALTER TABLE logistics ADD updated_at DATETIME DEFAULT GETDATE();



select* 
from users