'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import { Plus, Edit, Trash2, PiggyBank, AlertCircle, TrendingUp, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import DebtOptimizerCard from '@/components/wealth/DebtOptimizerCard'

interface Saving {
  id: number
  amount: number
  account_type: string
  description: string
  created_at: string
  updated_at: string
}

interface Debt {
  id: number
  amount: number
  interest_rate: number
  debt_type: string
  description: string
  created_at: string
  updated_at: string
}

interface Asset {
  id: number
  type: string
  symbol?: string
  quantity: number
  price: number
  purchase_date?: string
  created_at: string
  updated_at: string
}

interface Liability {
  id: number
  type: string
  amount: number
  rate?: number
  due_date?: string
  created_at: string
  updated_at: string
}

type TabType = 'savings' | 'debts' | 'assets' | 'liabilities'

export default function WealthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [savings, setSavings] = useState<Saving[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [optimizerRefreshKey, setOptimizerRefreshKey] = useState(0)
  
  const [activeTab, setActiveTab] = useState<TabType>('savings')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const [formData, setFormData] = useState({
    amount: '',
    account_type: '',
    description: '',
    interest_rate: '',
    debt_type: '',
    type: '',
    quantity: '',
    price: '',
    symbol: '',
    purchase_date: '',
    rate: '',
    due_date: '',
  })

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
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
      console.error(err)
    } finally {
      setLoadingData(false)
    }
  }

  /* ================= HANDLERS ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (activeTab === 'savings') {
        const payload = {
          amount: parseFloat(formData.amount),
          account_type: formData.account_type || 'Savings Account',
          description: formData.description,
        }
        if (editingItem && 'account_type' in editingItem) {
          await api.put(`/savings/${editingItem.id}`, payload)
        } else {
          await api.post('/savings', payload)
        }
      } else if (activeTab === 'debts') {
        const payload = {
          amount: parseFloat(formData.amount),
          interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : 0,
          debt_type: formData.debt_type || 'Loan',
          description: formData.description,
        }
        if (editingItem && 'debt_type' in editingItem) {
          await api.put(`/debts/${editingItem.id}`, payload)
        } else {
          await api.post('/debts', payload)
        }
      } else if (activeTab === 'assets') {
        // Validate required fields
        if (!formData.type || formData.type.trim() === '') {
          alert('Asset Type is required')
          return
        }
        if (!formData.quantity || parseFloat(formData.quantity) < 0) {
          alert('Quantity is required and must be >= 0')
          return
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
          alert('Price is required and must be >= 0')
          return
        }

        const payload = {
          type: formData.type.trim(),
          symbol: formData.symbol?.trim() || null,
          quantity: parseFloat(formData.quantity) || 0,
          price: parseFloat(formData.price) || 0,
          purchase_date: formData.purchase_date || null,
        }
        if (editingItem && 'quantity' in editingItem && editingItem.account_type === undefined) {
          await api.put(`/wealth/assets/${editingItem.id}`, payload)
        } else {
          await api.post('/wealth/assets', payload)
        }
      } else if (activeTab === 'liabilities') {
        const payload = {
          type: formData.type || 'Loan',
          amount: parseFloat(formData.amount),
          rate: formData.rate ? parseFloat(formData.rate) : null,
          due_date: formData.due_date || null,
        }
        if (editingItem && editingItem.account_type === undefined && editingItem.quantity === undefined) {
          await api.put(`/wealth/liabilities/${editingItem.id}`, payload)
        } else {
          await api.post('/wealth/liabilities', payload)
        }
      }

      setShowModal(false)
      setEditingItem(null)
      setFormData({
        amount: '',
        account_type: '',
        description: '',
        interest_rate: '',
        debt_type: '',
        type: '',
        quantity: '',
        price: '',
        symbol: '',
        purchase_date: '',
        rate: '',
        due_date: '',
      })
      await fetchData()
      setOptimizerRefreshKey(key => key + 1)
    } catch (err: any) {
      console.error('Form submission error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save'
      alert(errorMsg)
    }
  }

  const handleDelete = async (id: number, type: TabType) => {
    if (!confirm(`Delete this ${type.slice(0, -1)}?`)) return
    try {
      const endpoint = type === 'savings' || type === 'debts' ? `/${type}/${id}` : `/wealth/${type}/${id}`
      await api.delete(endpoint)
      await fetchData()
      setOptimizerRefreshKey(key => key + 1)
    } catch (err) {
      console.error(err)
      alert('Failed to delete')
    }
  }

  const handleEdit = (item: any, type: TabType) => {
    setActiveTab(type)
    setEditingItem(item)
    
    if (type === 'savings' && 'account_type' in item) {
      setFormData({
        amount: item.amount.toString(),
        account_type: item.account_type,
        description: item.description || '',
        interest_rate: '',
        debt_type: '',
        type: '',
        quantity: '',
        price: '',
        symbol: '',
        purchase_date: '',
        rate: '',
        due_date: '',
      })
    } else if (type === 'debts' && 'debt_type' in item) {
      setFormData({
        amount: item.amount.toString(),
        account_type: '',
        description: item.description || '',
        interest_rate: item.interest_rate?.toString() || '',
        debt_type: item.debt_type,
        type: '',
        quantity: '',
        price: '',
        symbol: '',
        purchase_date: '',
        rate: '',
        due_date: '',
      })
    } else if (type === 'assets' && 'quantity' in item) {
      setFormData({
        amount: '',
        account_type: '',
        description: '',
        interest_rate: '',
        debt_type: '',
        type: item.type,
        quantity: item.quantity.toString(),
        price: item.price.toString(),
        symbol: item.symbol || '',
        purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : '',
        rate: '',
        due_date: '',
      })
    } else if (type === 'liabilities') {
      setFormData({
        amount: item.amount.toString(),
        account_type: '',
        description: '',
        interest_rate: '',
        debt_type: '',
        type: item.type,
        quantity: '',
        price: '',
        symbol: '',
        purchase_date: '',
        rate: item.rate?.toString() || '',
        due_date: item.due_date ? item.due_date.split('T')[0] : '',
      })
    }
    setShowModal(true)
  }

  const openAddModal = (type: TabType) => {
    setActiveTab(type)
    setEditingItem(null)
    setFormData({
      amount: '',
      account_type: '',
      description: '',
      interest_rate: '',
      debt_type: '',
      type: '',
      quantity: '',
      price: '',
      symbol: '',
      purchase_date: '',
      rate: '',
      due_date: '',
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

  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0)
  const totalDebts = debts.reduce((sum, d) => sum + d.amount, 0)

  return (
    <DashboardLayout>
      <PageBackground variant="flow" />
      <div className="relative z-10 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Savings & Debts</h1>
          <p className="text-slate-400 mt-1">
            Manage your savings accounts and debts
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card card-pad bg-gradient-to-br from-success-900/30 to-success-800/10 border border-success-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Total Savings</span>
              <PiggyBank className="h-5 w-5 text-success-400" />
            </div>
            <p className="text-2xl font-bold text-success-300">
              ₹{Math.round(totalSavings).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-2">{savings.length} account(s)</p>
          </div>

          <div className="card card-pad bg-gradient-to-br from-danger-900/30 to-danger-800/10 border border-danger-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Total Debt</span>
              <AlertCircle className="h-5 w-5 text-danger-400" />
            </div>
            <p className="text-2xl font-bold text-danger-300">
              ₹{Math.round(totalDebts).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-2">{debts.length} debt(s)</p>
          </div>

          <div className="card card-pad bg-gradient-to-br from-primary-900/30 to-primary-800/10 border border-primary-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Total Assets</span>
              <TrendingUp className="h-5 w-5 text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-primary-300">
              ₹{Math.round(assets.reduce((sum, a) => sum + (a.quantity * a.price), 0)).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-2">{assets.length} asset(s)</p>
          </div>

          <div className="card card-pad bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 border border-yellow-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Total Liabilities</span>
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-yellow-300">
              ₹{Math.round(liabilities.reduce((sum, l) => sum + l.amount, 0)).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-2">{liabilities.length} liability(ies)</p>
          </div>
        </div>

        <DebtOptimizerCard refreshKey={optimizerRefreshKey} />

        {/* TABS */}
        <div className="card card-pad">
          <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
            {(['savings', 'debts', 'assets', 'liabilities'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-primary-400 text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ADD BUTTON */}
          <div className="mb-6">
            <button
              onClick={() => openAddModal(activeTab)}
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              Add {activeTab === 'savings' ? 'Saving' : activeTab === 'debts' ? 'Debt' : activeTab === 'assets' ? 'Asset' : 'Liability'}
            </button>
          </div>

          {/* SAVINGS TAB */}
          {activeTab === 'savings' && (
            <div className="space-y-4">
              {loadingData ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full mx-auto" />
                </div>
              ) : savings.length === 0 ? (
                <div className="text-center py-12">
                  <PiggyBank className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No savings yet. Add one to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savings.map((saving) => (
                    <div
                      key={saving.id}
                      className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700 rounded-lg hover:border-slate-600 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-50">{saving.account_type}</p>
                        <p className="text-sm text-slate-400">{saving.description || 'No description'}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-lg font-bold text-success-300">₹{Math.round(saving.amount).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(saving, 'savings')}
                          className="p-2 text-slate-400 hover:text-primary-400 transition"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(saving.id, 'savings')}
                          className="p-2 text-slate-400 hover:text-danger-400 transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DEBTS TAB */}
          {activeTab === 'debts' && (
            <div className="space-y-4">
              {loadingData ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full mx-auto" />
                </div>
              ) : debts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No debts added. Add one if applicable.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debts.map((debt) => (
                    <div
                      key={debt.id}
                      className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700 rounded-lg hover:border-slate-600 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-50">{debt.debt_type}</p>
                        <div className="text-sm text-slate-400 mt-1">
                          <p>{debt.description || 'No description'}</p>
                          {debt.interest_rate > 0 && (
                            <p>Interest Rate: {debt.interest_rate}%</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-lg font-bold text-danger-300">₹{Math.round(debt.amount).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(debt, 'debts')}
                          className="p-2 text-slate-400 hover:text-primary-400 transition"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(debt.id, 'debts')}
                          className="p-2 text-slate-400 hover:text-danger-400 transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ASSETS TAB */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              {loadingData ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full mx-auto" />
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No assets yet. Add one to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700 rounded-lg hover:border-slate-600 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-50">{asset.type}{asset.symbol ? ` - ${asset.symbol}` : ''}</p>
                        <p className="text-sm text-slate-400">Qty: {asset.quantity} × ₹{Math.round(asset.price).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-lg font-bold text-primary-300">₹{Math.round(asset.quantity * asset.price).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(asset, 'assets')}
                          className="p-2 text-slate-400 hover:text-primary-400 transition"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id, 'assets')}
                          className="p-2 text-slate-400 hover:text-danger-400 transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LIABILITIES TAB */}
          {activeTab === 'liabilities' && (
            <div className="space-y-4">
              {loadingData ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full mx-auto" />
                </div>
              ) : liabilities.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No liabilities added.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liabilities.map((liability) => (
                    <div
                      key={liability.id}
                      className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700 rounded-lg hover:border-slate-600 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-50">{liability.type}</p>
                        <div className="text-sm text-slate-400 mt-1">
                          {liability.rate && <p>Rate: {liability.rate}%</p>}
                          {liability.due_date && <p>Due: {new Date(liability.due_date).toLocaleDateString('en-IN')}</p>}
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-lg font-bold text-yellow-300">₹{Math.round(liability.amount).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(liability, 'liabilities')}
                          className="p-2 text-slate-400 hover:text-primary-400 transition"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(liability.id, 'liabilities')}
                          className="p-2 text-slate-400 hover:text-danger-400 transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full border border-slate-700 form-shell">
              <h2 className="text-xl font-bold text-slate-50 mb-4">
                {editingItem 
                  ? `Edit ${activeTab === 'savings' ? 'Saving' : activeTab === 'debts' ? 'Debt' : activeTab === 'assets' ? 'Asset' : 'Liability'}` 
                  : `Add ${activeTab === 'savings' ? 'Saving' : activeTab === 'debts' ? 'Debt' : activeTab === 'assets' ? 'Asset' : 'Liability'}`}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 form-shell">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                {/* Savings-specific fields */}
                {activeTab === 'savings' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Account Type
                    </label>
                    <input
                      type="text"
                      value={formData.account_type}
                      onChange={(e) =>
                        setFormData({ ...formData, account_type: e.target.value })
                      }
                      className="input"
                      placeholder="e.g., Savings Account, Fixed Deposit"
                    />
                  </div>
                )}

                {/* Debts-specific fields */}
                {activeTab === 'debts' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Debt Type
                      </label>
                      <input
                        type="text"
                        value={formData.debt_type}
                        onChange={(e) =>
                          setFormData({ ...formData, debt_type: e.target.value })
                        }
                        className="input"
                        placeholder="e.g., Loan, Credit Card, Mortgage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Interest Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.interest_rate}
                        onChange={(e) =>
                          setFormData({ ...formData, interest_rate: e.target.value })
                        }
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                  </>
                )}

                {/* Assets-specific fields */}
                {activeTab === 'assets' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Asset Type
                      </label>
                      <input
                        type="text"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="input"
                        placeholder="e.g., Stock, Mutual Fund, Gold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Symbol (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.symbol}
                        onChange={(e) =>
                          setFormData({ ...formData, symbol: e.target.value })
                        }
                        className="input"
                        placeholder="e.g., TCS, MSFT"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData({ ...formData, quantity: e.target.value })
                          }
                          className="input"
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          className="input"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Purchase Date (optional)
                      </label>
                      <input
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) =>
                          setFormData({ ...formData, purchase_date: e.target.value })
                        }
                        className="input"
                      />
                    </div>
                  </>
                )}

                {/* Liabilities-specific fields */}
                {activeTab === 'liabilities' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Liability Type
                      </label>
                      <input
                        type="text"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="input"
                        placeholder="e.g., Loan, Credit Card, Mortgage"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        className="input"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Interest Rate (%) (optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.rate}
                        onChange={(e) =>
                          setFormData({ ...formData, rate: e.target.value })
                        }
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Due Date (optional)
                      </label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) =>
                          setFormData({ ...formData, due_date: e.target.value })
                        }
                        className="input"
                      />
                    </div>
                  </>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input"
                    placeholder="Add notes..."
                    rows={2}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingItem(null)
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-slate-50 rounded-lg transition"
                  >
                    Save
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
