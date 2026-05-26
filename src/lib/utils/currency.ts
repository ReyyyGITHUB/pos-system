import { APP_CONFIG } from '@/config/app'


// Cache Intl.NumberFormat instances to save memory & CPU cycles
const rupiahFormatterCache: Record<string, Intl.NumberFormat> = {}

function getRupiahFormatter(withDecimal: boolean): Intl.NumberFormat {
  const key = withDecimal ? 'decimal' : 'integer'
  if (!rupiahFormatterCache[key]) {
    rupiahFormatterCache[key] = new Intl.NumberFormat(APP_CONFIG.currencyLocale, {
      style: 'currency',
      currency: APP_CONFIG.currency,
      minimumFractionDigits: withDecimal ? 2 : 0,
      maximumFractionDigits: withDecimal ? 2 : 0,
    })
  }
  return rupiahFormatterCache[key]
}

/**
 * Format angka ke format Rupiah
 * @example formatRupiah(50000) → "Rp 50.000"
 */
export function formatRupiah(amount: number, withDecimal = false): string {
  return getRupiahFormatter(withDecimal).format(amount)
}

/**
 * Parse string Rupiah ke number
 * @example parseRupiah("Rp 50.000") → 50000
 */
export function parseRupiah(value: string): number {
  return Number(value.replace(/[^0-9,-]+/g, '').replace(',', '.'))
}
