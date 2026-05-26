# Arsitektur Sistem — POS Kasir

## Diagram Sistem

```
┌─────────────────────────────────────────────────┐
│                   VERCEL CDN                     │
│  ┌─────────────────────────────────────────┐    │
│  │         Next.js 15 App Router           │    │
│  │                                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌───────┐ │    │
│  │  │ /kasir   │  │ /admin   │  │ /auth │ │    │
│  │  │ (Kasir)  │  │ (Admin)  │  │       │ │    │
│  │  └──────────┘  └──────────┘  └───────┘ │    │
│  │                                         │    │
│  │  ┌─────────────────────────────────┐   │    │
│  │  │    Service Worker (next-pwa)     │   │    │
│  │  │    IndexedDB via Dexie.js        │   │    │
│  │  └─────────────────────────────────┘   │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                        │
              HTTPS / Supabase SDK
                        │
┌─────────────────────────────────────────────────┐
│                SUPABASE CLOUD                    │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Auth     │  │ Realtime │  │  PostgreSQL   │ │
│  │ (JWT)    │  │ (WS sub) │  │  + RLS        │ │
│  └──────────┘  └──────────┘  └───────────────┘ │
│                                                  │
│  ┌──────────┐  ┌──────────────────────────────┐ │
│  │ Storage  │  │ Edge Functions               │ │
│  │ (foto)   │  │ - process_order_deduction    │ │
│  └──────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Struktur Folder Proyek

```
pos-kasir/
├── .docs/                         ← Dokumentasi AI agent (baca ini dulu!)
│   ├── README.md
│   ├── project-overview.md
│   ├── tech-stack.md
│   ├── database-schema.md
│   ├── architecture.md            ← file ini
│   ├── modules.md
│   ├── conventions.md
│   └── roadmap.md
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── kasir/                 ← Akses: kasir + admin
│   │   │   ├── page.tsx           ← POS utama (grid produk + cart)
│   │   │   └── riwayat/
│   │   │       └── page.tsx       ← History transaksi hari ini
│   │   ├── admin/                 ← Akses: admin only
│   │   │   ├── layout.tsx         ← Sidebar admin
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── produk/
│   │   │   │   ├── page.tsx       ← List produk
│   │   │   │   └── [id]/page.tsx  ← Edit produk + BOM
│   │   │   ├── inventori/page.tsx
│   │   │   ├── promo/page.tsx
│   │   │   ├── laporan/page.tsx
│   │   │   ├── shift/page.tsx
│   │   │   ├── user/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   └── sync/route.ts      ← Endpoint offline sync
│   │   ├── layout.tsx             ← Root layout + auth provider
│   │   └── page.tsx               ← Redirect ke /kasir atau /auth/login
│   │
│   ├── components/
│   │   ├── kasir/
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── CartSidebar.tsx
│   │   │   ├── CheckoutModal.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   └── SyncStatusBadge.tsx
│   │   ├── admin/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── BOMBuilder.tsx
│   │   ├── ui/                    ← Komponen reusable (Button, Input, Modal, dll)
│   │   └── charts/
│   │       ├── RevenueChart.tsx
│   │       ├── TopProductsChart.tsx
│   │       └── PaymentMethodChart.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          ← createBrowserClient()
│   │   │   └── server.ts          ← createServerClient()
│   │   ├── db/
│   │   │   └── offline.ts         ← Dexie schema + IndexedDB types
│   │   ├── sync/
│   │   │   └── queue.ts           ← Offline sync queue logic
│   │   └── utils/
│   │       ├── currency.ts        ← formatRupiah(), parseRupiah()
│   │       ├── order-number.ts    ← generateOrderNumber()
│   │       └── whatsapp.ts        ← buildReceiptMessage()
│   │
│   ├── hooks/
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useSyncQueue.ts
│   │
│   ├── stores/                    ← Zustand stores
│   │   ├── cart.store.ts
│   │   ├── auth.store.ts
│   │   └── sync.store.ts
│   │
│   ├── types/
│   │   ├── database.ts            ← Types dari Supabase schema
│   │   └── app.ts                 ← App-specific types
│   │
│   └── config/
│       └── app.ts                 ← APP_CONFIG (nama toko, dll)
│
├── supabase/
│   ├── migrations/                ← SQL migration files (versioned)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_functions.sql
│   └── functions/                 ← Supabase Edge Functions
│       └── process-order/
│           └── index.ts
│
├── public/
│   ├── manifest.json              ← PWA manifest
│   └── icons/                    ← PWA icons (192, 512px)
│
├── .docs/                         ← AI agent docs (lihat atas)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                    ← Jangan commit!
```

## Offline Strategy

### Flow Transaksi Offline

```
User checkout
    │
    ├─ Online? ──YES──► POST ke Supabase ──► Konfirmasi
    │
    └─ Offline? ──────► Simpan ke IndexedDB (Dexie)
                              │
                        Status: "pending_sync"
                              │
                    Internet pulih?
                              │
                        Auto-sync queue ──► POST ke Supabase
                              │
                        Update status: "synced"
```

### Service Worker Cache Strategy
- **Cache First**: aset statis (JS, CSS, gambar produk)
- **Network First**: API calls ke Supabase
- **Stale While Revalidate**: data produk & kategori

### IndexedDB Schema (Dexie)

```typescript
// Tabel lokal untuk offline
{
  pending_orders: '++id, created_at, synced',
  cached_products: 'id, category_id, updated_at',
  cached_categories: 'id',
}
```

## Auth & Role Guard

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 1. Cek session Supabase
  // 2. /admin/* → wajib role 'admin'
  // 3. /kasir/* → role 'kasir' atau 'admin'
  // 4. Redirect ke /auth/login jika tidak auth
}
```

## Realtime Subscriptions

```typescript
// Kasir: subscribe perubahan produk (admin update menu)
supabase
  .channel('products')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
  .subscribe()

// Admin: subscribe stock alert (stok di bawah minimum)
supabase
  .channel('ingredients')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ingredients' }, callback)
  .subscribe()
```
