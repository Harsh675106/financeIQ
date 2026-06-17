'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BrainCircuit } from 'lucide-react'

export default function TransactionIntelligencePanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/transactions/smart/intelligence')
        setData(res.data)
      } catch (error) {
        console.error('Failed to load transaction intelligence', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <BrainCircuit className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">Transaction Intelligence</h3>
      </div>

      {loading ? (
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      ) : !data ? (
        <div className="text-sm text-slate-400">No intelligence available yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-100">Category suggestions</p>
            {data.suggestions?.length ? data.suggestions.slice(0, 4).map((item: any) => (
              <div key={item.transactionId} className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40 text-sm">
                <div className="text-slate-100">{item.suggestedCategory}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Confidence {item.confidence}% | {item.reason}
                </div>
              </div>
            )) : <div className="text-sm text-slate-400">No recategorization suggestions.</div>}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-100">Anomalies and recurring patterns</p>
            {[...(data.unusualSpend || []).slice(0, 2), ...(data.recurring || []).slice(0, 2)].map((item: any, index: number) => (
              <div key={index} className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40 text-sm">
                <div className="text-slate-100">{item.reason || item.classification}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Confidence {item.confidence}% {item.amount ? `| ${Math.round(item.amount).toLocaleString('en-IN')}` : ''}
                </div>
              </div>
            ))}
            {!data.unusualSpend?.length && !data.recurring?.length ? (
              <div className="text-sm text-slate-400">No anomalies or recurring patterns detected yet.</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
