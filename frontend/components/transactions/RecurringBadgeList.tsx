'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function RecurringBadgeList() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await api.get('/transactions/smart/recurring')
      setItems(res.data.recurring || [])
    } catch (e) {
      console.error('Failed to load recurring', e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="card card-pad card-hover">
      <h3 className="text-lg font-semibold mb-4 text-slate-50">Recurring Transactions</h3>
      {loading ? <div className="h-10 bg-slate-800/60 rounded-xl animate-pulse"/> : (
        <div className="flex flex-wrap gap-2">
          {items.length === 0 ? (
            <span className="text-sm text-slate-400">No recurring detected</span>
          ) : items.map((x, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs bg-primary-500/10 text-primary-200 border border-primary-500/20">
              {x.type === 'income' ? '+' : '-'}₹{Number(x.amount).toLocaleString('en-IN')} · next {x.nextDate}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
