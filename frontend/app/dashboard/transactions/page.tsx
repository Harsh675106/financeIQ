'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import {
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  BarChart3,
  BrainCircuit,
  Layers,
  Wallet,
  Coins,
  RefreshCw,
  LayoutList,
  Table as TableIcon
} from 'lucide-react'
import { api } from '@/lib/api'
import SpendingAnalytics from '@/components/transactions/SpendingAnalytics'
import TransactionIntelligencePanel from '@/components/transactions/TransactionIntelligencePanel'
import BudgetsPanel from '@/components/transactions/BudgetsPanel'
import TransactionStatsStrip from '@/components/transactions/TransactionStatsStrip'
import TransactionItemCard, { TransactionItem } from '@/components/transactions/TransactionItemCard'
import TransactionModal from '@/components/transactions/TransactionModal'
import ConfettiEffect from '@/components/goals/ConfettiEffect'

type FilterType = 'all' | 'income' | 'expense' | 'large'

export default function TransactionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Stage Accordion Expand States
  const [showAnalyticsStage, setShowAnalyticsStage] = useState(true)
  const [showIntelligenceStage, setShowIntelligenceStage] = useState(false)
  const [showBudgetsStage, setShowBudgetsStage] = useState(false)

  // View Mode: Cards Stream vs Table
  const [viewMode, setViewMode] = useState<'stream' | 'table'>('stream')

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null)

  // Celebration Confetti
  const [confettiTrigger, setConfettiTrigger] = useState(false)

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchTransactions()
  }, [user, refreshKey])

  /* ---------------- FETCH ---------------- */
  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const response = await api.get('/transactions?limit=100')
      setTransactions(response.data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch transactions', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await api.delete(`/transactions/${id}`)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      console.error(error)
      alert('Failed to delete transaction')
    }
  }

  /* ---------------- EDIT ---------------- */
  const handleEdit = (transaction: TransactionItem) => {
    setEditingTransaction(transaction)
    setShowModal(true)
  }

  const handleOpenAdd = () => {
    setEditingTransaction(null)
    setShowModal(true)
  }

  const handleModalSuccess = () => {
    setRefreshKey((k) => k + 1)
    setConfettiTrigger(true)
  }

  /* ---------------- CALCULATIONS ---------------- */
  const incomeTotal = useMemo(
    () => transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  )

  const expenseTotal = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  )

  const incomeCount = useMemo(() => transactions.filter((t) => t.type === 'income').length, [transactions])
  const expenseCount = useMemo(() => transactions.filter((t) => t.type === 'expense').length, [transactions])

  /* ---------------- FILTERED & SORTED LIST ---------------- */
  const filteredTransactions = useMemo(() => {
    let list = [...transactions]

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (t) =>
          (t.description || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
      )
    }

    // Type filter
    if (activeFilter === 'income') {
      list = list.filter((t) => t.type === 'income')
    } else if (activeFilter === 'expense') {
      list = list.filter((t) => t.type === 'expense')
    } else if (activeFilter === 'large') {
      list = list.filter((t) => Number(t.amount) >= 10000)
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === 'highest') return Number(b.amount) - Number(a.amount)
      return Number(a.amount) - Number(b.amount)
    })

    return list
  }, [transactions, searchQuery, activeFilter, sortBy])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">SYNCING LIVE TRANSACTIONS...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageBackground variant="particles" />
      <ConfettiEffect trigger={confettiTrigger} onComplete={() => setConfettiTrigger(false)} />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 pb-16 px-2 sm:px-4 md:px-6">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/25 via-emerald-500/15 to-teal-500/25 border border-primary-500/40 shadow-xl shadow-primary-500/10">
                <Wallet className="h-6 w-6 text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2.5">
                  Transactions & Cash Flow
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> Live Feed
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Track dynamic cash velocity, categorized debits, and income events in real-time
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 via-emerald-400 to-teal-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-primary-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Record Transaction</span>
            </button>
          </div>
        </div>

        {/* ================= STATS VELOCITY STRIP ================= */}
        <TransactionStatsStrip
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          transactionCount={transactions.length}
          incomeCount={incomeCount}
          expenseCount={expenseCount}
        />

        {/* ================= STAGE ACCORDIONS (SPENDING ANALYTICS, INTELLIGENCE, BUDGETS) ================= */}
        <div className="space-y-4">
          {/* Stage 1: Spending Analytics Studio */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAnalyticsStage(!showAnalyticsStage)}
              className="flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-white transition group px-1"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition">
                {showAnalyticsStage ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
              <span>Spending Analytics & Outflow Velocity Studio</span>
              <span className="text-xs font-normal text-slate-400">
                ({showAnalyticsStage ? 'Click to collapse' : 'Click to expand'})
              </span>
            </button>

            {showAnalyticsStage && (
              <div className="anim-stage-drawer">
                <SpendingAnalytics refreshKey={refreshKey} />
              </div>
            )}
          </div>

          {/* Stage 2: Neural Intelligence & Anomaly Radar */}
          <div className="space-y-3">
            <button
              onClick={() => setShowIntelligenceStage(!showIntelligenceStage)}
              className="flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-white transition group px-1"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-400 group-hover:scale-110 transition">
                {showIntelligenceStage ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
              <span>Neural Transaction Intelligence & Anomaly Radar</span>
              <span className="text-xs font-normal text-slate-400">
                ({showIntelligenceStage ? 'Click to collapse' : 'Click to expand'})
              </span>
            </button>

            {showIntelligenceStage && (
              <div className="anim-stage-drawer">
                <TransactionIntelligencePanel />
              </div>
            )}
          </div>

          {/* Stage 3: Monthly Budget Guardrails */}
          <div className="space-y-3">
            <button
              onClick={() => setShowBudgetsStage(!showBudgetsStage)}
              className="flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-white transition group px-1"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition">
                {showBudgetsStage ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
              <span>Monthly Budget Guardrails & Thresholds</span>
              <span className="text-xs font-normal text-slate-400">
                ({showBudgetsStage ? 'Click to collapse' : 'Click to expand'})
              </span>
            </button>

            {showBudgetsStage && (
              <div className="anim-stage-drawer">
                <BudgetsPanel refreshKey={refreshKey} />
              </div>
            )}
          </div>
        </div>

        {/* ================= MAIN LIVE TRANSACTIONS STREAM WORKSPACE ================= */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />

          {/* Workspace Top Controls Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/90 pb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-50 flex items-center gap-2">
                Live Transaction Stream
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-300 border border-slate-700">
                  {filteredTransactions.length} Recorded
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time chronological timeline with automated classification
              </p>
            </div>

            {/* Quick Filter Buttons & View Mode Toggle */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Type Pills */}
              <div className="flex items-center gap-1 rounded-2xl bg-slate-800/80 p-1 border border-slate-700/60">
                {(['all', 'income', 'expense', 'large'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all duration-300 ${
                      activeFilter === filter
                        ? 'bg-primary-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter === 'large' ? 'Large (≥10k)' : filter}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 rounded-2xl bg-slate-800/80 p-1 border border-slate-700/60">
                <button
                  onClick={() => setViewMode('stream')}
                  className={`rounded-xl p-1.5 transition ${
                    viewMode === 'stream'
                      ? 'bg-primary-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card Stream View"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`rounded-xl p-1.5 transition ${
                    viewMode === 'table'
                      ? 'bg-primary-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Compact Table View"
                >
                  <TableIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search & Sort Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/90">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by description or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none shadow-inner"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-200 focus:border-primary-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Transactions Content Stream */}
          <div className="mt-6">
            {loadingTransactions ? (
              <div className="py-20 text-center">
                <div className="animate-spin h-9 w-9 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs text-slate-400 mt-3 font-mono">Syncing financial stream...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-14 px-6 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 mx-auto mb-3 border border-slate-700 shadow-lg">
                  <Wallet className="h-7 w-7 text-slate-400" />
                </div>
                <h4 className="text-base font-bold text-slate-200">No transactions found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  {searchQuery
                    ? `No entries match "${searchQuery}". Clear your search query to see all events.`
                    : 'Start logging your daily income and expense events to unlock real-time financial velocity tracking.'}
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-primary-500/20 transition hover:scale-105 active:scale-95"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  Record First Transaction
                </button>
              </div>
            ) : viewMode === 'stream' ? (
              /* Dual View 1: Energetic Cards Stream */
              <div className="space-y-3">
                {filteredTransactions.map((transaction, index) => (
                  <TransactionItemCard
                    key={transaction.id}
                    transaction={transaction}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              /* Dual View 2: Compact High-Tech Table */
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Type</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Description</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-5 py-3.5 text-slate-300 font-mono">
                          {new Date(t.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              t.type === 'income'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-200">{t.category || 'General'}</td>
                        <td className="px-5 py-3.5 text-slate-300">{t.description || '-'}</td>
                        <td
                          className={`px-5 py-3.5 text-right font-mono font-bold text-sm ${
                            t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(t)}
                              className="p-1 text-slate-400 hover:text-primary-300 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= TRANSACTION MODAL ================= */}
      <TransactionModal
        isOpen={showModal}
        editingTransaction={editingTransaction}
        onClose={() => {
          setShowModal(false)
          setEditingTransaction(null)
        }}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}
