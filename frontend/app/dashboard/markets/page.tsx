'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { api } from '@/lib/api'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  BrainCircuit,
  Globe2,
  Newspaper,
  Search,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

interface Asset {
  symbol: string
  label: string
  category: string
  concept: string
  importance: string
  isProxy: boolean
  price: number | null
  priceInInr: number | null
  currency: string
  rawCurrency: string
  displayCurrency: string
  exchange: string | null
  change1D: number | null
  change1W: number | null
  change1M: number | null
  lastUpdated: string | null
}

interface MarketStatusItem {
  marketType: string
  region: string
  primaryExchanges: string
  localOpen: string
  localClose: string
  status: string
  notes: string
}

interface MoversBucket {
  symbol: string
  price: number | null
  priceInInr: number | null
  displayCurrency: string
  changeAmount: number | null
  changePercentage: number | null
  volume: number | null
}

interface NewsItem {
  title: string
  url: string
  source: string
  summary: string
  publishedAt: string
  sentiment: string
  topics: string[]
}

interface Indicator {
  key: string
  label: string
  value: number | null
  unit: string
  importance: string
  lastUpdated: string | null
  delta?: number | null
  direction?: string
}

interface LearnCard {
  title: string
  body: string
}

interface MarketResponse {
  generatedAt: string
  snapshot: {
    assets: Asset[]
    marketStatus: MarketStatusItem[]
    movers: {
      gainers: MoversBucket[]
      losers: MoversBucket[]
      active: MoversBucket[]
    }
    news: NewsItem[]
    sourceStatus: {
      twelveDataConfigured: boolean
      alphaVantageConfigured: boolean
      alphaVantageReason: string | null
      usdInrRate: number | null
    }
  }
  macro: {
    indicators: Indicator[]
    recessionSignal: {
      status: string
      label: string
      detail: string
    }
    sourceStatus: {
      fredConfigured: boolean
    }
  }
  insights: {
    headline: string
    trendNarrative: string
    personalRelevance: string[]
    learnCards: LearnCard[]
    source: string
    userContext: {
      totalDebt: number
      totalSavings: number
      topExpenseCategories: { category: string; total: number }[]
    }
  }
}

interface SearchResponse {
  result: (Asset & {
    instrumentType?: string | null
    country?: string | null
    micCode?: string | null
  }) | null
  reason: string | null
}

