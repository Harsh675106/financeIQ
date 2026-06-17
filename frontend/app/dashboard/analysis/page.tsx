'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { api } from '@/lib/api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, BrainCircuit, TrendingUp, Wallet } from 'lucide-react'
import ScenarioPlannerCard from '@/components/analysis/ScenarioPlannerCard'
import DocumentIntelligenceCard from '@/components/analysis/DocumentIntelligenceCard'
import LifeEventPlannerCard from '@/components/analysis/LifeEventPlannerCard'

interface BriefingPriority {
  title: string
  detail: string
  impact: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  metric: string
  direction: 'increase' | 'decrease'
}

interface ForecastPoint {
  month: string
  income: number
  expense: number
  projectedBalance: number
}

interface AnalysisResponse {
  summary: string
  priorities: BriefingPriority[]
  opportunities: { title: string; detail: string; estimatedMonthlyImpact: number }[]
  recurringSubscriptions: { category: string; description: string; amount: number; occurrences: number }[]
  forecast: {
    baseline: { monthlyIncome: number; monthlyExpense: number }
    forecast: ForecastPoint[]
  }
}

export default function AnalysisPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchAnalysis()
    }
  }, [user])

  const fetchAnalysis = async () => {
    try {
      const response = await api.get('/analytics/financial-briefing')
      setAnalysisData(response.data)
    } catch (error) {
      console.error('Failed to fetch FinanceIQ briefing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || !user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const forecastData = analysisData?.forecast?.forecast || []
  const priorities = analysisData?.priorities || []
  const opportunities = analysisData?.opportunities || []
  const recurring = analysisData?.recurringSubscriptions || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="card card-pad bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary-500/10 p-3 text-primary-300">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-primary-300/80">FinanceIQ Briefing</p>
              <h1 className="text-3xl font-bold text-slate-50">AI-style money intelligence</h1>
              <p className="max-w-3xl text-slate-300">{analysisData?.summary}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">6-Month Cashflow Forecast</h2>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="projectedBalance" stroke="#38bdf8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Baseline income</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  {Math.round(analysisData?.forecast?.baseline?.monthlyIncome || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Baseline expense</p>
                <p className="mt-2 text-2xl font-semibold text-rose-300">
                  {Math.round(analysisData?.forecast?.baseline?.monthlyExpense || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-300" />
              <h2 className="text-lg font-semibold text-slate-50">Top Priorities</h2>
            </div>
            <div className="space-y-3">
              {priorities.length === 0 ? (
                <p className="text-sm text-slate-400">Add more financial data to unlock personalized priorities.</p>
              ) : (
                priorities.map((priority) => (
                  <div key={`${priority.title}-${priority.metric}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-100">{priority.title}</h3>
                      <span className="rounded-full bg-primary-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-primary-200">
                        {Math.round(priority.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{priority.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">Opportunities</h2>
            </div>
            <div className="space-y-3">
              {opportunities.length === 0 ? (
                <p className="text-sm text-slate-400">No clear opportunities yet. More budgeting and savings data will improve this section.</p>
              ) : (
                opportunities.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-100">{item.title}</h3>
                      <span className="text-sm text-emerald-300">
                        {Math.round(item.estimatedMonthlyImpact).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">Detected Recurring Expenses</h2>
            </div>
            <div className="space-y-3">
              {recurring.length === 0 ? (
                <p className="text-sm text-slate-400">FinanceIQ has not detected enough recurring expense patterns yet.</p>
              ) : (
                recurring.map((item) => (
                  <div key={`${item.description}-${item.amount}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-100">{item.description}</h3>
                      <span className="text-sm text-slate-300">
                        {Math.round(item.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.category} | {item.occurrences} occurrences detected
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <ScenarioPlannerCard />
        <LifeEventPlannerCard />
        <DocumentIntelligenceCard />
      </div>
    </DashboardLayout>
  )
}
