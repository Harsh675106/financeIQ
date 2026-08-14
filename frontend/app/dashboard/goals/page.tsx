'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import { Target, Plus, Edit, Trash2, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import GoalProjections from '@/components/goals/GoalProjections'

interface Goal {
  id: number
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  monthly_contribution: number
  status: 'active' | 'completed' | 'paused'
}

export default function GoalsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [goals, setGoals] = useState<Goal[]>([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [goalRefreshKey, setGoalRefreshKey] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')

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
      setGoals(res.data.goals || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingGoals(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, formData)
      } else {
        await api.post('/goals', formData)
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
      setGoalRefreshKey(key => key + 1)
    } catch {
      alert('Failed to save goal')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this goal?')) return
    await api.delete(`/goals/${id}`)
    await fetchGoals()
    setGoalRefreshKey(key => key + 1)
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

      await api.post(`/goals/${contributingGoal.id}/contribute`, {
        amount,
      })

      setShowContributeModal(false)
      setContributingGoal(null)
      setContributionAmount('')
      await fetchGoals()
      setGoalRefreshKey(key => key + 1)
    } catch (err) {
      console.error(err)
      alert('Failed to contribute to goal')
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
      target_date: goal.target_date
        ? goal.target_date.split('T')[0]
        : '',
      monthly_contribution:
        goal.monthly_contribution?.toString() || '',
    })
    setShowModal(true)
  }

  /* ================= HELPERS ================= */
  const calculateProgress = (goal: Goal) =>
    Math.min(100, (goal.current_amount / goal.target_amount) * 100)

  const getDaysRemaining = (date: string | null) => {
    if (!date) return null
    const diff =
      new Date(date).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-primary-600 rounded-full" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageBackground variant="upward" />
      <div className="relative z-10 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">
              Financial Goals
            </h1>
            <p className="text-slate-400">
              Track and achieve your financial objectives
            </p>
          </div>

          <button
            onClick={() => {
              setEditingGoal(null)
              setShowModal(true)
            }}
            className="btn-primary"
          >
            <Plus className="h-5 w-5" />
            New Goal
          </button>
        </div>

        {/* EMPTY */}
        {loadingGoals ? (
          <p className="text-center text-slate-400">
            Loading goals...
          </p>
        ) : goals.length === 0 ? (
          <div className="card card-pad text-center">
            <Target className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-50">
              No Goals Yet
            </h2>
          </div>
        ) : (
          <>
          <GoalProjections refreshKey={goalRefreshKey} />
          <div className="grid md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const progress = calculateProgress(goal)
              const daysRemaining = getDaysRemaining(
                goal.target_date
              )
              const isOverdue = daysRemaining !== null && daysRemaining < 0
              const isCompleted = progress >= 100

              return (
                <div
                  key={goal.id}
                  className={`card card-pad card-hover border-l-4 ${
                    isCompleted
                      ? 'border-l-emerald-500'
                      : isOverdue
                        ? 'border-l-rose-500'
                        : 'border-l-primary-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-slate-50">
                        {goal.name}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">
                        ₹{goal.current_amount.toLocaleString('en-IN')} / ₹{goal.target_amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isOverdue
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-primary-500/20 text-primary-300'
                    }`}>
                      {progress.toFixed(0)}%
                    </div>
                  </div>

                  {/* PROGRESS */}
                  <div className="mb-4">
                    <div className="w-full bg-slate-800/70 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          isCompleted
                            ? 'bg-emerald-400'
                            : isOverdue
                              ? 'bg-rose-400'
                              : 'bg-primary-400'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* INFO GRID */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    {goal.monthly_contribution > 0 && (
                      <div className="bg-slate-900/40 rounded p-2 border border-slate-800/50">
                        <div className="text-slate-400">Monthly Contribution</div>
                        <div className="font-semibold text-slate-200 mt-1">
                          ₹{goal.monthly_contribution.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}

                    {daysRemaining !== null && (
                      <div className={`rounded p-2 border ${
                        isOverdue
                          ? 'bg-rose-900/30 border-rose-800/50'
                          : 'bg-slate-900/40 border-slate-800/50'
                      }`}>
                        <div className={isOverdue ? 'text-rose-300' : 'text-slate-400'}>
                          Time Remaining
                        </div>
                        <div className={`font-semibold mt-1 ${isOverdue ? 'text-rose-200' : 'text-slate-200'}`}>
                          {daysRemaining < 0
                            ? `${Math.abs(daysRemaining)}d Overdue`
                            : daysRemaining === 0
                              ? 'Due Today'
                              : `${daysRemaining}d Left`}
                        </div>
                      </div>
                    )}

                    {!goal.target_date && (
                      <div className="bg-slate-900/40 rounded p-2 border border-slate-800/50 col-span-2">
                        <div className="text-slate-400 text-xs">No target date set</div>
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/70">
                    <button
                      onClick={() => openContributeModal(goal)}
                      className="flex items-center gap-1 text-success-300 hover:text-success-200 text-sm"
                    >
                      <Plus size={16} />
                      Contribute
                    </button>

                    <button
                      onClick={() => handleEdit(goal)}
                      className="flex items-center gap-1 text-primary-200 hover:text-primary-100 text-sm"
                    >
                      <Edit size={16} />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(goal.id)
                      }
                      className="flex items-center gap-1 text-danger-300 hover:text-danger-200 text-sm"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}

        {/* ================= MODAL ================= */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card card-pad w-full max-w-md shadow-lg form-shell">
              <h2 className="text-xl font-bold mb-4">
                {editingGoal
                  ? 'Edit Goal'
                  : 'Create Goal'}
              </h2>

              <form
                onSubmit={handleSubmit}
                className="space-y-4 form-shell"
              >
                {/* INPUT STYLE FIXED */}
                <input
                  type="text"
                  placeholder="Goal Name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="input"
                />

                <input
                  type="number"
                  placeholder="Target Amount"
                  required
                  value={formData.target_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_amount: e.target.value,
                    })
                  }
                  className="input"
                />

                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_date: e.target.value,
                    })
                  }
                  className="input"
                />

                <input
                  type="number"
                  placeholder="Monthly Contribution"
                  value={formData.monthly_contribution}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_contribution:
                        e.target.value,
                    })
                  }
                  className="input"
                />

                <div className="flex gap-3">
                  <button className="btn-primary flex-1">
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= CONTRIBUTE MODAL ================= */}
        {showContributeModal && contributingGoal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card card-pad w-full max-w-md shadow-lg form-shell">
              <h2 className="text-xl font-bold mb-2">
                Contribute to {contributingGoal.name}
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Current: ₹{contributingGoal.current_amount.toLocaleString('en-IN')} / ₹{contributingGoal.target_amount.toLocaleString('en-IN')}
              </p>

              <form
                onSubmit={handleContribute}
                className="space-y-4 form-shell"
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Contribution Amount"
                  required
                  value={contributionAmount}
                  onChange={(e) =>
                    setContributionAmount(e.target.value)
                  }
                  className="input"
                />

                <div className="flex gap-3">
                  <button className="btn-primary flex-1">
                    Add Funds
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowContributeModal(false)
                      setContributingGoal(null)
                      setContributionAmount('')
                    }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
