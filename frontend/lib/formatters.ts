/**
 * Safe number parsing and Indian Rupee / Financial formatters.
 * Guarantees that NaN, null, undefined, and non-numeric strings never break calculations or UI renders.
 */

export function safeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? fallback : val
  }
  const cleanStr = String(val).replace(/,/g, '').trim()
  const n = parseFloat(cleanStr)
  return isNaN(n) || !isFinite(n) ? fallback : n
}

export function formatINR(val: any, fallback = '0'): string {
  const n = safeNumber(val, NaN)
  if (isNaN(n)) return fallback
  return Math.round(n).toLocaleString('en-IN')
}

export function formatINRAmount(val: any, fallback = '₹0'): string {
  const n = safeNumber(val, NaN)
  if (isNaN(n)) return fallback
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export function formatPercent(val: any, decimals = 0, fallback = '0%'): string {
  const n = safeNumber(val, NaN)
  if (isNaN(n)) return fallback
  return decimals === 0 ? `${Math.round(n)}%` : `${n.toFixed(decimals)}%`
}
