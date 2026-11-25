'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import FinanceCopilotCard from '@/components/dashboard/FinanceCopilotCard'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { useAuth } from '@/hooks/useAuth'

export default function ChatPage() {
  const { user, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace('/')
    }
  }, [user, loading, initialized, router])

  if (!initialized || loading || !user) {
    return <LoadingScreen label="Loading your chat workspace..." />
  }

  return (
    <DashboardLayout chatHeader>
      <PageBackground variant="sparkles" />
      <div className="relative z-10 chat-page-bleed min-h-[calc(100dvh-4.5rem)] xl:h-[calc(100dvh-4.5rem)] xl:min-h-0 xl:overflow-hidden">
        <FinanceCopilotCard fullPage />
      </div>
    </DashboardLayout>
  )
}
