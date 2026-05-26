# 📁 Dokumentasi AI Agent — POS Kasir

Folder ini berisi semua dokumen referensi untuk AI agent yang bekerja di proyek ini.
Baca file-file ini sebelum melakukan perubahan apapun pada kodebase.

## Urutan Baca

1. [`project-overview.md`](./project-overview.md) — Ringkasan proyek, konteks bisnis, keputusan utama
2. [`tech-stack.md`](./tech-stack.md) — Tech stack lengkap + alasan pemilihan
3. [`database-schema.md`](./database-schema.md) — Skema PostgreSQL lengkap + relasi antar tabel
4. [`architecture.md`](./architecture.md) — Arsitektur sistem, offline strategy, folder structure
5. [`modules.md`](./modules.md) — Breakdown modul & fitur per prioritas
6. [`conventions.md`](./conventions.md) — Konvensi kode, naming, dan pola yang wajib diikuti
7. [`roadmap.md`](./roadmap.md) — Fase pengerjaan & status progress

## Aturan Wajib untuk AI Agent

- ⚠️ Selalu baca `conventions.md` sebelum menulis kode baru
- ⚠️ Jangan buat tabel database baru tanpa mengupdate `database-schema.md`
- ⚠️ Semua teks UI dalam **Bahasa Indonesia**
- ⚠️ Gunakan **TypeScript strict mode** — tidak ada `any` type
- ⚠️ Komponen harus **touch-friendly** (min touch target 44x44px)
