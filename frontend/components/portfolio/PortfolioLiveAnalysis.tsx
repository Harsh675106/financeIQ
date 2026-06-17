'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { TrendingUp, ShieldAlert } from 'lucide-react'

export default function PortfolioLiveAnalysis() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await api.get('/portfolio/analysis')
      setData(res.data)
    } catch (e) {
      console.error('Portfolio analysis load failed', e)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  const toPct = (n:number)=> (Math.round(n*100)/100).toFixed(2)

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary-300"/>
        <h3 className="text-lg font-semibold text-slate-50">Live Portfolio Analysis</h3>
      </div>

      {loading ? <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse"/> : !data ? (
        <div className="text-sm text-slate-400">No analysis available.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['equity','debt','gold','liquid'].map((k) => (
              <div key={k} className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40">
                <div className="text-xs text-slate-400">{k.toUpperCase()}</div>
                <div className="text-lg font-semibold text-slate-50">{toPct(data.currentAllocation[k])}%</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40">
              <div className="text-xs text-slate-400">Total Value</div>
              <div className="text-lg font-semibold text-slate-50">
                ₹{data.totalValue?.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40">
              <div className="text-xs text-slate-400">Risk Level</div>
              <div className="text-lg font-semibold text-slate-50">{data.risk?.level} ({toPct(data.risk?.annualVolatility)}% vol)</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40">
              <div className="text-xs text-slate-400">Drift</div>
              <div className="text-xs text-slate-300">{['equity','debt','gold','liquid'].map((k:string)=> `${k}: ${toPct((data.currentAllocation[k] - data.targetAllocation[k]))}%`).join(' | ')}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-100 mb-2">Rebalancing Suggestions</div>
            {data.rebalance?.suggestions?.length ? (
              <div className="space-y-2">
                {data.rebalance.suggestions.map((s:any, i:number)=> (
                  <div key={i} className="p-2 rounded-xl border border-slate-800/70 bg-slate-900/40 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-primary-300"/>
                      <span className="font-medium capitalize text-slate-100">{s.action}</span>
                      <span className="uppercase text-slate-400">{s.bucket}</span>
                    </div>
                    <div className="text-slate-100">₹{s.amount.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">No rebalancing needed within the 5% band.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
