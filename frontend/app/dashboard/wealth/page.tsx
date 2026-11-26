'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import {
  Plus,
  PiggyBank,
  AlertCircle,
  TrendingUp,
  Zap,
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
  Coins,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  Layers,
  Flame,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Home,
  Building,
  Car,
  Wallet,
  ArrowRight,
  Filter
} from 'lucide-react'
import { api } from '@/lib/api'
import { safeNumber, formatINR, formatPercent } from '@/lib/formatters'
import DebtOptimizerCard from '@/components/wealth/DebtOptimizerCard'
import SavingsGrowthSimulator from '@/components/wealth/SavingsGrowthSimulator'
import WealthHealthMeter from '@/components/wealth/WealthHealthMeter'
import WealthItemCard, { WealthItem, WealthCategory } from '@/components/wealth/WealthItemCard'
import WealthModal from '@/components/wealth/WealthModal'
import QuickAdjustModal from '@/components/wealth/QuickAdjustModal'
import ConfettiEffect from '@/components/goals/ConfettiEffect'
import PageHeader from '@/components/ui/PageHeader'
import LoadingScreen from '@/components/ui/LoadingScreen'
import Reveal from '@/components/motion/Reveal'

const QUICK_STARTERS: Record<
  WealthCategory,
  { label: string; icon: any; preset: { field: string; val: string; desc: string; rate?: string } }[]
> = {
  savings: [
    { label: 'Emergency Fund', icon: ShieldCheck, preset: { field: 'account_type', val: 'Emergency Fund', desc: 'Liquid contingency buffer (6 months expenses)' } },
    { label: 'Fixed Deposit (FD)', icon: PiggyBank, preset: { field: 'account_type', val: 'Fixed Deposit', desc: 'Guaranteed interest fixed deposit' } },
    { label: 'High-Yield Savings', icon: Wallet, preset: { field: 'account_type', val: 'High-Yield Savings', desc: 'Daily operating savings account' } },
    { label: 'Public Provident (PPF)', icon: Coins, preset: { field: 'account_type', val: 'PPF Account', desc: 'Government-backed tax-exempt compounding' } },
  ],
  debts: [
    { label: 'Credit Card', icon: CreditCard, preset: { field: 'debt_type', val: 'Credit Card', desc: 'Monthly high-rate revolving balance', rate: '36' } },
    { label: 'Home Loan', icon: Home, preset: { field: 'debt_type', val: 'Home Loan', desc: 'Long-term residential mortgage', rate: '8.5' } },
    { label: 'Car Loan', icon: Car, preset: { field: 'debt_type', val: 'Car Loan', desc: 'Vehicle financing EMI', rate: '9.2' } },
    { label: 'Personal Loan', icon: AlertCircle, preset: { field: 'debt_type', val: 'Personal Loan', desc: 'Unsecured bank loan', rate: '13.5' } },
  ],
  assets: [
    { label: 'Mutual Fund SIP', icon: TrendingUp, preset: { field: 'type', val: 'Mutual Fund', desc: 'Nifty 50 Index Fund units' } },
    { label: 'Direct Stocks', icon: Coins, preset: { field: 'type', val: 'Equity Stocks', desc: 'Long-term equity portfolio' } },
    { label: 'Physical / Digital Gold', icon: Sparkles, preset: { field: 'type', val: 'Gold Asset', desc: 'Sovereign gold bonds or bullion' } },
    { label: 'Real Estate Property', icon: Building, preset: { field: 'type', val: 'Real Estate', desc: 'Property holding' } },
  ],
  liabilities: [
    { label: 'Bank Overdraft', icon: Zap, preset: { field: 'type', val: 'Bank Overdraft', desc: 'Working capital credit facility' } },
    { label: 'Personal Borrowing', icon: AlertCircle, preset: { field: 'type', val: 'Personal Borrowing', desc: 'Informal borrowed capital' } },
    { label: 'Tax Provision', icon: Layers, preset: { field: 'type', val: 'Tax Obligation', desc: 'Pending advance tax installment' } },
  ],
}

