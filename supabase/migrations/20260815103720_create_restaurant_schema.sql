/*
# Create Masala Bites restaurant ordering schema

1. New Tables
- `tables`: Restaurant tables (1-12) with number and capacity.
- `menu_items`: Dishes with name, description, price, category, image_url, availability.
- `orders`: Customer orders linked to a table, with status and payment info.
- `order_items`: Line items belonging to an order (menu_item snapshot, quantity, notes).

2. Security
- Enable RLS on all tables.
- This is a no-auth public ordering app (customers scan QR and order).
- Policies use `TO anon, authenticated` so the anon-key frontend can read/write.
- Kitchen panel also runs as anon (shared kiosk), so anon CRUD is intentional.
- `USING (true)` is acceptable because all data is intentionally shared/public across the restaurant.

3. Important Notes
- Orders store a snapshot of menu item name/price in order_items so historical orders remain accurate even if menu items change.
- Order status flow: pending -> preparing -> ready -> completed. Cancelled is a side state.
- Payment method: 'counter' or 'online'. Payment status: 'unpaid' or 'paid'.
*/

CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number int NOT NULL UNIQUE,
  capacity int NOT NULL DEFAULT 4,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL,
  category text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'counter',
  payment_status text NOT NULL DEFAULT 'unpaid',
  total numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- tables: public read, no writes needed from frontend
DROP POLICY IF EXISTS "anon_read_tables" ON tables;
CREATE POLICY "anon_read_tables" ON tables FOR SELECT
  TO anon, authenticated USING (true);

-- menu_items: public read, no writes from frontend (managed via SQL)
DROP POLICY IF EXISTS "anon_read_menu_items" ON menu_items;
CREATE POLICY "anon_read_menu_items" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);


DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- order_items: public read + insert
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- Add realtime publication for orders so kitchen panel gets live updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;