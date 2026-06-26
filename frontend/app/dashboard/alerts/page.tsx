'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import { AlertCircle, CheckCircle, X, AlertTriangle, Info } from 'lucide-react'
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
        return <AlertCircle className="h-5 w-5 text-danger-300" />
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-danger-300" />
      case 'warning':
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-300" />
      default:
        return <Info className="h-5 w-5 text-primary-300" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-danger-500/30 bg-danger-500/10'
      case 'high':
        return 'border-danger-500/20 bg-danger-500/10'
      case 'warning':
      case 'medium':
        return 'border-yellow-500/25 bg-yellow-500/10'
      default:
        return 'border-primary-500/25 bg-primary-500/10'
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <DashboardLayout>
      <PageBackground variant="warning" />
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">Risk Alerts</h1>
            <p className="text-slate-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All clear'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-primary"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        {loadingAlerts ? (
          <div className="text-center py-12 text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 && recommendations.length === 0 ? (
          <div className="card card-pad text-center">
            <CheckCircle className="h-16 w-16 text-success-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-50 mb-2">All Clear</h2>
            <p className="text-slate-400">No active risk alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.length > 0 ? (
              <div className="card card-pad">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-50">Priority Recommendations</h2>
                    <p className="text-sm text-slate-400">Ranked by urgency and expected monthly impact.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {recommendations.map((item, index) => (
                    <div
                      key={`${item.alert_type}-${index}`}
                      className={`rounded-2xl border p-4 ${getSeverityColor(item.severity)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(item.severity)}
                            <h3 className="font-semibold text-slate-50">{item.title}</h3>
                          </div>
                          <p className="text-slate-100">{item.message}</p>
                          <p className="text-sm text-slate-300">{item.recommendation}</p>
                        </div>
                        <div className="text-right text-xs text-slate-300 min-w-[110px]">
                          <div>{Math.round(item.confidence)}% confidence</div>
                          <div className="mt-1">
                            {Math.round(item.estimatedMonthlyImpact).toLocaleString('en-IN')}/mo impact
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Why</p>
                          <p className="mt-2 text-sm text-slate-300">{item.whyItTriggered}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Assumptions</p>
                          <div className="mt-2 space-y-1">
                            {item.assumptions.map((assumption) => (
                              <p key={assumption} className="text-sm text-slate-300">
                                {assumption}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">If Assumptions Change</p>
                          <p className="mt-2 text-sm text-slate-300">{item.whatChangesIfWrong}</p>
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
                className={`card card-pad border-2 ${
                  alert.is_read ? 'border-slate-800/70 opacity-70' : getSeverityColor(alert.severity)
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-xl text-xs font-medium ${
                            alert.severity === 'critical'
                              ? 'bg-danger-500/15 text-danger-200 ring-1 ring-danger-500/25'
                              : alert.severity === 'high'
                              ? 'bg-danger-500/10 text-danger-200 ring-1 ring-danger-500/20'
                              : alert.severity === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-200 ring-1 ring-yellow-500/20'
                              : 'bg-primary-500/10 text-primary-200 ring-1 ring-primary-500/20'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {!alert.is_read && (
                        <span className="h-2 w-2 bg-primary-400 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-slate-100">{alert.message}</p>
                    <div className="flex items-center space-x-4 mt-4">
                      {!alert.is_read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-sm text-primary-200 hover:text-primary-100 font-medium"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="text-sm text-danger-300 hover:text-danger-200 font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-5 w-5" />
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