export default function WealthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [savings, setSavings] = useState<WealthItem[]>([])
  const [debts, setDebts] = useState<WealthItem[]>([])
  const [assets, setAssets] = useState<WealthItem[]>([])
  const [liabilities, setLiabilities] = useState<WealthItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Active Category
  const [activeTab, setActiveTab] = useState<WealthCategory>('savings')
  const [tabAnimKey, setTabAnimKey] = useState(0)

  // Stage Accordion Expand/Collapse States (Stage Up/Down)
  const [isHealthStageExpanded, setIsHealthStageExpanded] = useState(true)
  const [isSimulatorStageExpanded, setIsSimulatorStageExpanded] = useState(true)
  const [simulatorMode, setSimulatorMode] = useState<'debt' | 'savings'>('debt')

  // Search, Sort & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'recent' | 'apr'>('highest')
  const [filterHighValue, setFilterHighValue] = useState(false)
  const [filterHighAprOnly, setFilterHighAprOnly] = useState(false)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<WealthItem | null>(null)
  const [quickAdjustItem, setQuickAdjustItem] = useState<{ item: WealthItem; category: WealthCategory } | null>(null)

  // Celebration Confetti
  const [confettiTrigger, setConfettiTrigger] = useState(false)

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchData()
  }, [user, refreshKey])

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      setLoadingData(true)
      const [savingsRes, debtsRes, assetsRes, liabilitiesRes] = await Promise.all([
        api.get('/savings'),
        api.get('/debts'),
        api.get('/wealth/assets'),
        api.get('/wealth/liabilities'),
      ])
      setSavings(savingsRes.data.savings || [])
      setDebts(debtsRes.data.debts || [])
      setAssets(assetsRes.data.assets || [])
      setLiabilities(liabilitiesRes.data.liabilities || [])
    } catch (err) {
      console.error('Failed to load wealth data', err)
    } finally {
      setLoadingData(false)
    }
  }

  /* ================= AGGREGATES ================= */
  const totalSavings = useMemo(
    () => savings.reduce((sum, s) => sum + safeNumber(s.amount, 0), 0),
    [savings]
  )
  const totalDebts = useMemo(
    () => debts.reduce((sum, d) => sum + safeNumber(d.amount, 0), 0),
    [debts]
  )
  const totalAssets = useMemo(
    () =>
      assets.reduce((sum, a) => {
        const itemAmt = a.amount !== undefined && a.amount !== null ? safeNumber(a.amount, 0) : 0
        const qtyPrc = safeNumber(a.quantity, 0) * safeNumber(a.price, 0)
        const val = itemAmt > 0 && qtyPrc === 0 ? itemAmt : qtyPrc > 0 ? qtyPrc : itemAmt
        return sum + val
      }, 0),
    [assets]
  )
  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, l) => sum + safeNumber(l.amount, 0), 0),
    [liabilities]
  )
  const netWorth = (totalSavings + totalAssets) - (totalDebts + totalLiabilities)

  // Average debt APR
  const averageDebtApr = useMemo(() => {
    if (!debts || debts.length === 0) return '0.0'
    const totalWithRate = debts.reduce((sum, d) => {
      const amt = safeNumber(d.amount, 0)
      const rate = safeNumber(d.interest_rate ?? d.rate, 0)
      return sum + amt * rate
    }, 0)
    const validDebtsTotal = debts.reduce((sum, d) => sum + safeNumber(d.amount, 0), 0)
    return validDebtsTotal > 0 ? (totalWithRate / validDebtsTotal).toFixed(1) : '0.0'
  }, [debts])

  /* ================= TAB HANDLER ================= */
  const handleTabChange = (newTab: WealthCategory) => {
    if (newTab === activeTab) return
    setActiveTab(newTab)
    setTabAnimKey((k) => k + 1)
  }

  /* ================= ITEM ACTION HANDLERS ================= */
  const handleEdit = (item: WealthItem, category: WealthCategory) => {
    setActiveTab(category)
    setEditingItem(item)
    setShowAddModal(true)
  }

  const handleDelete = async (id: number, category: WealthCategory) => {
    if (!confirm(`Are you sure you want to remove this ${category.slice(0, -1)}?`)) return
    try {
      const endpoint = category === 'savings' || category === 'debts' ? `/${category}/${id}` : `/wealth/${category}/${id}`
      await api.delete(endpoint)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      console.error(err)
      alert('Failed to delete item')
    }
  }

  const handleOpenAdd = (category?: WealthCategory) => {
    if (category) setActiveTab(category)
    setEditingItem(null)
    setShowAddModal(true)
  }

  const handleModalSuccess = () => {
    setRefreshKey((k) => k + 1)
    setConfettiTrigger(true)
  }

  const handleQuickAdjustSuccess = () => {
    setRefreshKey((k) => k + 1)
    setConfettiTrigger(true)
  }

  // Singular category label for button text
  const getSingularLabel = (cat: WealthCategory) => {
    if (cat === 'savings') return 'Saving Account'
    if (cat === 'debts') return 'Debt / Loan'
    if (cat === 'assets') return 'Asset'
    return 'Liability'
  }

  /* ================= FILTERED ACTIVE LIST ================= */
  const activeItems = useMemo(() => {
    let list: WealthItem[] = []
    if (activeTab === 'savings') list = [...savings]
    else if (activeTab === 'debts') list = [...debts]
    else if (activeTab === 'assets') list = [...assets]
    else if (activeTab === 'liabilities') list = [...liabilities]

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((item) => {
        const title = (item.account_type || item.debt_type || item.type || item.symbol || '').toLowerCase()
        const desc = (item.description || '').toLowerCase()
        return title.includes(q) || desc.includes(q)
      })
    }

    // High value filter (> ₹50,000)
    if (filterHighValue) {
      list = list.filter((item) => {
        const itemAmt = item.amount !== undefined && item.amount !== null ? safeNumber(item.amount, 0) : 0
        const qtyPrc = safeNumber(item.quantity, 0) * safeNumber(item.price, 0)
        const val = activeTab === 'assets' ? (itemAmt > 0 && qtyPrc === 0 ? itemAmt : qtyPrc > 0 ? qtyPrc : itemAmt) : safeNumber(item.amount, 0)
        return val >= 50000
      })
    }

    // High APR filter (> 12% for debts)
    if (filterHighAprOnly && activeTab === 'debts') {
      list = list.filter((item) => safeNumber(item.interest_rate ?? item.rate, 0) >= 12)
    }

    // Sorting
    list.sort((a, b) => {
      const getVal = (item: WealthItem) => {
        const itemAmt = item.amount !== undefined && item.amount !== null ? safeNumber(item.amount, 0) : 0
        const qtyPrc = safeNumber(item.quantity, 0) * safeNumber(item.price, 0)
        return activeTab === 'assets' ? (itemAmt > 0 && qtyPrc === 0 ? itemAmt : qtyPrc > 0 ? qtyPrc : itemAmt) : safeNumber(item.amount, 0)
      }
      const valA = getVal(a)
      const valB = getVal(b)

      if (sortBy === 'highest') return valB - valA
      if (sortBy === 'lowest') return valA - valB
      if (sortBy === 'apr') return safeNumber(b.interest_rate ?? b.rate, 0) - safeNumber(a.interest_rate ?? a.rate, 0)
      return (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime())
    })

    return list
  }, [activeTab, savings, debts, assets, liabilities, searchQuery, filterHighValue, filterHighAprOnly, sortBy])

  if (loading || !user) {
    return <LoadingScreen label="Loading wealth suite..." />
  }

  return (
    <DashboardLayout>
      <PageBackground variant="flow" />
      <ConfettiEffect trigger={confettiTrigger} onComplete={() => setConfettiTrigger(false)} />

      <div className="relative z-10 space-y-6 lg:space-y-8">
        {/* ================= HERO HEADER ================= */}
        <PageHeader
          eyebrow="Live Matrix"
          eyebrowIcon={PiggyBank}
          eyebrowTone="brand"
          title={
            <>
              Savings, Debts & <span className="text-gradient">Wealth</span>
            </>
          }
          description="Manage cash buffers, optimize liability payoffs, and track compound growth"
          actions={
            <button
              onClick={() => handleOpenAdd(activeTab)}
              className="btn-primary btn-lg w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 stroke-[2.6]" />
              <span>Add {getSingularLabel(activeTab)}</span>
            </button>
          }
        />

        {/* ================= SUMMARY STAT CARDS GRID ================= */}
        <div
          className="grid grid-cols-1 gap-4 animate-fade-up sm:grid-cols-2 sm:gap-5 xl:grid-cols-4"
          style={{ animationDelay: '80ms' }}
        >
          {/* Total Liquid Savings */}
          <div
            onClick={() => handleTabChange('savings')}
            className={`card card-spotlight stage-card-lift group relative cursor-pointer overflow-hidden p-5 sm:p-6 ${
              activeTab === 'savings' ? 'border-emerald-300 ring-1 ring-emerald-200' : ''
            }`}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-opacity duration-300 ${
                activeTab === 'savings' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="eyebrow truncate">Liquid Savings</span>
                <span className="icon-tile icon-tile-sm icon-tile-emerald">
                  <PiggyBank className="h-4 w-4" />
                </span>
              </div>
              <p className="kpi-value break-words text-2xl text-emerald-600 2xl:text-[1.75rem]">
                ₹{formatINR(totalSavings)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-slate-500">
                <span className="num min-w-0 truncate">{savings.length} Active Accounts</span>
                <span className="flex shrink-0 items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Emergency Shield
                </span>
              </div>
            </div>
          </div>

          {/* Total Outstanding Debts */}
          <div
            onClick={() => handleTabChange('debts')}
            className={`card card-spotlight stage-card-lift group relative cursor-pointer overflow-hidden p-5 sm:p-6 ${
              activeTab === 'debts' ? 'border-rose-300 ring-1 ring-rose-200' : ''
            }`}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent transition-opacity duration-300 ${
                activeTab === 'debts' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="eyebrow truncate">Total Debts</span>
                <span className="icon-tile icon-tile-sm icon-tile-rose">
                  <AlertCircle className="h-4 w-4" />
                </span>
              </div>
              <p className="kpi-value break-words text-2xl text-rose-600 2xl:text-[1.75rem]">
                ₹{formatINR(totalDebts)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-slate-500">
                <span className="num min-w-0 truncate">{debts.length} Active Debts</span>
                <span className="num shrink-0 font-semibold text-rose-600">Avg {averageDebtApr}% APR</span>
              </div>
            </div>
          </div>

          {/* Total Invested Assets */}
          <div
            onClick={() => handleTabChange('assets')}
            className={`card card-spotlight stage-card-lift group relative cursor-pointer overflow-hidden p-5 sm:p-6 ${
              activeTab === 'assets' ? 'border-sky-300 ring-1 ring-sky-200' : ''
            }`}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent transition-opacity duration-300 ${
                activeTab === 'assets' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="eyebrow truncate">Invested Assets</span>
                <span className="icon-tile icon-tile-sm icon-tile-sky">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="kpi-value break-words text-2xl text-sky-600 2xl:text-[1.75rem]">
                ₹{formatINR(totalAssets)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-slate-500">
                <span className="num min-w-0 truncate">{assets.length} Holdings</span>
                <span className="shrink-0 font-semibold text-sky-700">Growth Engine</span>
              </div>
            </div>
          </div>

          {/* Net Solvency Balance */}
          <div
            onClick={() => handleTabChange('liabilities')}
            className={`card card-spotlight stage-card-lift group relative cursor-pointer overflow-hidden p-5 sm:p-6 ${
              activeTab === 'liabilities' ? 'border-primary-300 ring-1 ring-primary-200' : ''
            }`}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent transition-opacity duration-300 ${
                activeTab === 'liabilities' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="eyebrow truncate">Net Solvency</span>
                <span className="icon-tile icon-tile-sm icon-tile-brand">
                  <Coins className="h-4 w-4" />
                </span>
              </div>
              <p
                className={`kpi-value break-words text-2xl 2xl:text-[1.75rem] ${
                  netWorth >= 0 ? 'text-gradient' : 'text-rose-600'
                }`}
              >
                ₹{formatINR(netWorth)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-slate-500">
                <span className="num min-w-0 truncate">Liabilities: ₹{formatINR(totalLiabilities)}</span>
                <span
                  className={`shrink-0 font-semibold uppercase tracking-wide ${
                    netWorth >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {netWorth >= 0 ? 'Surplus' : 'Deficit'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= STAGE 1: FINANCIAL HEALTH ACCORDION ================= */}
        <Reveal>
          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsHealthStageExpanded(!isHealthStageExpanded)}
                aria-expanded={isHealthStageExpanded}
                className="group flex min-w-0 items-center gap-3 rounded-xl text-left"
              >
                <span className="icon-tile icon-tile-sm icon-tile-brand">
                  {isHealthStageExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[15px] font-semibold tracking-tight text-ink-900 transition-colors group-hover:text-primary-700 sm:text-base">
                    Financial Health & Solvency Diagnostic
                  </span>
                  <span className="block text-xs text-slate-500 transition-colors group-hover:text-slate-600">
                    {isHealthStageExpanded ? 'Click to collapse' : 'Click to expand'}
                  </span>
                </span>
              </button>
              <div
                aria-hidden="true"
                className="hidden h-px flex-1 bg-gradient-to-r from-line-strong via-line to-transparent sm:block"
              />
            </div>

            {isHealthStageExpanded && (
              <div className="anim-stage-drawer">
                <WealthHealthMeter
                  totalSavings={totalSavings}
                  totalDebts={totalDebts}
                  totalAssets={totalAssets}
                  totalLiabilities={totalLiabilities}
                />
              </div>
            )}
          </section>
        </Reveal>

        {/* ================= STAGE 2: INTERACTIVE SIMULATORS STAGE ================= */}
        <Reveal>
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setIsSimulatorStageExpanded(!isSimulatorStageExpanded)}
                aria-expanded={isSimulatorStageExpanded}
                className="group flex min-w-0 items-center gap-3 rounded-xl text-left"
              >
                <span className="icon-tile icon-tile-sm icon-tile-violet">
                  {isSimulatorStageExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[15px] font-semibold tracking-tight text-ink-900 transition-colors group-hover:text-primary-700 sm:text-base">
                    Interactive Simulators & Payoff Engines
                  </span>
                  <span className="block text-xs text-slate-500 transition-colors group-hover:text-slate-600">
                    {isSimulatorStageExpanded ? 'Click to collapse' : 'Click to expand'}
                  </span>
                </span>
              </button>

              {isSimulatorStageExpanded && (
                <div className="scroll-thin max-w-full overflow-x-auto">
                  <div className="segmented">
                    <button
                      onClick={() => setSimulatorMode('debt')}
                      aria-pressed={simulatorMode === 'debt'}
                      className={`segmented-item px-3.5 py-2 ${
                        simulatorMode === 'debt' ? 'segmented-item-active' : ''
                      }`}
                    >
                      <TrendingDown className="h-3.5 w-3.5" />
                      Debt Payoff Accelerator
                    </button>
                    <button
                      onClick={() => setSimulatorMode('savings')}
                      aria-pressed={simulatorMode === 'savings'}
                      className={`segmented-item px-3.5 py-2 ${
                        simulatorMode === 'savings' ? 'segmented-item-active' : ''
                      }`}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      Compounding SIP Engine
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isSimulatorStageExpanded && (
              <div className="anim-stage-drawer">
                {simulatorMode === 'debt' ? (
                  <DebtOptimizerCard refreshKey={refreshKey} />
                ) : (
                  <SavingsGrowthSimulator currentSavings={totalSavings} />
                )}
              </div>
            )}
          </section>
        </Reveal>

        {/* ================= MAIN BALANCE SHEET WORKSPACE (LEDGER BOOK) ================= */}
        <Reveal delay={60}>
          <section className="ledger-perspective">
            <div className="ledger-book-shell anim-book-expand p-5 pl-6 sm:p-6 sm:pl-8 lg:p-8 lg:pl-10">
              <div className="ledger-spine" aria-hidden="true" />
              {/* Subtle Ambient Glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-100/50 blur-3xl"
              />

              {/* Top Segmented Tabs Bar */}
              <div className="relative flex flex-col justify-between gap-5 border-b border-line pb-6 lg:flex-row lg:items-center">
                <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
                  {[
                    { id: 'savings' as WealthCategory, label: 'Savings Accounts', icon: PiggyBank, count: savings.length, total: totalSavings, color: 'text-emerald-600', activeStyle: 'border-primary-200 bg-primary-50 text-primary-800 shadow-xs' },
                    { id: 'debts' as WealthCategory, label: 'Debts & Loans', icon: AlertCircle, count: debts.length, total: totalDebts, color: 'text-rose-600', activeStyle: 'border-primary-200 bg-primary-50 text-primary-800 shadow-xs' },
                    { id: 'assets' as WealthCategory, label: 'Investments & Assets', icon: TrendingUp, count: assets.length, total: totalAssets, color: 'text-sky-600', activeStyle: 'border-primary-200 bg-primary-50 text-primary-800 shadow-xs' },
                    { id: 'liabilities' as WealthCategory, label: 'Other Liabilities', icon: Zap, count: liabilities.length, total: totalLiabilities, color: 'text-amber-600', activeStyle: 'border-primary-200 bg-primary-50 text-primary-800 shadow-xs' },
                  ].map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        aria-pressed={isActive}
                        className={`bookmark-tab group flex min-h-[40px] min-w-0 items-center justify-between gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold sm:justify-start ${
                          isActive
                            ? `active-bookmark ${tab.activeStyle}`
                            : 'border-line bg-white text-slate-600 hover:border-line-strong hover:bg-canvas-subtle hover:text-ink-900'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive ? tab.color : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        <span
                          className={`num shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isActive ? 'bg-white text-primary-700 ring-1 ring-primary-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handleOpenAdd(activeTab)}
                  className="btn-soft self-start lg:self-auto"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Add {getSingularLabel(activeTab)}</span>
                </button>
              </div>

              {/* Search, Sort & Quick Filter Bar */}
              <div className="surface-inset relative mt-6 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5">
                {/* Search Input */}
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab} by name or notes...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label={`Search ${activeTab}`}
                    className="input h-10 py-0 pl-10 text-sm sm:text-sm"
                  />
                </div>

                {/* Sort & Quick Filter Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort entries"
                    className="input h-10 w-auto py-0 text-xs sm:text-[13px]"
                  >
                    <option value="highest">Highest Amount</option>
                    <option value="lowest">Lowest Amount</option>
                    <option value="recent">Recently Added</option>
                    {activeTab === 'debts' && <option value="apr">Highest APR %</option>}
                  </select>

                  <button
                    onClick={() => setFilterHighValue(!filterHighValue)}
                    aria-pressed={filterHighValue}
                    className={`num inline-flex h-10 items-center rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
                      filterHighValue
                        ? 'border-primary-200 bg-primary-50 text-primary-700 shadow-xs'
                        : 'border-line-strong bg-white text-slate-600 hover:border-slate-300 hover:text-ink-900'
                    }`}
                  >
                    ≥ ₹50,000
                  </button>

                  {activeTab === 'debts' && (
                    <button
                      onClick={() => setFilterHighAprOnly(!filterHighAprOnly)}
                      aria-pressed={filterHighAprOnly}
                      className={`num inline-flex h-10 items-center rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
                        filterHighAprOnly
                          ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-xs'
                          : 'border-line-strong bg-white text-slate-600 hover:border-slate-300 hover:text-ink-900'
                      }`}
                    >
                      High APR (≥12%)
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Content Section */}
              <div key={tabAnimKey} className="anim-page-shift-next relative mt-6">
                {loadingData ? (
                  <div role="status" aria-live="polite" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
                      {[0, 1, 2, 3].map((slot) => (
                        <div key={slot} className="skeleton h-40 rounded-[1.25rem]" />
                      ))}
                    </div>
                    <p className="text-center text-xs text-slate-500">Syncing balance matrix...</p>
                  </div>
                ) : activeItems.length === 0 ? (
                  /* High-Fidelity Empty State with 1-Click Starters */
                  <div className="rounded-2xl border border-dashed border-line-strong bg-canvas-subtle/50 px-5 py-10 text-center sm:px-8 sm:py-12">
                    <div className="relative mx-auto mb-5 w-fit">
                      <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-primary-100/70 blur-xl" />
                      <span
                        className={`icon-tile icon-tile-lg relative ${
                          activeTab === 'savings'
                            ? 'icon-tile-emerald'
                            : activeTab === 'debts'
                            ? 'icon-tile-rose'
                            : activeTab === 'assets'
                            ? 'icon-tile-sky'
                            : 'icon-tile-amber'
                        }`}
                      >
                        {activeTab === 'savings' ? (
                          <PiggyBank className="h-6 w-6" />
                        ) : activeTab === 'debts' ? (
                          <AlertCircle className="h-6 w-6" />
                        ) : activeTab === 'assets' ? (
                          <TrendingUp className="h-6 w-6" />
                        ) : (
                          <Zap className="h-6 w-6" />
                        )}
                      </span>
                    </div>

                    <h4 className="text-balance break-words font-display text-lg font-semibold text-ink-900">
                      {searchQuery
                        ? `No ${activeTab} matching "${searchQuery}"`
                        : `No ${activeTab === 'savings' ? 'Savings Accounts' : activeTab === 'debts' ? 'Debts or Loans' : activeTab === 'assets' ? 'Investments' : 'Liabilities'} Added Yet`}
                    </h4>
                    <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
                      {searchQuery
                        ? 'Try adjusting your search query or removing active filters.'
                        : 'Get started in 1-click by picking a popular preset below or create a custom entry:'}
                    </p>

                    {/* 1-Click Quick Starter Cards */}
                    {!searchQuery && (
                      <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                        {QUICK_STARTERS[activeTab]?.map((starter) => {
                          const Icon = starter.icon
                          return (
                            <button
                              key={starter.label}
                              onClick={() => {
                                setActiveTab(activeTab)
                                setEditingItem(null)
                                setShowAddModal(true)
                              }}
                              className="surface-inset surface-inset-hover group flex flex-col items-center justify-center gap-2 p-3.5 text-center transition-[transform,border-color,background-color] duration-200 motion-safe:hover:-translate-y-0.5"
                            >
                              <span className="icon-tile icon-tile-sm">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="text-xs font-semibold text-ink-700 transition-colors group-hover:text-ink-900">
                                + {starter.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    <div className="mt-6">
                      <button
                        onClick={() => handleOpenAdd(activeTab)}
                        className="btn-primary"
                      >
                        <Plus className="h-4 w-4 stroke-[2.6]" />
                        Add Custom {getSingularLabel(activeTab)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
                    {activeItems.map((item, index) => (
                      <WealthItemCard
                        key={item.id}
                        item={item}
                        category={activeTab}
                        index={index}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onQuickAdjust={(it, cat) => setQuickAdjustItem({ item: it, category: cat })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      {/* ================= MODALS ================= */}
      <WealthModal
        isOpen={showAddModal}
        initialCategory={activeTab}
        editingItem={editingItem}
        onClose={() => {
          setShowAddModal(false)
          setEditingItem(null)
        }}
        onSuccess={handleModalSuccess}
      />

      <QuickAdjustModal
        isOpen={!!quickAdjustItem}
        item={quickAdjustItem?.item || null}
        category={quickAdjustItem?.category || 'savings'}
        onClose={() => setQuickAdjustItem(null)}
        onSuccess={handleQuickAdjustSuccess}
      />
    </DashboardLayout>
  )
}
