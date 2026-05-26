import { APP_CONFIG } from '@/config/app'


/**
 * Format angka ke format Rupiah
 * @example formatRupiah(50000) → "Rp 50.000"
 */
export function formatRupiah(amount: number, withDecimal = false): string {
  return new Intl.NumberFormat(APP_CONFIG.currencyLocale, {
    style: 'currency',
    currency: APP_CONFIG.currency,
    minimumFractionDigits: withDecimal ? 2 : 0,
    maximumFractionDigits: withDecimal ? 2 : 0,
  }).format(amount)
}

/**
 * Parse string Rupiah ke number
 * @example parseRupiah("Rp 50.000") → 50000
 */
export function parseRupiah(value: string): number {
  return Number(value.replace(/[^0-9,-]+/g, '').replace(',', '.'))
}
