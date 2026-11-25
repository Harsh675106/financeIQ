interface LoadingScreenProps {
  label?: string
}

/**
 * Full-viewport loader shown while auth/session state resolves.
 */
export default function LoadingScreen({ label = 'Loading your workspace...' }: LoadingScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-2xl" />
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary-400 border-r-cyan-400/70" />
        <div className="brand-mark h-10 w-10 rounded-xl">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="font-display text-sm font-semibold tracking-tight text-slate-100">FinanceIQ</p>
        <p className="mt-1 text-sm text-slate-400">{label}</p>
      </div>
    </div>
  )
}
