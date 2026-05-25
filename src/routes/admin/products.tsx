import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Loader2, Upload, X, ImageIcon,
  AlertTriangle, PlusCircle,
} from 'lucide-react'
import { supabase, stockLabels, categoryLabels, type DbProduct, type StockStatus, type ProductCategory } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/products')({
  component: ProductsPage,
})

// ── Zod schema ────────────────────────────────────────────────────────────────

// Keep all fields as plain strings/enums so z.input === z.output (no coerce/default).
// Number conversion for prices happens in the mutation handler.
const productSchema = z.object({
  name:         z.string().min(1, 'Emri është i detyrueshëm'),
  subtitle:     z.string(),
  meta:         z.string(),
  short_desc:   z.string(),
  category:     z.enum(['honey', 'nuts']),
  stock_status: z.enum(['in_stock', 'low_stock', 'out_of_stock']),
  price_250g:   z.string(),
  price_500g:   z.string(),
  price_1kg:    z.string(),
  description:  z.string(),
  origin:       z.string(),
  nutrition:    z.array(z.object({ label: z.string(), value: z.string() })),
})

type FormData = z.infer<typeof productSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const STOCK_COLORS: Record<StockStatus, string> = {
  in_stock:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  low_stock:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  out_of_stock:  'bg-red-500/10 text-red-400 border-red-500/20',
}

function productToFormData(p: DbProduct): FormData {
  const v250 = p.variants?.find(v => v.weight === '250g')?.price ?? 0
  const v500 = p.variants?.find(v => v.weight === '500g')?.price ?? 0
  const v1kg = p.variants?.find(v => v.weight === '1kg')?.price ?? 0
  return {
    name:         p.name,
    subtitle:     p.subtitle,
    meta:         p.meta,
    short_desc:   p.short_desc,
    category:     p.category,
    stock_status: p.stock_status,
    price_250g:   String(v250),
    price_500g:   String(v500),
    price_1kg:    String(v1kg),
    description:  p.description,
    origin:       p.origin,
    nutrition:    p.nutrition ?? [],
  }
}

const toInt = (s: string) => Math.max(0, Number.parseInt(s, 10) || 0)

// ── Image upload section ──────────────────────────────────────────────────────

