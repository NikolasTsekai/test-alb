import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { subDays, subWeeks, subMonths, subYears, format, isAfter, parseISO } from 'date-fns'
import { sq } from 'date-fns/locale'
import { ShoppingBag, TrendingUp, Package, Clock, AlertCircle } from 'lucide-react'
import { supabase, formatLek, type DbOrder, type DbProduct, type OrderItem } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/admin/')({
  component: Dashboard,
})

type DateFilter = 'day' | 'week' | 'month' | 'year'

const FILTER_LABELS: Record<DateFilter, string> = {
  day:   'Sot',
  week:  '7 ditë',
  month: '30 ditë',
  year:  '365 ditë',
}

function getFilterStart(filter: DateFilter): Date {
  const now = new Date()
  if (filter === 'day')   return subDays(now, 1)
  if (filter === 'week')  return subWeeks(now, 1)
  if (filter === 'month') return subMonths(now, 1)
  return subYears(now, 1)
}

const PIE_COLORS = { honey: '#f59e0b', nuts: '#92400e' }
const BAR_COLOR  = '#f59e0b'

function StatCard({
  icon: Icon, label, value, sub, loading,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  loading?: boolean
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
            {loading
              ? <Skeleton className="h-8 w-28 mt-2 bg-gray-800" />
              : <p className="text-2xl font-bold text-white mt-1 truncate">{value}</p>
            }
            {sub && !loading && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-amber-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Dashboard() {
  const [filter, setFilter] = useState<DateFilter>('week')

  const { data: orders = [], isLoading: ordersLoading } = useQuery<DbOrder[]>({
    queryKey: ['admin-orders-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    refetchInterval: 30_000,
  })

  const { data: products = [], isLoading: productsLoading } = useQuery<DbProduct[]>({
    queryKey: ['admin-products-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      return data ?? []
    },
  })

  // ── Filtered orders for pie/stats ──────────────────────────────────
  const filterStart = getFilterStart(filter)
  const filtered = useMemo(
    () => orders.filter(o => isAfter(parseISO(o.created_at), filterStart) && o.status !== 'rejected'),
    [orders, filter, filterStart],
  )

  // ── Stats ──────────────────────────────────────────────────────────
  const totalRevenue = filtered.reduce((s, o) => s + o.total_amount, 0)
  const pendingCount = orders.filter(o => o.status === 'pending').length
  const inStockCount = products.filter(p => p.stock_status === 'in_stock').length

  // ── Pie data: honey vs nuts revenue ───────────────────────────────
  const pieData = useMemo(() => {
    const totals = { honey: 0, nuts: 0 }
    filtered.forEach(order => {
      (order.items as OrderItem[]).forEach(item => {
        const cat = item.product_category ?? 'honey'
        totals[cat] = (totals[cat] ?? 0) + item.unit_price * item.quantity
      })
    })
    return [
      { name: 'Mjaltë',       value: totals.honey, color: PIE_COLORS.honey },
      { name: 'Arra/Bajame',  value: totals.nuts,  color: PIE_COLORS.nuts  },
    ].filter(d => d.value > 0)
  }, [filtered])

  // ── Bar data: last 7 days revenue ─────────────────────────────────
  const barData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      return {
        day:     format(d, 'EEE', { locale: sq }),
        revenue: 0,
        date:    format(d, 'yyyy-MM-dd'),
      }
    })
    orders
      .filter(o => o.status !== 'rejected' && isAfter(parseISO(o.created_at), subDays(new Date(), 7)))
      .forEach(o => {
        const key = format(parseISO(o.created_at), 'yyyy-MM-dd')
        const slot = days.find(d => d.date === key)
        if (slot) slot.revenue += o.total_amount
      })
    return days
  }, [orders])

  // ── Top products ───────────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>()
    orders
      .filter(o => o.status !== 'rejected')
      .forEach(o => {
        (o.items as OrderItem[]).forEach(item => {
          const key = item.product_name
          const prev = map.get(key) ?? { name: key, qty: 0, revenue: 0 }
          map.set(key, {
            name:    key,
            qty:     prev.qty + item.quantity,
            revenue: prev.revenue + item.unit_price * item.quantity,
          })
        })
      })
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [orders])

  const loading = ordersLoading || productsLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paneli kryesor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pasqyrë e të dhënave të dyqanit</p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Të ardhura"
          value={loading ? '...' : formatLek(totalRevenue)}
          sub={FILTER_LABELS[filter]}
          loading={loading}
        />
        <StatCard
          icon={ShoppingBag}
          label="Porosi"
          value={loading ? '...' : String(filtered.length)}
          sub={FILTER_LABELS[filter]}
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Në pritje"
          value={loading ? '...' : String(pendingCount)}
          sub="Aktualisht"
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Produkte"
          value={loading ? '...' : String(inStockCount)}
          sub="Në stok"
          loading={loading}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pie Chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-white text-base">Shitjet sipas kategorisë</CardTitle>
              <Tabs value={filter} onValueChange={v => setFilter(v as DateFilter)}>
                <TabsList className="bg-gray-800 h-7">
                  {(Object.keys(FILTER_LABELS) as DateFilter[]).map(k => (
                    <TabsTrigger
                      key={k}
                      value={k}
                      className="text-xs px-2 h-6 data-[state=active]:bg-amber-500 data-[state=active]:text-gray-950"
                    >
                      {FILTER_LABELS[k]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full bg-gray-800 rounded-lg" />
            ) : pieData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-gray-600 gap-2">
                <AlertCircle size={28} />
                <p className="text-sm">Nuk ka të dhëna për këtë periudhë</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
                    formatter={(v: number) => [formatLek(v), 'Të ardhura']}
                  />
                  <Legend
                    formatter={v => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Të ardhura — 7 ditët e fundit</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full bg-gray-800 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
                    formatter={(v: number) => [formatLek(v), 'Të ardhura']}
                    cursor={{ fill: 'rgba(245,158,11,0.05)' }}
                  />
                  <Bar dataKey="revenue" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top products ────────────────────────────────────────────── */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Produktet më të shitura</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-gray-800 rounded" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-600 py-4 text-center">Nuk ka porosi ende</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-200 truncate">{p.name}</span>
                  <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs shrink-0">
                    {p.qty} cop.
                  </Badge>
                  <span className="text-sm font-semibold text-amber-400 shrink-0">
                    {formatLek(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
