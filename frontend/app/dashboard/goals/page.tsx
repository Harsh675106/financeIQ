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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-primary-500 animate-spin" />
        <p className="mt-4 text-slate-400 text-sm animate-pulse">Initializing Financial Odyssey...</p>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageBackground variant="aurora" />

      {/* Confetti Particle Layer */}
      <ConfettiEffect
        trigger={confettiTrigger}
        onComplete={() => setConfettiTrigger(false)}
      />

      <div className="relative z-10 space-y-7 pb-12">
        {/* ================= HERO HEADER ================= */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-up">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Odyssey Command Center
              </span>
              <span className="text-xs text-slate-400">
                {telemetry.activeCount} In Flight • {telemetry.completedCount} Conquered
              </span>
            </div>
            <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl flex items-center gap-3">
              Financial Goals Odyssey
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-xl">
              Turn abstract aspirations into tangible milestones through storyline progression, velocity forecasts, and discipline.
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              className="rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:brightness-110 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              New Goal Quest
            </button>
          </div>
        </div>

        {/* ================= TELEMETRY HERO METRICS ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-up [animation-delay:100ms]">
          {/* Card 1: Active Goals Capital (or Total Conquered if none active) */}
          <div className="story-glass-card rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{telemetry.activeCount > 0 ? 'Active Quests Capital' : 'Conquered Vault'}</span>
              <Coins className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-slate-50">
              ₹{(telemetry.activeCount > 0 ? telemetry.activeSaved : telemetry.conqueredSaved).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              of ₹{(telemetry.activeCount > 0 ? telemetry.activeTarget : telemetry.conqueredTarget).toLocaleString('en-IN')} Target
            </span>
          </div>

          {/* Card 2: Active Quests Victory Index */}
          <div className="story-glass-card rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{telemetry.activeCount > 0 ? 'Active Quests Index' : 'All Quests Conquered'}</span>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-yellow-300">
              {telemetry.activeCount > 0 ? `${telemetry.activeProgress.toFixed(1)}%` : '100%'}
            </div>
            <div className="mt-1.5 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-1000"
                style={{ width: `${Math.min(100, telemetry.activeCount > 0 ? telemetry.activeProgress : 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Monthly Fuel (Active in-flight goals only) */}
          <div className="story-glass-card rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Monthly Fuel</span>
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-cyan-300">
              ₹{telemetry.activeMonthly.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {telemetry.activeCount > 0 ? 'Committed for active quests' : 'All goals reached'}
            </span>
          </div>

          {/* Card 4: Conquered Vault & Mastered Goals */}
          <div className="story-glass-card rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Conquered Treasury</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-300">
              ₹{telemetry.conqueredSaved.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-400/90 font-mono">
              {telemetry.completedCount} Mastered • {telemetry.activeCount} In Flight
            </span>
          </div>
        </div>

        {/* ================= VIEW SELECTOR & FILTERS ================= */}
        {goals.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/90 p-1 rounded-2xl">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeFilter === tab.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View Mode Toggle (Storyline vs Grid) */}
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800/90 p-1 rounded-2xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('storyline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === 'storyline'
                    ? 'bg-gradient-to-r from-emerald-600/30 to-teal-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Storyline Map</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-emerald-600/30 to-teal-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Card Grid</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {loadingGoals ? (
          <div className="story-glass-card rounded-3xl p-12 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Consulting the Financial Star Chart...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="story-glass-card rounded-3xl p-12 text-center animate-fade-up max-w-xl mx-auto">
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Compass className="h-10 w-10 animate-spin [animation-duration:20s]" />
            </div>
            <h2 className="text-2xl font-black text-slate-100">No Financial Quests Declared Yet</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Every grand wealth empire begins with an intention. Declare your first financial goal quest—whether buying a home, planning a vacation, or building a safety fund.
            </p>
            <button
              onClick={() => {
                setEditingGoal(null)
                setShowModal(true)
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:brightness-110"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Start Your First Quest
            </button>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-emerald-400" />
                  {activeFilter === 'all'
                    ? `All Financial Quests (${filteredGoals.length})`
                    : activeFilter === 'active'
                    ? `In-Flight Goals (${filteredGoals.length})`
                    : activeFilter === 'completed'
                    ? `Conquered Goals (${filteredGoals.length})`
                    : `Urgent Quests (${filteredGoals.length})`}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
            </div>

            {/* ================= AI PROJECTIONS MATRIX ================= */}
            <div className="mt-8">
              <GoalProjections refreshKey={goalRefreshKey} />
            </div>
          </>
        )}

        {/* ================= CREATE / EDIT MODAL ================= */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="story-glass-card w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/30 animate-pop-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">
                      {editingGoal ? 'Refine Goal Quest' : 'Declare New Goal Quest'}
                    </h2>
                    <p className="text-xs text-slate-400">Set your coordinates, target summit, and monthly fuel.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Goal Quest Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dream House Downpayment, Himalayan Expedition, Tesla Model 3"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target Capital Summit (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      required
                      min="1"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Monthly Fuel Deposit (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      min="0"
                      value={formData.monthly_contribution}
                      onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value })}
                      className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Conquest Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:brightness-110"
                  >
                    {editingGoal ? 'Save Modifications' : 'Launch Goal Quest'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-400 hover:text-slate-200"
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="story-glass-card w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/30 animate-pop-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Add Capital Deposit</h2>
                    <p className="text-xs text-slate-400 font-semibold text-emerald-300">
                      {contributingGoal.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContributeModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="my-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Progress</span>
                <span className="font-mono font-bold text-slate-200">
                  ₹{contributingGoal.current_amount.toLocaleString('en-IN')} / ₹{contributingGoal.target_amount.toLocaleString('en-IN')} (
                  {((contributingGoal.current_amount / contributingGoal.target_amount) * 100).toFixed(0)}%)
                </span>
              </div>

              {/* Quick preset chips */}
              <div className="flex gap-2 mb-4">
                {[500, 1000, 2500, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setContributionAmount(preset.toString())}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 py-1.5 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-200 transition-all"
                  >
                    +₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <form onSubmit={handleContribute} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    autoFocus
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:brightness-110"
                  >
                    Confirm Deposit
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowContributeModal(false)}
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-400 hover:text-slate-200"
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
      </div>
    </DashboardLayout>
  )
}
