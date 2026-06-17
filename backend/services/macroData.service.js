const axios = require('axios')

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations'
const CACHE_TTL_MS = 60 * 60 * 1000
const cache = new Map()

const seriesConfig = {
  inflation: {
    id: 'CPIAUCSL',
    label: 'Inflation',
    unit: '% YoY',
    importance: 'Shows how quickly prices are rising across the economy.',
  },
  rates: {
    id: 'FEDFUNDS',
    label: 'Fed Funds Rate',
    unit: '%',
    importance: 'Higher rates can pressure borrowing, valuations, and demand.',
  },
  unemployment: {
    id: 'UNRATE',
    label: 'Unemployment',
    unit: '%',
    importance: 'A cooling labor market can weaken consumer strength and growth.',
  },
  treasury10Y: {
    id: 'DGS10',
    label: '10Y Treasury',
    unit: '%',
    importance: 'This is a key benchmark for discount rates and long-term borrowing.',
  },
  spread10Y2Y: {
    id: 'T10Y2Y',
    label: '10Y-2Y Spread',
    unit: 'bps',
    importance: 'A negative yield spread is a classic recession-risk warning sign.',
  },
}

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (item.expiresAt > Date.now()) {
    return item.value
  }
  return null
}

function getStale(key) {
  return cache.get(key)?.value || null
}

function setCached(key, value, ttlMs = CACHE_TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function parseObservationValue(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function fetchFredSeries(seriesId) {
  const cacheKey = `fred:${seriesId}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const response = await axios.get(FRED_BASE_URL, {
      params: {
        series_id: seriesId,
        api_key: apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit: 24,
      },
      timeout: 15000,
    })

    return setCached(cacheKey, response.data)
  } catch (error) {
    const stale = getStale(cacheKey)
    if (stale) {
      return stale
    }
    console.error(`FRED series error for ${seriesId}:`, error.response?.data || error.message)
    return null
  }
}

function getLatestNumeric(observations, index = 0) {
  const filtered = observations
    .map((item) => ({
      date: item.date,
      value: parseObservationValue(item.value),
    }))
    .filter((item) => item.value !== null)

  return filtered[index] || null
}

async function getMacroPulse() {
  const [inflationData, ratesData, unemploymentData, treasuryData, spreadData] = await Promise.all([
    fetchFredSeries(seriesConfig.inflation.id),
    fetchFredSeries(seriesConfig.rates.id),
    fetchFredSeries(seriesConfig.unemployment.id),
    fetchFredSeries(seriesConfig.treasury10Y.id),
    fetchFredSeries(seriesConfig.spread10Y2Y.id),
  ])

  const inflationSeries = inflationData?.observations || []
  const inflationLatest = getLatestNumeric(inflationSeries, 0)
  const inflationYearAgo = getLatestNumeric(inflationSeries, 12)
  const inflationYoY =
    inflationLatest && inflationYearAgo && inflationYearAgo.value !== 0
      ? round2(((inflationLatest.value - inflationYearAgo.value) / inflationYearAgo.value) * 100)
      : null

  const ratesLatest = getLatestNumeric(ratesData?.observations || [], 0)
  const ratesPrev = getLatestNumeric(ratesData?.observations || [], 1)
  const unemploymentLatest = getLatestNumeric(unemploymentData?.observations || [], 0)
  const unemploymentPrev = getLatestNumeric(unemploymentData?.observations || [], 1)
  const treasuryLatest = getLatestNumeric(treasuryData?.observations || [], 0)
  const treasuryPrev = getLatestNumeric(treasuryData?.observations || [], 1)
  const spreadLatest = getLatestNumeric(spreadData?.observations || [], 0)
  const spreadPrev = getLatestNumeric(spreadData?.observations || [], 1)

  const indicators = [
    {
      key: 'inflation',
      label: seriesConfig.inflation.label,
      value: inflationYoY,
      unit: seriesConfig.inflation.unit,
      importance: seriesConfig.inflation.importance,
      lastUpdated: inflationLatest?.date || null,
      direction: inflationYoY !== null && inflationYoY > 3 ? 'hot' : 'cooling',
    },
    {
      key: 'rates',
      label: seriesConfig.rates.label,
      value: ratesLatest?.value ?? null,
      unit: seriesConfig.rates.unit,
      importance: seriesConfig.rates.importance,
      lastUpdated: ratesLatest?.date || null,
      delta: ratesLatest && ratesPrev ? round2(ratesLatest.value - ratesPrev.value) : null,
      direction: ratesLatest && ratesPrev && ratesLatest.value > ratesPrev.value ? 'up' : 'steady',
    },
    {
      key: 'unemployment',
      label: seriesConfig.unemployment.label,
      value: unemploymentLatest?.value ?? null,
      unit: seriesConfig.unemployment.unit,
      importance: seriesConfig.unemployment.importance,
      lastUpdated: unemploymentLatest?.date || null,
      delta:
        unemploymentLatest && unemploymentPrev
          ? round2(unemploymentLatest.value - unemploymentPrev.value)
          : null,
      direction:
        unemploymentLatest && unemploymentPrev && unemploymentLatest.value > unemploymentPrev.value
          ? 'up'
          : 'steady',
    },
    {
      key: 'treasury10Y',
      label: seriesConfig.treasury10Y.label,
      value: treasuryLatest?.value ?? null,
      unit: seriesConfig.treasury10Y.unit,
      importance: seriesConfig.treasury10Y.importance,
      lastUpdated: treasuryLatest?.date || null,
      delta: treasuryLatest && treasuryPrev ? round2(treasuryLatest.value - treasuryPrev.value) : null,
      direction: treasuryLatest && treasuryPrev && treasuryLatest.value > treasuryPrev.value ? 'up' : 'down',
    },
    {
      key: 'spread10Y2Y',
      label: seriesConfig.spread10Y2Y.label,
      value: spreadLatest?.value !== null && spreadLatest?.value !== undefined ? round2(spreadLatest.value * 100) : null,
      unit: seriesConfig.spread10Y2Y.unit,
      importance: seriesConfig.spread10Y2Y.importance,
      lastUpdated: spreadLatest?.date || null,
      delta:
        spreadLatest && spreadPrev ? round2((spreadLatest.value - spreadPrev.value) * 100) : null,
      direction: spreadLatest && spreadLatest.value < 0 ? 'inverted' : 'positive',
    },
  ]

  const recessionSignal =
    spreadLatest?.value === null || spreadLatest?.value === undefined
      ? {
          status: 'unknown',
          label: 'Signal unavailable',
          detail: 'Yield-spread data is unavailable right now.',
        }
      : spreadLatest.value < 0
        ? {
            status: 'warning',
            label: 'Yield curve inverted',
            detail: 'A negative 10Y-2Y spread often signals tighter financial conditions and slower growth risk.',
          }
        : spreadLatest.value < 0.5
          ? {
              status: 'caution',
              label: 'Curve is flat',
              detail: 'A flat yield curve suggests markets are watching growth and rates carefully.',
            }
          : {
              status: 'healthy',
              label: 'Curve remains positive',
              detail: 'A positive spread suggests the bond market is not flashing a strong recession signal right now.',
            }

  return {
    indicators,
    recessionSignal,
    sourceStatus: {
      fredConfigured: Boolean(process.env.FRED_API_KEY),
    },
  }
}

module.exports = {
  getMacroPulse,
}
