'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import { Plus, Edit, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { api } from '@/lib/api'
import SpendingAnalytics from '@/components/transactions/SpendingAnalytics'
import RecurringBadgeList from '@/components/transactions/RecurringBadgeList'
import BudgetsPanel from '@/components/transactions/BudgetsPanel'
import TransactionIntelligencePanel from '@/components/transactions/TransactionIntelligencePanel'
import BudgetAutopilotCard from '@/components/transactions/BudgetAutopilotCard'

interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

/* ✅ Reusable Tailwind input style */
const inputStyle =
  "input"

export default function TransactionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchTransactions()
  }, [user])

  /* ---------------- FETCH ---------------- */
  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions?limit=100')
      setTransactions(response.data.transactions || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, formData)
      } else {
        await api.post('/transactions', formData)
      }

      setShowModal(false)
      setEditingTransaction(null)

      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })

      await fetchTransactions()
      setAnalyticsRefreshKey(key => key + 1)
    } catch (error) {
      console.error(error)
      alert('Failed to save transaction')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return
    await api.delete(`/transactions/${id}`)
    await fetchTransactions()
    setAnalyticsRefreshKey(key => key + 1)
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category || '',
      description: transaction.description || '',
      date: transaction.date.split('T')[0],
    })
    setShowModal(true)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-primary-600 rounded-full" />
      </div>
    )
  }

  /* ---------------- CALCULATIONS ---------------- */
  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <DashboardLayout>
      <PageBackground variant="particles" />
      <div className="relative z-10 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">Transactions</h1>
            <p className="text-slate-400 mt-1">
              Manage your income and expenses
            </p>
          </div>

          <button
            onClick={() => {
              setEditingTransaction(null)
              setShowModal(true)
            }}
            className="btn-primary"
          >
            <Plus className="h-5 w-5" />
            Add Transaction
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid md:grid-cols-3 gap-6">
          <SummaryCard
            title="Total Income"
            value={incomeTotal}
            icon={<ArrowUpCircle />}
            color="text-success-600"
          />
          <SummaryCard
            title="Total Expenses"
            value={expenseTotal}
            icon={<ArrowDownCircle />}
            color="text-danger-600"
          />
          <SummaryCard
            title="Net Savings"
            value={incomeTotal - expenseTotal}
            icon={null}
            color={
              incomeTotal - expenseTotal >= 0
                ? 'text-success-600'
                : 'text-danger-600'
            }
          />
        </div>

        {/* ANALYTICS + RECURRING + BUDGETS */}
        <SpendingAnalytics refreshKey={analyticsRefreshKey} />
        <TransactionIntelligencePanel />
        <RecurringBadgeList />
        <BudgetAutopilotCard />
        <BudgetsPanel />

        {/* TABLE */}
        <div className="card overflow-hidden">
          {loadingTransactions ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-900/60 border-b border-slate-800/70">
                <tr className="text-xs uppercase text-slate-400">
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 text-slate-200">
                      {new Date(t.date).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 capitalize text-slate-200">{t.type}</td>

                    <td className="px-6 py-4 text-slate-200">{t.category || '-'}</td>

                    <td className="px-6 py-4 text-slate-200">{t.description || '-'}</td>

                    <td
                      className={`px-6 py-4 text-right font-medium ${
                        t.type === 'income'
                          ? 'text-success-600'
                          : 'text-danger-600'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}₹
                      {Number(t.amount).toLocaleString('en-IN')}
                    </td>

                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(t)}
                        className="rounded-lg p-1 text-primary-300 hover:bg-primary-500/10 hover:text-primary-200"
                        aria-label="Edit transaction"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="rounded-lg p-1 text-danger-300 hover:bg-danger-500/10 hover:text-danger-200"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card card-pad w-full max-w-md shadow-xl form-shell">
              <h2 className="text-xl font-bold mb-4">
                {editingTransaction ? 'Edit' : 'Add'} Transaction
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 form-shell">

                <select
                  value={formData.type}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'income' | 'expense',
                    })
                  }
                  className={inputStyle}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>

                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={e =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className={inputStyle}
                />

                <input
                  placeholder="Category"
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className={inputStyle}
                />

                <input
                  placeholder="Description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className={inputStyle}
                />

                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className={inputStyle}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
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
      </div>
    </DashboardLayout>
  )
}

/* ---------- Small reusable card ---------- */
function SummaryCard({ title, value, icon, color }: any) {
  return (
    <div className="card card-pad card-hover">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        ₹{value.toLocaleString('en-IN')}
      </p>
    </div>
  )
}
