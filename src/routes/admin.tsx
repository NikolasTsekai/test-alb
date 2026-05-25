import { createFileRoute, Outlet, Link, useNavigate, useMatchRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Package, ShoppingBag, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const NAV: NavItem[] = [
  { to: '/admin',          label: 'Paneli',    icon: LayoutDashboard, exact: true },
  { to: '/admin/products', label: 'Produktet', icon: Package },
  { to: '/admin/orders',   label: 'Porositë',  icon: ShoppingBag },
]

function NavLink({ to, label, icon: Icon, exact }: NavItem) {
  const matchRoute = useMatchRoute()
  const isActive = !!matchRoute({ to, fuzzy: !exact })

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-amber-500/15 text-amber-400 shadow-sm'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
      )}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight size={14} className="text-amber-500/60" />}
    </Link>
  )
}

function BottomNavLink({ to, label, icon: Icon, exact }: NavItem) {
  const matchRoute = useMatchRoute()
  const isActive = !!matchRoute({ to, fuzzy: !exact })
  return (
    <Link
      to={to}
      className={cn(
        'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors',
        isActive ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300',
      )}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  )
}

function AdminLayout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/admin-login' })
    }
  }, [user, loading, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/admin-login' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    )
  }

  if (!user) return null

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 font-bold text-sm">AG</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Albanian Gold</p>
            <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(item => (
          <NavLink key={item.to} {...item} />
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Dil nga paneli</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 font-bold text-xs">AG</span>
          </div>
          <span className="text-white font-semibold text-sm">Albanian Gold</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Hap menunë"
        >
          <Menu size={20} className="text-gray-300" />
        </button>
      </header>

      {/* ── Mobile drawer overlay ───────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="w-72 h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 border-l">
              <span className="text-white font-semibold text-sm">Navigimi</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1" onClick={() => setDrawerOpen(false)}>
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Page content — LEFT side */}
        <main className="flex-1 overflow-auto min-h-0">
          <div className="p-4 lg:p-6 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Sidebar — RIGHT side (desktop only) */}
        <div className="hidden lg:flex w-64 shrink-0 flex-col">
          <Sidebar />
        </div>
      </div>

      {/* ── Mobile bottom nav ───────────────────────────────────────── */}
      <nav className="lg:hidden flex bg-gray-900 border-t border-gray-800">
        {NAV.map(item => (
          <BottomNavLink key={item.to} {...item} />
        ))}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span>Dil</span>
        </button>
      </nav>
    </div>
  )
}
