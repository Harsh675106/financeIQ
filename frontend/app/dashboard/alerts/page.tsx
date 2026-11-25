'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import PageHeader from '@/components/ui/PageHeader'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { AlertCircle, CheckCircle, X, AlertTriangle, Info, ShieldAlert, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

interface Alert {
  id: number
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  is_read: boolean
  created_at: string
}

interface Recommendation {
  alert_type: string
  severity: 'info' | 'warning' | 'high' | 'critical'
  title: string
  message: string
  recommendation: string
  estimatedMonthlyImpact: number
  confidence: number
  impactScore: number
  whyItTriggered: string
  assumptions: string[]
  whatChangesIfWrong: string
}

export default function AlertsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsResponse, recommendationsResponse] = await Promise.all([
        api.get('/alerts'),
        api.get('/alerts/recommendations'),
      ])
      setAlerts(alertsResponse.data.alerts || [])
      setRecommendations(recommendationsResponse.data.recommendations || [])
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoadingAlerts(false)
    }
  }, [])

  const checkAlerts = useCallback(async () => {
    try {
      await api.post('/alerts/check')
      fetchAlerts()
    } catch (error) {
      console.error('Failed to check alerts:', error)
    }
  }, [fetchAlerts])

  useEffect(() => {
    if (user) {
      fetchAlerts()
      checkAlerts()
    }
  }, [user, fetchAlerts, checkAlerts])

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/alerts/${id}/read`)
      fetchAlerts()
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/alerts/read-all')
      fetchAlerts()
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error)
    }
  }

  const deleteAlert = async (id: number) => {
    try {
      await api.delete(`/alerts/${id}`)
      fetchAlerts()
    } catch (error) {
      console.error('Failed to delete alert:', error)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="icon-tile icon-tile-rose">
            <AlertCircle className="h-[18px] w-[18px]" />
          </span>
        )
      case 'high':
        return (
          <span className="icon-tile icon-tile-rose">
            <AlertTriangle className="h-[18px] w-[18px]" />
          </span>
        )
      case 'warning':
      case 'medium':
        return (
          <span className="icon-tile icon-tile-amber">
            <Info className="h-[18px] w-[18px]" />
          </span>
        )
      default:
        return (
          <span className="icon-tile icon-tile-sky">
            <Info className="h-[18px] w-[18px]" />
          </span>
        )
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-rose-200 bg-rose-50/70'
      case 'high':
        return 'border-rose-200/80 bg-rose-50/40'
      case 'warning':
      case 'medium':
        return 'border-amber-200 bg-amber-50/60'
      default:
        return 'border-sky-200 bg-sky-50/50'
    }
  }

  if (loading || !user) {
    return <LoadingScreen label="Loading risk alerts..." />
  }

  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <DashboardLayout>
      <PageBackground variant="warning" />
      <div className="relative z-10 space-y-6 lg:space-y-8">
        <PageHeader
          eyebrow="Intelligence"
          eyebrowIcon={ShieldAlert}
          eyebrowTone="warning"
          title="Risk Alerts"
          description={
            unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All clear'
          }
          actions={
            unreadCount > 0 ? (
              <button onClick={markAllAsRead} className="btn-primary">
                <CheckCircle className="h-4 w-4" />
                <span>Mark All Read</span>
              </button>
            ) : undefined
          }
        />

        {loadingAlerts ? (
          <div className="space-y-4" aria-busy="true">
            <span className="sr-only">Loading alerts...</span>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card card-pad">
                <div className="flex items-start gap-4">
                  <div className="skeleton h-10 w-10 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2.5">
                    <div className="skeleton h-4 w-1/4" />
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 && recommendations.length === 0 ? (
          <div className="card card-pad animate-fade-up">
            <EmptyState
              icon={CheckCircle}
              tone="emerald"
              title="All Clear"
              description="No active risk alerts at this time"
            />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {recommendations.length > 0 ? (
              <div className="card card-pad animate-fade-up">
                <SectionHeader
                  icon={Sparkles}
                  tone="violet"
                  title="Priority Recommendations"
                  subtitle="Ranked by urgency and expected monthly impact."
                  className="mb-5"
                />
                <div className="space-y-4">
                  {recommendations.map((item, index) => (
                    <div
                      key={`${item.alert_type}-${index}`}
                      className={`rounded-2xl border p-4 sm:p-5 ${getSeverityColor(item.severity)}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="shrink-0">{getSeverityIcon(item.severity)}</div>
                          <div className="min-w-0 space-y-1.5">
                            <h3 className="break-words font-display text-[15px] font-semibold text-ink-900">
                              {item.title}
                            </h3>
                            <p className="break-words text-sm text-ink-700">{item.message}</p>
                            <p className="break-words text-sm text-slate-600">{item.recommendation}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5 pl-[3.25rem] sm:flex-col sm:items-end sm:pl-0">
                          <span className="badge badge-neutral num">{Math.round(item.confidence)}% confidence</span>
                          <span className="badge badge-success num">
                            {Math.round(item.estimatedMonthlyImpact).toLocaleString('en-IN')}/mo impact
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <div className="surface-inset bg-white/80 p-3.5">
                          <p className="eyebrow text-[10px] text-slate-500">Why</p>
                          <p className="mt-2 break-words text-sm text-ink-700">{item.whyItTriggered}</p>
                        </div>
                        <div className="surface-inset bg-white/80 p-3.5">
                          <p className="eyebrow text-[10px] text-slate-500">Assumptions</p>
                          <div className="mt-2 space-y-1">
                            {item.assumptions.map((assumption) => (
                              <p key={assumption} className="break-words text-sm text-ink-700">
                                {assumption}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="surface-inset bg-white/80 p-3.5">
                          <p className="eyebrow text-[10px] text-slate-500">If Assumptions Change</p>
                          <p className="mt-2 break-words text-sm text-ink-700">{item.whatChangesIfWrong}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`card card-pad animate-fade-up transition-opacity ${
                  alert.is_read ? 'opacity-70' : getSeverityColor(alert.severity)
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`badge ${
                            alert.severity === 'critical'
                              ? 'badge-danger'
                              : alert.severity === 'high'
                              ? 'badge-danger'
                              : alert.severity === 'medium'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="num text-xs text-slate-500">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {!alert.is_read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500 ring-4 ring-primary-100">
                          <span className="sr-only">Unread</span>
                        </span>
                      )}
                    </div>
                    <p className="break-words text-ink-900">{alert.message}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {!alert.is_read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="btn-soft btn-sm"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="btn-ghost btn-sm text-rose-600 hover:!bg-rose-50 hover:!text-rose-700"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="btn-icon h-8 w-8"
                    aria-label="Dismiss alert"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
