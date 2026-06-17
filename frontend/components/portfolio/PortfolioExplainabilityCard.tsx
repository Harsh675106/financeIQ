'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ShieldAlert } from 'lucide-react'

export default function PortfolioExplainabilityCard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/portfolio/explainability')
        setData(res.data)
      } catch (error) {
        console.error('Failed to load portfolio explainability', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">AI Portfolio Explainability</h3>
      </div>

      {loading ? (
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      ) : !data ? (
        <div className="text-sm text-slate-400">No portfolio explainability available.</div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {(data.explanations || []).length === 0 ? (
              <div className="text-sm text-slate-400">No major portfolio mismatch detected right now.</div>
            ) : (
              data.explanations.map((item: any) => (
                <div key={item.type} className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-slate-100">{item.title}</div>
                    <div className="text-xs text-slate-400">Confidence {item.confidence}%</div>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">{item.explanation}</p>
                </div>
              ))
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-100 mb-2">Stress test</p>
            <div className="grid md:grid-cols-2 gap-3">
              {(data.stressTests || []).map((item: any) => (
                <div key={item.scenario} className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40 text-sm">
                  <div className="text-slate-100">{item.scenario}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Impact {(item.estimatedImpactPercent * 100).toFixed(1)}% | Portfolio {Math.round(item.projectedPortfolioValue).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
