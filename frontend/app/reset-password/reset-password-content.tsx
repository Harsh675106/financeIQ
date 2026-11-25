'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, KeyRound, Lock, ShieldCheck, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'

function AuthBrand() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <span className="brand-mark h-10 w-10 rounded-xl">
        <TrendingUp className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-white">
        Finance<span className="text-gradient">IQ</span>
      </span>
    </div>
  )
}

export default function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return setError('Invalid reset link')
    if (password !== confirmPassword) return setError('Passwords do not match')
    setLoading(true)
    setError('')

    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => router.push('/'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success)
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
        <div className="relative isolate w-full max-w-md">
          <div
            className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.16),transparent_70%),radial-gradient(50%_40%_at_50%_100%,rgba(112,104,244,0.14),transparent_70%)] blur-2xl"
            aria-hidden="true"
          />
          <div
            className="glass-strong relative overflow-hidden rounded-3xl p-6 text-center animate-fade-up sm:p-8"
            role="status"
            aria-live="polite"
          >
            <div
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"
              aria-hidden="true"
            />
            <AuthBrand />
            <span className="icon-tile icon-tile-lg icon-tile-emerald mx-auto mb-5 mt-8 flex h-14 w-14 rounded-2xl">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Success!</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Your password has been reset. Redirecting to login...</p>
          </div>
        </div>
      </div>
    )

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="relative isolate w-full max-w-md">
        <div
          className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(112,104,244,0.22),transparent_70%),radial-gradient(50%_40%_at_50%_100%,rgba(34,211,238,0.1),transparent_70%)] blur-2xl"
          aria-hidden="true"
        />
        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 animate-fade-up sm:p-8">
          <div
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent"
            aria-hidden="true"
          />
          <AuthBrand />

          <div className="mb-6 mt-8 text-center">
            <span className="icon-tile icon-tile-lg icon-tile-brand mx-auto mb-5 flex h-14 w-14 rounded-2xl">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Create New Password</h2>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-sm leading-relaxed text-rose-200 animate-fade-in"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary-300"
                aria-hidden="true"
              />
              <input
                type="password"
                placeholder="New Password"
                className="input pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="New Password"
              />
            </div>
            <div className="group relative">
              <ShieldCheck
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary-300"
                aria-hidden="true"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="input pl-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-label="Confirm New Password"
              />
            </div>
            <div className="pt-2">
              <button disabled={loading} className="btn-primary btn-lg w-full">
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