function formatSignedPercent(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A'
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatCompactNumber(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A'
  }
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function legacyFormatAssetPrice(asset: Asset) {
  if (asset.priceInInr === null || asset.priceInInr === undefined) {
    return 'N/A'
  }
  return `₹${asset.priceInInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function legacyFormatRupees(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A'
  }
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function legacyFormatOriginalPrice(asset: { price: number | null; rawCurrency?: string; currency?: string; label?: string }) {
  if (asset.price === null || asset.price === undefined || Number.isNaN(asset.price)) {
    return 'N/A'
  }

  const currency = asset.rawCurrency || asset.currency || 'USD'

  if ((asset.label || '') === 'USD/INR' || currency === 'INR') {
    return `₹${asset.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  }

  if (currency === 'USD') {
    return `$${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  return `${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
}

function formatIndicatorValue(indicator: Indicator) {
  if (indicator.value === null || indicator.value === undefined) {
    return 'N/A'
  }
  if (indicator.unit === 'bps') {
    return `${indicator.value.toFixed(0)} ${indicator.unit}`
  }
  if (indicator.unit === '%' || indicator.unit === '% YoY') {
    return `${indicator.value.toFixed(2)} ${indicator.unit}`
  }
  return `${indicator.value.toFixed(2)} ${indicator.unit}`
}

function getChangeTone(value: number | null) {
  if (value === null || value === undefined) return 'text-slate-400 bg-slate-800/70'
  if (value > 0) return 'text-emerald-200 bg-emerald-500/10'
  if (value < 0) return 'text-rose-200 bg-rose-500/10'
  return 'text-slate-200 bg-slate-800/70'
}

function formatPublishedAt(value: string) {
  if (!value) return 'Unknown time'
  const normalized =
    value.length === 15
      ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`
      : value

  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatRupees(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A'
  }
  return `\u20B9${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatAssetPrice(asset: Asset) {
  if (asset.priceInInr === null || asset.priceInInr === undefined) {
    return 'N/A'
  }
  return formatRupees(asset.priceInInr)
}

function formatOriginalPrice(asset: { price: number | null; rawCurrency?: string; currency?: string; label?: string }) {
  if (asset.price === null || asset.price === undefined || Number.isNaN(asset.price)) {
    return 'N/A'
  }

  const currency = asset.rawCurrency || asset.currency || 'USD'

  if ((asset.label || '') === 'USD/INR' || currency === 'INR') {
    return formatRupees(asset.price)
  }

  if (currency === 'USD') {
    return `$${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  return `${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
}

export default function MarketsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<MarketResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResponse['result']>(null)
  const [searchReason, setSearchReason] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      void fetchMarketData()
    }
  }, [user])

  const fetchMarketData = async () => {
    try {
      const response = await api.get('/markets')
      setData(response.data)
    } catch (error) {
      console.error('Failed to fetch market intelligence:', error)
    } finally {
      setLoadingPage(false)
      setRefreshing(false)
    }
  }

  const runSearch = async () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setSearchResult(null)
      setSearchReason(null)
      return
    }

    setSearching(true)
    try {
      const response = await api.get<SearchResponse>('/markets/search', {
        params: { q: trimmed },
      })
      setSearchResult(response.data.result)
      setSearchReason(response.data.reason)
    } catch (error) {
      console.error('Failed to search market asset:', error)
      setSearchResult(null)
      setSearchReason('search_unavailable')
    } finally {
      setSearching(false)
    }
  }

  const trendData = useMemo(() => {
    const assets = data?.snapshot.assets || []
    return assets.map((asset) => ({
      name: asset.label,
      oneDay: asset.change1D ?? 0,
      oneWeek: asset.change1W ?? 0,
      oneMonth: asset.change1M ?? 0,
    }))
  }, [data])

  const pulseData = useMemo(() => {
    const indicators = data?.macro.indicators || []
    return indicators
      .filter((item) => item.value !== null && item.value !== undefined)
      .map((item) => ({
        name: item.label,
        value: item.value || 0,
      }))
  }, [data])

  if (loading || !user || loadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const assets = data?.snapshot.assets || []
  const statuses = data?.snapshot.marketStatus || []
  const movers = data?.snapshot.movers || { gainers: [], losers: [], active: [] }
  const indicators = data?.macro.indicators || []
  const learnCards = data?.insights.learnCards || []
  const personalRelevance = data?.insights.personalRelevance || []
  const news = data?.snapshot.news || []
  const moverSections: Array<{ title: string; items: MoversBucket[] }> = [
    { title: 'Gainers', items: movers.gainers },
    { title: 'Losers', items: movers.losers },
    { title: 'Most Active', items: movers.active },
  ]
  const missingKeys = [
    !data?.snapshot.sourceStatus.twelveDataConfigured ? 'Twelve Data' : null,
    !data?.snapshot.sourceStatus.alphaVantageConfigured ? 'Alpha Vantage' : null,
    !data?.macro.sourceStatus.fredConfigured ? 'FRED' : null,
  ].filter(Boolean)
  const alphaUnavailableReason =
    !data?.snapshot.sourceStatus.alphaVantageConfigured
      ? 'Alpha Vantage API key is missing, so FinanceIQ fallback data is being shown.'
      : data?.snapshot.sourceStatus.alphaVantageReason === 'using_fallback_data'
        ? 'Alpha Vantage free tier is currently slow, so FinanceIQ fallback data is being shown.'
        : 'Live Alpha Vantage data is connected.'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))]" />
          <div className="pointer-events-none absolute -top-8 right-0 h-36 w-36 rounded-full bg-sky-400/10 blur-3xl animate-float-soft" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-primary-500/10 blur-3xl animate-blob-slow" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                <Globe2 className="h-4 w-4" />
                Market Intelligence
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
                  Understand what markets are doing and why it matters to your money.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Live market context, macro signals, useful explanations, and user-relevant insights in one advanced dashboard.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">What it means</p>
                <p className="mt-2 text-base leading-7 text-slate-100">
                  {data?.insights.headline}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Data refresh</p>
                <p className="mt-2 text-lg font-semibold text-slate-50">
                  {data?.generatedAt
                    ? new Date(data.generatedAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Unknown'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">USD/INR</p>
                <p className="mt-2 text-lg font-semibold text-slate-50">
                  {data?.snapshot.sourceStatus.usdInrRate
                    ? `₹${data.snapshot.sourceStatus.usdInrRate.toFixed(2)}`
                    : 'Unavailable'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRefreshing(true)
                  void fetchMarketData()
                }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl transition hover:bg-white/10"
              >
                <div className="flex items-center gap-2 text-slate-200">
                  <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">Refresh intelligence</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Cached market data refreshes from free APIs with fallback handling.
                </p>
              </button>
            </div>
          </div>
        </section>

        {missingKeys.length > 0 ? (
          <div className="rounded-[1.75rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Market Intelligence is running with partial data because these free API keys are not configured yet: {missingKeys.join(', ')}.
          </div>
        ) : null}

        <section className="card card-pad">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Search Any Market Trend</h2>
              <p className="mt-1 text-sm text-slate-400">Search by symbol or name and view the latest trend in both market currency and rupees.</p>
            </div>
            <div className="flex w-full max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void runSearch()
                    }
                  }}
                  placeholder="Search Tesla, Reliance, BTC/USD, AAPL, NIFTY..."
                  className="input w-full pl-11"
                />
              </div>
              <button type="button" onClick={() => void runSearch()} disabled={searching} className="btn-primary">
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchResult ? (
            <div className="mt-5 rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {searchResult.instrumentType || searchResult.category}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-50">{searchResult.label}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {searchResult.symbol}
                    {searchResult.country ? ` | ${searchResult.country}` : ''}
                    {searchResult.exchange ? ` | ${searchResult.exchange}` : ''}
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-3xl font-bold text-slate-50">{formatAssetPrice(searchResult)}</p>
                  <p className="mt-1 text-xs text-slate-400">Original: {formatOriginalPrice(searchResult)}</p>
                  <p className="mt-1 text-xs text-slate-500">Currency: {searchResult.rawCurrency || searchResult.currency}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
                {[
                  ['1D', searchResult.change1D],
                  ['1W', searchResult.change1W],
                  ['1M', searchResult.change1M],
                ].map(([label, value]) => (
                  <div key={label} className={`rounded-xl px-3 py-3 text-center ${getChangeTone(value as number | null)}`}>
                    <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
                    <p className="mt-1 text-sm font-semibold">{formatSignedPercent(value as number | null)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : searchReason ? (
            <div className="mt-5 rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              {searchReason === 'missing_twelve_data_key'
                ? 'Search is unavailable because the Twelve Data API key is missing.'
                : searchReason === 'not_found'
                  ? 'No matching market instrument was found for that search.'
                  : 'Search data is temporarily unavailable. Please try another symbol or try again later.'}
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
          <section className="card card-pad space-y-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">Live Markets</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {assets.map((asset, index) => (
                <div
                  key={asset.symbol}
                  className="rounded-[1.5rem] border border-slate-800/80 bg-slate-900/60 p-4 animate-fade-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{asset.category}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-50">{asset.label}</h3>
                      <p className="mt-1 text-sm text-slate-400">{asset.concept}</p>
                    </div>
                    {asset.isProxy ? (
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400">
                        ETF proxy
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-bold text-slate-50">{formatAssetPrice(asset)}</p>
                      <p className="mt-1 text-xs text-slate-400">Original: {formatOriginalPrice(asset)}</p>
                      <p className="mt-2 text-xs text-slate-500">{asset.importance}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ['1D', asset.change1D],
                      ['1W', asset.change1W],
                      ['1M', asset.change1M],
                    ].map(([label, value]) => (
                      <div key={label} className={`rounded-xl px-3 py-2 text-center ${getChangeTone(value as number | null)}`}>
                        <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
                        <p className="mt-1 text-sm font-semibold">{formatSignedPercent(value as number | null)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="card card-pad">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-primary-300" />
                <h2 className="text-lg font-semibold text-slate-50">Market Status</h2>
              </div>
              <div className="space-y-3">
                {statuses.length === 0 ? (
                  <p className="text-sm text-slate-400">No market status data available.</p>
                ) : (
                  statuses.map((item) => (
                    <div key={`${item.region}-${item.marketType}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{item.region}</p>
                          <p className="text-xs text-slate-500">{item.primaryExchanges || item.marketType}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-wide ${
                          item.status.toLowerCase().includes('open')
                            ? 'bg-emerald-500/10 text-emerald-200'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card card-pad">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="h-5 w-5 text-primary-300" />
                <h2 className="text-lg font-semibold text-slate-50">Personal Relevance</h2>
              </div>
              <div className="space-y-3">
                {personalRelevance.map((item) => (
                  <div key={item} className="rounded-2xl border border-primary-500/15 bg-primary-500/10 p-4 text-sm leading-6 text-primary-100">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">Trend Dashboard</h2>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(2, 6, 23, 0.95)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: 16,
                    }}
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                  />
                  <Bar dataKey="oneDay" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="oneWeek" fill="#34d399" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="oneMonth" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Narrative</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{data?.insights.trendNarrative}</p>
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">Macro Pulse</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {indicators.map((indicator) => (
                <div key={indicator.key} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{indicator.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-50">{formatIndicatorValue(indicator)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{indicator.importance}</p>
                </div>
              ))}
            </div>

            {pulseData.length > 0 ? (
              <div className="mt-6 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pulseData}>
                    <defs>
                      <linearGradient id="marketPulseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(2, 6, 23, 0.95)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: 16,
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="url(#marketPulseFill)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            <div className={`mt-4 rounded-2xl border p-4 ${
              data?.macro.recessionSignal.status === 'warning'
                ? 'border-rose-500/20 bg-rose-500/10'
                : data?.macro.recessionSignal.status === 'caution'
                  ? 'border-amber-500/20 bg-amber-500/10'
                  : 'border-emerald-500/20 bg-emerald-500/10'
            }`}>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Recession signal</p>
              <p className="mt-2 text-lg font-semibold text-slate-50">{data?.macro.recessionSignal.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{data?.macro.recessionSignal.detail}</p>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">Top Movers</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {moverSections.map(({ title, items }) => (
                <div key={title} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-sm font-semibold text-slate-50">{title}</p>
                  <div className="mt-4 space-y-3">
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-400">Unavailable right now. {alphaUnavailableReason}</p>
                    ) : (
                      items.map((item) => (
                        <div key={`${title}-${item.symbol}`} className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
                          <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-100">{item.symbol}</p>
                          <span className={`rounded-full px-2 py-1 text-[11px] ${getChangeTone(item.changePercentage)}`}>
                            {formatSignedPercent(item.changePercentage)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                            Original {item.price !== null ? `$${item.price.toFixed(2)}` : 'N/A'} | INR {formatRupees(item.priceInInr)} | Vol {item.volume !== null ? formatCompactNumber(item.volume) : 'Unavailable'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">News and Sentiment</h2>
            </div>
            <div className="space-y-4">
              {news.length === 0 ? (
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                  Market news feed is currently unavailable. {alphaUnavailableReason}
                </div>
              ) : (
                news.map((item) =>
                  item.url ? (
                    <a
                      key={`${item.url}-${item.title}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4 transition hover:border-sky-400/30 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                              {item.source}
                            </span>
                            <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-sky-200">
                              {item.sentiment}
                            </span>
                          </div>
                          <h3 className="mt-3 text-base font-semibold text-slate-50">{item.title}</h3>
                        </div>
                        <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {item.topics.map((topic) => (
                          <span key={topic} className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-400">
                            {topic}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">{formatPublishedAt(item.publishedAt)}</p>
                    </a>
                  ) : (
                    <div
                      key={`${item.source}-${item.title}`}
                      className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                              {item.source}
                            </span>
                            <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-sky-200">
                              {item.sentiment}
                            </span>
                          </div>
                          <h3 className="mt-3 text-base font-semibold text-slate-50">{item.title}</h3>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {item.topics.map((topic) => (
                          <span key={topic} className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-400">
                            {topic}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">{formatPublishedAt(item.publishedAt)}</p>
                    </div>
                  ),
                )
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">Learn Finance</h2>
            </div>
            <div className="space-y-4">
              {learnCards.map((card, index) => (
                <div
                  key={card.title}
                  className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4 animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <p className="text-base font-semibold text-slate-50">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary-300" />
              <h2 className="text-lg font-semibold text-slate-50">Your Market Context</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total debt</p>
                <p className="mt-3 text-2xl font-semibold text-slate-50">
                  ₹{Math.round(data?.insights.userContext.totalDebt || 0).toLocaleString('en-IN')}
                </p>
                <p className="mt-2 text-sm text-slate-400">Higher-rate environments make debt strategy more important.</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total savings</p>
                <p className="mt-3 text-2xl font-semibold text-slate-50">
                  ₹{Math.round(data?.insights.userContext.totalSavings || 0).toLocaleString('en-IN')}
                </p>
                <p className="mt-2 text-sm text-slate-400">Savings strength affects how well you can absorb macro volatility.</p>
              </div>
            </div>
            <div className="mt-4 rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top expense categories</p>
              <div className="mt-4 space-y-3">
                {(data?.insights.userContext.topExpenseCategories || []).length === 0 ? (
                  <p className="text-sm text-slate-400">Add expense transactions to unlock more personal market relevance.</p>
                ) : (
                  (data?.insights.userContext.topExpenseCategories || []).map((item) => (
                    <div key={item.category} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3">
                      <p className="text-sm text-slate-200">{item.category}</p>
                      <p className="text-sm font-medium text-slate-50">
                        ₹{Math.round(item.total).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
