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
// LIGHTWEIGHT HAPTICS & REAL-TIME WEB AUDIO SYNTHESIZER
// ==========================================
const playTapSound = () => {
  if (typeof window === 'undefined') return
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    osc.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(900, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.06)
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime) // Soft 8% volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06)
    
    osc.start()
    osc.stop(audioCtx.currentTime + 0.06)
  } catch {
    // Fail silently if browser blocks audio context initially
  }
}

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(15) // Short premium 15ms pulse
  }
}

const triggerFeedback = () => {
  playTapSound()
  triggerHaptic()
}

// ==========================================
// LIGHTWEIGHT INLINE SVG ICONS
// ==========================================
const IconCoffeeCup = ({ className = "w-6 h-6 text-chartwell-blue" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V4h14v4zM17 8V4h2a2 2 0 012 2v2h-4z" />
  </svg>
)

const IconList = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const IconGrid = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const IconCart = ({ className = "w-5 h-5 text-slate-text" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const IconChevronUp = () => (
  <svg className="w-3 h-3 text-chartwell-blue" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

// ==========================================
// SUB-COMPONENT: STATIC HEADER (MEMOIZED)
// ==========================================
const Header = React.memo(({ onSignOut }: { onSignOut: () => void }) => {
  return (
    <header className="sticky top-0 z-10 bg-cloud-white border-b border-stone-border shadow-subtle px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <IconCoffeeCup className="w-5 h-5 text-chartwell-blue" />
        <h1 className="font-roobert font-medium text-slate-text text-base leading-none">
          {APP_CONFIG.name}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-caption text-ash-gray font-medium hidden sm:inline">Kasir Toko</span>
        <button 
          onClick={() => { triggerFeedback(); onSignOut(); }}
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
            onClick={() => { triggerFeedback(); setSearchQuery(''); }}
            className="absolute right-2.5 top-2.5 text-steel-gray hover:text-slate-text text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
      <button 
        onClick={() => { triggerFeedback(); setViewMode(viewMode === 'grid' ? 'list' : 'grid'); }}
        className="bg-cloud-white border border-stone-border rounded-inputs p-2 flex items-center justify-center cursor-pointer shadow-subtle active:scale-95 text-slate-text"
        title="Ubah Layout"
      >
        {viewMode === 'grid' ? <IconList /> : <IconGrid />}
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
          onClick={() => { triggerFeedback(); setSelectedCategory(cat.id === 'all' ? 'Semua' : cat.id); }}
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

  const imageBlock = product.image_url ? (
    <img 
      src={product.image_url} 
      alt={product.name} 
      className="w-full aspect-[4/3] object-cover rounded-md mb-3"
    />
  ) : (
    <div className="w-full aspect-[4/3] bg-sky-tint rounded-md mb-3 flex items-center justify-center">
      <IconCoffeeCup className="w-7 h-7 text-chartwell-blue/60" />
    </div>
  )

  if (isGrid) {
    return (
      <div 
        onClick={() => { triggerFeedback(); onAdd(product); }}
        className="bg-cloud-white rounded-cards shadow-md border border-stone-border p-4 flex flex-col justify-between transition-all duration-100 cursor-pointer active:bg-stone-100 select-none"
      >
        <div>
          {imageBlock}
          <h3 className="font-medium text-slate-text text-sm line-clamp-1">{product.name}</h3>
          <p className="text-steel-gray text-caption mt-0.5 line-clamp-1">{product.description}</p>
        </div>
        
        {/* Anti-overflow Stacked layout for Mobile */}
        <div className="mt-3 flex flex-col gap-2">
          <span className="font-semibold text-slate-text text-sm leading-none">
            {formatRupiah(product.price)}
          </span>
          
          {quantity > 0 && (
            <div 
              onClick={(e) => e.stopPropagation()} /* Prevents card-click trigger on plus/minus tap */
              className="flex items-center justify-between bg-sky-tint border border-chartwell-blue/20 rounded-buttons p-0.5 w-full"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); triggerFeedback(); onRemove(product.id); }}
                className="w-6 h-6 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90 select-none text-xs"
              >
                -
              </button>
              <span className="font-semibold text-slate-text text-xs">{quantity}x</span>
              <button 
                onClick={(e) => { e.stopPropagation(); triggerFeedback(); onAdd(product); }}
                className="w-6 h-6 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90 select-none text-xs"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      onClick={() => { triggerFeedback(); onAdd(product); }}
      className="bg-cloud-white rounded-md shadow-sm border border-stone-border p-3 flex items-center justify-between gap-3 cursor-pointer active:bg-stone-100 transition-colors duration-100 select-none"
    >
      <div className="flex items-center gap-3">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-10 h-10 object-cover rounded-md"
          />
        ) : (
          <div className="w-10 h-10 bg-sky-tint rounded-md flex items-center justify-center">
            <IconCoffeeCup className="w-5 h-5 text-chartwell-blue/60" />
          </div>
        )}
        <div>
          <h3 className="font-medium text-slate-text text-sm">{product.name}</h3>
          <span className="font-semibold text-steel-gray text-caption">
            {formatRupiah(product.price)}
          </span>
        </div>
      </div>

      {quantity > 0 && (
        <div 
          onClick={(e) => e.stopPropagation()} /* Prevents card-click trigger on plus/minus tap */
          className="flex items-center gap-2 bg-sky-tint border border-chartwell-blue/20 rounded-buttons p-0.5"
        >
          <button 
            onClick={(e) => { e.stopPropagation(); triggerFeedback(); onRemove(product.id); }}
            className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90 select-none"
          >
            -
          </button>
          <span className="font-semibold text-slate-text text-xs min-w-[14px] text-center">{quantity}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); triggerFeedback(); onAdd(product); }}
            className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90 select-none"
          >
            +
          </button>
        </div>
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

  // Payment Sub-Flow States
  const [paymentStep, setPaymentStep] = useState<'cart' | 'tunai' | 'qris'>('cart')
  const [selectedMethod, setSelectedMethod] = useState<'tunai' | 'qris' | null>(null)
  const [cashInput, setCashInput] = useState<string>('0')
  const [qrisGenerating, setQrisGenerating] = useState(false)

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

  // Triggered when payment method "Lanjut" is pressed
  const handleProceedToPayment = () => {
    if (!selectedMethod) return
    triggerFeedback()
    if (selectedMethod === 'qris') {
      setPaymentStep('qris')
      setQrisGenerating(true)
      setTimeout(() => {
        setQrisGenerating(false)
      }, 1200) // Simulated spawn API delay
    } else {
      setPaymentStep('tunai')
      setCashInput('0')
    }
  }

  // Handle Custom Numpad input
  const handleNumpadPress = (key: string) => {
    triggerFeedback()
    if (key === 'C') {
      setCashInput('0')
    } else if (key === '⌫') {
      setCashInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'))
    } else {
      setCashInput((prev) => (prev === '0' ? key : prev + key))
    }
  }

  // Finalize Cash checkout
  const handleCashPaymentSuccess = () => {
    const received = parseInt(cashInput || '0')
    if (received < cartSummary.total) return
    triggerFeedback()
    alert(`Transaksi Tunai Sukses!\nTotal: ${formatRupiah(cartSummary.total)}\nBayar: ${formatRupiah(received)}\nKembalian: ${formatRupiah(received - cartSummary.total)}`)
    clearCart()
    setPaymentStep('cart')
    setSelectedMethod(null)
    setCartOpen(false)
  }

  // Finalize QRIS checkout
  const handleQrisPaymentSuccess = () => {
    triggerFeedback()
    alert(`Transaksi QRIS Sukses!\nTotal: ${formatRupiah(cartSummary.total)}\nStatus: DANA MASUK (API APPROVED)`)
    clearCart()
    setPaymentStep('cart')
    setSelectedMethod(null)
    setCartOpen(false)
  }

  if (!mounted) return null

  // Cash Calculation Variables
  const cashReceivedValue = parseInt(cashInput || '0')
  const changeValue = cashReceivedValue - cartSummary.total

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

      {/* Sticky Bottom Summary Drawer with pulsing detail badge */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-cloud-white border-t border-stone-border shadow-md px-4 py-3 max-w-lg mx-auto w-full flex items-center justify-between gap-4">
          <div 
            onClick={() => { triggerFeedback(); setCartOpen(true); }}
            className="flex-1 cursor-pointer flex flex-col justify-center"
          >
            <div className="flex items-center gap-1.5">
              <IconCart className="w-4 h-4 text-slate-text" />
              <span className="font-semibold text-slate-text text-sm">{totalCartCount} Barang</span>
              <span className="inline-flex items-center justify-center w-5 h-5 text-chartwell-blue bg-sky-tint rounded-full">
                <IconChevronUp />
              </span>
            </div>
            <p className="text-ash-gray text-caption mt-0.5">
              Total: <span className="font-bold text-slate-text">{formatRupiah(cartSummary.total)}</span>
            </p>
          </div>
          <button 
            onClick={() => { triggerFeedback(); setCartOpen(true); }}
            className="bg-chartwell-blue text-cloud-white font-medium py-2 px-5 rounded-buttons shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer text-sm"
          >
            Bayar Sekarang
          </button>
        </div>
      )}

      {/* Smooth, Hardware-Accelerated Bottom Sheet & Backdrop Portal */}
      <div 
        onClick={() => {
          triggerFeedback()
          setCartOpen(false)
          setPaymentStep('cart')
          setSelectedMethod(null)
        }}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-[0.5px] transition-opacity duration-200 ${
          isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-cloud-white rounded-t-largecard max-w-lg mx-auto w-full border-t border-stone-border shadow-xl transform transition-transform duration-300 ease-out will-change-transform max-h-[88vh] flex flex-col ${
          isCartOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Dynamic Step-Based Header */}
        <div className="py-3 flex justify-center cursor-pointer select-none">
          <div className="w-10 h-1 bg-stone-border rounded-full" />
        </div>

        {paymentStep === 'cart' && (
          <>
            <div className="px-4 pb-3 flex items-center justify-between border-b border-stone-border">
              <h2 className="font-medium text-slate-text text-sm">Keranjang Belanja</h2>
              <button 
                onClick={() => { triggerFeedback(); clearCart(); }}
                className="text-caption text-red-500 font-medium hover:underline cursor-pointer"
              >
                Kosongkan
              </button>
            </div>

            {/* List Item Cart Scroll area */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 max-h-[40vh]">
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
                      onClick={() => { triggerFeedback(); removeFromCart(item.product.id); }}
                      className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90"
                    >
                      -
                    </button>
                    <span className="font-semibold text-slate-text text-xs min-w-[14px] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => { triggerFeedback(); addToCart(item.product); }}
                      className="w-7 h-7 bg-cloud-white rounded-full flex items-center justify-center font-bold text-chartwell-blue shadow-subtle cursor-pointer active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary & Payment Method Selector */}
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

              {/* Only Tunai & QRIS Payment selectors */}
              <div className="space-y-2">
                <label className="block text-caption font-semibold text-ash-gray">
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['tunai', 'qris'] as const).map((method) => {
                    const isSelected = selectedMethod === method
                    return (
                      <button
                        key={method}
                        onClick={() => { triggerFeedback(); setSelectedMethod(method); }}
                        className={`text-caption py-2.5 rounded-inputs shadow-subtle transition-all cursor-pointer font-semibold text-center border capitalize ${
                          isSelected
                            ? 'bg-chartwell-blue text-cloud-white border-chartwell-blue shadow-sm'
                            : 'bg-cloud-white text-slate-text border-stone-border hover:border-chartwell-blue/50'
                        }`}
                      >
                        {method === 'tunai' ? '💵 Tunai' : '📱 QRIS'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!selectedMethod}
                className={`w-full font-medium py-2.5 px-4 rounded-buttons text-sm transition-all shadow-sm ${
                  selectedMethod
                    ? 'bg-chartwell-blue text-cloud-white cursor-pointer active:scale-[0.98] hover:opacity-95'
                    : 'bg-stone-border text-steel-gray cursor-not-allowed opacity-60'
                }`}
              >
                Lanjut ke Pembayaran
              </button>
            </div>
          </>
        )}

        {/* paymentStep === 'tunai' (Sub-layar Tunai Kustom) */}
        {paymentStep === 'tunai' && (
          <div className="flex-1 flex flex-col max-h-[82vh] overflow-y-auto">
            <div className="px-4 pb-3 flex items-center gap-3 border-b border-stone-border">
              <button 
                onClick={() => { triggerFeedback(); setPaymentStep('cart'); }}
                className="text-slate-text font-bold hover:text-chartwell-blue text-sm cursor-pointer p-1"
              >
                ← Kembali
              </button>
              <h2 className="font-medium text-slate-text text-sm">Pembayaran Tunai</h2>
            </div>

            {/* Cash Calculations */}
            <div className="p-4 space-y-3">
              <div className="bg-canvas-fog rounded-cards border border-stone-border p-3 space-y-2">
                <div className="flex justify-between text-caption text-ash-gray">
                  <span>Tagihan Penjualan</span>
                  <span className="font-bold text-slate-text">{formatRupiah(cartSummary.total)}</span>
                </div>
                <div className="flex justify-between text-caption text-ash-gray">
                  <span>Uang Diterima</span>
                  <span className="font-bold text-chartwell-blue text-sm">{formatRupiah(cashReceivedValue)}</span>
                </div>
                <div className="flex justify-between text-caption text-ash-gray pt-1.5 border-t border-stone-border/50">
                  <span>Status Kembalian</span>
                  {changeValue >= 0 ? (
                    <span className="font-extrabold text-green-600">{formatRupiah(changeValue)}</span>
                  ) : (
                    <span className="font-extrabold text-red-500">Kurang: {formatRupiah(Math.abs(changeValue))}</span>
                  )}
                </div>
              </div>

              {/* Color-coded Rupiah Notes Slider */}
              <div className="overflow-x-auto -mx-4 px-4 py-1.5 flex gap-2 scrollbar-none">
                <button
                  onClick={() => { triggerFeedback(); setCashInput(cartSummary.total.toString()); }}
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-inputs text-caption font-bold bg-sky-tint text-chartwell-blue border border-chartwell-blue/30 active:scale-95 transition-all cursor-pointer"
                >
                  Uang Pas
                </button>
                {[
                  { value: 2000, label: 'Rp 2k', bg: 'bg-stone-100 border-stone-300 text-stone-700' },
                  { value: 5000, label: 'Rp 5k', bg: 'bg-amber-100 border-amber-300 text-amber-800' },
                  { value: 10000, label: 'Rp 10k', bg: 'bg-purple-100 border-purple-300 text-purple-800' },
                  { value: 20000, label: 'Rp 20k', bg: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
                  { value: 50000, label: 'Rp 50k', bg: 'bg-blue-100 border-blue-300 text-blue-800' },
                  { value: 100000, label: 'Rp 100k', bg: 'bg-rose-100 border-rose-300 text-rose-800' }
                ].map((note) => (
                  <button
                    key={note.value}
                    onClick={() => { triggerFeedback(); setCashInput(note.value.toString()); }}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-inputs text-caption font-bold border active:scale-95 transition-all cursor-pointer ${note.bg}`}
                  >
                    {note.label}
                  </button>
                ))}
              </div>

              {/* Custom UI Numpad Grid */}
              <div className="grid grid-cols-3 gap-2 py-2 max-w-[280px] mx-auto w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleNumpadPress(key)}
                    className="h-12 bg-cloud-white text-slate-text font-bold text-base rounded-inputs shadow-subtle border border-stone-border active:bg-stone-100 flex items-center justify-center cursor-pointer transition-all"
                  >
                    {key}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCashPaymentSuccess}
                disabled={changeValue < 0}
                className={`w-full font-semibold py-2.5 px-4 rounded-buttons text-sm transition-all shadow-sm ${
                  changeValue >= 0
                    ? 'bg-chartwell-blue text-cloud-white cursor-pointer active:scale-[0.98] hover:opacity-95'
                    : 'bg-stone-border text-steel-gray cursor-not-allowed opacity-60'
                }`}
              >
                Selesaikan & Cetak Struk
              </button>
            </div>
          </div>
        )}

        {/* paymentStep === 'qris' (Sub-layar QRIS Kustom) */}
        {paymentStep === 'qris' && (
          <div className="p-4 space-y-4 flex flex-col max-h-[82vh] overflow-y-auto items-center">
            <div className="w-full flex items-center gap-3 pb-3 border-b border-stone-border self-start">
              <button 
                onClick={() => { triggerFeedback(); setPaymentStep('cart'); }}
                className="text-slate-text font-bold hover:text-chartwell-blue text-sm cursor-pointer p-1"
              >
                ← Kembali
              </button>
              <h2 className="font-medium text-slate-text text-sm">Pembayaran QRIS</h2>
            </div>

            <div className="text-center space-y-1">
              <p className="text-caption text-ash-gray">Total Pembayaran</p>
              <h3 className="text-heading font-semibold text-slate-text">{formatRupiah(cartSummary.total)}</h3>
            </div>

            {/* Dynamic QR Generator box */}
            <div className="w-48 h-48 bg-cloud-white border border-stone-border rounded-cards flex flex-col items-center justify-center p-3 shadow-md relative overflow-hidden">
              {qrisGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-chartwell-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-ash-gray font-medium animate-pulse">Spawning QRIS...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-between w-full h-full">
                  {/* Mock QR SVG Box */}
                  <svg className="w-36 h-36 text-slate-text" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 3h3v2h-3v-2zm3 3h3v2h-3v-2zm-3-6h2v2h-2v-2zm4 4h1v1h-1v-1zm-1 1h1v1h-1v-1zm-2-2h1v1h-1v-1zm3-3h1v1h-1v-1zm-5-1h2v2h-2v-2zm3 3h1v1h-1v-1zm-1 1h1v1h-1v-1z" />
                  </svg>
                  <p className="text-[9px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold border border-green-200">
                    QRIS AKTIF (MOCK API)
                  </p>
                </div>
              )}
            </div>

            <p className="text-center text-caption text-ash-gray max-w-[240px] px-2 leading-relaxed">
              Tunjukkan kode QRIS di atas kepada pelanggan untuk pembayaran instan.
            </p>

            <button
              onClick={handleQrisPaymentSuccess}
              disabled={qrisGenerating}
              className="w-full bg-chartwell-blue text-cloud-white font-semibold py-2.5 px-4 rounded-buttons text-sm transition-all shadow-sm cursor-pointer hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
            >
              Konfirmasi QRIS Sukses
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
