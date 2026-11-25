'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import LandingPage from '@/components/pages/LandingPage'
import LoadingScreen from '@/components/ui/LoadingScreen'

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
    return <LoadingScreen label="Loading FinanceIQ..." />
  }

  return <LandingPage />
}