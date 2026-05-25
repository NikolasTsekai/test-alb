import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { sq } from 'date-fns/locale'
import {
  ShoppingBag, Phone, MapPin, MessageSquare, Clock,
  CheckCircle2, Truck, XCircle, PackageCheck, Loader2, Search,
} from 'lucide-react'
import { supabase, orderStatusLabels, formatLek, type DbOrder, type OrderStatus, type OrderItem } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/orders')({
  component: OrdersPage,
})

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   'bg-amber-500/10  text-amber-400  border-amber-500/20',
  confirmed: 'bg-blue-500/10   text-blue-400   border-blue-500/20',
  shipped:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:  'bg-red-500/10   text-red-400    border-red-500/20',
}

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle2,
  shipped:   Truck,
  delivered: PackageCheck,
  rejected:  XCircle,
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'rejected']

const NEXT_ACTIONS: Partial<Record<OrderStatus, { to: OrderStatus; label: string; color: string }[]>> = {
  pending: [
    { to: 'confirmed', label: 'Konfirmo', color: 'bg-blue-600 hover:bg-blue-500 text-white' },
    { to: 'rejected',  label: 'Refuzo',   color: 'bg-red-600/80 hover:bg-red-600 text-white' },
  ],
  confirmed: [
    { to: 'shipped',  label: 'Shëno si Dërguar',  color: 'bg-purple-600 hover:bg-purple-500 text-white' },
    { to: 'rejected', label: 'Refuzo',             color: 'bg-red-600/80 hover:bg-red-600 text-white' },
  ],
  shipped: [
    { to: 'delivered', label: 'Shëno si Dorëzuar', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
  ],
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ order, onStatusChange, updating }: {
  order: DbOrder
  onStatusChange: (id: string, status: OrderStatus) => void
  updating: boolean
}) {
  const StatusIcon = STATUS_ICONS[order.status]
  const actions = NEXT_ACTIONS[order.status] ?? []

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{order.customer_name}</span>
            <Badge
              variant="outline"
              className={cn('text-xs border flex items-center gap-1', STATUS_STYLES[order.status])}
            >
              <StatusIcon size={11} />
              {orderStatusLabels[order.status]}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {format(parseISO(order.created_at), "d MMM yyyy · HH:mm", { locale: sq })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-amber-400">{formatLek(order.total_amount)}</p>
          <p className="text-xs text-gray-600 mt-0.5">#{order.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Contact info */}
      <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Phone size={13} className="text-gray-600 shrink-0" />
          <a href={`tel:${order.customer_phone}`} className="hover:text-white transition-colors truncate">
            {order.customer_phone}
          </a>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-400">
          <MapPin size={13} className="text-gray-600 shrink-0 mt-0.5" />
          <span className="truncate">{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ''}</span>
        </div>
        {order.notes && (
          <div className="flex items-start gap-2 text-sm text-gray-400 sm:col-span-2">
            <MessageSquare size={13} className="text-gray-600 shrink-0 mt-0.5" />
            <span className="italic">{order.notes}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mx-4 mb-3 rounded-lg bg-gray-800/60 divide-y divide-gray-800">
        {(order.items as OrderItem[]).map((item, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">{item.product_name}</p>
              <p className="text-xs text-gray-600">{item.variant_weight} × {item.quantity}</p>
            </div>
            <p className="text-sm font-medium text-gray-300 shrink-0">
              {formatLek(item.unit_price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex gap-2 px-4 pb-4">
          {actions.map(action => (
            <Button
              key={action.to}
              size="sm"
              disabled={updating}
              onClick={() => onStatusChange(order.id, action.to)}
              className={cn('flex-1 text-sm font-medium', action.color)}
            >
              {updating
                ? <Loader2 size={14} className="animate-spin" />
                : action.label
              }
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function OrdersPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data: orders = [], isLoading } = useQuery<DbOrder[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    refetchInterval: 20_000,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id)
      if (error) throw error
    },
    onMutate: ({ id }) => setUpdatingId(id),
    onSettled: () => setUpdatingId(null),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-orders-all'] })
      toast.success(`Statusi ndryshoi në "${orderStatusLabels[status]}"`)
    },
    onError: (err: Error) => toast.error('Gabim: ' + err.message),
  })

  const filtered = useMemo(() => {
    let result = orders
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.customer_city.toLowerCase().includes(q) ||
        o.id.startsWith(q),
      )
    }
    return result
  }, [orders, statusFilter, search])

  const countsByStatus = useMemo(() => {
    const c: Partial<Record<OrderStatus, number>> = {}
    orders.forEach(o => { c[o.status] = (c[o.status] ?? 0) + 1 })
    return c
  }, [orders])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Porositë</h1>
        <p className="text-sm text-gray-500 mt-0.5">{orders.length} porosi gjithsej</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kërko me emër, telefon, qytet..."
            className="bg-gray-900 border-gray-800 text-white pl-9 focus-visible:ring-amber-500 placeholder:text-gray-600"
          />
        </div>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={v => setStatusFilter(v as OrderStatus | 'all')}
        >
          <SelectTrigger className="bg-gray-900 border-gray-800 text-white focus:ring-amber-500 w-full sm:w-52">
            <SelectValue placeholder="Filtro sipas statusit" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem value="all">
              Të gjitha ({orders.length})
            </SelectItem>
            {ALL_STATUSES.map(s => (
              <SelectItem key={s} value={s}>
                {orderStatusLabels[s]} ({countsByStatus[s] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status pills (mobile-friendly quick filter) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(['all', ...ALL_STATUSES] as const).map(s => {
          const count = s === 'all' ? orders.length : (countsByStatus[s] ?? 0)
          const isActive = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300',
              )}
            >
              {s === 'all' ? 'Të gjitha' : orderStatusLabels[s]}
              <span className={cn(
                'w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold',
                isActive ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-500',
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-600 gap-3">
          <ShoppingBag size={40} />
          <p className="text-sm">
            {orders.length === 0
              ? 'Nuk ka porosi ende. Porositë e reja do të shfaqen automatikisht.'
              : 'Nuk u gjet asnjë porosi me filtrin aktual.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
              updating={updatingId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
