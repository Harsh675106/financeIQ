'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Cookies from 'js-cookie'
import { CheckCircle, AlertCircle, Loader, ArrowLeft, Mail, TrendingUp } from 'lucide-react'

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

export default function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const verificationAttempted = useRef(false)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return

    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [resendCooldown])

  useEffect(() => {
    if (verificationAttempted.current) return

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided')
        return
      }

      verificationAttempted.current = true

      try {
        const response = await api.post('/auth/verify-email', { token })

        Cookies.set('token', response.data.token, { expires: 7 })

        setStatus('success')
        setMessage('Email verified successfully! Redirecting to dashboard...')

        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } catch (error: any) {
        setStatus('error')
        const errorMessage = error.response?.data?.message || 'Failed to verify email'
        setMessage(errorMessage)
      }
    }

    verifyEmail()
  }, [token, router])

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setResendMessage('Please enter your email address')
      return
    }

    setResendLoading(true)
    setResendMessage('')

    try {
      const response = await api.post('/auth/resend-verification-email', {
        email: email.toLowerCase().trim(),
      })
      setResendMessage('Success: ' + response.data.message)
      setResendCooldown(30)
    } catch (error: any) {
      const retryAfter = Number(error.response?.data?.retryAfter || 0)
      if (error.response?.status === 429 && retryAfter > 0) {
        setResendCooldown(retryAfter)
      }
      setResendMessage(
        'Error: ' + (error.response?.data?.message || 'Failed to resend verification email'),
      )
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="relative isolate w-full max-w-md">
        <div
          className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(112,104,244,0.22),transparent_70%),radial-gradient(50%_40%_at_50%_100%,rgba(34,211,238,0.1),transparent_70%)] blur-2xl"
          aria-hidden="true"
        />

        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 text-center animate-fade-up sm:p-8">
          <div
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent"
            aria-hidden="true"
          />

          <AuthBrand />

          <div className="mt-8">
            {status === 'loading' && (
              <>
                <span className="icon-tile icon-tile-lg icon-tile-brand mx-auto mb-5 flex h-14 w-14 rounded-2xl">
                  <Loader className="h-6 w-6 animate-spin" aria-hidden="true" />
                </span>
                <h1 className="text-2xl font-semibold tracking-tight text-white">Verifying Email</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">Please wait while we verify your email address...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <span className="icon-tile icon-tile-lg icon-tile-emerald mx-auto mb-5 flex h-14 w-14 rounded-2xl">
                  <CheckCircle className="h-6 w-6" aria-hidden="true" />
                </span>
                <h1 className="text-2xl font-semibold tracking-tight text-white">Email Verified!</h1>
                <p className="mt-2 break-words text-sm leading-relaxed text-slate-400">{message}</p>
                <div className="mx-auto mt-6 h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-primary-400" aria-hidden="true" />
              </>
            )}

            {status === 'error' && (
              <>
                <span className="icon-tile icon-tile-lg icon-tile-rose mx-auto mb-5 flex h-14 w-14 rounded-2xl">
                  <AlertCircle className="h-6 w-6" aria-hidden="true" />
                </span>
                <h1 className="text-2xl font-semibold tracking-tight text-white">Verification Failed</h1>
                <p className="mt-2 break-words text-sm leading-relaxed text-slate-400">{message}</p>

                <div className="mt-6 space-y-3 text-left">
                  <div className="group relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary-300"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      className="input w-full pl-10"
                      placeholder="Enter your email to resend verification"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={resendLoading}
                      aria-label="Email address"
                    />
                  </div>

                  {resendMessage && (
                    <div
                      className={`break-words rounded-xl border px-3 py-2 text-xs leading-relaxed ${
                        resendMessage.startsWith('Success:')
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                          : 'border-rose-500/25 bg-rose-500/10 text-rose-200'
                      }`}
                    >
                      {resendMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading || resendCooldown > 0}
                    className="btn-primary btn-lg w-full"
                  >
                    {resendLoading
                      ? 'Sending...'
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend Verification Email'}
                  </button>
                </div>

                <div className="divider my-5" aria-hidden="true" />

                <button onClick={() => router.push('/')} className="btn-secondary w-full">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
