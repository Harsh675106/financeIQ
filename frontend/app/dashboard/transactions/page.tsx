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
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import LoadingScreen from '@/components/ui/LoadingScreen'

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
    return <LoadingScreen label="Syncing live transactions..." />
  }

  return (
    <DashboardLayout>
      <PageBackground variant="flow" />
      <ConfettiEffect trigger={confettiTrigger} onComplete={() => setConfettiTrigger(false)} />

      <div className="relative z-10 space-y-6 lg:space-y-8">
        {/* ================= HEADER ================= */}
        <PageHeader
          eyebrow="Cash Flow Ledger"
          eyebrowIcon={Wallet}
          eyebrowTone="brand"
          meta={
            <span className="badge badge-success">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live Feed
            </span>
          }
          title={
            <>
              Transactions & <span className="text-gradient">Cash Flow</span>
            </>
          }
          description="Track dynamic cash velocity, categorized debits, and income events in real-time"
          actions={
            <button onClick={handleOpenAdd} className="btn-primary h-11 w-full px-5 sm:w-auto">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>Record Transaction</span>
            </button>
          }
        />

        {/* ================= STATS VELOCITY STRIP ================= */}
        <TransactionStatsStrip
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          transactionCount={transactions.length}
          incomeCount={incomeCount}
          expenseCount={expenseCount}
        />

        {/* ================= STAGE ACCORDIONS (SPENDING ANALYTICS, INTELLIGENCE, BUDGETS) ================= */}
        <div className="space-y-3 sm:space-y-4">
          {/* Stage 1: Spending Analytics Studio */}
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => setShowAnalyticsStage(!showAnalyticsStage)}
              aria-expanded={showAnalyticsStage}
              className="group card card-hover flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 sm:px-4"
            >
              <span className="icon-tile icon-tile-sm icon-tile-sky">
                <BarChart3 className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900 transition-colors group-hover:text-primary-700">
                  Spending Analytics & Outflow Velocity Studio
                </span>
                <span className="block text-xs font-normal text-slate-500">
                  ({showAnalyticsStage ? 'Click to collapse' : 'Click to expand'})
                </span>
              </span>
              <span className="btn-icon h-8 w-8 rounded-lg">
                {showAnalyticsStage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>

            {showAnalyticsStage && (
              <div className="anim-stage-drawer">
                <SpendingAnalytics refreshKey={refreshKey} />
              </div>
            )}
          </div>

          {/* Stage 2: Neural Intelligence & Anomaly Radar */}
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => setShowIntelligenceStage(!showIntelligenceStage)}
              aria-expanded={showIntelligenceStage}
              className="group card card-hover flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 sm:px-4"
            >
              <span className="icon-tile icon-tile-sm icon-tile-violet">
                <BrainCircuit className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900 transition-colors group-hover:text-primary-700">
                  Neural Transaction Intelligence & Anomaly Radar
                </span>
                <span className="block text-xs font-normal text-slate-500">
                  ({showIntelligenceStage ? 'Click to collapse' : 'Click to expand'})
                </span>
              </span>
              <span className="btn-icon h-8 w-8 rounded-lg">
                {showIntelligenceStage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>

            {showIntelligenceStage && (
              <div className="anim-stage-drawer">
                <TransactionIntelligencePanel />
              </div>
            )}
          </div>

          {/* Stage 3: Monthly Budget Guardrails */}
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => setShowBudgetsStage(!showBudgetsStage)}
              aria-expanded={showBudgetsStage}
              className="group card card-hover flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 sm:px-4"
            >
              <span className="icon-tile icon-tile-sm">
                <Layers className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900 transition-colors group-hover:text-primary-700">
                  Monthly Budget Guardrails & Thresholds
                </span>
                <span className="block text-xs font-normal text-slate-500">
                  ({showBudgetsStage ? 'Click to collapse' : 'Click to expand'})
                </span>
              </span>
              <span className="btn-icon h-8 w-8 rounded-lg">
                {showBudgetsStage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
        <section className="card card-pad relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary-100/60 to-ice-100/60 blur-3xl"
          />

          {/* Workspace Top Controls Header */}
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile">
                <Coins className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="card-title">Live Transaction Stream</h3>
                  <span className="badge badge-neutral num">
                    {filteredTransactions.length} Recorded
                  </span>
                </div>
                <p className="card-subtitle">
                  Real-time chronological timeline with automated classification
                </p>
              </div>
            </div>

            {/* Quick Filter Buttons & View Mode Toggle */}
            <div className="flex min-w-0 items-center gap-2">
              {/* Type Pills */}
              <div className="scroll-thin -mx-1 min-w-0 flex-1 overflow-x-auto px-1 py-0.5 lg:flex-none">
                <div className="segmented" role="group" aria-label="Filter transactions by type">
                  {(['all', 'income', 'expense', 'large'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      aria-pressed={activeFilter === filter}
                      className={`segmented-item py-2 capitalize sm:py-1.5 ${
                        activeFilter === filter ? 'segmented-item-active' : ''
                      }`}
                    >
                      {filter === 'large' ? 'Large (≥10k)' : filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="segmented shrink-0" role="group" aria-label="View mode">
                <button
                  onClick={() => setViewMode('stream')}
                  aria-pressed={viewMode === 'stream'}
                  aria-label="Card Stream View"
                  className={`segmented-item px-2.5 py-2 sm:py-1.5 ${
                    viewMode === 'stream' ? 'segmented-item-active' : ''
                  }`}
                  title="Card Stream View"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  aria-pressed={viewMode === 'table'}
                  aria-label="Compact Table View"
                  className={`segmented-item px-2.5 py-2 sm:py-1.5 ${
                    viewMode === 'table' ? 'segmented-item-active' : ''
                  }`}
                  title="Compact Table View"
                >
                  <TableIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search & Sort Bar */}
          <div className="relative mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by description or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search transactions"
                className="input pl-10"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 sm:w-52 sm:shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort transactions"
                className="input"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>

          <div className="divider relative mt-5" />

          {/* Transactions Content Stream */}
          <div className="relative mt-5">
            {loadingTransactions ? (
              <div className="space-y-2.5" role="status" aria-live="polite">
                <div className="skeleton h-[72px]" />
                <div className="skeleton h-[72px]" />
                <div className="skeleton h-[72px]" />
                <div className="skeleton h-[72px]" />
                <p className="pt-2 text-center text-xs text-slate-500">Syncing financial stream...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line-strong bg-canvas/60 px-4 sm:px-6">
                <EmptyState
                  icon={Wallet}
                  tone="slate"
                  title="No transactions found"
                  description={
                    searchQuery
                      ? `No entries match "${searchQuery}". Clear your search query to see all events.`
                      : 'Start logging your daily income and expense events to unlock real-time financial velocity tracking.'
                  }
                  action={
                    <button onClick={handleOpenAdd} className="btn-primary">
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      Record First Transaction
                    </button>
                  }
                />
              </div>
            ) : viewMode === 'stream' ? (
              /* Dual View 1: Energetic Cards Stream */
              <div className="space-y-2.5">
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
              <div className="scroll-thin overflow-x-auto rounded-xl border border-line bg-white">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th className="!text-right">Amount</th>
                      <th className="!text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <tr key={t.id}>
                        <td className="num whitespace-nowrap !text-slate-500">
                          {new Date(t.date).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <span
                            className={`badge capitalize ${
                              t.type === 'income' ? 'badge-success' : 'badge-danger'
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap font-medium !text-ink-900">{t.category || 'General'}</td>
                        <td className="!text-slate-600">
                          <span className="block min-w-[8rem] max-w-[18rem] truncate">{t.description || '-'}</span>
                        </td>
                        <td
                          className={`num whitespace-nowrap text-right font-display font-semibold ${
                            t.type === 'income' ? '!text-emerald-700' : '!text-rose-600'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(t)}
                              className="btn-ghost btn-sm hover:!bg-primary-50 hover:!text-primary-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="btn-ghost btn-sm hover:!bg-rose-50 hover:!text-rose-700"
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
        </section>
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
