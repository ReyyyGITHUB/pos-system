import { create } from 'zustand'
import type { Product } from '@/types/database'
import type { CartItem } from '@/types/app'

interface CartState {
  cartItems: CartItem[]
  selectedCategory: string
  viewMode: 'grid' | 'list'
  searchQuery: string
  isCartOpen: boolean
  
  // Actions
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  setSelectedCategory: (category: string) => void
  setViewMode: (mode: 'grid' | 'list') => void
  setSearchQuery: (query: string) => void
  setCartOpen: (open: boolean) => void
}

export const useCartStore = create<CartState>((set) => ({
  cartItems: [],
  selectedCategory: 'Semua',
  viewMode: 'grid',
  searchQuery: '',
  isCartOpen: false,

  addToCart: (product) =>
    set((state) => {
      const existingItem = state.cartItems.find((item) => item.product.id === product.id)
      
      if (existingItem) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }
      }
      
      return { cartItems: [...state.cartItems, { product, quantity: 1 }] }
    }),

  removeFromCart: (productId) =>
    set((state) => {
      const existingItem = state.cartItems.find((item) => item.product.id === productId)
      
      if (!existingItem) return state

      if (existingItem.quantity === 1) {
        return {
          cartItems: state.cartItems.filter((item) => item.product.id !== productId),
        }
      }

      return {
        cartItems: state.cartItems.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ),
      }
    }),

  clearCart: () => set({ cartItems: [] }),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setCartOpen: (open) => set({ isCartOpen: open }),
}))
