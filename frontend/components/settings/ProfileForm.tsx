'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

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
    return <div className="h-56 rounded-xl bg-slate-800/60 animate-pulse" />
  }

  return (
    <div className="card card-pad card-hover">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-50">Financial Settings</h2>
      </div>

      <form onSubmit={update} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Age</label>
          <input
            type="number"
            min="0"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            className="input max-w-xs"
            placeholder="Optional"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-300">Target Allocation</label>
            <span className={`text-sm font-medium ${allocationTotal === 100 ? 'text-success-300' : 'text-danger-300'}`}>
              {allocationTotal}%
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(allocationLabels) as AllocationKey[]).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-sm text-slate-400">{allocationLabels[key]}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={allocation[key]}
                  onChange={(event) => updateAllocation(key, event.target.value)}
                  className="input"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="btn-primary w-full px-5 sm:w-auto disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {message && <p className="text-sm text-slate-300">{message}</p>}
        </div>
      </form>
    </div>
  )
}
