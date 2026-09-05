import { useState, useEffect } from 'react'
import { getIndiaTimeInfo, IndiaTimeInfo } from '@/lib/timeUtils'

export function useIndiaGreeting(): IndiaTimeInfo {
  // Start with default fallback to avoid hydration mismatch
  const [timeInfo, setTimeInfo] = useState<IndiaTimeInfo>(() => getIndiaTimeInfo())

  useEffect(() => {
    // Update immediately on mount
    setTimeInfo(getIndiaTimeInfo())

    // Update every 30 seconds to catch minute/hour transitions accurately
    const interval = setInterval(() => {
      setTimeInfo(getIndiaTimeInfo())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return timeInfo
}