function ImageUploader({
  images,
  onAdd,
  onRemove,
}: {
  images: string[]
  onAdd: (urls: string[]) => void
  onRemove: (url: string) => void
}) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map(url => (
          <div key={url} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-700">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-700 hover:border-amber-500/50 flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-amber-500 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <span className="text-xs">{uploading ? '...' : 'Ngarko'}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={async e => {
          const files = Array.from(e.target.files ?? [])
          if (!files.length) return
          setUploading(true)
          const urls: string[] = []
          for (const file of files) {
            const ext  = file.name.split('.').pop()
            const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const { error } = await supabase.storage.from('product-images').upload(path, file)
            if (error) { toast.error('Ngarkimi dështoi: ' + error.message); continue }
            const { data } = supabase.storage.from('product-images').getPublicUrl(path)
            urls.push(data.publicUrl)
          }
          if (urls.length) onAdd(urls)
          setUploading(false)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── Product form dialog ───────────────────────────────────────────────────────

function ProductDialog({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product?: DbProduct
}) {
  const qc = useQueryClient()
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const isEdit = !!product

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      // Cast needed: @hookform/resolvers v5 distinguishes z.input vs z.output types,
      // but our schema has identical input/output so this is safe.
      resolver: zodResolver(productSchema) as unknown as Resolver<FormData>,
      defaultValues: product ? productToFormData(product) : {
        name:         '',
        subtitle:     '',
        meta:         '',
        short_desc:   '',
        category:     'honey',
        stock_status: 'in_stock',
        price_250g:   '0',
        price_500g:   '0',
        price_1kg:    '0',
        description:  '',
        origin:       '',
        nutrition:    [{ label: 'Energji', value: '' }],
      },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'nutrition' })

  const upsert = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name:         data.name,
        subtitle:     data.subtitle,
        meta:         data.meta,
        short_desc:   data.short_desc,
        category:     data.category,
        stock_status: data.stock_status,
        variants: [
          { weight: '250g', price: toInt(data.price_250g) },
          { weight: '500g', price: toInt(data.price_500g) },
          { weight: '1kg',  price: toInt(data.price_1kg)  },
        ],
        description: data.description,
        origin:      data.origin,
        nutrition:   data.nutrition,
        images,
        alt: data.name,
      }

      if (isEdit) {
        const { error } = await supabase.from('products').update(payload).eq('id', product!.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['admin-products-all'] })
      toast.success(isEdit ? 'Produkti u përditësua' : 'Produkti u shtua')
      onClose()
    },
    onError: (err: Error) => toast.error('Gabim: ' + err.message),
  })

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEdit ? 'Ndrysho produktin' : 'Shto produkt të ri'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((d: FormData) => upsert.mutate(d))} className="space-y-5 py-2">

          {/* Basic info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-gray-300">Emri i produktit *</Label>
              <Input
                {...register('name')}
                className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500"
                placeholder="Mjaltë Gështenje Premium"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Nëntitulli</Label>
              <Input {...register('subtitle')} className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500" placeholder="100% natyral" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Meta (origjina/meta)</Label>
              <Input {...register('meta')} className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500" placeholder="Malësia e Madhe" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Kategoria</Label>
              <Select
                value={watch('category')}
                onValueChange={v => setValue('category', v as ProductCategory)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-amber-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="honey">Mjaltë</SelectItem>
                  <SelectItem value="nuts">Arra / Bajame</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Statusi i stokut</Label>
              <Select
                value={watch('stock_status')}
                onValueChange={v => setValue('stock_status', v as StockStatus)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-amber-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="in_stock">Në stok</SelectItem>
                  <SelectItem value="low_stock">Stok i ulët</SelectItem>
                  <SelectItem value="out_of_stock">Pa stok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Prices */}
          <div>
            <Label className="text-gray-300 block mb-3">Çmimet (ALL)</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['250g', '500g', '1kg'] as const).map(w => {
                const field = `price_${w.replace('g', 'g')}` as 'price_250g' | 'price_500g' | 'price_1kg'
                return (
                  <div key={w} className="space-y-1.5">
                    <Label className="text-xs text-gray-500">{w}</Label>
                    <Input
                      type="number"
                      min={0}
                      {...register(field)}
                      className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500"
                      placeholder="0"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Text fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Përshkrim i shkurtër</Label>
              <Textarea
                {...register('short_desc')}
                rows={2}
                className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Përshkrimi</Label>
              <Textarea
                {...register('description')}
                rows={3}
                className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500 resize-none"
                placeholder="Descrikcioni i plotë i produktit..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Origjina &amp; Burimet</Label>
              <Textarea
                {...register('origin')}
                rows={3}
                className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500 resize-none"
                placeholder="Ku prodhohet, si mblidhet..."
              />
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Nutrition table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-gray-300">Vlerat Ushqyese (për 100g)</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => append({ label: '', value: '' })}
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 px-2 text-xs"
              >
                <PlusCircle size={14} className="mr-1" />
                Shto rresht
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <Input
                    {...register(`nutrition.${idx}.label`)}
                    placeholder="p.sh. Energji"
                    className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500 flex-1"
                  />
                  <Input
                    {...register(`nutrition.${idx}.value`)}
                    placeholder="p.sh. 320 kcal"
                    className="bg-gray-800 border-gray-700 text-white focus-visible:ring-amber-500 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-xs text-gray-600 py-2">
                  Shtyp "Shto rresht" për të shtuar vlera ushqyese.
                </p>
              )}
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Images */}
          <div>
            <Label className="text-gray-300 block mb-3">Fotot e produktit</Label>
            <ImageUploader
              images={images}
              onAdd={urls => setImages(prev => [...prev, ...urls])}
              onRemove={url => setImages(prev => prev.filter(u => u !== url))}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              Anulo
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || upsert.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold"
            >
              {(isSubmitting || upsert.isPending) && <Loader2 size={14} className="animate-spin mr-2" />}
              {isEdit ? 'Ruaj ndryshimet' : 'Shto produktin'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ProductsPage() {
  const qc = useQueryClient()
  const [dialogProduct, setDialogProduct] = useState<DbProduct | undefined>()
  const [dialogOpen, setDialogOpen]       = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState<DbProduct | null>(null)

  const { data: products = [], isLoading } = useQuery<DbProduct[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['admin-products-all'] })
      toast.success('Produkti u fshi')
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error('Gabim: ' + err.message),
  })

  const openAdd  = () => { setDialogProduct(undefined); setDialogOpen(true) }
  const openEdit = (p: DbProduct) => { setDialogProduct(p); setDialogOpen(true) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Produktet</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} produkte gjithsej</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold"
        >
          <Plus size={16} className="mr-1.5" />
          Produkt i ri
        </Button>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`skel-${i}`} className="h-36 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-600 gap-3">
          <ImageIcon size={40} />
          <p className="text-sm">Nuk ka produkte. Shto produktin e parë!</p>
          <Button onClick={openAdd} variant="outline" size="sm" className="border-gray-700 text-gray-300">
            <Plus size={14} className="mr-1" />
            Shto produkt
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {products.map(p => (
            <div
              key={p.id}
              className="flex gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.alt} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-700"><ImageIcon size={20} /></div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{categoryLabels[p.category]}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn('text-xs border', STOCK_COLORS[p.stock_status])}
                  >
                    {stockLabels[p.stock_status]}
                  </Badge>
                  <span className="text-xs text-gray-600">
                    {p.variants?.[1]?.price?.toLocaleString('sq-AL')} L / 500g
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => openEdit(p)}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-800 hover:text-amber-400 transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-800 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <ProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        product={dialogProduct}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle size={18} className="text-red-400" />
              Fshi produktin
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              A jeni i sigurt që doni të fshini <strong className="text-white">"{deleteTarget?.name}"</strong>?
              Kjo veprim nuk mund të kthehet prapa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              Anulo
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500 text-white"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? <><Loader2 size={14} className="animate-spin mr-1" />Duke fshirë...</>
                : 'Po, fshi'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
