'use client'

import { Fragment, ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { AnimatePresence, m } from 'framer-motion'
import {
  ArrowLeftRight,
  CandlestickChart,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  PieChart,
  PiggyBank,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

type NavGroup = 'Overview' | 'Money' | 'Invest' | 'Intelligence' | 'Account'

interface NavItem {
  href: string
  icon: typeof LayoutDashboard
  label: string
  group: NavGroup
  badge?: string
  highlight?: boolean
}

const NAV_GROUPS: NavGroup[] = ['Overview', 'Money', 'Invest', 'Intelligence', 'Account']

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: 'Live', group: 'Overview' },
  { href: '/dashboard/transactions', icon: ArrowLeftRight, label: 'Transactions', group: 'Money' },
  { href: '/dashboard/goals', icon: Target, label: 'Goals', group: 'Money' },
  { href: '/dashboard/wealth', icon: PiggyBank, label: 'Savings & Debts', group: 'Money' },
  { href: '/dashboard/portfolio', icon: PieChart, label: 'Portfolio', group: 'Invest' },
  { href: '/dashboard/markets', icon: CandlestickChart, label: 'Markets', group: 'Invest' },
  { href: '/dashboard/analysis', icon: LineChart, label: 'Analysis', group: 'Invest' },
  { href: '/dashboard/chat', icon: Sparkles, label: 'AI Chat', highlight: true, group: 'Intelligence' },
  { href: '/dashboard/alerts', icon: ShieldAlert, label: 'Risk Alerts', group: 'Intelligence' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', group: 'Account' },
]

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
}

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-9 w-9 rounded-xl'
  return (
    <span className={`brand-mark ${box}`}>
      <TrendingUp className={size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} strokeWidth={2.4} />
    </span>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncToast, setSyncToast] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    if (sidebarOpen) {
      root.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
    } else {
      root.style.overflow = ''
      body.style.overflow = ''
    }

    return () => {
      root.style.overflow = ''
      body.style.overflow = ''
    }
  }, [sidebarOpen])

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleSyncNow = () => {
    if (isSyncing) return
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
      setSyncToast(true)
      setTimeout(() => setSyncToast(false), 3000)
    }, 700)
  }

  const activeItem = navItems.find((item) => isItemActive(pathname, item.href)) ?? navItems[0]
  const ActiveIcon = activeItem.icon
  const userInitial = (user?.name || user?.email || 'U')[0].toUpperCase()

  const renderNav = (closeOnClick?: boolean, collapsed = false) => (
    <nav
      aria-label="Primary"
      className={`relative min-h-0 flex-1 px-3 py-3 ${
        collapsed ? 'overflow-visible' : 'overflow-y-auto overscroll-contain scroll-thin'
      }`}
    >
      {NAV_GROUPS.map((group) => {
        const items = navItems.filter((item) => item.group === group)
        if (items.length === 0) return null

        return (
          <div key={group} className="mb-3 last:mb-0">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-line-strong" aria-hidden="true" />
            ) : (
              <p className="eyebrow mb-1.5 px-3 text-[10px] text-slate-400">{group}</p>
            )}

            <ul className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = isItemActive(pathname, item.href)

                return (
                  <li key={item.href} className="group relative">
                    <Link
                      href={item.href}
                      onClick={closeOnClick ? () => setSidebarOpen(false) : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      className={`sidebar-nav-link flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                        collapsed ? 'h-11 justify-center px-0' : 'px-3 py-2.5'
                      } ${
                        isActive
                          ? 'nav-active'
                          : 'text-slate-600 hover:bg-ink-900/[0.04] hover:text-ink-900'
                      }`}
                    >
                      {isActive && <span className="nav-active-indicator" aria-hidden="true" />}
                      <span className="relative flex shrink-0">
                        <Icon
                          className={`h-[18px] w-[18px] transition-colors duration-200 ${
                            isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-ink-700'
                          }`}
                        />
                        {item.highlight && (
                          <span className="absolute -right-1 -top-1 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ice-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-ice-500" />
                          </span>
                        )}
                      </span>

                      {!collapsed && (
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="badge badge-success px-2 py-0 text-[10px] leading-[18px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {item.badge}
                            </span>
                          )}
                        </span>
                      )}
                    </Link>

                    {/* Collapsed tooltip flyout */}
                    {collapsed && (
                      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                        <div className="glass-strong whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-900">
                          {item.label}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )

  const renderUserSection = (collapsed = false, mobile = false) => (
    <div
      className={`relative shrink-0 border-t border-line p-3 ${collapsed ? 'px-2' : ''}`}
      style={mobile ? { paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' } : undefined}
    >
      {!collapsed ? (
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <span className="avatar-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold text-primary-700">
            {userInitial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-900">{user?.name || user?.email}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-icon h-8 w-8 rounded-lg hover:!border-rose-200 hover:!bg-rose-50 hover:!text-rose-600"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="avatar-ring flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-semibold text-primary-700">
            {userInitial}
          </span>
          <button
            onClick={handleLogout}
            className="btn-icon h-8 w-8 rounded-lg hover:!border-rose-200 hover:!bg-rose-50 hover:!text-rose-600"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )

  const renderAiStatus = () => (
    <div className="relative mx-3 mb-3 overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-ice-50 p-3.5">
      <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-ice-200/60 blur-2xl" />
      <div className="relative flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-ink-900">AI Financial Brain</span>
      </div>
      <p className="relative mt-1 text-[11px] leading-snug text-slate-500">
        Real-time portfolio intelligence active
      </p>
    </div>
  )

  return (
    <div className="relative min-h-screen text-ink-900 lg:flex">
      {/* Toast Notification */}
      {syncToast && (
        <div
          role="status"
          className="glass-strong fixed bottom-6 right-4 z-[200] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-medium text-ink-900 animate-pop-in sm:right-6"
        >
          <span className="icon-tile icon-tile-sm icon-tile-emerald h-6 w-6 rounded-md">
            <Zap className="h-3.5 w-3.5" />
          </span>
          <span>Dashboard synced with live market metrics</span>
        </div>
      )}

      {/* Mobile Drawer */}
      <AnimatePresence>
      {sidebarOpen && (
        <Fragment key="mobile-drawer">
          <m.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-ink-900/25 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <m.aside
            key="drawer-panel"
            initial={{ x: '-104%', rotateY: 8, transformPerspective: 1200 }}
            animate={{ x: 0, rotateY: 0, transitionEnd: { transformPerspective: 0 } }}
            exit={{ x: '-104%', rotateY: 6, transformPerspective: 1200 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="sidebar-panel fixed inset-y-0 left-0 z-[110] flex h-[100dvh] max-h-[100dvh] min-h-0 w-[18rem] max-w-[86vw] flex-col rounded-r-3xl lg:hidden"
          >
            <div className="sidebar-ambient" aria-hidden="true" />
            <div className="relative flex shrink-0 items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2.5">
                <BrandMark />
                <span className="font-display text-lg font-semibold tracking-tight text-ink-900">FinanceIQ</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="btn-icon"
              >
                <span className="sr-only">Close navigation</span>
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav(true)}
            {renderAiStatus()}
            {renderUserSection(false, true)}
          </m.aside>
        </Fragment>
      )}
      </AnimatePresence>

      {/* Desktop floating sidebar */}
      <aside
        className={`sticky top-0 z-[60] hidden h-screen shrink-0 p-3 pr-0 transition-[width] duration-300 ease-out-expo lg:block ${
          isCollapsed ? 'w-[5.75rem]' : 'w-[17.5rem]'
        }`}
      >
        <div className="sidebar-panel relative flex h-full flex-col rounded-[1.75rem]">
          <div className="sidebar-ambient" aria-hidden="true" />

          {/* Brand Header */}
          <div
            className={`relative flex items-center py-4 ${
              isCollapsed ? 'flex-col gap-3 px-2' : 'justify-between px-5'
            }`}
          >
            <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="FinanceIQ dashboard">
              <BrandMark />
              {!isCollapsed && (
                <span className="font-display text-lg font-semibold tracking-tight text-ink-900">
                  Finance<span className="text-gradient">IQ</span>
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="btn-icon h-7 w-7 rounded-lg"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation */}
          {renderNav(false, isCollapsed)}

          {/* AI status (expanded only) */}
          {!isCollapsed && renderAiStatus()}

          {/* User profile section */}
          {renderUserSection(isCollapsed)}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <header className="app-header sticky top-0 z-50">
          <div className="container-app flex h-16 items-center justify-between gap-3">
            {/* Left: mobile trigger + brand / desktop page context */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="btn-icon h-10 w-10 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open navigation</span>
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label="FinanceIQ dashboard">
                <BrandMark size="sm" />
                <span className="font-display text-base font-semibold tracking-tight text-ink-900 max-[359px]:hidden">
                  FinanceIQ
                </span>
              </Link>

              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <span className="icon-tile icon-tile-sm">
                  <ActiveIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="text-[11px] font-medium text-slate-400">
                    Workspace <span className="mx-1 text-slate-300">/</span>
                    <span className="text-slate-500">{activeItem.group}</span>
                  </p>
                  <p className="truncate font-display text-sm font-semibold text-ink-900">{activeItem.label}</p>
                </div>
              </div>
            </div>

            {/* Right Side Header Controls */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="btn-secondary group h-10 gap-2 px-3 text-xs sm:px-3.5"
                title="Instant Metrics Refresh"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-primary-600 transition-transform duration-700 ${
                    isSyncing ? 'animate-spin' : 'motion-safe:group-hover:rotate-180'
                  }`}
                />
                <span className="hidden sm:inline">{isSyncing ? 'Processing...' : 'Instant Sync'}</span>
                <span className="sr-only sm:hidden">{isSyncing ? 'Processing' : 'Instant Sync'}</span>
              </button>

              <Link href="/dashboard/chat" className="btn-primary h-10 gap-1.5 px-3.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask Copilot</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="relative flex-1 pb-10 pt-6">
          <div className="container-app page-enter">{children}</div>
        </main>
      </div>
    </div>
  )
}
