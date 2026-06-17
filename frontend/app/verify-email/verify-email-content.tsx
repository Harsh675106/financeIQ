'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Cookies from 'js-cookie'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full">
        <div className="card card-pad text-center">
          {status === 'loading' && (
            <>
              <Loader className="h-12 w-12 text-primary-400 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-slate-50 mb-2">Verifying Email</h1>
              <p className="text-slate-400">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-50 mb-2">Email Verified!</h1>
              <p className="text-slate-400 mb-4">{message}</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-50 mb-2">Verification Failed</h1>
              <p className="text-slate-400 mb-4">{message}</p>

              <div className="space-y-3 mb-6">
                <input
                  type="email"
                  className="input w-full"
                  placeholder="Enter your email to resend verification"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resendLoading}
                />

                {resendMessage && (
                  <div className="text-xs text-slate-300">{resendMessage}</div>
                )}

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading || resendCooldown > 0}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading
                    ? 'Sending...'
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                </button>
              </div>

              <button onClick={() => router.push('/')} className="btn-secondary w-full">
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
