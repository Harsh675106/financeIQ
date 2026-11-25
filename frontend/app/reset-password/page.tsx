'use client'

import { Suspense } from 'react'
import { Loader2, TrendingUp } from 'lucide-react'
import ResetPasswordContent from './reset-password-content'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
        <div
          className="glass-strong w-full max-w-md rounded-3xl p-6 text-center sm:p-8"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-2.5">
            <span className="brand-mark h-10 w-10 rounded-xl">
              <TrendingUp className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Finance<span className="text-gradient">IQ</span>
            </span>
          </div>
          <span className="icon-tile icon-tile-lg icon-tile-brand mx-auto mt-8 flex h-14 w-14 rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
