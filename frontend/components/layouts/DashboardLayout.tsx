'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import {
  AlertCircle,
  BarChart3,
  BrainCircuit,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Settings,
  Target,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
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

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: 'Live' },
    { href: '/dashboard/transactions', icon: BarChart3, label: 'Transactions' },
    { href: '/dashboard/goals', icon: Target, label: 'Goals' },
    { href: '/dashboard/wealth', icon: PiggyBank, label: 'Savings & Debts' },
    { href: '/dashboard/portfolio', icon: TrendingUp, label: 'Portfolio' },
    { href: '/dashboard/analysis', icon: BrainCircuit, label: 'Analysis' },
    { href: '/dashboard/markets', icon: Globe2, label: 'Markets' },
    { href: '/dashboard/chat', icon: BrainCircuit, label: 'AI Chat', highlight: true },
    { href: '/dashboard/alerts', icon: AlertCircle, label: 'Risk Alerts' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ]

  const renderNav = (closeOnClick?: boolean, collapsed = false) => (
    <nav className="flex-1 space-y-1.5 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              onClick={closeOnClick ? () => setSidebarOpen(false) : undefined}
              className={`sidebar-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center px-2' : ''
              } ${
                isActive
                  ? 'bg-primary-500/15 text-primary-300 ring-1 ring-primary-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-50 hover:translate-x-0.5'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {item.highlight && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                )}
              </div>

              {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center rounded-md bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-300 ring-1 ring-inset ring-primary-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>

            {/* Collapsed Tooltip Flyout */}
            {collapsed && (
              <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1">
                <div className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 shadow-xl border border-slate-800 whitespace-nowrap">
                  {item.label}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )

  const renderUserSection = (collapsed = false) => (
    <div className={`border-t border-slate-800/80 p-3 ${collapsed ? 'px-2' : 'px-4'}`}>
      {!collapsed ? (
        <div className="mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 text-xs font-bold text-white shadow-md">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-slate-50">
                {user?.name || user?.email}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-2 flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 text-xs font-bold text-white shadow-md">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className={`btn-ghost flex w-full items-center rounded-xl text-xs font-medium text-slate-300 hover:text-danger-400 ${
          collapsed ? 'justify-center p-2.5' : 'justify-start gap-2 px-3 py-2'
        }`}
        title="Sign Out"
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && <span>Sign Out</span>}
      </button>
    </div>
  )

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-slate-100 lg:flex lg:h-screen lg:overflow-hidden">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-[200] animate-pop-in rounded-xl border border-primary-500/30 bg-slate-900/95 px-4 py-3 text-xs font-medium text-slate-100 shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span>Dashboard synced with live market metrics</span>
        </div>
      )}

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] h-screen w-screen bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="sidebar-ambient fixed inset-y-0 left-0 z-[110] flex h-screen w-64 max-w-[85vw] flex-col border-r border-slate-800/80 bg-slate-950/95 shadow-2xl backdrop-blur-2xl lg:hidden animate-slide-in-left">
            <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-50">
                  FinanceIQ
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-full p-2 text-slate-300 hover:bg-slate-800/60 transition-colors"
              >
                <span className="sr-only">Close navigation</span>
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav(true)}
            {renderUserSection()}
          </aside>
        </>
      )}

      {/* Desktop Sticky Sidebar with Dynamic Width Transition */}
      <aside
        className={`sidebar-ambient relative z-[120] hidden h-screen shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/90 shadow-sm backdrop-blur-2xl transition-all duration-300 ease-in-out lg:flex lg:sticky lg:top-0 lg:self-start ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className={`flex items-center border-b border-slate-800/70 py-4 transition-all duration-300 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/10 border border-primary-500/30 text-primary-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold tracking-tight text-slate-50">
                FinanceIQ
              </span>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-all hover:scale-105"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Toggle */}
        {isCollapsed && (
          <div className="flex justify-center pt-2 pb-1">
            <button
              onClick={() => setIsCollapsed(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-all hover:scale-105"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        {renderNav(false, isCollapsed)}

        {/* Bottom AI Status badge if expanded */}
        {!isCollapsed && (
          <div className="mx-3 mb-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">AI Financial Brain</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-tight">
              Real-time portfolio intelligence active
            </p>
          </div>
        )}

        {/* User profile section */}
        {renderUserSection(isCollapsed)}
      </aside>

      {/* Main Content Area */}
      <div className="relative z-0 flex-1 min-w-0 overflow-x-hidden lg:overflow-y-auto">
        {/* Top Navbar */}
        <header className="fixed inset-x-0 top-0 z-[80] border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-2xl lg:top-0 lg:z-50 transition-all">
          <div className="container-app flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex w-full items-center justify-between">
              {/* Mobile trigger */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="fixed left-3 top-3 z-[90] inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-950/95 p-2 text-slate-200 shadow-[0_8px_30px_rgba(2,6,23,0.45)] backdrop-blur-xl hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open navigation</span>
                  <Menu className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 pl-12 lg:pl-0">
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold tracking-wide uppercase text-[10px]">Real-time Engine</span>
                  </div>
                </div>
              </div>

              {/* Right Side Header Controls */}
              <div className="flex items-center gap-3">
                {/* Instant Sync Action Button */}
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="group relative flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-primary-500/40 hover:bg-slate-800 hover:text-white"
                  title="Instant Metrics Refresh"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-primary-400 transition-transform duration-700 ${
                      isSyncing ? 'animate-spin' : 'group-hover:rotate-180'
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {isSyncing ? 'Processing...' : 'Instant Sync'}
                  </span>
                </button>

                {/* Quick Chat Shortcut Pill */}
                <Link
                  href="/dashboard/chat"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600/90 to-primary-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-105"
                >
                  <BrainCircuit className="h-3.5 w-3.5" />
                  <span>Ask Copilot</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="min-h-[calc(100dvh-4rem)] pb-12 pt-20 sm:pt-24 lg:min-h-0 lg:pt-24">
          <div className="container-app">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
