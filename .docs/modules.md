# Modul & Fitur — POS Kasir

## Priority Matrix

| Modul | Route | Priority | Fase |
|---|---|---|---|
| Kasir POS | `/kasir` | 🔴 HIGH — MVP Core | Fase 2 |
| Manajemen Produk | `/admin/produk` | 🔴 HIGH — MVP | Fase 2 |
| Inventori & BOM | `/admin/inventori` | 🔴 HIGH — MVP | Fase 3 |
| Promo & Diskon | `/admin/promo` | 🟡 MEDIUM | Fase 5 |
| Analytics | `/admin/laporan` | 🟡 MEDIUM | Fase 5 |
| Manajemen User | `/admin/user` | 🟡 MEDIUM | Fase 5 |
| Shift & Presensi | `/admin/shift` | 🟡 MEDIUM | Fase 5 |
| Pengaturan | `/admin/settings` | 🟢 LOW | Fase 6 |

---

## Modul 1: Kasir POS (`/kasir`)

**Pengguna**: Kasir & Admin

### Fitur
- [ ] Grid produk (tile besar, touch target min 80px)
- [ ] Filter kategori (tab horizontal scroll)
- [ ] Pencarian produk realtime (debounce 300ms)
- [ ] Keranjang belanja (sidebar desktop / bottom sheet mobile)
  - Tambah/kurangi quantity
  - Hapus item
  - Notes per item (opsional)
- [ ] Pilih metode bayar: Tunai / Debit / QRIS Statis
- [ ] Input nominal bayar + kalkulasi kembalian otomatis
- [ ] Aplikasi promo: auto-cek promo aktif berdasarkan tanggal & min_purchase
- [ ] Konfirmasi checkout + cetak/kirim receipt
- [ ] Digital receipt via WhatsApp deeplink (wa.me)
- [ ] History transaksi hari ini (`/kasir/riwayat`)
- [ ] Clock-in / Clock-out shift
- [ ] Offline mode:
  - Checkout tanpa internet (simpan ke IndexedDB)
  - Badge "X transaksi belum tersync"
  - Auto-sync saat online

### Komponen Utama
- `ProductGrid` — grid produk dengan kategori filter
- `CartSidebar` — keranjang belanja
- `CheckoutModal` — modal konfirmasi + pilih bayar
- `PaymentMethodSelector` — 3 tombol metode bayar
- `SyncStatusBadge` — indikator status online/offline/sync

---

## Modul 2: Manajemen Produk (`/admin/produk`)

**Pengguna**: Admin only

### Fitur
- [ ] List produk dengan filter kategori + pencarian
- [ ] CRUD produk:
  - Nama, deskripsi, harga, foto, kategori, status aktif
  - Upload foto ke Supabase Storage
- [ ] CRUD kategori (nama, icon/emoji, urutan)
- [ ] BOM Builder per produk:
  - Tambah bahan baku + jumlah yang dibutuhkan
  - Edit/hapus bahan dari resep
- [ ] Toggle aktif/nonaktif produk (tanpa hapus)
- [ ] Import produk via Excel/CSV (bulk import)
  - Template download
  - Preview sebelum import
  - Error report jika ada baris invalid

---

## Modul 3: Inventori & BOM (`/admin/inventori`)

**Pengguna**: Admin only

### Fitur
- [ ] List bahan baku dengan indikator stok
  - 🔴 Di bawah minimum
  - 🟡 Mendekati minimum (< 2x minimum)
  - 🟢 Aman
- [ ] CRUD bahan baku:
  - Nama, satuan (gram/ml/pcs/liter), stok, minimum stok, harga beli
- [ ] Restock manual (form tambah stok masuk)
- [ ] Penyesuaian stok (adjustment + alasan)
- [ ] Log mutasi stok (tabel + filter tanggal)
- [ ] Alert panel: bahan di bawah minimum stok
- [ ] Auto-deduct: dipanggil oleh Supabase Edge Function saat order complete

---

## Modul 4: Promo & Diskon (`/admin/promo`)

**Pengguna**: Admin only

### Fitur
- [ ] List promo (aktif & tidak aktif)
- [ ] CRUD promo:
  - Nama promo
  - Tipe: persentase (%) atau nominal (Rp)
  - Nilai diskon
  - Periode: tanggal mulai - tanggal selesai
  - Minimum pembelian
  - Toggle aktif/nonaktif
- [ ] Preview: promo yang sedang aktif hari ini

### Logika Aplikasi Promo (di Kasir)
```typescript
function getActivePromo(subtotal: number): Promotion | null {
  const today = new Date()
  return promotions.find(p =>
    p.is_active &&
    new Date(p.start_date) <= today &&
    new Date(p.end_date) >= today &&
    subtotal >= p.min_purchase
  ) ?? null
}
```

---

## Modul 5: Analytics & Laporan (`/admin/laporan`)

**Pengguna**: Admin only

### Fitur
- [ ] Kartu ringkasan:
  - Omzet hari ini
  - Jumlah transaksi hari ini
  - Rata-rata nilai transaksi
- [ ] Grafik omzet 30 hari terakhir (line chart — Recharts)
- [ ] Produk terlaris (bar chart — top 10)
- [ ] Distribusi metode pembayaran (pie chart)
- [ ] Filter rentang tanggal custom
- [ ] Export laporan ke:
  - PDF (jsPDF)
  - Excel (SheetJS)

---

## Modul 6: Manajemen User (`/admin/user`)

**Pengguna**: Admin only

### Fitur
- [ ] List semua user (kasir & admin)
- [ ] CRUD user:
  - Nama lengkap
  - Email (untuk login Supabase Auth)
  - Role: kasir / admin
  - PIN 4 digit (untuk kasir, optional)
  - Status aktif
- [ ] Nonaktifkan akun (soft delete, tidak hapus data)
- [ ] Reset password (kirim email reset via Supabase)

---

## Modul 7: Shift & Presensi (`/admin/shift`)

**Pengguna**: Admin only

### Fitur
- [ ] Riwayat shift semua karyawan (tabel)
- [ ] Filter: per karyawan, per tanggal/periode
- [ ] Detail per shift: waktu masuk, keluar, total jam
- [ ] Kalkulasi total jam kerja per periode
- [ ] Export laporan shift ke Excel

### Logika Clock-in/out (di Kasir)
```typescript
// Clock-in: INSERT shifts dengan clock_in = NOW()
// Clock-out: UPDATE shifts SET clock_out = NOW(),
//            total_hours = EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600
// Hanya boleh 1 shift aktif per kasir (clock_out IS NULL)
```

---

## Modul 8: Pengaturan (`/admin/settings`)

**Pengguna**: Admin only

### Fitur
- [ ] Profil toko: nama, logo, alamat, nomor telp
- [ ] Upload gambar QRIS statis (tampil saat checkout QRIS)
- [ ] Template digital receipt (preview teks WA)
- [ ] Backup data manual (export semua tabel ke Excel)
