'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import { SlidersHorizontal } from 'lucide-react'
import ProfileForm from '@/components/settings/ProfileForm'
import PageHeader from '@/components/ui/PageHeader'
import Reveal from '@/components/motion/Reveal'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <LoadingScreen label="Loading settings..." />
  }

  return (
    <DashboardLayout>
      <PageBackground variant="orbit" />
      <div className="relative z-10 space-y-6 lg:space-y-8">
        <PageHeader
          eyebrow="Preferences"
          eyebrowIcon={SlidersHorizontal}
          eyebrowTone="neutral"
          title="Settings"
          description="Tune your financial profile and target allocation."
        />

        <Reveal className="max-w-4xl">
          <ProfileForm />
        </Reveal>
      </div>
    </DashboardLayout>
  )
}
