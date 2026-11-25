'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import {
  Target,
  Plus,
  Compass,
  Trophy,
  Zap,
  TrendingUp,
  Sparkles,
  Layers,
  Filter,
  Flame,
  ShieldCheck,
  Coins,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import GoalProjections from '@/components/goals/GoalProjections'
import GoalStorylineMap from '@/components/goals/GoalStorylineMap'
import GoalStoryCard from '@/components/goals/GoalStoryCard'
import GoalSimulatorModal from '@/components/goals/GoalSimulatorModal'
import ConfettiEffect from '@/components/goals/ConfettiEffect'
import PageHeader from '@/components/ui/PageHeader'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import LoadingScreen from '@/components/ui/LoadingScreen'

interface Goal {
  id: number
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  monthly_contribution: number
  status: 'active' | 'completed' | 'paused'
}

type FilterTab = 'all' | 'active' | 'completed' | 'urgent'
type ViewMode = 'storyline' | 'grid'

export default function GoalsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [goals, setGoals] = useState<Goal[]>([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [goalRefreshKey, setGoalRefreshKey] = useState(0)

  // Modals & Active selections
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')

  // Storyline & Simulator States
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)
  const [simulatorGoal, setSimulatorGoal] = useState<Goal | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('storyline')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  // Confetti trigger
  const [confettiTrigger, setConfettiTrigger] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    monthly_contribution: '',
  })

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchGoals()
  }, [user])

  /* ================= API ================= */
  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals')
      const fetched: Goal[] = res.data.goals || []
      setGoals(fetched)
      if (fetched.length > 0 && !selectedGoalId) {
        setSelectedGoalId(fetched[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingGoals(false)
    }
  }

  const triggerCelebration = () => {
    setConfettiTrigger(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, formData)
      } else {
        await api.post('/goals', formData)
        triggerCelebration()
      }

      setShowModal(false)
      setEditingGoal(null)
      setFormData({
        name: '',
        target_amount: '',
        target_date: '',
        monthly_contribution: '',
      })

      await fetchGoals()
      setGoalRefreshKey((k) => k + 1)
    } catch {
      alert('Failed to save goal')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this financial goal quest?')) return
    await api.delete(`/goals/${id}`)
    await fetchGoals()
    setGoalRefreshKey((k) => k + 1)
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contributingGoal) return

    try {
      const amount = parseFloat(contributionAmount)
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount')
        return
      }

      await api.post(`/goals/${contributingGoal.id}/contribute`, { amount })

      setShowContributeModal(false)
      setContributingGoal(null)
      setContributionAmount('')
      triggerCelebration()
      await fetchGoals()
      setGoalRefreshKey((k) => k + 1)
    } catch (err) {
      console.error(err)
      alert('Failed to contribute to goal')
    }
  }

  const handleQuickContribute = async (goal: Goal, amount: number) => {
    try {
      await api.post(`/goals/${goal.id}/contribute`, { amount })
      triggerCelebration()
      await fetchGoals()
      setGoalRefreshKey((k) => k + 1)
    } catch (err) {
      console.error(err)
      alert('Failed to add quick contribution')
    }
  }

  const openContributeModal = (goal: Goal) => {
    setContributingGoal(goal)
    setContributionAmount('')
    setShowContributeModal(true)
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
      monthly_contribution: goal.monthly_contribution?.toString() || '',
    })
    setShowModal(true)
  }

  /* ================= TELEMETRY STATS ================= */
  const telemetry = useMemo(() => {
    // Separate active (in-flight) goals and conquered (completed) goals
    const activeGoals = goals.filter((g) => (Number(g.current_amount) / Number(g.target_amount)) < 1)
    const completedGoals = goals.filter((g) => (Number(g.current_amount) / Number(g.target_amount)) >= 1)

    const activeTarget = activeGoals.reduce((acc, g) => acc + (Number(g.target_amount) || 0), 0)
    const activeSaved = activeGoals.reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0)
    const activeMonthly = activeGoals.reduce((acc, g) => acc + (Number(g.monthly_contribution) || 0), 0)
    const activeProgress = activeTarget > 0 ? (activeSaved / activeTarget) * 100 : 0

    const conqueredTarget = completedGoals.reduce((acc, g) => acc + (Number(g.target_amount) || 0), 0)
    const conqueredSaved = completedGoals.reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0)

    const totalTarget = goals.reduce((acc, g) => acc + (Number(g.target_amount) || 0), 0)
    const totalSaved = goals.reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0)

    return {
      activeTarget,
      activeSaved,
      activeMonthly,
      activeProgress,
      conqueredTarget,
      conqueredSaved,
      totalTarget,
      totalSaved,
      completedCount: completedGoals.length,
      activeCount: activeGoals.length,
    }
  }, [goals])

  /* ================= FILTERED GOALS ================= */
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const progress = (Number(g.current_amount) / Number(g.target_amount)) * 100
      const isCompleted = progress >= 100

      if (activeFilter === 'completed') return isCompleted
      if (activeFilter === 'active') return !isCompleted
      if (activeFilter === 'urgent') {
        if (!g.target_date) return false
        const diffDays = Math.ceil((new Date(g.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return diffDays <= 30 && !isCompleted
      }
      return true
    })
  }, [goals, activeFilter])

  if (loading || !user) {
    return <LoadingScreen label="Initializing Financial Odyssey..." />
  }

  return (
    <DashboardLayout>
      <PageBackground variant="aurora" />

      {/* Confetti Particle Layer */}
      <ConfettiEffect
        trigger={confettiTrigger}
        onComplete={() => setConfettiTrigger(false)}
      />

      <div className="relative z-10 space-y-6 pb-4 lg:space-y-8">
        {/* ================= HERO HEADER ================= */}
        <PageHeader
          eyebrow="Odyssey Command Center"
          eyebrowIcon={Sparkles}
          eyebrowTone="brand"
          meta={
            <span className="badge badge-neutral num">
              {telemetry.activeCount} In Flight • {telemetry.completedCount} Conquered
            </span>
          }
          title={
            <>
              Financial Goals <span className="text-gradient">Odyssey</span>
            </>
          }
          description="Turn abstract aspirations into tangible milestones through storyline progression, velocity forecasts, and discipline."
          actions={
            <button
              onClick={() => {
                setEditingGoal(null)
                setFormData({
                  name: '',
                  target_amount: '',
                  target_date: '',
                  monthly_contribution: '',
                })
                setShowModal(true)
              }}
              className="btn-primary h-11 w-full px-5 sm:w-auto"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New Goal Quest
            </button>
          }
        />

        {/* ================= TELEMETRY HERO METRICS ================= */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {/* Card 1: Active Goals Capital (or Total Conquered if none active) */}
          <div className="card card-spotlight p-4 animate-fade-up sm:p-5" style={{ animationDelay: '60ms' }}>
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 text-xs font-medium leading-snug text-slate-400">
                  {telemetry.activeCount > 0 ? 'Active Quests Capital' : 'Conquered Vault'}
                </span>
                <span className="icon-tile icon-tile-sm icon-tile-brand">
                  <Coins className="h-4 w-4" />
                </span>
              </div>
              <div className="kpi-value mt-3 break-words text-lg sm:text-2xl">
                ₹{(telemetry.activeCount > 0 ? telemetry.activeSaved : telemetry.conqueredSaved).toLocaleString('en-IN')}
              </div>
              <span className="num mt-1 text-[11px] text-slate-500">
                of ₹{(telemetry.activeCount > 0 ? telemetry.activeTarget : telemetry.conqueredTarget).toLocaleString('en-IN')} Target
              </span>
            </div>
          </div>

          {/* Card 2: Active Quests Victory Index */}
          <div className="card card-spotlight p-4 animate-fade-up sm:p-5" style={{ animationDelay: '120ms' }}>
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 text-xs font-medium leading-snug text-slate-400">
                  {telemetry.activeCount > 0 ? 'Active Quests Index' : 'All Quests Conquered'}
                </span>
                <span className="icon-tile icon-tile-sm icon-tile-violet">
                  <Trophy className="h-4 w-4" />
                </span>
              </div>
              <div
                className={`kpi-value mt-3 text-lg sm:text-2xl ${
                  telemetry.activeCount > 0 ? 'text-gradient' : 'text-gradient-emerald'
                }`}
              >
                {telemetry.activeCount > 0 ? `${telemetry.activeProgress.toFixed(1)}%` : '100%'}
              </div>
              <div className="progress-track mt-2.5 h-1.5">
                <div
                  className={
                    telemetry.activeCount > 0
                      ? 'progress-fill'
                      : 'progress-fill bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.7)]'
                  }
                  style={{ width: `${Math.min(100, telemetry.activeCount > 0 ? telemetry.activeProgress : 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Monthly Fuel (Active in-flight goals only) */}
          <div className="card card-spotlight p-4 animate-fade-up sm:p-5" style={{ animationDelay: '180ms' }}>
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 text-xs font-medium leading-snug text-slate-400">Active Monthly Fuel</span>
                <span className="icon-tile icon-tile-sm icon-tile-cyan">
                  <Zap className="h-4 w-4" />
                </span>
              </div>
              <div className="kpi-value mt-3 break-words text-lg sm:text-2xl">
                ₹{telemetry.activeMonthly.toLocaleString('en-IN')}
              </div>
              <span className="mt-1 text-[11px] text-slate-500">
                {telemetry.activeCount > 0 ? 'Committed for active quests' : 'All goals reached'}
              </span>
            </div>
          </div>

          {/* Card 4: Conquered Vault & Mastered Goals */}
          <div className="card card-spotlight p-4 animate-fade-up sm:p-5" style={{ animationDelay: '240ms' }}>
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 text-xs font-medium leading-snug text-slate-400">Conquered Treasury</span>
                <span className="icon-tile icon-tile-sm icon-tile-emerald">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="kpi-value mt-3 break-words text-lg text-emerald-300 sm:text-2xl">
                ₹{telemetry.conqueredSaved.toLocaleString('en-IN')}
              </div>
              <span className="num mt-1 text-[11px] text-emerald-300/80">
                {telemetry.completedCount} Mastered • {telemetry.activeCount} In Flight
              </span>
            </div>
          </div>
        </div>

        {/* ================= VIEW SELECTOR & FILTERS ================= */}
        {goals.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="scroll-thin -mx-1 max-w-full overflow-x-auto px-1 pb-1 sm:pb-0">
              <div className="segmented" role="group" aria-label="Filter goals">
                {[
                  { id: 'all', label: 'All Quests', count: goals.length },
                  { id: 'active', label: 'In Flight', count: telemetry.activeCount },
                  { id: 'completed', label: 'Conquered', count: telemetry.completedCount },
                  { id: 'urgent', label: 'Due Soon' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as FilterTab)}
                    aria-pressed={activeFilter === tab.id}
                    className={`segmented-item py-2 sm:py-1.5 ${
                      activeFilter === tab.id ? 'segmented-item-active' : ''
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`num rounded-full px-1.5 text-[10px] leading-4 ${
                          activeFilter === tab.id ? 'bg-white/15 text-white' : 'bg-white/[0.06] text-slate-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle (Storyline vs Grid) */}
            <div className="segmented self-start sm:self-auto" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode('storyline')}
                aria-pressed={viewMode === 'storyline'}
                className={`segmented-item py-2 sm:py-1.5 ${viewMode === 'storyline' ? 'segmented-item-active' : ''}`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Storyline Map</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`segmented-item py-2 sm:py-1.5 ${viewMode === 'grid' ? 'segmented-item-active' : ''}`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Card Grid</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {loadingGoals ? (
          <div className="card card-pad flex flex-col items-center justify-center py-14 text-center" role="status">
            <div className="relative mb-4 h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-cyan-400/70 border-t-primary-400" />
            </div>
            <p className="text-sm text-slate-400">Consulting the Financial Star Chart...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="card card-pad mx-auto max-w-xl animate-fade-up">
            <EmptyState
              icon={Compass}
              tone="brand"
              title="No Financial Quests Declared Yet"
              description="Every grand wealth empire begins with an intention. Declare your first financial goal quest—whether buying a home, planning a vacation, or building a safety fund."
              action={
                <button
                  onClick={() => {
                    setEditingGoal(null)
                    setShowModal(true)
                  }}
                  className="btn-primary btn-lg"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Start Your First Quest
                </button>
              }
            />
          </div>
        ) : (
          <>
            {/* ================= INTERACTIVE STORYLINE ODYSSEY MAP ================= */}
            {viewMode === 'storyline' && (
              <GoalStorylineMap
                goals={goals}
                selectedGoalId={selectedGoalId}
                onSelectGoal={(id) => setSelectedGoalId(id)}
                onContributeModal={openContributeModal}
                onOpenSimulator={(goal) => setSimulatorGoal(goal)}
              />
            )}

            {/* ================= GOAL CARDS SECTION ================= */}
            <section className="space-y-4 sm:space-y-5">
              <SectionHeader
                icon={Flame}
                tone="violet"
                as="h3"
                title={
                  activeFilter === 'all'
                    ? `All Financial Quests (${filteredGoals.length})`
                    : activeFilter === 'active'
                    ? `In-Flight Goals (${filteredGoals.length})`
                    : activeFilter === 'completed'
                    ? `Conquered Goals (${filteredGoals.length})`
                    : `Urgent Quests (${filteredGoals.length})`
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredGoals.map((goal) => (
                  <GoalStoryCard
                    key={goal.id}
                    goal={goal}
                    isSelected={goal.id === selectedGoalId}
                    onSelect={() => setSelectedGoalId(goal.id)}
                    onContribute={openContributeModal}
                    onQuickContribute={handleQuickContribute}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onOpenSimulator={(g) => setSimulatorGoal(g)}
                  />
                ))}
              </div>
            </section>

            {/* ================= AI PROJECTIONS MATRIX ================= */}
            <div>
              <GoalProjections refreshKey={goalRefreshKey} />
            </div>
          </>
        )}
      </div>

      {/* Modals live outside the z-10 content layer so they cover the app shell. */}

      {/* ================= CREATE / EDIT MODAL ================= */}
      {showModal && (
        <div className="modal-backdrop animate-fade-in">
          <div
            className="modal-panel max-w-lg overflow-y-auto p-5 animate-pop-in sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={editingGoal ? 'Refine Goal Quest' : 'Declare New Goal Quest'}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent"
              aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile icon-tile-brand">
                  <Target className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold tracking-tight text-white">
                    {editingGoal ? 'Refine Goal Quest' : 'Declare New Goal Quest'}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">Set your coordinates, target summit, and monthly fuel.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn-icon"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="label">
                  Goal Quest Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dream House Downpayment, Himalayan Expedition, Tesla Model 3"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">
                    Target Capital Summit (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    required
                    min="1"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    className="input num"
                  />
                </div>

                <div>
                  <label className="label">
                    Monthly Fuel Deposit (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    min="0"
                    value={formData.monthly_contribution}
                    onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value })}
                    className="input num"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Target Conquest Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="btn-primary h-11 flex-1"
                >
                  {editingGoal ? 'Save Modifications' : 'Launch Goal Quest'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary h-11"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CONTRIBUTE CUSTOM MODAL ================= */}
      {showContributeModal && contributingGoal && (
        <div className="modal-backdrop animate-fade-in">
          <div
            className="modal-panel max-w-md overflow-y-auto p-5 animate-pop-in sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Add Capital Deposit"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent"
              aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile icon-tile-brand">
                  <Coins className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold tracking-tight text-white">Add Capital Deposit</h2>
                  <p className="mt-0.5 truncate text-xs font-semibold text-primary-200">
                    {contributingGoal.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowContributeModal(false)}
                className="btn-icon"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="surface-inset my-4 flex items-center justify-between gap-3 p-3.5 text-xs">
              <span className="shrink-0 text-slate-400">Current Progress</span>
              <span className="num text-right font-semibold text-slate-100">
                ₹{contributingGoal.current_amount.toLocaleString('en-IN')} / ₹{contributingGoal.target_amount.toLocaleString('en-IN')} (
                {((contributingGoal.current_amount / contributingGoal.target_amount) * 100).toFixed(0)}%)
              </span>
            </div>

            {/* Quick preset chips */}
            <div className="mb-4 grid grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setContributionAmount(preset.toString())}
                  className="btn-secondary btn-sm num h-9 px-1.5"
                >
                  +₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="label">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Enter amount"
                  required
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="input num"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary h-11 flex-1"
                >
                  Confirm Deposit
                </button>

                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="btn-secondary h-11"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= STORYLINE SPEEDUP SIMULATOR MODAL ================= */}
      {simulatorGoal && (
        <GoalSimulatorModal
          goal={simulatorGoal}
          isOpen={!!simulatorGoal}
          onClose={() => setSimulatorGoal(null)}
          onContributeQuick={(g, amt) => handleQuickContribute(g, amt)}
        />
      )}
    </DashboardLayout>
  )
}
