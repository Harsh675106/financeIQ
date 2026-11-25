'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { Loader2, PieChart, Save, User, Wallet } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

type AllocationKey = 'equity' | 'debt' | 'gold' | 'liquid'

interface Profile {
  age?: number | string | null
  target_allocation?: Partial<Record<AllocationKey, number | string>> | string | null
}

type AllocationState = Record<AllocationKey, string>

const allocationLabels: Record<AllocationKey, string> = {
  equity: 'Equity',
  debt: 'Debt',
  gold: 'Gold',
  liquid: 'Liquid',
}

const defaultAllocation: AllocationState = {
  equity: '50',
  debt: '30',
  gold: '10',
  liquid: '10',
}

/** Literal accent classes per asset class (dots + allocation strip). */
const allocationAccent: Record<AllocationKey, string> = {
  equity: 'bg-primary-400',
  debt: 'bg-cyan-400',
  gold: 'bg-amber-400',
  liquid: 'bg-violet-400',
}

function normalizeAllocation(targetAllocation: Profile['target_allocation']): AllocationState {
  if (!targetAllocation) {
    return defaultAllocation
  }

  const parsed =
    typeof targetAllocation === 'string'
      ? JSON.parse(targetAllocation || '{}')
      : targetAllocation

  return {
    equity: String(parsed.equity ?? defaultAllocation.equity),
    debt: String(parsed.debt ?? defaultAllocation.debt),
    gold: String(parsed.gold ?? defaultAllocation.gold),
    liquid: String(parsed.liquid ?? defaultAllocation.liquid),
  }
}

export default function ProfileForm() {
  const [age, setAge] = useState('')
  const [allocation, setAllocation] = useState<AllocationState>(defaultAllocation)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/wealth/profiles/me')
        const profile: Profile = res.data.profile || {}

        setAge(profile.age ? String(profile.age) : '')

        try {
          setAllocation(normalizeAllocation(profile.target_allocation))
        } catch {
          setAllocation(defaultAllocation)
        }
      } catch (error) {
        console.error('Profile load failed', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const allocationTotal = useMemo(
    () => Object.values(allocation).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [allocation]
  )

  const updateAllocation = (key: AllocationKey, value: string) => {
    setAllocation((current) => ({ ...current, [key]: value }))
  }

  const update = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    if (allocationTotal !== 100) {
      setMessage('Allocation must add up to 100%.')
      return
    }

    try {
      setSaving(true)

      const targetAllocation = Object.fromEntries(
        Object.entries(allocation).map(([key, value]) => [key, Number(value)])
      )

      await api.put('/wealth/profiles/me', {
        ...(age ? { age: Number(age) } : {}),
        target_allocation: targetAllocation,
      })

      setMessage('Settings saved.')
    } catch (error) {
      console.error('Profile save failed', error)
      setMessage('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card card-pad space-y-6" role="status" aria-label="Loading settings">
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="skeleton h-5 w-44" />
        </div>
        <div className="skeleton h-24 w-full rounded-[0.875rem]" />
        <div className="skeleton h-40 w-full rounded-[0.875rem]" />
      </div>
    )
  }

  return (
    <div className="card card-pad">
      <SectionHeader icon={Wallet} tone="brand" title="Financial Settings" />

      <form onSubmit={update} className="mt-6 space-y-5">
        <section className="surface-inset p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary-300" aria-hidden="true" />
            <label htmlFor="settings-age" className="text-sm font-medium text-slate-200">Age</label>
          </div>
          <input
            id="settings-age"
            type="number"
            min="0"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            className="input num max-w-xs"
            placeholder="Optional"
          />
        </section>

        <section className="surface-inset p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary-300" aria-hidden="true" />
              <label className="text-sm font-medium text-slate-200">Target Allocation</label>
            </div>
            <span className={`badge num ${allocationTotal === 100 ? 'badge-success' : 'badge-danger'}`}>
              {allocationTotal}%
            </span>
          </div>

          <div className="mb-5 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
            {(Object.keys(allocationLabels) as AllocationKey[]).map((key) => (
              <div
                key={key}
                className={`h-full transition-[width] duration-500 ${allocationAccent[key]}`}
                style={{ width: `${Math.max(0, Number(allocation[key]) || 0)}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(allocationLabels) as AllocationKey[]).map((key) => (
              <div key={key}>
                <label htmlFor={`allocation-${key}`} className="label flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${allocationAccent[key]}`} aria-hidden="true" />
                  {allocationLabels[key]}
                </label>
                <div className="relative">
                  <input
                    id={`allocation-${key}`}
                    type="number"
                    min="0"
                    max="100"
                    value={allocation[key]}
                    onChange={(event) => updateAllocation(key, event.target.value)}
                    className="input num pr-9"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500" aria-hidden="true">
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="btn-primary h-11 w-full px-5 sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {message && (
            <p className="text-sm text-slate-300" role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
