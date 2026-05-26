import type { Product, Promotion } from '@/types/database'

export interface CartItem {
  product: Product
  quantity: number
}

export interface CheckoutSummary {
  subtotal: number
  discountAmount: number
  appliedPromotion: Promotion | null
  total: number
}

export interface AppError {
  message: string
  code?: string
}
