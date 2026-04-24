-- 1. Create a function to auto-update 'updated_time' column
CREATE OR REPLACE FUNCTION update_updated_time_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_time = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- CORE TABLES

CREATE TABLE warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_warehouses_updated_time
BEFORE UPDATE ON warehouses
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_name VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role_name IN ('admin', 'staff')),
    image_url TEXT,
    warehouse_id INT,
    is_active BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

CREATE TRIGGER update_users_updated_time
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

CREATE TABLE login_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    refresh_token VARCHAR(255),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loginlogs_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TRIGGER update_login_logs_updated_time
BEFORE UPDATE ON login_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_suppliers_updated_time
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_categories_updated_time
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

-- PRODUCT SYSTEM

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    supplier_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    category_id INT NOT NULL,
    image_url TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    CONSTRAINT fk_products_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TRIGGER update_products_updated_time
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

-- ORDER SYSTEM

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_customers_updated_time
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TRIGGER update_orders_updated_time
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TRIGGER update_order_items_updated_time
BEFORE UPDATE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_updated_time_column();

CREATE TABLE product_order_items (
    product_id INT NOT NULL,
    order_item_id INT NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (product_id, order_item_id),
    CONSTRAINT fk_poi_product FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT fk_poi_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id)
);

-- product_order_items does not have created_time or updated_time in original schema
