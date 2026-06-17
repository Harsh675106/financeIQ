'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import LandingPage from '@/components/pages/LandingPage'

export default function Home() {
  const { user, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !loading && user) {
      if (user.emailVerified) {
        router.replace('/dashboard')
      }
    }
  }, [user, loading, initialized, router])

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return <LandingPage />
}