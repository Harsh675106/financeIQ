'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Repeat } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

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
      <SectionHeader as="h3" icon={Repeat} tone="cyan" title="Recurring Transactions" className="mb-4" />
      {loading ? (
        <div className="flex flex-wrap gap-2">
          <div className="skeleton h-7 w-36 rounded-full" />
          <div className="skeleton h-7 w-28 rounded-full" />
          <div className="skeleton h-7 w-32 rounded-full" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.length === 0 ? (
            <span className="text-sm text-slate-500">No recurring detected</span>
          ) : items.map((x, i) => (
            <span
              key={i}
              className={`badge num px-3 py-1 text-xs ${x.type === 'income' ? 'badge-success' : 'badge-danger'}`}
            >
              {x.type === 'income' ? '+' : '-'}₹{Number(x.amount).toLocaleString('en-IN')} · next {x.nextDate}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
