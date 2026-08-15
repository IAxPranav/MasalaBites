ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text;

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone
  ON orders (customer_phone);
