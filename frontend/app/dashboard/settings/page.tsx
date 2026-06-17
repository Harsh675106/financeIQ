'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { SlidersHorizontal } from 'lucide-react'
import ProfileForm from '@/components/settings/ProfileForm'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="h-7 w-7 text-primary-300" />
          <h1 className="text-3xl font-bold text-slate-50">Settings</h1>
        </div>

        <ProfileForm />
      </div>
    </DashboardLayout>
  )
}
