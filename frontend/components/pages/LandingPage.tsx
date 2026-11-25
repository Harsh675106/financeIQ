'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import AmbientCanvas from '@/components/motion/AmbientCanvas'
import FloatingShapes, { type ShapeSpec } from '@/components/motion/FloatingShapes'
import TiltCard from '@/components/motion/TiltCard'
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
  Sparkles,
  Lock,
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

const particleToneClass: Record<string, string> = {
  emerald: 'finance-particle-emerald',
  cyan: 'finance-particle-cyan',
  sky: 'finance-particle-sky',
  teal: 'finance-particle-teal',
}

const features = [
  {
    Icon: Shield,
    title: 'Smart Risk Guard',
    description: 'Real-time risk score and alerts tuned to your portfolio.',
    tile: 'icon-tile-emerald',
  },
  {
    Icon: Brain,
    title: 'AI Opportunity Engine',
    description: 'Machine learning projections on savings, goals and cashflow.',
    tile: 'icon-tile-sky',
  },
  {
    Icon: Target,
    title: 'Goal Playbooks',
    description: 'Ready-made tracks for education, house, retirement and more.',
    tile: 'icon-tile-brand',
  },
  {
    Icon: BarChart3,
    title: 'Live Portfolio Radar',
    description: 'Allocation heatmaps and Monte Carlo stress tests in one view.',
    tile: 'icon-tile-violet',
  },
]

const heroShapes: ShapeSpec[] = [
  { kind: 'cube', size: 56, style: { top: '2%', left: '46%' }, desktopOnly: true },
  { kind: 'ring', size: 132, style: { top: '-4%', right: '-2%' }, delay: 1.5, desktopOnly: true },
  { kind: 'orb', size: 66, style: { bottom: '4%', left: '-2%' }, delay: 3, desktopOnly: true },
  { kind: 'tile', size: 70, style: { bottom: '-2%', right: '40%' }, delay: 4.5, desktopOnly: true },
]

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { login, register } = useAuth()

  return (
    <div className="relative isolate min-h-screen overflow-x-clip text-ink-900">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-primary-200/50 blur-3xl animate-blob-slow" />
        <div className="absolute -right-24 top-16 h-[24rem] w-[24rem] rounded-full bg-ice-200/60 blur-3xl animate-blob-slow" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-teal-100/60 blur-3xl animate-blob-slow" />
      </div>

      {/* Drifting finance symbols */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
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
            <span className={`finance-particle-symbol ${particleToneClass[particle.tone]}`}>
              <particle.Icon className={particle.size} strokeWidth={1.75} />
            </span>
          </div>
        ))}
      </div>

      {/* Aurora ribbon + interactive particle network */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="page-bg-aurora absolute" />
        <AmbientCanvas density={1.1} />
      </div>

      <header className="container-app py-5 sm:py-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="landing-brand-icon flex h-10 w-10 items-center justify-center rounded-xl">
              <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.4} />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-ink-900 sm:text-xl">
              Finance<span className="text-gradient">IQ</span>
            </span>
          </div>

          <span className="badge badge-neutral hidden sm:inline-flex">
            <Lock className="h-3 w-3" />
            Encrypted &amp; private by design
          </span>
        </div>
      </header>

      <main className="container-app relative pb-12 pt-2 sm:pb-16 sm:pt-6 lg:pt-12">
        <FloatingShapes shapes={heroShapes} className="-z-10" />
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          {/* Hero copy */}
          <section className="order-last min-w-0 space-y-9 lg:order-first">
            <div className="space-y-5 animate-fade-up">
              <span className="badge badge-brand">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered wealth insights
              </span>
              <h1 className="text-balance font-display text-[2.1rem] font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-[2.75rem] lg:text-[3.25rem]">
                The Modern Solution
                <br />
                <span className="text-gradient">For Financial Opportunity</span>
              </h1>
              <p className="text-pretty max-w-xl text-[15px] leading-relaxed text-slate-500 sm:text-base">
                Create and track your financial journey with intelligent
                analytics, Monte Carlo simulations, and risk insights crafted
                for Indian investors.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {features.map(({ Icon, title, description, tile }, index) => (
                <div
                  key={title}
                  className="animate-fade-up"
                  style={{ animationDelay: `${120 + index * 70}ms` }}
                >
                  <TiltCard className="h-full" max={8}>
                    <div className="card card-hover h-full p-4 sm:p-5">
                      <div className="flex items-start gap-3.5">
                        <span className={`icon-tile ${tile}`}>
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-500 sm:text-sm">
              <div className="flex items-center gap-2">
                <Zap className="landing-inline-icon h-4 w-4 text-primary-600" />
                <span>Realtime analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="landing-inline-icon h-4 w-4 text-ice-600" />
                <span>Bank-grade security</span>
              </div>
            </div>
          </section>

          {/* Auth card */}
          <section className="order-first min-w-0 lg:order-last lg:justify-self-end">
            <div className="relative mx-auto w-full max-w-md">
              <div className="landing-hero-glow pointer-events-none absolute -inset-10 -z-10" aria-hidden="true" />
              <div className="glass-strong auth-card w-full min-w-0 rounded-[1.75rem] p-5 animate-scale-in sm:p-8">
                <div className="mb-6">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {isLogin
                      ? 'Sign in to your financial command center.'
                      : 'Start building your financial intelligence in minutes.'}
                  </p>
                </div>

                <div className="segmented mb-6 flex w-full" role="tablist" aria-label="Authentication mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isLogin}
                    onClick={() => setIsLogin(true)}
                    className={`segmented-item min-h-[44px] flex-1 text-[13px] sm:min-h-[40px] ${
                      isLogin ? 'segmented-item-active' : ''
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isLogin}
                    onClick={() => setIsLogin(false)}
                    className={`segmented-item min-h-[44px] flex-1 text-[13px] sm:min-h-[40px] ${
                      !isLogin ? 'segmented-item-active' : ''
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
          </section>
        </div>
      </main>
    </div>
  )
}
