# Roadmap — POS Kasir

> Last updated: 2026-05-25

## Status Legend
- `[ ]` Belum dimulai
- `[/]` Sedang dikerjakan
- `[x]` Selesai
- `[-]` Ditunda / Backlog

## Fase 1: Foundation ✅ (Week 1–2)
> Setup infrastruktur, auth, design system dasar

- [x] Planning & dokumentasi AI agent
- [x] Init Next.js 15 + TypeScript + Tailwind v4
- [x] Install semua dependencies (Supabase, Zustand, Dexie, dll)
- [x] Setup Supabase project di cloud
- [x] Buat migration SQL (schema + indexes)
- [x] Buat `src/config/app.ts` (APP_CONFIG)
- [x] Buat Supabase client helpers (`client.ts`, `server.ts`)
- [x] Middleware auth + role guard
- [x] TypeScript types (database + app)
- [x] Utility functions (currency, order-number, whatsapp)
- [x] Halaman login (`/login`)
- [x] Redirect root page
- [x] Placeholder `/kasir`
- [ ] Setup PWA (`manifest.json` + `next-pwa`)
- [ ] Design system (Tailwind config, tokens warna)
- [ ] Zustand stores skeleton (cart, auth, sync)


## Fase 2: Core POS — Kasir (Week 3–4)
> Fitur paling kritis — harus jalan sempurna sebelum lanjut

- [ ] Layout kasir (grid produk + cart)
- [ ] `ProductGrid` — fetch + display produk realtime
- [ ] Filter kategori
- [ ] Pencarian produk (debounce)
- [ ] `CartSidebar` — add/remove/update qty
- [ ] CRUD produk & kategori (admin panel dasar)
- [ ] `CheckoutModal` — flow checkout lengkap
- [ ] Pilih metode bayar (Tunai / Debit / QRIS)
- [ ] Hitung kembalian
- [ ] Auto-apply promo aktif
- [ ] Digital receipt via WhatsApp deeplink
- [ ] History transaksi hari ini
- [ ] Clock-in / Clock-out shift

## Fase 3: Inventori & BOM (Week 5)
> Auto-deduct stok adalah fitur kritis untuk F&B

- [ ] CRUD bahan baku
- [ ] BOM Builder UI (tambah/edit bahan per produk)
- [ ] Supabase Edge Function: `process_order_stock_deduction`
- [ ] Restock manual
- [ ] Stock alert panel (merah/kuning/hijau)
- [ ] Log mutasi stok

## Fase 4: Offline Mode (Week 6)
> Transaksi tetap jalan saat internet mati

- [ ] Dexie.js setup + IndexedDB schema
- [ ] Service worker strategy (via next-pwa)
- [ ] Offline checkout → queue ke IndexedDB
- [ ] Auto-sync saat koneksi pulih
- [ ] `SyncStatusBadge` — indikator realtime
- [ ] Conflict resolution strategy

## Fase 5: Admin Panel (Week 7–8)
> Laporan, promo, user management

- [ ] Dashboard analytics (kartu + charts Recharts)
- [ ] Modul promo & diskon
- [ ] Manajemen user (CRUD + role)
- [ ] Laporan shift & presensi
- [ ] Export PDF (jsPDF)
- [ ] Export Excel (SheetJS)

## Fase 6: Polish & Deploy (Week 9)
> Finishing, testing, go-live

- [ ] Import produk via Excel (bulk)
- [ ] Pengaturan toko (nama, logo, QRIS statis)
- [ ] Testing E2E (Playwright)
- [ ] Performance audit (Lighthouse)
- [ ] Setup environment variables di Vercel
- [ ] Deploy ke Vercel production
- [ ] Custom domain (opsional)
- [ ] Dokumentasi penggunaan untuk kasir & admin

---

## Backlog (Fase Maintenance)

- [-] QRIS dinamis (Midtrans/Xendit)
- [-] Product variants (S/M/L, hot/iced)
- [-] Notifikasi push (stock alert via browser notification)
- [-] Dark mode toggle
- [-] Laporan laba-rugi (COGS dari `cost_per_unit`)
- [-] Multi-device kasir (realtime cart sync)
- [-] Printer thermal (Web Bluetooth API)
