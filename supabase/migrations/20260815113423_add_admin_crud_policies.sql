/*
# Add admin CRUD policies for menu_items and tables

1. Purpose
- The admin panel needs to create, update, and delete menu items and tables.
- Currently only SELECT policies exist for these tables (public read).
- This migration adds INSERT, UPDATE, and DELETE policies for anon+authenticated,
  matching the existing no-auth single-tenant pattern used throughout the app.

2. Modified Tables
- `menu_items`: added INSERT, UPDATE, DELETE policies (anon + authenticated)
- `tables`: added INSERT, UPDATE, DELETE policies (anon + authenticated)

3. Security
- No new tables. RLS already enabled on both tables.
- Policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a no-auth shared-kiosk app where all data is intentionally public.
  The admin panel is gated by a password screen in the frontend, not by database auth.
- This is consistent with the existing orders/order_items write policies.

4. Important Notes
- The admin panel password gate is enforced in the frontend (sessionStorage).
- These policies are idempotent: DROP POLICY IF EXISTS before CREATE.
*/

-- menu_items: admin writes
DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
CREATE POLICY "anon_insert_menu_items" ON menu_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
CREATE POLICY "anon_update_menu_items" ON menu_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;
CREATE POLICY "anon_delete_menu_items" ON menu_items FOR DELETE
  TO anon, authenticated USING (true);

-- tables: admin writes
DROP POLICY IF EXISTS "anon_insert_tables" ON tables;
CREATE POLICY "anon_insert_tables" ON tables FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tables" ON tables;
CREATE POLICY "anon_update_tables" ON tables FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tables" ON tables;
CREATE POLICY "anon_delete_tables" ON tables FOR DELETE
  TO anon, authenticated USING (true);

-- Also add DELETE policy for orders so admin can delete/cancel orders
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE
  TO anon, authenticated USING (true);

-- Add realtime for menu_items and tables so admin panel gets live updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables;
  END IF;
END $$;
