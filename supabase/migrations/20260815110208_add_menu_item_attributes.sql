/*
# Add veg, spice_level, and is_special columns to menu_items

1. Modified Tables
- `menu_items`: Added three new columns:
  - `veg` (boolean, default true) — whether the dish is vegetarian
  - `spice_level` (int, default 0) — spice level 0-3
  - `is_special` (boolean, default false) — chef's special flag

2. Security
- No security changes. Existing RLS policies remain in place.

3. Important Notes
- All columns have safe defaults so existing rows are not null.
- Migration is idempotent (uses DO $$ block for conditional column adds).
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'veg') THEN
    ALTER TABLE menu_items ADD COLUMN veg boolean NOT NULL DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'spice_level') THEN
    ALTER TABLE menu_items ADD COLUMN spice_level int NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_special') THEN
    ALTER TABLE menu_items ADD COLUMN is_special boolean NOT NULL DEFAULT false;
  END IF;
END $$;