export type UserRole = 'kasir' | 'admin'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  pin: string | null
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  sort_order: number
  is_active: boolean
}

export interface Product {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  created_at: string
  categories?: Category
}

export interface Ingredient {
  id: string
  name: string
  unit: string
  stock: number
  min_stock: number
  cost_per_unit: number
  created_at: string
}

export interface ProductRecipe {
  id: string
  product_id: string
  ingredient_id: string
  quantity: number
  ingredients?: Ingredient
}

export interface Promotion {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  start_date: string
  end_date: string
  is_active: boolean
  min_purchase: number
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded'
export type PaymentMethod = 'tunai' | 'debit' | 'qris'

export interface Order {
  id: string
  order_number: string
  cashier_id: string
  subtotal: number
  discount_amount: number
  promotion_id: string | null
  total: number
  payment_method: PaymentMethod
  amount_paid: number
  change_amount: number
  customer_name: string | null
  customer_phone: string | null
  status: OrderStatus
  notes: string | null
  created_at: string
  synced_at: string | null
  profiles?: Profile
  promotions?: Promotion
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  price: number
  quantity: number
  subtotal: number
}

export type MovementType = 'sale' | 'restock' | 'adjustment' | 'waste'

export interface StockMovement {
  id: string
  ingredient_id: string
  order_id: string | null
  movement_type: MovementType
  quantity_change: number
  stock_before: number
  stock_after: number
  notes: string | null
  created_by: string
  created_at: string
}

export interface Shift {
  id: string
  cashier_id: string
  clock_in: string
  clock_out: string | null
  total_hours: number | null
  notes: string | null
  profiles?: Profile
}
