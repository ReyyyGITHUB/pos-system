# Tech Stack — POS Kasir

## Stack Lengkap

| Layer | Teknologi | Versi | Alasan |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15.x | SSR/CSR fleksibel, PWA support, ekosistem besar |
| **Language** | TypeScript | 5.x | Type safety, maintainability jangka panjang |
| **Styling** | Tailwind CSS | v4 | Utility-first, design system konsisten |
| **Database** | PostgreSQL via Supabase | latest | Relational, RLS, realtime built-in |
| **Auth** | Supabase Auth | latest | JWT, email+password, built-in |
| **State** | Zustand | 5.x | Ringan, no boilerplate, devtools support |
| **Offline DB** | Dexie.js (IndexedDB) | 4.x | Wrapper IndexedDB yang ergonomis |
| **Charts** | Recharts | 2.x | React-native, responsive, composable |
| **PWA** | next-pwa | latest | Service worker + installable di iPad |
| **Export** | jsPDF + SheetJS | latest | PDF laporan + export Excel |
| **Validation** | Zod | 3.x | Runtime validation + TypeScript inference |
| **Forms** | React Hook Form | 7.x | Performant, integrates dengan Zod |
| **Hosting FE** | Vercel | — | Zero-config deploy untuk Next.js |
| **Hosting BE** | Supabase Cloud | — | Managed PostgreSQL + realtime |
| **Package Mgr** | npm | — | Default, pnpm tidak terinstall di mesin ini |

## Supabase Services yang Dipakai

```
✅ Auth          — JWT authentication, role via user metadata
✅ Database      — PostgreSQL + RLS policies
✅ Realtime      — Live update produk & stok di layar kasir
✅ Storage       — Foto produk & gambar QRIS statis
✅ Edge Functions — Auto-deduct stok saat transaksi complete
```

## Package Install Commands

```bash
# Core dependencies
npm install @supabase/supabase-js zustand dexie zod react-hook-form recharts

# PWA
npm install next-pwa

# Export
npm install jspdf xlsx

# Dev
npm install -D @types/node
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Server-side only (Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Versi Next.js Config yang Digunakan

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' }
    ]
  }
}

export default nextConfig
```
