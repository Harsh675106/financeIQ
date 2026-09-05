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
import DebtOptimizerCard from '@/components/wealth/DebtOptimizerCard'
import SavingsGrowthSimulator from '@/components/wealth/SavingsGrowthSimulator'
import WealthHealthMeter from '@/components/wealth/WealthHealthMeter'
import WealthItemCard, { WealthItem, WealthCategory } from '@/components/wealth/WealthItemCard'
import WealthModal from '@/components/wealth/WealthModal'
import QuickAdjustModal from '@/components/wealth/QuickAdjustModal'
import ConfettiEffect from '@/components/goals/ConfettiEffect'

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
  const totalSavings = useMemo(() => savings.reduce((sum, s) => sum + (s.amount || 0), 0), [savings])
  const totalDebts = useMemo(() => debts.reduce((sum, d) => sum + (d.amount || 0), 0), [debts])
  const totalAssets = useMemo(
    () => assets.reduce((sum, a) => sum + ((a.quantity || 0) * (a.price || 0)), 0),
    [assets]
  )
  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, l) => sum + (l.amount || 0), 0),
    [liabilities]
  )
  const netWorth = (totalSavings + totalAssets) - (totalDebts + totalLiabilities)

  // Average debt APR
  const averageDebtApr = useMemo(() => {
    if (debts.length === 0) return 0
    const totalWithRate = debts.reduce((sum, d) => sum + ((d.amount || 0) * (d.interest_rate || 0)), 0)
    return totalDebts > 0 ? (totalWithRate / totalDebts).toFixed(1) : '0.0'
  }, [debts, totalDebts])

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
        const val = activeTab === 'assets' ? (item.quantity || 0) * (item.price || 0) : item.amount || 0
        return val >= 50000
      })
    }

    // High APR filter (> 12% for debts)
    if (filterHighAprOnly && activeTab === 'debts') {
      list = list.filter((item) => (item.interest_rate || 0) >= 12)
    }

    // Sorting
    list.sort((a, b) => {
      const valA = activeTab === 'assets' ? (a.quantity || 0) * (a.price || 0) : a.amount || 0
      const valB = activeTab === 'assets' ? (b.quantity || 0) * (b.price || 0) : b.amount || 0

      if (sortBy === 'highest') return valB - valA
      if (sortBy === 'lowest') return valA - valB
      if (sortBy === 'apr') return (b.interest_rate || b.rate || 0) - (a.interest_rate || a.rate || 0)
      return (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime())
    })

    return list
  }, [activeTab, savings, debts, assets, liabilities, searchQuery, filterHighValue, filterHighAprOnly, sortBy])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">LOADING WEALTH SUITE...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageBackground variant="flow" />
      <ConfettiEffect trigger={confettiTrigger} onComplete={() => setConfettiTrigger(false)} />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 pb-16 px-2 sm:px-4 md:px-6">
        {/* ================= HERO HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-cyan-500/25 border border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <PiggyBank className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2.5">
                  Savings, Debts & Wealth
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="h-3.5 w-3.5" /> Live Matrix
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Manage cash buffers, optimize liability payoffs, and track compound growth
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAdd(activeTab)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-primary-500 to-teal-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Add {getSingularLabel(activeTab)}</span>
            </button>
          </div>
        </div>

        {/* ================= SUMMARY STAT CARDS GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Liquid Savings */}
          <div
            onClick={() => handleTabChange('savings')}
            className={`group cursor-pointer relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all duration-300 stage-card-lift ${
              activeTab === 'savings'
                ? 'border-emerald-500/60 bg-gradient-to-br from-emerald-950/50 via-slate-900/95 to-slate-950/95 ring-2 ring-emerald-500/30 shadow-emerald-500/10'
                : 'border-emerald-500/20 bg-slate-900/80 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liquid Savings</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 group-hover:scale-110 transition">
                <PiggyBank className="h-4.5 w-4.5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
              ₹{Math.round(totalSavings).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
              <span>{savings.length} Active Accounts</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Emergency Shield
              </span>
            </div>
          </div>

          {/* Total Outstanding Debts */}
          <div
            onClick={() => handleTabChange('debts')}
            className={`group cursor-pointer relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all duration-300 stage-card-lift ${
              activeTab === 'debts'
                ? 'border-rose-500/60 bg-gradient-to-br from-rose-950/50 via-slate-900/95 to-slate-950/95 ring-2 ring-rose-500/30 shadow-rose-500/10'
                : 'border-rose-500/20 bg-slate-900/80 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Debts</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 group-hover:scale-110 transition">
                <AlertCircle className="h-4.5 w-4.5 text-rose-400" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-400">
              ₹{Math.round(totalDebts).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
              <span>{debts.length} Active Debts</span>
              <span className="text-rose-400 font-bold">Avg {averageDebtApr}% APR</span>
            </div>
          </div>

          {/* Total Invested Assets */}
          <div
            onClick={() => handleTabChange('assets')}
            className={`group cursor-pointer relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all duration-300 stage-card-lift ${
              activeTab === 'assets'
                ? 'border-cyan-500/60 bg-gradient-to-br from-cyan-950/50 via-slate-900/95 to-slate-950/95 ring-2 ring-cyan-500/30 shadow-cyan-500/10'
                : 'border-cyan-500/20 bg-slate-900/80 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invested Assets</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 group-hover:scale-110 transition">
                <TrendingUp className="h-4.5 w-4.5 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-300">
              ₹{Math.round(totalAssets).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
              <span>{assets.length} Holdings</span>
              <span className="text-cyan-400 font-bold">Growth Engine</span>
            </div>
          </div>

          {/* Net Solvency Balance */}
          <div
            onClick={() => handleTabChange('liabilities')}
            className={`group cursor-pointer relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all duration-300 stage-card-lift ${
              activeTab === 'liabilities'
                ? 'border-indigo-500/60 bg-gradient-to-br from-indigo-950/50 via-slate-900/95 to-slate-950/95 ring-2 ring-indigo-500/30 shadow-indigo-500/10'
                : 'border-indigo-500/20 bg-slate-900/80 hover:border-indigo-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Solvency</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 group-hover:scale-110 transition">
                <Coins className="h-4.5 w-4.5 text-indigo-400" />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${netWorth >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
              ₹{Math.round(netWorth).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
              <span>Liabilities: ₹{Math.round(totalLiabilities).toLocaleString('en-IN')}</span>
              <span className={`font-bold uppercase ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netWorth >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= STAGE 1: FINANCIAL HEALTH ACCORDION ================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setIsHealthStageExpanded(!isHealthStageExpanded)}
              className="flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-white transition group"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition">
                {isHealthStageExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
              <span>Financial Health & Solvency Diagnostic</span>
              <span className="text-xs font-normal text-slate-400">
                ({isHealthStageExpanded ? 'Click to collapse' : 'Click to expand'})
              </span>
            </button>
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
        </div>

        {/* ================= STAGE 2: INTERACTIVE SIMULATORS STAGE ================= */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <button
              onClick={() => setIsSimulatorStageExpanded(!isSimulatorStageExpanded)}
              className="flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-white transition group"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-400 group-hover:scale-110 transition">
                {isSimulatorStageExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
              <span>Interactive Simulators & Payoff Engines</span>
              <span className="text-xs font-normal text-slate-400">
                ({isSimulatorStageExpanded ? 'Click to collapse' : 'Click to expand'})
              </span>
            </button>

            {isSimulatorStageExpanded && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-slate-900/90 p-1.5 border border-slate-700/80 shadow-lg">
                <button
                  onClick={() => setSimulatorMode('debt')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                    simulatorMode === 'debt'
                      ? 'bg-gradient-to-r from-primary-500 to-emerald-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  Debt Payoff Accelerator
                </button>
                <button
                  onClick={() => setSimulatorMode('savings')}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                    simulatorMode === 'savings'
                      ? 'bg-gradient-to-r from-primary-500 to-emerald-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Compounding SIP Engine
                </button>
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
        </div>

        {/* ================= MAIN BALANCE SHEET WORKSPACE (MODERN GLASS SUITE) ================= */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />

          {/* Top Segmented Tabs Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-800/90 pb-6">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5">
              {[
                { id: 'savings' as WealthCategory, label: 'Savings Accounts', icon: PiggyBank, count: savings.length, total: totalSavings, color: 'text-emerald-400', activeStyle: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/5' },
                { id: 'debts' as WealthCategory, label: 'Debts & Loans', icon: AlertCircle, count: debts.length, total: totalDebts, color: 'text-rose-400', activeStyle: 'bg-rose-500/15 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/5' },
                { id: 'assets' as WealthCategory, label: 'Investments & Assets', icon: TrendingUp, count: assets.length, total: totalAssets, color: 'text-cyan-400', activeStyle: 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/5' },
                { id: 'liabilities' as WealthCategory, label: 'Other Liabilities', icon: Zap, count: liabilities.length, total: totalLiabilities, color: 'text-amber-400', activeStyle: 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/5' },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`group flex items-center justify-between sm:justify-start gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-300 border ${
                      isActive
                        ? `${tab.activeStyle}`
                        : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isActive ? tab.color : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span>{tab.label}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                        isActive ? 'bg-slate-900/90 text-slate-100 border border-slate-700' : 'bg-slate-800 text-slate-400'
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
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800/90 px-4 py-2.5 text-xs font-bold text-primary-400 border border-primary-500/30 hover:bg-primary-500/15 hover:border-primary-500/50 transition shadow-sm self-start lg:self-auto"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add {getSingularLabel(activeTab)}</span>
            </button>
          </div>

          {/* Search, Sort & Quick Filter Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/90">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${activeTab} by name or notes...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none shadow-inner"
              />
            </div>

            {/* Sort & Quick Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-200 focus:border-primary-500 focus:outline-none"
              >
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
                <option value="recent">Recently Added</option>
                {activeTab === 'debts' && <option value="apr">Highest APR %</option>}
              </select>

              <button
                onClick={() => setFilterHighValue(!filterHighValue)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold border transition ${
                  filterHighValue
                    ? 'bg-primary-500/20 text-primary-300 border-primary-500/40 shadow-sm'
                    : 'border-slate-700/80 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                ≥ ₹50,000
              </button>

              {activeTab === 'debts' && (
                <button
                  onClick={() => setFilterHighAprOnly(!filterHighAprOnly)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold border transition ${
                    filterHighAprOnly
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold shadow-sm'
                      : 'border-slate-700/80 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  High APR (≥12%)
                </button>
              )}
            </div>
          </div>

          {/* Cards Content Section */}
          <div key={tabAnimKey} className="mt-6 animate-fade-in">
            {loadingData ? (
              <div className="py-20 text-center">
                <div className="animate-spin h-9 w-9 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs text-slate-400 mt-3 font-mono">Syncing balance matrix...</p>
              </div>
            ) : activeItems.length === 0 ? (
              /* High-Fidelity Empty State with 1-Click Starters */
              <div className="py-12 px-6 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 mx-auto mb-4 border border-slate-700 shadow-xl">
                  {activeTab === 'savings' ? (
                    <PiggyBank className="h-8 w-8 text-emerald-400" />
                  ) : activeTab === 'debts' ? (
                    <AlertCircle className="h-8 w-8 text-rose-400" />
                  ) : activeTab === 'assets' ? (
                    <TrendingUp className="h-8 w-8 text-cyan-400" />
                  ) : (
                    <Zap className="h-8 w-8 text-amber-400" />
                  )}
                </div>

                <h4 className="text-lg font-bold text-slate-100">
                  {searchQuery
                    ? `No ${activeTab} matching "${searchQuery}"`
                    : `No ${activeTab === 'savings' ? 'Savings Accounts' : activeTab === 'debts' ? 'Debts or Loans' : activeTab === 'assets' ? 'Investments' : 'Liabilities'} Added Yet`}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  {searchQuery
                    ? 'Try adjusting your search query or removing active filters.'
                    : 'Get started in 1-click by picking a popular preset below or create a custom entry:'}
                </p>

                {/* 1-Click Quick Starter Cards */}
                {!searchQuery && (
                  <div className="mt-6 max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                          className="group flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3.5 text-center transition hover:-translate-y-1 hover:border-primary-500/50 hover:bg-slate-850 hover:shadow-lg shadow-sm"
                        >
                          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 group-hover:bg-primary-500/20 group-hover:text-primary-300 transition">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-emerald-400 px-6 py-3 text-xs font-black text-slate-950 shadow-xl shadow-primary-500/20 transition hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Add Custom {getSingularLabel(activeTab)}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
