import type { OrderItem } from '@/types/database'
import { APP_CONFIG } from '@/config/app'
import { formatRupiah } from './currency'

interface ReceiptParams {
  orderNumber: string
  items: Pick<OrderItem, 'product_name' | 'quantity' | 'price' | 'subtotal'>[]
  subtotal: number
  discountAmount: number
  total: number
  paymentMethod: string
  amountPaid: number
  changeAmount: number
  cashierName: string
  customerPhone?: string
}

/**
 * Build pesan struk untuk WhatsApp deeplink
 */
export function buildReceiptMessage(params: ReceiptParams): string {
  const {
    orderNumber, items, subtotal, discountAmount,
    total, paymentMethod, amountPaid, changeAmount, cashierName
  } = params

  const now = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const itemLines = items
    .map(i => `  ${i.product_name} x${i.quantity}  ${formatRupiah(i.subtotal)}`)
    .join('\n')

  const methodLabel: Record<string, string> = {
    tunai: 'Tunai', debit: 'Debit', qris: 'QRIS'
  }

  let message = `🧾 *STRUK PEMBAYARAN*\n`
  message += `*${APP_CONFIG.name}*\n`
  message += `${now}\n`
  message += `No: ${orderNumber}\n`
  message += `Kasir: ${cashierName}\n`
  message += `─────────────────────\n`
  message += `${itemLines}\n`
  message += `─────────────────────\n`
  message += `Subtotal  : ${formatRupiah(subtotal)}\n`
  if (discountAmount > 0) {
    message += `Diskon    : -${formatRupiah(discountAmount)}\n`
  }
  message += `*Total     : ${formatRupiah(total)}*\n`
  message += `Bayar (${methodLabel[paymentMethod] ?? paymentMethod}): ${formatRupiah(amountPaid)}\n`
  if (changeAmount > 0) {
    message += `Kembalian : ${formatRupiah(changeAmount)}\n`
  }
  message += `─────────────────────\n`
  message += `Terima kasih sudah berbelanja! 🙏`

  return message
}

/**
 * Buka WhatsApp deeplink dengan pesan struk
 */
export function openWhatsAppReceipt(phone: string, message: string): void {
  const cleaned = phone.replace(/\D/g, '')
  const withCode = cleaned.startsWith('0')
    ? APP_CONFIG.whatsappCountryCode + cleaned.slice(1)
    : cleaned
  const encoded = encodeURIComponent(message)
  window.open(`https://wa.me/${withCode}?text=${encoded}`, '_blank')
}
