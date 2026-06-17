'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import {
  TrendingUp,
  Shield,
  Brain,
  Target,
  BarChart3,
  Zap,
  DollarSign,
  IndianRupee,
  Percent,
  Landmark,
  Wallet,
  CandlestickChart,
} from 'lucide-react'

const financeParticles = [
  { Icon: DollarSign, left: '6%', size: 'h-5 w-5', delay: '0s', duration: '17s', tone: 'emerald' },
  { Icon: CandlestickChart, left: '14%', size: 'h-6 w-6', delay: '2s', duration: '21s', tone: 'cyan' },
  { Icon: Wallet, left: '22%', size: 'h-5 w-5', delay: '5s', duration: '16s', tone: 'sky' },
  { Icon: IndianRupee, left: '31%', size: 'h-7 w-7', delay: '1s', duration: '19s', tone: 'emerald' },
  { Icon: Percent, left: '40%', size: 'h-5 w-5', delay: '7s', duration: '20s', tone: 'teal' },
  { Icon: Landmark, left: '49%', size: 'h-6 w-6', delay: '3s', duration: '18s', tone: 'cyan' },
  { Icon: TrendingUp, left: '58%', size: 'h-6 w-6', delay: '8s', duration: '22s', tone: 'emerald' },
  { Icon: IndianRupee, left: '67%', size: 'h-5 w-5', delay: '4s', duration: '15s', tone: 'sky' },
  { Icon: Brain, left: '76%', size: 'h-5 w-5', delay: '6s', duration: '17s', tone: 'teal' },
  { Icon: DollarSign, left: '86%', size: 'h-6 w-6', delay: '2.5s', duration: '20s', tone: 'cyan' },
  { Icon: BarChart3, left: '93%', size: 'h-5 w-5', delay: '9s', duration: '18s', tone: 'emerald' },
]

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { login, register } = useAuth()

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-500/25 blur-3xl animate-blob-slow" />
        <div className="absolute -right-10 top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl animate-blob-slow" />
        <div className="absolute bottom-[-6rem] left-1/3 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl animate-blob-slow" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_55%),linear-gradient(#0f172a_1px,transparent_1px),linear-gradient(90deg,#0f172a_1px,transparent_1px)] bg-[length:auto,80px_80px,80px_80px] opacity-40" />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {financeParticles.map((particle, index) => (
          <div
            key={`${particle.left}-${index}`}
            className="finance-particle animate-finance-drift"
            style={{
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          >
            <span className={`finance-particle-symbol finance-particle-${particle.tone}`}>
              <particle.Icon className={particle.size} strokeWidth={1.75} />
            </span>
          </div>
        ))}
      </div>

      <header className="container-app py-5 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="landing-brand-icon flex h-9 w-9 items-center justify-center rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-200" />
            </div>
            <span className="text-lg font-semibold tracking-tight sm:text-xl">
              FinanceIQ
            </span>
          </div>
        </div>
      </header>

      <main className="container-app pb-12 pt-4 sm:pt-6 lg:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                AI-powered wealth insights
              </p>
              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                The Modern Solution
                <br />
                <span className="text-primary-300">
                  For Financial Opportunity
                </span>
              </h1>
              <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                Create and track your financial journey with intelligent
                analytics, Monte Carlo simulations, and risk insights crafted
                for Indian investors.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card card-pad card-hover animate-float-soft">
                <Shield className="landing-feature-icon landing-feature-icon-emerald mb-3 h-6 w-6" />
                <h3 className="mb-1 text-sm font-semibold text-slate-50">
                  Smart Risk Guard
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time risk score and alerts tuned to your portfolio.
                </p>
              </div>

              <div className="card card-pad card-hover">
                <Brain className="landing-feature-icon landing-feature-icon-cyan mb-3 h-6 w-6" />
                <h3 className="mb-1 text-sm font-semibold text-slate-50">
                  AI Opportunity Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Machine learning projections on savings, goals and cashflow.
                </p>
              </div>

              <div className="card card-pad card-hover">
                <Target className="landing-feature-icon landing-feature-icon-sky mb-3 h-6 w-6" />
                <h3 className="mb-1 text-sm font-semibold text-slate-50">
                  Goal Playbooks
                </h3>
                <p className="text-xs text-slate-400">
                  Ready-made tracks for education, house, retirement and more.
                </p>
              </div>

              <div className="card card-pad card-hover">
                <BarChart3 className="landing-feature-icon landing-feature-icon-teal mb-3 h-6 w-6" />
                <h3 className="mb-1 text-sm font-semibold text-slate-50">
                  Live Portfolio Radar
                </h3>
                <p className="text-xs text-slate-400">
                  Allocation heatmaps and Monte Carlo stress tests in one view.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 sm:text-sm">
              <div className="flex items-center gap-2">
                <Zap className="landing-inline-icon h-4 w-4 text-emerald-200" />
                <span>Realtime analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="landing-inline-icon h-4 w-4 text-cyan-200" />
                <span>Bank-grade security</span>
              </div>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="card card-pad max-w-md border-primary-500/20 bg-slate-900/80">
              <div className="mb-6 flex space-x-2 rounded-full bg-slate-900/70 p-1 text-xs ring-1 ring-slate-700">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 rounded-full py-2 text-center font-medium transition ${
                    isLogin
                      ? 'bg-primary-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 rounded-full py-2 text-center font-medium transition ${
                    !isLogin
                      ? 'bg-primary-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {isLogin ? (
                <LoginForm onLogin={login} />
              ) : (
                <RegisterForm onRegister={register} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
