'use client'

import React, { useMemo, useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { APP_CONFIG } from '@/config/app'
import { formatRupiah } from '@/lib/utils/currency'
import { useCartStore } from '@/lib/store/cart'
import type { Product } from '@/types/database'

// Mock Data for offline capability & instant testing
const MOCK_PRODUCTS: Product[] = [
  { id: '1', category_id: '1', name: 'Kopi Latte', description: 'Espresso dengan susu hangat', price: 25000, image_url: null, is_active: true, created_at: '' },
  { id: '2', category_id: '1', name: 'Caramel Macchiato', description: 'Kopi espresso manis karamel', price: 28000, image_url: null, is_active: true, created_at: '' },
  { id: '3', category_id: '2', name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telor mata sapi', price: 30000, image_url: null, is_active: true, created_at: '' },
  { id: '4', category_id: '2', name: 'Mie Goreng Jawa', description: 'Mie goreng bumbu tradisional', price: 25000, image_url: null, is_active: true, created_at: '' },
  { id: '5', category_id: '1', name: 'Es Teh Manis', description: 'Teh manis segar dingin', price: 10000, image_url: null, is_active: true, created_at: '' },
  { id: '6', category_id: '3', name: 'Croissant Cokelat', description: 'Roti mentega prancis cokelat', price: 20000, image_url: null, is_active: true, created_at: '' },
  { id: '7', category_id: '3', name: 'Kentang Goreng', description: 'French fries renyah asin', price: 18000, image_url: null, is_active: true, created_at: '' }
]

const CATEGORIES = [
  { id: 'all', name: 'Semua' },
  { id: '1', name: 'Kopi & Teh' },
  { id: '2', name: 'Makanan Berat' },
  { id: '3', name: 'Camilan (Snack)' }
]

// ==========================================
// SUB-COMPONENT: STATIC HEADER (MEMOIZED)
// ==========================================
const Header = React.memo(({ onSignOut }: { onSignOut: () => void }) => {
  return (
    <header className="sticky top-0 z-10 bg-cloud-white border-b border-stone-border shadow-subtle px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">☕</span>
        <h1 className="font-roobert font-medium text-slate-text text-base leading-none">
          {APP_CONFIG.name}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-caption text-ash-gray font-medium hidden sm:inline">Kasir Toko</span>
        <button 
          onClick={onSignOut}
          className="text-caption text-red-500 border border-red-200 hover:bg-red-50 active:scale-95 transition-all py-1 px-3 rounded-buttons font-medium cursor-pointer"
        >
          Keluar
        </button>
      </div>
    </header>
  )
})
Header.displayName = 'Header'

// ==========================================
// SUB-COMPONENT: SEARCH BAR & VIEW SWITCHER (MEMOIZED)
// ==========================================
const SearchBar = React.memo(({ 
  searchQuery, 
  setSearchQuery, 
  viewMode, 
  setViewMode 
}: { 
  searchQuery: string
  setSearchQuery: (q: string) => void
  viewMode: 'grid' | 'list'
  setViewMode: (m: 'grid' | 'list') => void
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input 
          type="text" 
          placeholder="Cari produk kasir..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-3 pr-8 py-2 bg-cloud-white text-slate-text border border-platinum-outline rounded-inputs text-sm focus:outline-none focus:border-chartwell-blue placeholder-ash-gray/60"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-steel-gray hover:text-slate-text text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
      <button 
        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        className="bg-cloud-white border border-stone-border rounded-inputs p-2 flex items-center justify-center cursor-pointer shadow-subtle active:scale-95 text-slate-text text-caption"
        title="Ubah Layout"
      >
        {viewMode === 'grid' ? '📋 List' : '⏹️ Grid'}
      </button>
    </div>
  )
})
SearchBar.displayName = 'SearchBar'

// ==========================================
// SUB-COMPONENT: CATEGORY SLIDER (MEMOIZED)
// ==========================================
const CategorySlider = React.memo(({ 
  selectedCategory, 
  setSelectedCategory 
}: { 
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
}) => {
  return (
    <div className="overflow-x-auto -mx-4 px-4 flex gap-1.5 scrollbar-none">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.id === 'all' ? 'Semua' : cat.id)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-buttons text-caption font-medium border transition-all cursor-pointer ${
            (cat.id === 'all' && selectedCategory === 'Semua') || selectedCategory === cat.id
              ? 'bg-chartwell-blue text-cloud-white border-chartwell-blue shadow-sm'
              : 'bg-cloud-white text-ash-gray border-stone-border hover:text-slate-text'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
})
CategorySlider.displayName = 'CategorySlider'

// ==========================================
// COMPONENT: MEMOIZED PRODUCT CARD (CPU & RENDERING HOG DEFENSE)
// ==========================================
const ProductCard = React.memo(({ 
  product, 
  quantity, 
  viewMode,
  onAdd, 
  onRemove 
}: { 
  product: Product
  quantity: number
  viewMode: 'grid' | 'list'
  onAdd: (p: Product) => void
  onRemove: (id: string) => void
}) => {
  const isGrid = viewMode === 'grid'

  if (isGrid) {
    return (
      <div className="bg-cloud-white rounded-cards shadow-md border border-stone-border p-4 flex flex-col justify-between transition-all duration-150">
        <div>
          <div className="w-full aspect-[4/3] bg-sky-tint rounded-md mb-3 flex items-center justify-center text-2xl select-none">
            ☕
          </div>
          <h3 className="font-medium text-slate-text text-sm line-clamp-1">{product.name}</h3>
          <p className="text-steel-gray text-caption mt-0.5 line-clamp-1">{product.description}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold text-slate-text text-sm">
            {formatRupiah(product.price)}
          </span>
          
          {quantity > 0 ? (
            <div className="flex items-center gap-2 bg-sky-tint border border-chartwell-blue/20 rounded-buttons p-0.5">
              <button 
                onClick={() => onRemove(product.id)}
                className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90 select-none text-sm"
              >
                -
              </button>
              <span className="font-semibold text-slate-text text-xs min-w-[14px] text-center">{quantity}</span>
              <button 
                onClick={() => onAdd(product)}
                className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90 select-none text-sm"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(product)}
              className="bg-chartwell-blue text-cloud-white text-caption font-medium py-1.5 px-3 rounded-buttons shadow-sm active:scale-95 cursor-pointer select-none"
            >
              + Tambah
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cloud-white rounded-md shadow-sm border border-stone-border p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-tint rounded-md flex items-center justify-center text-lg select-none">
          ☕
        </div>
        <div>
          <h3 className="font-medium text-slate-text text-sm">{product.name}</h3>
          <span className="font-semibold text-steel-gray text-caption">
            {formatRupiah(product.price)}
          </span>
        </div>
      </div>

      {quantity > 0 ? (
        <div className="flex items-center gap-2 bg-sky-tint border border-chartwell-blue/20 rounded-buttons p-0.5">
          <button 
            onClick={() => onRemove(product.id)}
            className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90 select-none"
          >
            -
          </button>
          <span className="font-semibold text-slate-text text-xs min-w-[14px] text-center">{quantity}</span>
          <button 
            onClick={() => onAdd(product)}
            className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90 select-none"
          >
            +
          </button>
        </div>
      ) : (
        <button
          onClick={() => onAdd(product)}
          className="bg-chartwell-blue text-cloud-white text-caption font-medium py-1 px-3 rounded-buttons shadow-sm active:scale-95 cursor-pointer select-none"
        >
          + Tambah
        </button>
      )}
    </div>
  )
})
ProductCard.displayName = 'ProductCard'

// ==========================================
// CORE APP EXPORT PAGE
// ==========================================
export default function KasirPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Selective selectors to isolate state subscriptions
  const cartItems = useCartStore((s) => s.cartItems)
  const selectedCategory = useCartStore((s) => s.selectedCategory)
  const viewMode = useCartStore((s) => s.viewMode)
  const searchQuery = useCartStore((s) => s.searchQuery)
  const isCartOpen = useCartStore((s) => s.isCartOpen)

  const addToCart = useCartStore((s) => s.addToCart)
  const removeFromCart = useCartStore((s) => s.removeFromCart)
  const clearCart = useCartStore((s) => s.clearCart)
  const setSelectedCategory = useCartStore((s) => s.setSelectedCategory)
  const setViewMode = useCartStore((s) => s.setViewMode)
  const setSearchQuery = useCartStore((s) => s.setSearchQuery)
  const setCartOpen = useCartStore((s) => s.setCartOpen)

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Callback safety
  const handleSignOut = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      alert('Gagal mengeluarkan sesi. Silakan muat ulang halaman.')
    }
  }, [router])

  // Filter products memoized
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const matchCategory = selectedCategory === 'Semua' || product.category_id === selectedCategory
      const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [selectedCategory, searchQuery])

  // Get total items in cart
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0)
  }, [cartItems])

  // Calculate Subtotal & Total
  const cartSummary = useMemo(() => {
    const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
    const tax = Math.round(subtotal * 0.1) // 10% tax
    const total = subtotal + tax
    return { subtotal, tax, total }
  }, [cartItems])

  // Get current quantity of a specific product
  const getProductQuantity = useCallback((productId: string) => {
    const item = cartItems.find((item) => item.product.id === productId)
    return item ? item.quantity : 0
  }, [cartItems])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-canvas-fog pb-24 select-none flex flex-col font-inter">
      {/* Memoized Header */}
      <Header onSignOut={handleSignOut} />

      {/* Main Layout Area */}
      <main className="p-4 flex-1 max-w-lg mx-auto w-full space-y-4">
        {/* Memoized Search Bar */}
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Memoized Category Slider */}
        <CategorySlider 
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Product listing based on layout */}
        {filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-2'}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={getProductQuantity(product.id)}
                viewMode={viewMode}
                onAdd={addToCart}
                onRemove={removeFromCart}
              />
            ))}
          </div>
        ) : (
          <div className="bg-cloud-white rounded-cards border border-stone-border p-8 text-center text-ash-gray shadow-subtle">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-sm font-medium">Produk tidak ditemukan</p>
            <p className="text-caption mt-0.5">Silakan gunakan kata kunci pencarian lain.</p>
          </div>
        )}
      </main>

      {/* Sticky Bottom Summary Drawer */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-cloud-white border-t border-stone-border shadow-md px-4 py-3 max-w-lg mx-auto w-full flex items-center justify-between gap-4">
          <div 
            onClick={() => setCartOpen(true)}
            className="flex-1 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🛒</span>
              <span className="font-semibold text-slate-text text-sm">{totalCartCount} Barang</span>
            </div>
            <p className="text-ash-gray text-caption mt-0.5">
              Total: <span className="font-bold text-slate-text">{formatRupiah(cartSummary.total)}</span>
            </p>
          </div>
          <button 
            onClick={() => setCartOpen(true)}
            className="bg-chartwell-blue text-cloud-white font-medium py-2.5 px-6 rounded-buttons shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer text-sm"
          >
            Bayar Sekarang
          </button>
        </div>
      )}

      {/* Smooth, Hardware-Accelerated Bottom Sheet & Backdrop Portal */}
      <div 
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-[0.5px] transition-opacity duration-200 ${
          isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-cloud-white rounded-t-largecard max-w-lg mx-auto w-full border-t border-stone-border shadow-xl transform transition-transform duration-300 ease-out will-change-transform max-h-[85vh] flex flex-col ${
          isCartOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Sheet Handle */}
        <div 
          onClick={() => setCartOpen(false)}
          className="py-3 flex justify-center cursor-pointer select-none"
        >
          <div className="w-10 h-1 bg-stone-border rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="px-4 pb-3 flex items-center justify-between border-b border-stone-border">
          <h2 className="font-medium text-slate-text text-sm">Keranjang Belanja</h2>
          <button 
            onClick={clearCart}
            className="text-caption text-red-500 font-medium hover:underline cursor-pointer"
          >
            Kosongkan
          </button>
        </div>

        {/* List Item Cart Scroll area */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {cartItems.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between border-b border-stone-border/40 pb-3 last:border-b-0 last:pb-0">
              <div className="flex-1 min-w-0 pr-3">
                <h4 className="font-medium text-slate-text text-sm truncate">{item.product.name}</h4>
                <p className="text-ash-gray text-caption mt-0.5">
                  {formatRupiah(item.product.price)} / unit
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-sky-tint border border-chartwell-blue/20 rounded-buttons p-0.5">
                <button 
                  onClick={() => removeFromCart(item.product.id)}
                  className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90"
                >
                  -
                </button>
                <span className="font-semibold text-slate-text text-xs min-w-[14px] text-center">{item.quantity}</span>
                <button 
                  onClick={() => addToCart(item.product)}
                  className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Transaction summary & Payment Panel */}
        <div className="bg-canvas-fog border-t border-stone-border p-4 space-y-4">
          <div className="space-y-1.5 text-caption">
            <div className="flex justify-between text-ash-gray">
              <span>Subtotal</span>
              <span>{formatRupiah(cartSummary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ash-gray">
              <span>Pajak (10%)</span>
              <span>{formatRupiah(cartSummary.tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-text text-sm pt-1 border-t border-stone-border/60">
              <span>Total Pembayaran</span>
              <span>{formatRupiah(cartSummary.total)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2">
            {['Tunai', 'QRIS', 'Debit'].map((method) => (
              <button
                key={method}
                onClick={() => {
                  alert(`Pembayaran ${method} Berhasil!\nTotal: ${formatRupiah(cartSummary.total)}`);
                  clearCart();
                  setCartOpen(false);
                }}
                className="bg-cloud-white border border-stone-border hover:border-chartwell-blue hover:text-chartwell-blue active:scale-95 text-slate-text text-caption py-2 rounded-inputs shadow-subtle transition-all cursor-pointer font-medium text-center"
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


