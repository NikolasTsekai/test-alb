import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co'
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-key'

export const supabase = createClient(url, key)

// ── Types ──────────────────────────────────────────────────────────────────────

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
export type ProductCategory = 'honey' | 'nuts'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'rejected'

export interface NutritionRow {
  label: string
  value: string
}

export interface ProductVariant {
  weight: string
  price: number
}

export interface DbProduct {
  id: string
  name: string
  subtitle: string
  meta: string
  short_desc: string
  description: string  // Përshkrimi
  origin: string       // Origjina & Burimet
  nutrition: NutritionRow[] // Vlerat Ushqyese
  category: ProductCategory
  stock_status: StockStatus
  variants: ProductVariant[]
  images: string[]
  alt: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id?: string
  product_name: string
  product_category: ProductCategory
  variant_weight: string
  quantity: number
  unit_price: number
}

export interface DbOrder {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_city: string
  notes: string
  status: OrderStatus
  items: OrderItem[]
  total_amount: number
  created_at: string
  updated_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export const formatLek = (amount: number) =>
  amount.toLocaleString('sq-AL') + ' L'

export const stockLabels: Record<StockStatus, string> = {
  in_stock:   'Në stok',
  low_stock:  'Stok i ulët',
  out_of_stock: 'Pa stok',
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending:   'Në pritje',
  confirmed: 'Konfirmuar',
  shipped:   'Dërguar',
  delivered: 'Dorëzuar',
  rejected:  'Refuzuar',
}

export const categoryLabels: Record<ProductCategory, string> = {
  honey: 'Mjaltë',
  nuts:  'Arra/Bajame',
}
