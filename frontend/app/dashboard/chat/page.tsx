'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import FinanceCopilotCard from '@/components/dashboard/FinanceCopilotCard'
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-800"></div>
          <div className="absolute top-0 h-16 w-16 rounded-full border-t-4 border-primary-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-400 text-sm">Loading your chat workspace...</p>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="chat-page-bleed xl:h-[calc(100dvh-4.75rem)] xl:min-h-0 xl:overflow-hidden">
        <FinanceCopilotCard fullPage />
      </div>
    </DashboardLayout>
  )
}
