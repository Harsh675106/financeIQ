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
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FolderOpen,
  ArrowRight
} from 'lucide-react'
import { api } from '@/lib/api'
import DebtOptimizerCard from '@/components/wealth/DebtOptimizerCard'
import SavingsGrowthSimulator from '@/components/wealth/SavingsGrowthSimulator'
import WealthHealthMeter from '@/components/wealth/WealthHealthMeter'
import WealthItemCard, { WealthItem, WealthCategory } from '@/components/wealth/WealthItemCard'
import WealthModal from '@/components/wealth/WealthModal'
import QuickAdjustModal from '@/components/wealth/QuickAdjustModal'
import ConfettiEffect from '@/components/goals/ConfettiEffect'

const TAB_ORDER: WealthCategory[] = ['savings', 'debts', 'assets', 'liabilities']

export default function WealthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [savings, setSavings] = useState<WealthItem[]>([])
  const [debts, setDebts] = useState<WealthItem[]>([])
  const [assets, setAssets] = useState<WealthItem[]>([])
  const [liabilities, setLiabilities] = useState<WealthItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Active Category & 3D Page Turn Animation
  const [activeTab, setActiveTab] = useState<WealthCategory>('savings')
  const [pageTurnDirection, setPageTurnDirection] = useState<'next' | 'prev'>('next')
  const [pageAnimKey, setPageAnimKey] = useState(0)

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

  /* ================= TAB PAGE FLIP HANDLERS ================= */
  const handleTabChange = (newTab: WealthCategory) => {
    if (newTab === activeTab) return
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    const newIndex = TAB_ORDER.indexOf(newTab)
    setPageTurnDirection(newIndex > currentIndex ? 'next' : 'prev')
    setActiveTab(newTab)
    setPageAnimKey((k) => k + 1)
  }

  const handleNextPage = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    if (currentIndex < TAB_ORDER.length - 1) {
      handleTabChange(TAB_ORDER[currentIndex + 1])
    }
  }

  const handlePrevPage = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    if (currentIndex > 0) {
      handleTabChange(TAB_ORDER[currentIndex - 1])
    }
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

  const currentTabIdx = TAB_ORDER.indexOf(activeTab)

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">OPENING WEALTH DOSSIER...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageBackground variant="flow" />
      <ConfettiEffect trigger={confettiTrigger} onComplete={() => setConfettiTrigger(false)} />

      <div className="relative z-10 max-w-7xl mx-auto space-y-7 pb-16 px-1 sm:px-2 md:px-4 anim-book-expand">
        {/* ================= HERO HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-cyan-500/25 border border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <BookOpen className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-50 flex items-center gap-2.5">
                  Savings, Debts & Wealth
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 shadow-inner">
                    <Sparkles className="h-3.5 w-3.5" /> 3D Balance Ledger
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Master your cash buffer, eliminate high-interest liabilities, and accelerate wealth compounding
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAdd(activeTab)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-primary-500 to-teal-400 px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Add Balance Entry</span>
            </button>
          </div>
        </div>

        {/* ================= SUMMARY STAT CARDS GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Liquid Savings */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl stage-card-lift">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liquid Savings</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 shadow-inner group-hover:scale-110 transition">
                <PiggyBank className="h-4.5 w-4.5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
              ₹{Math.round(totalSavings).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
              <span className="font-medium">{savings.length} Active Accounts</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Emergency Shield
              </span>
            </div>
          </div>

          {/* Total Outstanding Debts */}
          <div className="group relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl stage-card-lift">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Debts</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 shadow-inner group-hover:scale-110 transition">
                <AlertCircle className="h-4.5 w-4.5 text-rose-400" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-400">
              ₹{Math.round(totalDebts).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
              <span className="font-medium">{debts.length} Active Debts</span>
              <span className="text-rose-400 font-bold">Avg {averageDebtApr}% APR</span>
            </div>
          </div>

          {/* Total Invested Assets */}
          <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl stage-card-lift">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invested Assets</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 shadow-inner group-hover:scale-110 transition">
                <TrendingUp className="h-4.5 w-4.5 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-300">
              ₹{Math.round(totalAssets).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
              <span className="font-medium">{assets.length} Holdings</span>
              <span className="text-cyan-400 font-bold">Growth Multiplier</span>
            </div>
          </div>

          {/* Net Solvency Balance */}
          <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl stage-card-lift">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Solvency</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 shadow-inner group-hover:scale-110 transition">
                <Coins className="h-4.5 w-4.5 text-indigo-400" />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${netWorth >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
              ₹{Math.round(netWorth).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
              <span>Liabilities: ₹{Math.round(totalLiabilities).toLocaleString('en-IN')}</span>
              <span className={`font-bold uppercase ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netWorth >= 0 ? 'Surplus Positive' : 'Deficit'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= STAGE 1: WEALTH HEALTH ACCORDION DRAWER ================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setIsHealthStageExpanded(!isHealthStageExpanded)}
              className="flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-white transition group"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition">
                {isHealthStageExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
              <span>Financial Health & Solvency Matrix</span>
              <span className="text-xs font-normal text-slate-400">
                ({isHealthStageExpanded ? 'Click to collapse stage' : 'Click to expand stage'})
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
              <span>Interactive Intelligence & Payoff Engines</span>
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

        {/* ================= 3D WEALTH DOSSIER & LEDGER BOOK ================= */}
        <div className="ledger-perspective">
          <div className="ledger-book-shell p-6 md:p-8">
            {/* Left Metallic Spine Accent */}
            <div className="ledger-spine" />

            {/* Dossier Header & Bookmark Ribbon Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-800 pb-5 pl-2">
              {/* Tab Navigation with Physical Bookmark Ribbons */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0">
                {[
                  { id: 'savings' as WealthCategory, label: 'Savings Accounts', pageNum: 'P.1', icon: PiggyBank, count: savings.length, color: 'text-emerald-400', activeClass: 'text-emerald-300 border-emerald-500/50 bg-slate-800/90 ring-1 ring-emerald-500/30' },
                  { id: 'debts' as WealthCategory, label: 'Debts & Loans', pageNum: 'P.2', icon: AlertCircle, count: debts.length, color: 'text-rose-400', activeClass: 'text-rose-300 border-rose-500/50 bg-slate-800/90 ring-1 ring-rose-500/30' },
                  { id: 'assets' as WealthCategory, label: 'Investments & Assets', pageNum: 'P.3', icon: TrendingUp, count: assets.length, color: 'text-cyan-400', activeClass: 'text-cyan-300 border-cyan-500/50 bg-slate-800/90 ring-1 ring-cyan-500/30' },
                  { id: 'liabilities' as WealthCategory, label: 'Other Liabilities', pageNum: 'P.4', icon: Zap, count: liabilities.length, color: 'text-amber-400', activeClass: 'text-amber-300 border-amber-500/50 bg-slate-800/90 ring-1 ring-amber-500/30' },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`bookmark-tab group flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-300 border whitespace-nowrap shadow-sm ${
                        isActive
                          ? `${tab.activeClass} active-bookmark shadow-lg`
                          : 'border-slate-800/80 text-slate-400 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-400">{tab.pageNum}</span>
                      <Icon className={`h-4 w-4 ${isActive ? tab.color : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                          isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Page Turn Chevrons & Quick Add */}
              <div className="flex items-center gap-2 self-end lg:self-auto">
                <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentTabIdx === 0}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Previous Ledger Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-mono text-xs px-2 text-slate-300 font-bold">
                    {currentTabIdx + 1} / {TAB_ORDER.length}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentTabIdx === TAB_ORDER.length - 1}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Next Ledger Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenAdd(activeTab)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-primary-400 border border-primary-500/30 hover:bg-primary-500/10 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New {activeTab.slice(0, -1)}</span>
                </button>
              </div>
            </div>

            {/* Ledger Controls: Search, Sort, Filter */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/90 pl-3">
              {/* Search input */}
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

            {/* Dynamic Animated Page Content (Flipping Page Shift) */}
            <div
              key={pageAnimKey}
              className={`mt-6 ${pageTurnDirection === 'next' ? 'anim-page-shift-next' : 'anim-page-shift-prev'}`}
            >
              {loadingData ? (
                <div className="py-20 text-center">
                  <div className="animate-spin h-9 w-9 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                  <p className="text-xs text-slate-400 mt-3 font-mono">Syncing balance matrix...</p>
                </div>
              ) : activeItems.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-800/90 rounded-3xl bg-slate-900/40 p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 mx-auto mb-4 border border-slate-700/80 shadow-lg">
                    {activeTab === 'savings' ? (
                      <PiggyBank className="h-7 w-7 text-emerald-400" />
                    ) : activeTab === 'debts' ? (
                      <AlertCircle className="h-7 w-7 text-rose-400" />
                    ) : activeTab === 'assets' ? (
                      <TrendingUp className="h-7 w-7 text-cyan-400" />
                    ) : (
                      <Zap className="h-7 w-7 text-amber-400" />
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-200">
                    No {activeTab} in this ledger chapter
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                    {searchQuery
                      ? 'No entries match your search query or filters. Clear the search to view all items.'
                      : `Start tracking your ${activeTab} entries to unlock automated compounding forecasts and payback roadmaps.`}
                  </p>
                  <button
                    onClick={() => handleOpenAdd(activeTab)}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-primary-500/20 transition hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Add First {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                  </button>
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

            {/* Dossier Bottom Page Footer Navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-800/90 pt-4 text-xs text-slate-400 pl-2">
              <span className="font-mono">
                Chapter {currentTabIdx + 1}: <strong className="text-slate-200 capitalize">{activeTab}</strong> ({activeItems.length} item{activeItems.length === 1 ? '' : 's'})
              </span>

              <div className="flex items-center gap-3">
                {currentTabIdx > 0 && (
                  <button
                    onClick={handlePrevPage}
                    className="flex items-center gap-1 text-slate-400 hover:text-primary-400 font-semibold transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev: {TAB_ORDER[currentTabIdx - 1]}</span>
                  </button>
                )}
                {currentTabIdx < TAB_ORDER.length - 1 && (
                  <button
                    onClick={handleNextPage}
                    className="flex items-center gap-1 text-slate-400 hover:text-primary-400 font-semibold transition"
                  >
                    <span>Next: {TAB_ORDER[currentTabIdx + 1]}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
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
