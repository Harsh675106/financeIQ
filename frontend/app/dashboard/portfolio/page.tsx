'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import PortfolioAllocation from '@/components/dashboard/PortfolioAllocation'
import PortfolioLiveAnalysis from '@/components/portfolio/PortfolioLiveAnalysis'
import PortfolioExplainabilityCard from '@/components/portfolio/PortfolioExplainabilityCard'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Play } from 'lucide-react'
import { api } from '@/lib/api'

export default function PortfolioPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [simulationData, setSimulationData] = useState<any>(null)
  const [loadingSimulation, setLoadingSimulation] = useState(false)

  const [formData, setFormData] = useState({
    initialAmount: '10000',
    monthlyContribution: '500',
    years: '10',
    expectedReturn: '8',
    volatility: '15',
  })

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  /* ================= LOAD USER DATA ================= */
  useEffect(() => {
    if (user) {
      loadUserPortfolioData()
    }
  }, [user])

  const loadUserPortfolioData = async () => {
    try {
      // Get total current portfolio value (assets + savings combined)
      const [assetsRes, savingsRes] = await Promise.all([
        api.get('/portfolio/holdings'),
        api.get('/savings'),
      ])

      let totalValue = assetsRes.data?.total || 0
      const totalSavings = savingsRes.data?.total || 0

      // Add savings to total portfolio value
      totalValue += totalSavings

      // Estimate average monthly contribution (use 10% of current assets as default monthly)
      const estimatedMonthly = Math.round(totalValue * 0.1)

      // Pre-fill form with actual user data
      setFormData((prev) => ({
        ...prev,
        initialAmount: totalValue > 0 ? Math.round(totalValue).toString() : '10000',
        monthlyContribution: estimatedMonthly > 0 ? estimatedMonthly.toString() : '500',
      }))
    } catch (error) {
      console.error('Failed to load portfolio data:', error)
      // Keep defaults if fetch fails
    }
  }

  /* ================= SIMULATION ================= */
  const runSimulation = async () => {
    setLoadingSimulation(true)

    try {
      const res = await api.post('/portfolio/simulation', {
        initialAmount: parseFloat(formData.initialAmount),
        monthlyContribution: parseFloat(formData.monthlyContribution),
        years: parseInt(formData.years),
        expectedReturn: parseFloat(formData.expectedReturn) / 100,
        volatility: parseFloat(formData.volatility) / 100,
      })

      setSimulationData(res.data)
    } catch (err) {
      console.error(err)
      alert('Failed to run simulation')
    } finally {
      setLoadingSimulation(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-primary-600 rounded-full" />
      </div>
    )
  }

  const chartData = simulationData
    ? [
        { name: 'Worst Case', value: simulationData.worstCase },
        { name: 'Median', value: simulationData.median },
        { name: 'Mean', value: simulationData.mean },
        { name: 'Best Case', value: simulationData.bestCase },
      ]
    : []

  /* ================= UI ================= */
  return (
    <DashboardLayout>
      <PageBackground variant="grid" />
      <div className="relative z-10 space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-slate-50">
            Portfolio Analysis
          </h1>
          <p className="text-slate-400">
            Monte Carlo simulation and portfolio allocation
          </p>
        </div>

        {/* TOP GRID */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PortfolioAllocation />
            <PortfolioLiveAnalysis />
            <PortfolioExplainabilityCard />
          </div>

          {/* SIMULATION CARD */}
          <div className="card card-pad card-hover">

            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-6 w-6 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">
                Monte Carlo Simulation
              </h2>
            </div>

            <div className="space-y-4">

              {/* INPUT STYLE FIXED */}
              {[
                ['Initial Amount (₹)', 'initialAmount'],
                ['Monthly Contribution (₹)', 'monthlyContribution'],
                ['Years', 'years'],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {label}
                  </label>

                  <input
                    type="number"
                    value={(formData as any)[key]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [key]: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>
              ))}

              {/* RETURN + VOLATILITY */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Expected Return (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.expectedReturn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedReturn: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Volatility (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.volatility}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        volatility: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>
              </div>

              {/* BUTTON */}
              <button
                onClick={runSimulation}
                disabled={loadingSimulation}
                className="btn-primary w-full"
              >
                <Play className="h-5 w-5" />
                {loadingSimulation
                  ? 'Running Simulation...'
                  : 'Run Simulation'}
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {simulationData && (
          <div className="card card-pad card-hover">

            <h2 className="text-lg font-semibold text-slate-50 mb-6">
              Simulation Results
            </h2>

            {/* STATS */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">

              {[
                ['Worst Case', simulationData.worstCase, 'bg-slate-900/50', 'text-slate-100'],
                ['Median', simulationData.median, 'bg-primary-500/10', 'text-primary-200'],
                ['Mean', simulationData.mean, 'bg-success-500/10', 'text-success-200'],
                ['Best Case', simulationData.bestCase, 'bg-purple-500/10', 'text-purple-200'],
              ].map(([title, value, bg, color]) => (
                <div key={title as string} className={`${bg} rounded-xl p-4 border border-slate-800/60`}>
                  <p className="text-sm text-slate-400 mb-1">{title}</p>
                  <p className={`text-2xl font-bold ${color}`}>
                    ₹{(value as number)?.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            {/* CHART */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis stroke="#374151" dataKey="name" />
                <YAxis stroke="#374151" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(2, 6, 23, 0.9)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16,185,129,0.25)',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: number) =>
                    `₹${value.toLocaleString('en-IN')}`
                  }
                />
                <Legend />
                <Bar dataKey="value" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 text-sm text-slate-400">
              <p>Simulations: {simulationData.simulations || 10000}</p>
              <p>
                Standard Deviation: ₹
                {simulationData.stdDev?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
