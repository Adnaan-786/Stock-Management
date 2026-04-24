-- Indexes
-- Users Email Index
CREATE INDEX idx_users_email ON users(email);

-- Products Name Index
CREATE INDEX idx_products_name ON products(name);

-- Orders Date Index
CREATE INDEX idx_orders_date ON orders(order_date);

-- Product Order Items Composite Index
CREATE INDEX idx_poi_product_order ON product_order_items(product_id, order_item_id);

-- Customers Email Index
CREATE INDEX idx_customers_email ON customers(email);

-- Procedure to Update Product Quantity Stock
CREATE OR REPLACE FUNCTION update_product_quantity(
    p_product_id INT,
    p_quantity_change INT
)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET quantity = quantity + p_quantity_change,
        updated_time = CURRENT_TIMESTAMP
    WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure to Create a New Order with Items
-- In Postgres, we pass arrays instead of comma-separated strings
CREATE OR REPLACE FUNCTION create_order(
    p_customer_id INT,
    p_product_ids INT[],
    p_quantities INT[],
    p_prices DECIMAL(10,2)[]
)
RETURNS INT AS $$
DECLARE
    v_order_id INT;
    v_order_item_id INT;
    i INT;
BEGIN
    -- Insert new order
    INSERT INTO orders (customer_id, status) VALUES (p_customer_id, 'pending')
    RETURNING order_id INTO v_order_id;

    -- Loop through arrays to insert items
    FOR i IN 1 .. array_length(p_product_ids, 1) LOOP
        -- Insert order item
        INSERT INTO order_items (order_id) VALUES (v_order_id)
        RETURNING order_item_id INTO v_order_item_id;

        -- Insert product_order_item
        INSERT INTO product_order_items (product_id, order_item_id, quantity, total_price)
        VALUES (
            p_product_ids[i],
            v_order_item_id,
            p_quantities[i],
            p_quantities[i] * p_prices[i]
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;


-- Triggers
-- Trigger to update product quantity after inserting into product_order_items
CREATE OR REPLACE FUNCTION trg_after_insert_product_order_items_func()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET quantity = quantity - NEW.quantity,
        updated_time = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_insert_product_order_items
AFTER INSERT ON product_order_items
FOR EACH ROW EXECUTE FUNCTION trg_after_insert_product_order_items_func();
