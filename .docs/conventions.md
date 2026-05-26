# Konvensi Kode — POS Kasir

> ⚠️ **AI Agent**: Baca file ini sebelum menulis kode apapun. Konvensi ini wajib diikuti tanpa pengecualian.

## TypeScript

### Rules
- **Strict mode aktif** — tidak ada `any` type, gunakan `unknown` jika perlu
- Semua fungsi harus punya return type eksplisit
- Gunakan `interface` untuk object shapes, `type` untuk unions/primitives
- Gunakan Zod untuk validasi input form dan API response

```typescript
// ✅ BENAR
interface Product {
  id: string
  name: string
  price: number
}

function getProduct(id: string): Promise<Product> { ... }

// ❌ SALAH
function getProduct(id: any): any { ... }
```

## Naming Conventions

| Item | Convention | Contoh |
|---|---|---|
| Komponen React | PascalCase | `ProductGrid`, `CartSidebar` |
| Hooks | camelCase + `use` prefix | `useCart`, `useProducts` |
| Stores (Zustand) | camelCase + `.store.ts` | `cart.store.ts` |
| Utility functions | camelCase | `formatRupiah`, `generateOrderNumber` |
| Types/Interfaces | PascalCase | `Order`, `Product`, `CartItem` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CART_ITEMS`, `APP_CONFIG` |
| Database tables | snake_case | `order_items`, `stock_movements` |
| CSS classes | Tailwind utilities saja |  |
| File names | kebab-case (kecuali komponen) | `cart-sidebar.tsx` atau `CartSidebar.tsx` |

## Struktur Komponen React

```typescript
// Template komponen standar
import type { FC } from 'react'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

const ProductCard: FC<ProductCardProps> = ({ product, onAddToCart }) => {
  // 1. Hooks
  // 2. Derived state
  // 3. Handlers
  // 4. Early returns (loading, error, empty)
  // 5. Render

  return (
    <button
      onClick={() => onAddToCart(product)}
      className="..."
      // Wajib: min touch target 44px untuk mobile
      style={{ minHeight: '44px', minWidth: '44px' }}
    >
      {product.name}
    </button>
  )
}

export default ProductCard
```

## Supabase Client Usage

```typescript
// Browser (Client Component)
import { createBrowserClient } from '@/lib/supabase/client'

// Server (Server Component / API Route)
import { createServerClient } from '@/lib/supabase/server'

// ❌ JANGAN import langsung dari '@supabase/supabase-js'
```

## Currency & Angka

```typescript
// Selalu gunakan helper ini
import { formatRupiah } from '@/lib/utils/currency'

formatRupiah(50000)        // → "Rp 50.000"
formatRupiah(50000, true)  // → "Rp 50.000,00"

// Database: simpan dalam NUMERIC(12,2) — bukan integer
// Jangan kalkulasi float langsung, gunakan library atau round
```

## Error Handling

```typescript
// Pattern standar untuk Supabase queries
const { data, error } = await supabase.from('products').select('*')

if (error) {
  console.error('[products] fetch error:', error.message)
  // Tampilkan error ke user, jangan expose detail ke UI
  toast.error('Gagal memuat produk. Coba lagi.')
  return
}
```

## Teks UI

- **100% Bahasa Indonesia** — tidak ada teks Inggris yang tampil ke user
- Label form: `Nama Produk`, `Harga`, `Stok`, dll
- Pesan error: `Gagal menyimpan data`, `Stok tidak mencukupi`, dll
- Tombol: `Simpan`, `Batal`, `Hapus`, `Tambah`, `Checkout`
- Status: `Aktif`, `Nonaktif`, `Tersinkronisasi`, `Menunggu sinkronisasi`

## Touch-First UI Rules

```
✅ Tombol minimum 44×44px
✅ Spacing antar elemen interaktif minimum 8px
✅ Font size minimum 14px untuk teks UI, 16px untuk input (hindari zoom iOS)
✅ Tap feedback (active:scale-95 atau ripple effect)
✅ Tidak ada hover-only interaction — semua hover state harus ada fallback tap
✅ Scroll area harus -webkit-overflow-scrolling: touch
```

## Zustand Store Pattern

```typescript
// stores/cart.store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  total: number
}

export const useCartStore = create<CartStore>()(
  devtools(
    (set, get) => ({
      items: [],
      addItem: (product) => set((state) => { ... }),
      removeItem: (productId) => set((state) => { ... }),
      clearCart: () => set({ items: [] }),
      get total() {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      }
    }),
    { name: 'cart-store' }
  )
)
```

## File Import Order

```typescript
// 1. React & Next.js
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { z } from 'zod'

// 3. Internal — types
import type { Product } from '@/types/database'

// 4. Internal — lib/utils
import { formatRupiah } from '@/lib/utils/currency'

// 5. Internal — stores/hooks
import { useCartStore } from '@/stores/cart.store'

// 6. Internal — components
import { Button } from '@/components/ui/Button'
```

## Git Commit Convention

Format: `type(scope): pesan singkat`

```
feat(kasir): tambah pencarian produk realtime
fix(checkout): perbaiki kalkulasi kembalian saat diskon
refactor(cart): pisahkan CartSidebar ke komponen kecil
docs: update database-schema.md
chore: install dependensi recharts
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`
