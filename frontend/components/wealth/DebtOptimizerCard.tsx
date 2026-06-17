'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BrainCircuit, TrendingDown } from 'lucide-react'

interface Strategy {
  strategy: 'avalanche' | 'snowball'
  monthsToDebtFree: number | null
  totalInterest: number
  payoffOrder: { id: number; debtType: string; description: string; month: number }[]
}

interface DebtPlan {
  hasDebts: boolean
  monthlyPaymentBudget: number
  summary: string
  strategies: Strategy[]
  recommendedStrategy: (Strategy & { label: string }) | null
}

interface DebtOptimizerCardProps {
  refreshKey?: number
}

export default function DebtOptimizerCard({ refreshKey = 0 }: DebtOptimizerCardProps) {
  const [data, setData] = useState<DebtPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/debts/optimizer/plan')
        setData(res.data)
      } catch (error) {
        console.error('Failed to load debt optimizer', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [refreshKey])

  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2 mb-4">
        <BrainCircuit className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">Debt Optimizer</h3>
      </div>

      {loading ? (
        <div className="h-24 rounded-xl bg-slate-800/60 animate-pulse" />
      ) : !data?.hasDebts ? (
        <p className="text-sm text-slate-400">No debts found. Add a debt to see payoff strategies.</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-4">
            <p className="text-sm text-slate-200">{data.summary}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-primary-200">
              Suggested monthly payoff budget: {Math.round(data.monthlyPaymentBudget).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {data.strategies.map((strategy) => (
              <div key={strategy.strategy} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-slate-100 capitalize">{strategy.strategy}</h4>
                  {data.recommendedStrategy?.strategy === strategy.strategy ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-emerald-200">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <p>Debt-free in: {strategy.monthsToDebtFree === null ? 'Long horizon' : `${strategy.monthsToDebtFree} months`}</p>
                  <p>Total interest: {Math.round(strategy.totalInterest).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          {data.recommendedStrategy?.payoffOrder?.length ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-primary-300" />
                <p className="text-sm font-semibold text-slate-100">Suggested payoff order</p>
              </div>
              <div className="space-y-2">
                {data.recommendedStrategy.payoffOrder.slice(0, 4).map((item) => (
                  <div key={`${item.id}-${item.month}`} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.debtType}{item.description ? ` | ${item.description}` : ''}</span>
                    <span className="text-slate-500">Month {item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
