/**
 * Generate order number format: ORD-YYYYMMDD-XXXX
 * XXXX = random 4 digit hex
 */
export function generateOrderNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `ORD-${date}-${suffix}`
}
