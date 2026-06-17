'use client'

import { ReactNode, useState } from 'react'
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
} from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/transactions', icon: BarChart3, label: 'Transactions' },
    { href: '/dashboard/goals', icon: Target, label: 'Goals' },
    { href: '/dashboard/wealth', icon: PiggyBank, label: 'Savings & Debts' },
    { href: '/dashboard/portfolio', icon: TrendingUp, label: 'Portfolio' },
    { href: '/dashboard/markets', icon: Globe2, label: 'Markets' },
    { href: '/dashboard/chat', icon: BrainCircuit, label: 'AI Chat' },
    { href: '/dashboard/alerts', icon: AlertCircle, label: 'Risk Alerts' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ]

  const renderNav = (closeOnClick?: boolean) => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeOnClick ? () => setSidebarOpen(false) : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-500/15 text-primary-200 ring-1 ring-primary-500/30'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-50'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  const renderUserSection = () => (
    <div className="border-t border-slate-800/80 px-4 py-4">
      <div className="mb-2 px-2">
        <p className="truncate text-sm font-medium text-slate-50">
          {user?.name || user?.email}
        </p>
        <p className="truncate text-xs text-slate-400">
          {user?.email}
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="btn-ghost flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 hover:text-danger-400"
      >
        <LogOut className="h-5 w-5" />
        <span>Sign Out</span>
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/92 shadow-xl backdrop-blur-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary-400" />
                <span className="text-lg font-semibold tracking-tight text-slate-50">
                  FinanceIQ
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-full p-2 text-slate-300 hover:bg-slate-800/60"
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

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800/80 bg-slate-950/88 shadow-sm backdrop-blur-2xl lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-800/70 px-5 py-5">
          <TrendingUp className="h-7 w-7 text-primary-400" />
          <span className="text-xl font-bold tracking-tight text-slate-50">
            FinanceIQ
          </span>
        </div>
        {renderNav(false)}
        {renderUserSection()}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-2xl">
          <div className="container-app flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full p-2 text-slate-200 hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open navigation</span>
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 lg:hidden">
                <TrendingUp className="h-5 w-5 text-primary-400" />
                <span className="text-base font-semibold tracking-tight text-slate-50">
                  FinanceIQ
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="pb-8 pt-4 sm:pt-6 lg:pt-8">
          <div className="container-app">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
