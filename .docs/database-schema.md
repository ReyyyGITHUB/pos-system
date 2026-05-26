# Database Schema — POS Kasir

## Overview

Database: **PostgreSQL** via Supabase Cloud
Auth tabel dikelola Supabase (`auth.users`), profil user di tabel `profiles` sebagai extension.

> ⚠️ **RLS: DINONAKTIFKAN** — Keamanan dihandle di middleware Next.js. Gunakan `SUPABASE_SERVICE_ROLE_KEY` hanya server-side. Jangan expose URL project sembarangan.

## Tabel & Kolom

### `profiles`
Extension dari `auth.users`. Dibuat otomatis via trigger saat user baru register.
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('kasir', 'admin')),
  pin         TEXT,                    -- bcrypt hash PIN 4 digit (kasir)
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `categories`
```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  icon        TEXT,                    -- emoji atau lucide icon name
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true
);
```

### `products`
```sql
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `ingredients`
```sql
CREATE TABLE ingredients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  unit           TEXT NOT NULL,        -- 'gram', 'ml', 'pcs', 'liter', dll
  stock          NUMERIC(12,3) NOT NULL DEFAULT 0,
  min_stock      NUMERIC(12,3) NOT NULL DEFAULT 0,
  cost_per_unit  NUMERIC(12,4) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `product_recipes` (BOM — Bill of Materials)
```sql
CREATE TABLE product_recipes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id  UUID NOT NULL REFERENCES ingredients(id),
  quantity       NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  UNIQUE(product_id, ingredient_id)
);
```

### `promotions`
```sql
CREATE TABLE promotions (
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
```

### `orders`
```sql
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT UNIQUE NOT NULL,   -- format: ORD-YYYYMMDD-XXXX
  cashier_id      UUID NOT NULL REFERENCES profiles(id),
  subtotal        NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  promotion_id    UUID REFERENCES promotions(id),
  total           NUMERIC(12,2) NOT NULL,
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('tunai', 'debit', 'qris')),
  amount_paid     NUMERIC(12,2) NOT NULL,
  change_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  customer_name   TEXT,
  customer_phone  TEXT,                   -- untuk WA deeplink receipt
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at       TIMESTAMPTZ             -- NULL = belum sync (transaksi offline)
);
```

### `order_items`
```sql
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id),
  product_name TEXT NOT NULL,             -- SNAPSHOT nama saat transaksi
  price        NUMERIC(12,2) NOT NULL,    -- SNAPSHOT harga saat transaksi
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  subtotal     NUMERIC(12,2) NOT NULL
);
```

> ⚠️ `product_name` dan `price` adalah snapshot — sengaja tidak FK-only agar laporan historis tetap akurat saat harga berubah.

### `stock_movements`
```sql
CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
  order_id        UUID REFERENCES orders(id),  -- NULL jika manual adjustment
  movement_type   TEXT NOT NULL
                  CHECK (movement_type IN ('sale', 'restock', 'adjustment', 'waste')),
  quantity_change NUMERIC(12,3) NOT NULL,       -- negatif=keluar, positif=masuk
  stock_before    NUMERIC(12,3) NOT NULL,
  stock_after     NUMERIC(12,3) NOT NULL,
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `shifts`
```sql
CREATE TABLE shifts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id  UUID NOT NULL REFERENCES profiles(id),
  clock_in    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out   TIMESTAMPTZ,
  total_hours NUMERIC(5,2),              -- auto-calculated saat clock_out
  notes       TEXT
);
```

## Row Level Security (RLS)

**Status: ❌ SKIP — tidak digunakan.**

Keamanan dihandle di layer aplikasi:
- `middleware.ts` — cek session + role sebelum render halaman
- API routes pakai `SUPABASE_SERVICE_ROLE_KEY` (server-side only, tidak pernah ke client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` hanya untuk auth login, bukan query data sensitif

## Database Functions (Supabase Edge)

### `process_order_stock_deduction(order_id UUID)`
Dipanggil saat `orders.status` berubah ke `'completed'`:
1. Loop semua `order_items` dari order tersebut
2. Untuk tiap item, lookup `product_recipes`
3. Kurangi `ingredients.stock` sesuai `quantity * recipe.quantity`
4. Insert log ke `stock_movements`

### `generate_order_number()`
Generate order number format `ORD-YYYYMMDD-XXXX` (XXXX = 4 digit sequential per hari).

## Relasi Ringkas

```
categories ──< products ──< product_recipes >── ingredients
                    │                                 │
                    └──< order_items                  └──< stock_movements
                               │
                    orders >───┘
                       │
                    profiles >── shifts
                       │
                    promotions
```

## Index yang Direkomendasikan

```sql
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_cashier ON orders(cashier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
```
