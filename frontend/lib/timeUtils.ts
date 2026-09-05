/**
 * Time and Greeting utility functions for India Standard Time (IST - Asia/Kolkata)
 */

export interface IndiaTimeInfo {
  greeting: string
  subtext: string
  period: 'morning' | 'afternoon' | 'evening' | 'night'
  formattedDate: string
  formattedTime: string
  istHour: number
}

/**
 * Gets the current hour (0-23) in India Standard Time (Asia/Kolkata)
 */
export function getIndiaHour(date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    })
    const hourStr = formatter.format(date)
    const hour = parseInt(hourStr, 10)
    return hour === 24 ? 0 : hour
  } catch (err) {
    // Fallback if timezone formatting fails
    const utcHours = date.getUTCHours()
    const utcMinutes = date.getUTCMinutes()
    // IST is UTC + 5:30
    const istTotalMinutes = utcHours * 60 + utcMinutes + 330
    const istHour = Math.floor((istTotalMinutes / 60) % 24)
    return istHour
  }
}

/**
 * Returns the appropriate greeting and contextual information based on Indian Standard Time (IST)
 * 
 * Rules:
 * - 04:00 to 11:59 (4 AM - 11:59 AM): Good morning
 * - 12:00 to 16:59 (12 PM - 4:59 PM): Good afternoon
 * - 17:00 to 21:59 (5 PM - 9:59 PM): Good evening
 * - 22:00 to 03:59 (10 PM - 3:59 AM): Good night
 */
export function getIndiaTimeInfo(date: Date = new Date()): IndiaTimeInfo {
  const hour = getIndiaHour(date)

  let greeting = 'Good morning'
  let subtext = 'Here is your morning financial overview and market pulse.'
  let period: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning'

  if (hour >= 4 && hour < 12) {
    greeting = 'Good morning'
    subtext = 'Start your day with your latest financial snapshot and portfolio performance.'
    period = 'morning'
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon'
    subtext = 'Here is your mid-day wealth analysis, market movements, and budget tracking.'
    period = 'afternoon'
  } else if (hour >= 17 && hour < 22) {
    greeting = 'Good evening'
    subtext = 'Review your daily financial summary, recent transactions, and goal progress.'
    period = 'evening'
  } else {
    greeting = 'Good night'
    subtext = 'Rest easy knowing your automated portfolio insights and alerts are up to date.'
    period = 'night'
  }

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)

  const formattedTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)

  return {
    greeting,
    subtext,
    period,
    formattedDate,
    formattedTime,
    istHour: hour,
  }
}
