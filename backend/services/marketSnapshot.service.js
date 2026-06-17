const axios = require('axios')

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com'
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'
const CACHE_TTL_MS = 15 * 60 * 1000

const cache = new Map()

const trackedAssets = [
  {
    symbol: 'SPY',
    label: 'S&P 500',
    category: 'Equities',
    concept: 'US large-cap equity trend',
    importance: 'Broad proxy for the US stock market.',
    isProxy: true,
  },
  {
    symbol: 'QQQ',
    label: 'Nasdaq 100',
    category: 'Equities',
    concept: 'Growth and technology leadership',
    importance: 'Useful for reading risk appetite and tech-heavy momentum.',
    isProxy: true,
  },
  {
    symbol: 'DIA',
    label: 'Dow Jones',
    category: 'Equities',
    concept: 'Large established companies',
    importance: 'Tracks older blue-chip leadership and defensive sentiment.',
    isProxy: true,
  },
  {
    symbol: 'GLD',
    label: 'Gold',
    category: 'Commodities',
    concept: 'Risk hedge and inflation-sensitive asset',
    importance: 'Gold often strengthens when investors get defensive.',
    isProxy: true,
  },
  {
    symbol: 'USO',
    label: 'Oil',
    category: 'Commodities',
    concept: 'Energy price pressure',
    importance: 'Oil pressure can flow through to inflation and transport costs.',
    isProxy: true,
  },
  {
    symbol: 'USD/INR',
    label: 'USD/INR',
    category: 'FX',
    concept: 'Dollar strength versus rupee',
    importance: 'Important for imported inflation and global investing decisions.',
    isProxy: false,
  },
  {
    symbol: 'BTC/USD',
    label: 'Bitcoin',
    category: 'Crypto',
    concept: 'High-beta crypto sentiment',
    importance: 'Useful as a proxy for speculative appetite and crypto volatility.',
    isProxy: false,
  },
]

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
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
  return value
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function toNumber(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function computePercentChange(current, prior) {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior === 0) {
    return null
  }
  return round2(((current - prior) / prior) * 100)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function inferCategory(type) {
  switch ((type || '').toLowerCase()) {
    case 'etf':
    case 'common stock':
    case 'preferred stock':
    case 'adr':
      return 'Equities'
    case 'cryptocurrency':
      return 'Crypto'
    case 'currency':
    case 'physical currency':
      return 'FX'
    case 'index':
      return 'Index'
    default:
      return 'Markets'
  }
}

function convertPriceToInr(price, currency, usdInrRate) {
  if (!Number.isFinite(price)) return null
  if (currency === 'INR') return round2(price)
  if ((currency === 'USD' || !currency) && Number.isFinite(usdInrRate)) {
    return round2(price * usdInrRate)
  }
  return round2(price)
}

function normalizeTrackedAsset(rawAsset, usdInrRate) {
  if (!rawAsset) return null

  const displayPriceInInr = convertPriceToInr(rawAsset.price, rawAsset.currency, usdInrRate)

  return {
    ...rawAsset,
    rawCurrency: rawAsset.currency || 'USD',
    priceInInr: displayPriceInInr,
    displayCurrency: 'INR',
  }
}

async function fetchTwelveDataSeries(asset) {
  const cacheKey = `twelve-series:${asset.symbol}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/time_series`, {
      params: {
        symbol: asset.symbol,
        interval: '1day',
        outputsize: 30,
        apikey: apiKey,
      },
      timeout: 15000,
    })

    if (response.data?.status === 'error') {
      throw new Error(response.data?.message || `Twelve Data error for ${asset.symbol}`)
    }

    const values = Array.isArray(response.data?.values) ? response.data.values : []
    if (values.length < 2) {
      throw new Error(`Not enough Twelve Data observations for ${asset.symbol}`)
    }

    const latest = toNumber(values[0]?.close)
    const previous = toNumber(values[1]?.close)
    const weekAgo = toNumber(values[Math.min(5, values.length - 1)]?.close)
    const monthAgo = toNumber(values[Math.min(21, values.length - 1)]?.close)

    const parsed = {
      symbol: asset.symbol,
      label: asset.label,
      category: asset.category,
      concept: asset.concept,
      importance: asset.importance,
      isProxy: asset.isProxy,
      price: latest,
      currency: response.data?.meta?.currency || (asset.category === 'FX' ? 'INR' : 'USD'),
      exchange: response.data?.meta?.exchange || null,
      change1D: computePercentChange(latest, previous),
      change1W: computePercentChange(latest, weekAgo),
      change1M: computePercentChange(latest, monthAgo),
      lastUpdated: response.data?.values?.[0]?.datetime || null,
    }

    return setCached(cacheKey, parsed)
  } catch (error) {
    const stale = getStale(cacheKey)
    if (stale) {
      return stale
    }
    console.error(`Market series error for ${asset.symbol}:`, error.response?.data || error.message)
    return null
  }
}

