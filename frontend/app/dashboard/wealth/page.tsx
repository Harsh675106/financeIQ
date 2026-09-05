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
  Flame
} from 'lucide-react'
import { api } from '@/lib/api'
import DebtOptimizerCard from '@/components/wealth/DebtOptimizerCard'
import SavingsGrowthSimulator from '@/components/wealth/SavingsGrowthSimulator'
import WealthHealthMeter from '@/components/wealth/WealthHealthMeter'
import WealthItemCard, { WealthItem, WealthCategory } from '@/components/wealth/WealthItemCard'
import WealthModal from '@/components/wealth/WealthModal'
import QuickAdjustModal from '@/components/wealth/QuickAdjustModal'
import ConfettiEffect from '@/components/goals/ConfettiEffect'

export default function WealthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [savings, setSavings] = useState<WealthItem[]>([])
  const [debts, setDebts] = useState<WealthItem[]>([])
  const [assets, setAssets] = useState<WealthItem[]>([])
  const [liabilities, setLiabilities] = useState<WealthItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Active Category & Interactive Tools
  const [activeTab, setActiveTab] = useState<WealthCategory>('savings')
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

  /* ================= HANDLERS ================= */
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

  /* ================= FILTERED & SORTED ACTIVE LIST ================= */
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

      <div className="relative z-10 space-y-6 pb-12">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <PiggyBank className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2">
                  Savings, Debts & Wealth
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="h-3 w-3" /> Live Balance Matrix
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Optimize cash runway, eliminate debt drag, and compound net worth
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenAdd(activeTab)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-emerald-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-primary-500/25 transition hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Wealth Entry
            </button>
          </div>
        </div>

        {/* ================= SUMMARY STAT CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Savings */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950/90 p-4.5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Liquid Savings</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition">
                <PiggyBank className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono tracking-tight text-emerald-400">
              ₹{Math.round(totalSavings).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span>{savings.length} Active Accounts</span>
              <span className="text-emerald-400/90 font-medium">Safe Reserve</span>
            </div>
          </div>

          {/* Total Debts */}
          <div className="group relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-slate-950/90 p-4.5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-rose-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Debts</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 group-hover:scale-110 transition">
                <AlertCircle className="h-4 w-4 text-rose-400" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono tracking-tight text-rose-400">
              ₹{Math.round(totalDebts).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span>{debts.length} Outstanding Loans</span>
              <span className="text-rose-400/90 font-medium">Avg {averageDebtApr}% APR</span>
            </div>
          </div>

          {/* Total Assets */}
          <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-slate-950/90 p-4.5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Invested Assets</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 group-hover:scale-110 transition">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono tracking-tight text-cyan-300">
              ₹{Math.round(totalAssets).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span>{assets.length} Holdings & Assets</span>
              <span className="text-cyan-400/90 font-medium">Growth Engine</span>
            </div>
          </div>

          {/* Total Liabilities / Net Worth */}
          <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950/90 p-4.5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-indigo-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Net Worth</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 transition">
                <Coins className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <p className={`text-2xl font-black font-mono tracking-tight ${netWorth >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
              ₹{Math.round(netWorth).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span>Liabilities: ₹{Math.round(totalLiabilities).toLocaleString('en-IN')}</span>
              <span className={netWorth >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {netWorth >= 0 ? 'Solvent' : 'Deficit'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= WEALTH HEALTH & FORTRESS METER ================= */}
        <WealthHealthMeter
          totalSavings={totalSavings}
          totalDebts={totalDebts}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
        />

        {/* ================= INTERACTIVE SIMULATORS SWITCHER ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Interactive Intelligence & Simulators
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700">
                  What-If Analysis
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
              <button
                onClick={() => setSimulatorMode('debt')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  simulatorMode === 'debt'
                    ? 'bg-primary-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" />
                Debt Payoff Accelerator
              </button>
              <button
                onClick={() => setSimulatorMode('savings')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  simulatorMode === 'savings'
                    ? 'bg-primary-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Compounding SIP Simulator
              </button>
            </div>
          </div>

          {simulatorMode === 'debt' ? (
            <DebtOptimizerCard refreshKey={refreshKey} />
          ) : (
            <SavingsGrowthSimulator currentSavings={totalSavings} />
          )}
        </div>

        {/* ================= MAIN BALANCE SHEET WORKSPACE ================= */}
        <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 p-5 shadow-2xl backdrop-blur-xl">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'savings' as WealthCategory, label: 'Savings Accounts', icon: PiggyBank, count: savings.length, total: totalSavings, color: 'text-emerald-400' },
                { id: 'debts' as WealthCategory, label: 'Debts & Loans', icon: AlertCircle, count: debts.length, total: totalDebts, color: 'text-rose-400' },
                { id: 'assets' as WealthCategory, label: 'Investments & Assets', icon: TrendingUp, count: assets.length, total: totalAssets, color: 'text-cyan-400' },
                { id: 'liabilities' as WealthCategory, label: 'Other Liabilities', icon: Zap, count: liabilities.length, total: totalLiabilities, color: 'text-amber-400' },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 border whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-800 border-primary-500/50 text-slate-100 shadow-md ring-1 ring-primary-500/20'
                        : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? tab.color : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-slate-800 text-slate-400'
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
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-primary-400 border border-primary-500/30 hover:bg-primary-500/10 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
            </button>
          </div>

          {/* Search, Sort & Quick Filter Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Sort Dropdown & Quick Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 focus:border-primary-500 focus:outline-none"
              >
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
                <option value="recent">Recently Added</option>
                {activeTab === 'debts' && <option value="apr">Highest APR %</option>}
              </select>

              <button
                onClick={() => setFilterHighValue(!filterHighValue)}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-medium border transition ${
                  filterHighValue
                    ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                    : 'border-slate-700/70 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                ≥ ₹50,000
              </button>

              {activeTab === 'debts' && (
                <button
                  onClick={() => setFilterHighAprOnly(!filterHighAprOnly)}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-medium border transition ${
                    filterHighAprOnly
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                      : 'border-slate-700/70 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  High APR (≥12%)
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid / Empty States */}
          <div className="mt-5">
            {loadingData ? (
              <div className="py-16 text-center">
                <div className="animate-spin h-8 w-8 border-3 border-primary-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs text-slate-400 mt-2 font-mono">Syncing balance matrix...</p>
              </div>
            ) : activeItems.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 mx-auto mb-3 border border-slate-700">
                  {activeTab === 'savings' ? (
                    <PiggyBank className="h-6 w-6 text-slate-500" />
                  ) : activeTab === 'debts' ? (
                    <AlertCircle className="h-6 w-6 text-slate-500" />
                  ) : activeTab === 'assets' ? (
                    <TrendingUp className="h-6 w-6 text-slate-500" />
                  ) : (
                    <Zap className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  No {activeTab} matching criteria
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? 'No entries matched your search query or active filters.'
                    : `Start tracking your ${activeTab} to unlock automated analytics and payoff strategies.`}
                </p>
                <button
                  onClick={() => handleOpenAdd(activeTab)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-primary-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
