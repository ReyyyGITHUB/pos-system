# Project Overview — POS Kasir

## Konteks Bisnis

Aplikasi Point of Sale (POS) berbasis web untuk **UMKM F&B** (kafe/booth) skala 1 cabang.
Nama placeholder: **"Kafe Anda"** — dapat diganti di `src/config/app.ts`.

## Target Pengguna

| Role | Akses | Device Utama |
|---|---|---|
| **Kasir** | Modul transaksi + clock-in/out | iPad / tablet (touch-first) |
| **Admin** | Full akses semua modul | Laptop / desktop |

## Prinsip Desain Utama

1. **Touch-first** — semua elemen interaktif minimum 44×44px
2. **Light mode only** — outdoor booth, keterbacaan prioritas
3. **Bahasa Indonesia** — seluruh teks UI
4. **Speed** — minim klik untuk checkout, tidak ada full-page reload
5. **Offline-capable** — transaksi tetap jalan saat internet mati

## Keputusan Bisnis Final

- ✅ 1 cabang, tidak multi-tenant
- ✅ Pembayaran: Tunai, Debit, QRIS Statis (dinamis ditunda)
- ✅ Digital receipt via WhatsApp deeplink (wa.me)
- ✅ Shift karyawan: clock-in/out + laporan jam kerja
- ✅ BOM (Bill of Materials): auto-deduct stok bahan baku per transaksi
- ✅ Import produk via Excel/CSV
- ⏸️ Product variants (S/M/L) — ditunda, schema belum include
- ⏸️ QRIS dinamis — ditunda, bisa tambah di fase maintenance

## Nama & Branding

```typescript
// src/config/app.ts
export const APP_CONFIG = {
  name: 'Kafe Anda',        // ← Ganti dengan nama toko asli
  tagline: 'Sistem Kasir',
  version: '1.0.0',
}
```