async function fetchAlphaVantage(params, cacheKey, ttlMs = CACHE_TTL_MS) {
  const cached = getCached(cacheKey)
  if (cached) return cached

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        ...params,
        apikey: apiKey,
      },
      timeout: 15000,
    })

    const data = response.data
    if (data?.Note || data?.Information || data?.['Error Message']) {
      throw new Error(data.Note || data.Information || data['Error Message'])
    }

    return setCached(cacheKey, data, ttlMs)
  } catch (error) {
    const stale = getStale(cacheKey)
    if (stale) {
      return stale
    }
    console.error(`Alpha Vantage error for ${cacheKey}:`, error.response?.data || error.message)
    return null
  }
}

async function getUsdInrRate() {
  const fx = await fetchTwelveDataSeries({
    symbol: 'USD/INR',
    label: 'USD/INR',
    category: 'FX',
    concept: 'Dollar strength versus rupee',
    importance: 'Important for imported inflation and global investing decisions.',
    isProxy: false,
  })

  return fx?.price || null
}

async function getMarketStatus() {
  const now = new Date()
  const day = now.getUTCDay()
  const weekday = day >= 1 && day <= 5
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()

  const usOpen = 13 * 60 + 30
  const usClose = 20 * 60
  const indiaOpen = 3 * 60 + 45
  const indiaClose = 10 * 60

  const getStatus = (open, close) => {
    if (!weekday) return 'closed'
    if (utcMinutes < open) return 'pre-market'
    if (utcMinutes > close) return 'closed'
    return 'open'
  }

  return [
    {
      marketType: 'equity',
      region: 'United States',
      primaryExchanges: 'NYSE / Nasdaq',
      localOpen: '09:30',
      localClose: '16:00',
      status: getStatus(usOpen, usClose),
      notes: 'Estimated from market hours to reduce third-party API pressure.',
    },
    {
      marketType: 'equity',
      region: 'India',
      primaryExchanges: 'NSE / BSE',
      localOpen: '09:15',
      localClose: '15:30',
      status: getStatus(indiaOpen, indiaClose),
      notes: 'Estimated from market hours to reduce third-party API pressure.',
    },
  ]
}

async function getTopMovers(usdInrRate) {
  const data = await fetchAlphaVantage(
    { function: 'TOP_GAINERS_LOSERS' },
    'alpha:top-movers',
    4 * 60 * 60 * 1000,
  )

  const normalize = (items) =>
    (Array.isArray(items) ? items : []).slice(0, 5).map((item) => {
      const price = toNumber(item.price)
      return {
        symbol: item.ticker,
        price,
        priceInInr: convertPriceToInr(price, 'USD', usdInrRate),
        displayCurrency: 'INR',
        changeAmount: toNumber(item.change_amount),
        changePercentage: toNumber(String(item.change_percentage || '').replace('%', '')),
        volume: toNumber(item.volume),
      }
    })

  return {
    gainers: normalize(data?.top_gainers),
    losers: normalize(data?.top_losers),
    active: normalize(data?.most_actively_traded),
    available: Boolean(data),
  }
}

