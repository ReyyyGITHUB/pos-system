-- Migration 001: Initial Schema
-- POS Kasir — Database Setup
-- Run this in Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extension dari auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('kasir', 'admin')),
  pin         TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'kasir')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT '🍽️',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INGREDIENTS (Bahan Baku)
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  unit           TEXT NOT NULL DEFAULT 'gram',
  stock          NUMERIC(12,3) NOT NULL DEFAULT 0,
  min_stock      NUMERIC(12,3) NOT NULL DEFAULT 0,
  cost_per_unit  NUMERIC(12,4) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PRODUCT RECIPES (BOM)
-- ============================================
CREATE TABLE IF NOT EXISTS product_recipes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id  UUID NOT NULL REFERENCES ingredients(id),
  quantity       NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  UNIQUE(product_id, ingredient_id)
);

-- ============================================
-- PROMOTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS promotions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value        NUMERIC(12,2) NOT NULL CHECK (value > 0),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  min_purchase NUMERIC(12,2) NOT NULL DEFAULT 0,
  CHECK (end_date >= start_date)
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT UNIQUE NOT NULL,
  cashier_id      UUID NOT NULL REFERENCES profiles(id),
  subtotal        NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  promotion_id    UUID REFERENCES promotions(id),
  total           NUMERIC(12,2) NOT NULL,
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('tunai', 'debit', 'qris')),
  amount_paid     NUMERIC(12,2) NOT NULL,
  change_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  customer_name   TEXT,
  customer_phone  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at       TIMESTAMPTZ
);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  price        NUMERIC(12,2) NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  subtotal     NUMERIC(12,2) NOT NULL
);

-- ============================================
-- STOCK MOVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
  order_id        UUID REFERENCES orders(id),
  movement_type   TEXT NOT NULL CHECK (movement_type IN ('sale', 'restock', 'adjustment', 'waste')),
  quantity_change NUMERIC(12,3) NOT NULL,
  stock_before    NUMERIC(12,3) NOT NULL,
  stock_after     NUMERIC(12,3) NOT NULL,
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SHIFTS
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id  UUID NOT NULL REFERENCES profiles(id),
  clock_in    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out   TIMESTAMPTZ,
  total_hours NUMERIC(5,2),
  notes       TEXT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cashier ON orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
