'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
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
      <div className="form-page-center">
        <div className="card card-pad form-shell text-center bg-slate-900 border-emerald-500/30">
          <h2 className="text-2xl font-bold text-emerald-400 mb-2">Success!</h2>
          <p className="text-slate-300">Your password has been reset. Redirecting to login...</p>
        </div>
      </div>
    )

  return (
    <div className="form-page-center">
      <div className="card card-pad form-shell">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create New Password</h2>
        {error && <div className="p-3 mb-4 bg-red-500/10 text-red-400 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 form-shell">
          <input
            type="password"
            placeholder="New Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