function buildFallbackMovers(assets) {
  const normalized = (assets || [])
    .filter((asset) => asset && asset.price !== null)
    .map((asset) => ({
      symbol: asset.symbol,
      price: asset.price,
      priceInInr: asset.priceInInr,
      displayCurrency: 'INR',
      changeAmount:
        asset.change1D !== null && asset.price !== null
          ? round2((asset.price * asset.change1D) / 100)
          : null,
      changePercentage: asset.change1D,
      volume: null,
    }))

  const byChangeDesc = [...normalized].sort(
    (left, right) => (right.changePercentage ?? Number.NEGATIVE_INFINITY) - (left.changePercentage ?? Number.NEGATIVE_INFINITY),
  )
  const byChangeAsc = [...normalized].sort(
    (left, right) => (left.changePercentage ?? Number.POSITIVE_INFINITY) - (right.changePercentage ?? Number.POSITIVE_INFINITY),
  )
  const byMomentum = [...normalized].sort(
    (left, right) => Math.abs(right.changePercentage ?? 0) - Math.abs(left.changePercentage ?? 0),
  )

  return {
    gainers: byChangeDesc.slice(0, 5),
    losers: byChangeAsc.slice(0, 5),
    active: byMomentum.slice(0, 5),
    available: false,
    isFallback: true,
  }
}

async function getMarketNews() {
  const data = await fetchAlphaVantage(
    {
      function: 'NEWS_SENTIMENT',
      topics: 'financial_markets,economy_macro,technology',
      sort: 'LATEST',
      limit: 8,
    },
    'alpha:market-news',
    90 * 60 * 1000,
  )

  return {
    items: (Array.isArray(data?.feed) ? data.feed : []).slice(0, 8).map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      summary: item.summary,
      publishedAt: item.time_published,
      sentiment: item.overall_sentiment_label || 'Neutral',
      topics: (Array.isArray(item.topics) ? item.topics : [])
        .slice(0, 3)
        .map((topic) => topic.topic),
    })),
    available: Boolean(data),
  }
}

function buildFallbackNews(snapshotAssets, macroIndicators) {
  const findAsset = (label) => snapshotAssets.find((item) => item.label === label)
  const findIndicator = (key) => macroIndicators.find((item) => item.key === key)

  const equity = findAsset('S&P 500')
  const gold = findAsset('Gold')
  const oil = findAsset('Oil')
  const bitcoin = findAsset('Bitcoin')
  const usdInr = findAsset('USD/INR')
  const inflation = findIndicator('inflation')
  const rates = findIndicator('rates')

  const briefs = [
    {
      title: 'Risk appetite check',
      source: 'FinanceIQ Brief',
      summary:
        (gold?.change1W ?? 0) > (equity?.change1W ?? 0)
          ? 'Gold is outperforming broad equities this week, which usually points to a more defensive market tone.'
          : 'Equities are holding up against defensive assets this week, suggesting investors are still willing to take some risk.',
      publishedAt: new Date().toISOString(),
      sentiment: (equity?.change1W ?? 0) >= 0 ? 'Constructive' : 'Cautious',
      topics: ['markets', 'equities', 'risk'],
      url: '',
    },
    {
      title: 'Inflation pressure watch',
      source: 'FinanceIQ Brief',
      summary:
        (oil?.change1M ?? 0) > 0 || (inflation?.value ?? 0) > 3
          ? 'Oil and inflation-sensitive signals are still worth watching because they can feed into living costs, transport, and rate expectations.'
          : 'Inflation-sensitive assets are not flashing a major new warning right now, though commodity shocks can still change the picture quickly.',
      publishedAt: new Date().toISOString(),
      sentiment: (oil?.change1M ?? 0) > 3 ? 'Inflationary' : 'Balanced',
      topics: ['inflation', 'oil', 'macro'],
      url: '',
    },
    {
      title: 'Rates and currency monitor',
      source: 'FinanceIQ Brief',
      summary:
        (rates?.value ?? 0) >= 4
          ? `Policy rates remain elevated near ${rates?.value?.toFixed?.(2) || rates?.value}${rates?.unit || '%'}. That keeps debt costs important, especially if USD/INR stays firm.`
          : 'Rates are not at extreme highs right now, but currency and yield moves still matter for debt and investment planning.',
      publishedAt: new Date().toISOString(),
      sentiment: (usdInr?.change1M ?? 0) > 0 ? 'Watchful' : 'Stable',
      topics: ['rates', 'fx', 'debt'],
      url: '',
    },
    {
      title: 'Speculative trend pulse',
      source: 'FinanceIQ Brief',
      summary:
        (bitcoin?.change1W ?? 0) > 0
          ? 'Bitcoin strength this week suggests speculative appetite is alive, but that usually comes with higher volatility.'
          : 'Bitcoin weakness suggests traders are not leaning aggressively into speculative assets right now.',
      publishedAt: new Date().toISOString(),
      sentiment: (bitcoin?.change1W ?? 0) > 0 ? 'Risk-on' : 'Risk-off',
      topics: ['crypto', 'sentiment', 'volatility'],
      url: '',
    },
  ]

  return briefs
}

