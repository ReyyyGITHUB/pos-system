// Konfigurasi aplikasi global
// Ganti nilai di sini untuk branding toko Anda

export const APP_CONFIG = {
  name: 'Kafe Anda',          // ← Ganti dengan nama toko asli
  tagline: 'Sistem Kasir',
  version: '1.0.0',
  currency: 'IDR',
  currencyLocale: 'id-ID',
  whatsappCountryCode: '62',   // Indonesia
} as const

export type AppConfig = typeof APP_CONFIG