async function searchMarketAsset(query) {
  const trimmed = String(query || '').trim()
  if (!trimmed) {
    return null
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) {
    return {
      result: null,
      reason: 'missing_twelve_data_key',
    }
  }

  const usdInrRate = await getUsdInrRate()
  const cacheKey = `market-search:${trimmed.toLowerCase()}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const searchResponse = await axios.get(`${TWELVE_DATA_BASE_URL}/symbol_search`, {
      params: {
        symbol: trimmed,
        outputsize: 6,
        apikey: apiKey,
      },
      timeout: 15000,
    })

    const matches = Array.isArray(searchResponse.data?.data) ? searchResponse.data.data : []
    const bestMatch =
      matches.find((item) => String(item.symbol || '').toLowerCase() === trimmed.toLowerCase()) ||
      matches[0]

    if (!bestMatch?.symbol) {
      const emptyResult = { result: null, reason: 'not_found' }
      return setCached(cacheKey, emptyResult, 5 * 60 * 1000)
    }

    const series = await fetchTwelveDataSeries({
      symbol: bestMatch.symbol,
      label: bestMatch.instrument_name || bestMatch.symbol,
      category: inferCategory(bestMatch.instrument_type),
      concept: bestMatch.exchange || bestMatch.country || 'Search result',
      importance: `Matched ${bestMatch.symbol} from ${bestMatch.exchange || bestMatch.country || 'market data'}.`,
      isProxy: false,
    })

    if (!series) {
      const emptyResult = { result: null, reason: 'series_unavailable' }
      return setCached(cacheKey, emptyResult, 5 * 60 * 1000)
    }

    const result = {
      result: {
        ...normalizeTrackedAsset(series, usdInrRate),
        instrumentType: bestMatch.instrument_type || null,
        country: bestMatch.country || null,
        micCode: bestMatch.mic_code || null,
      },
      reason: null,
    }

    return setCached(cacheKey, result)
  } catch (error) {
    const stale = getStale(cacheKey)
    if (stale) {
      return stale
    }
    console.error('Market search error:', error.response?.data || error.message)
    return {
      result: null,
      reason: 'search_unavailable',
    }
  }
}

async function getMarketSnapshot() {
  const usdInrRate = await getUsdInrRate()
  const [assets, marketStatus] = await Promise.all([
    Promise.all(trackedAssets.map((asset) => fetchTwelveDataSeries(asset))),
    getMarketStatus(),
  ])
  const normalizedAssets = assets.filter(Boolean).map((asset) => normalizeTrackedAsset(asset, usdInrRate))

  const liveMovers = await getTopMovers(usdInrRate)
  await sleep(1200)
  const liveNews = await getMarketNews()
  const movers = liveMovers?.available ? liveMovers : buildFallbackMovers(normalizedAssets)

  const alphaConfigured = Boolean(process.env.ALPHA_VANTAGE_API_KEY)
  const alphaLiveAvailable = Boolean(liveMovers?.available || liveNews?.available)
  const newsItems = liveNews?.available
    ? liveNews.items
    : buildFallbackNews(normalizedAssets, [])
  const alphaReason = alphaConfigured
    ? alphaLiveAvailable
      ? null
      : 'using_fallback_data'
    : 'missing_api_key'

  return {
    assets: normalizedAssets,
    marketStatus,
    movers: movers || { gainers: [], losers: [], active: [], available: false, isFallback: true },
    news: newsItems,
    sourceStatus: {
      twelveDataConfigured: Boolean(process.env.TWELVE_DATA_API_KEY),
      alphaVantageConfigured: alphaConfigured,
      alphaVantageReason: alphaReason,
      usdInrRate,
    },
  }
}

module.exports = {
  getMarketSnapshot,
  searchMarketAsset,
}
