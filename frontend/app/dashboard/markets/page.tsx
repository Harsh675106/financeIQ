'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import PageHeader from '@/components/ui/PageHeader'
import Reveal from '@/components/motion/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import { api } from '@/lib/api'
import { activeDot, axisProps, barCursor, chartColors, gridProps, tooltipCursor } from '@/lib/chartTheme'
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
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CandlestickChart,
  Clock,
  Globe2,
  IndianRupee,
  Info,
  Landmark,
  Newspaper,
  Search,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
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
  if (value === null || value === undefined) return 'text-slate-500 bg-slate-50 ring-1 ring-inset ring-slate-200'
  if (value > 0) return 'text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200'
  if (value < 0) return 'text-rose-700 bg-rose-50 ring-1 ring-inset ring-rose-200'
  return 'text-ink-700 bg-slate-100 ring-1 ring-inset ring-slate-200'
}

/** Presentational accents for the movers buckets (literal classes for Tailwind). */
const MOVER_STYLES: Record<string, { icon: ComponentType<{ className?: string }>; tile: string }> = {
  Gainers: { icon: TrendingUp, tile: 'icon-tile-emerald' },
  Losers: { icon: TrendingDown, tile: 'icon-tile-rose' },
  'Most Active': { icon: Activity, tile: 'icon-tile-brand' },
}

/** Badge tone for a news sentiment label (bullish = gain, bearish = loss). */
function getSentimentBadge(sentiment: string) {
  const normalized = (sentiment || '').toLowerCase()
  if (normalized.includes('bull')) return 'badge-success'
  if (normalized.includes('bear')) return 'badge-danger'
  return 'badge-info'
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

  const reduceMotion = useReducedMotion()

  if (loading || !user || loadingPage) {
    return (
      <DashboardLayout>
        <PageBackground variant="trend" />
        <div
          className="card relative z-10 flex min-h-[60vh] items-center justify-center p-8"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full bg-primary-200/50 blur-xl" />
              <div className="absolute inset-0 rounded-full border-2 border-line" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-ice-400 border-t-primary-500" />
            </div>
            <p className="text-sm text-slate-500">Loading market insights…</p>
          </div>
        </div>
      </DashboardLayout>
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
      <PageBackground variant="trend" />
      <div className="relative z-10 space-y-6 lg:space-y-8">
        <PageHeader
          eyebrow="Market Intelligence"
          eyebrowIcon={Globe2}
          eyebrowTone="brand"
          title={
            <>
              Understand what <span className="text-gradient">markets</span> are doing and why it matters to your money.
            </>
          }
          description="Live market context, macro signals, useful explanations, and user-relevant insights in one advanced dashboard."
          actions={
            <button
              type="button"
              onClick={() => {
                setRefreshing(true)
                void fetchMarketData()
              }}
              className="btn-secondary h-10"
            >
              <RefreshCcw className={`h-4 w-4 text-primary-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh intelligence</span>
            </button>
          }
        />

        <Reveal variant="rise">
          <section
            className="surface-highlight card-spotlight relative overflow-hidden p-5 shadow-card animate-fade-up sm:p-6"
            style={{ animationDelay: '60ms' }}
          >
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(5,150,105,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(5,150,105,0.06)_1px,transparent_1px)] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_at_top_left,#000_15%,transparent_70%)]" />
            </div>

            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="icon-tile icon-tile-sm icon-tile-violet">
                    <BrainCircuit className="h-4 w-4" />
                  </span>
                  <p className="eyebrow">What it means</p>
                </div>
                <p className="text-pretty mt-4 font-display text-lg font-medium leading-relaxed text-ink-900 sm:text-xl">
                  {data?.insights.headline}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-xl border border-line bg-white/80 p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    <p className="eyebrow">Data refresh</p>
                  </div>
                  <p className="kpi-value mt-2 text-lg">
                    {data?.generatedAt
                      ? new Date(data.generatedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Unknown'}
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    Cached market data refreshes from free APIs with fallback handling.
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-white/80 p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <p className="eyebrow">USD/INR</p>
                  </div>
                  <p className="kpi-value mt-2 text-2xl">
                    {data?.snapshot.sourceStatus.usdInrRate
                      ? `₹${data.snapshot.sourceStatus.usdInrRate.toFixed(2)}`
                      : 'Unavailable'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {missingKeys.length > 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            <span className="icon-tile icon-tile-sm icon-tile-amber">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <p className="min-w-0 pt-1">
              Market Intelligence is running with partial data because these free API keys are not configured yet: {missingKeys.join(', ')}.
            </p>
          </div>
        ) : null}

        <Reveal delay={60}>
          <section className="card card-pad">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <SectionHeader
                icon={Search}
                tone="brand"
                title="Search Any Market Trend"
                subtitle="Search by symbol or name and view the latest trend in both market currency and rupees."
                className="min-w-0"
              />
              <div className="flex w-full gap-2 lg:max-w-xl">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                    className="input h-11 w-full pl-11"
                    aria-label="Search market instruments"
                  />
                </div>
                <button type="button" onClick={() => void runSearch()} disabled={searching} className="btn-primary h-11 shrink-0 px-5">
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {searchResult ? (
              <div className="surface-inset relative mt-5 overflow-hidden p-5 animate-pop-in">
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary-100/80 blur-2xl" aria-hidden="true" />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="eyebrow">
                      {searchResult.instrumentType || searchResult.category}
                    </p>
                    <h3 className="mt-2 break-words font-display text-2xl font-semibold tracking-tight text-ink-900">{searchResult.label}</h3>
                    <p className="mt-1 break-words font-mono text-[13px] text-slate-500">
                      {searchResult.symbol}
                      {searchResult.country ? ` | ${searchResult.country}` : ''}
                      {searchResult.exchange ? ` | ${searchResult.exchange}` : ''}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="kpi-value text-3xl">{formatAssetPrice(searchResult)}</p>
                    <p className="num mt-1 text-xs text-slate-500">Original: {formatOriginalPrice(searchResult)}</p>
                    <p className="mt-1 text-xs text-slate-500">Currency: {searchResult.rawCurrency || searchResult.currency}</p>
                  </div>
                </div>
                <div className="relative mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
                  {[
                    ['1D', searchResult.change1D],
                    ['1W', searchResult.change1W],
                    ['1M', searchResult.change1M],
                  ].map(([label, value]) => (
                    <div key={label} className={`rounded-xl px-3 py-2.5 text-center ${getChangeTone(value as number | null)}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
                      <p className="num mt-0.5 text-sm font-semibold">{formatSignedPercent(value as number | null)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchReason ? (
              <div className="surface-inset mt-5 flex items-start gap-3 p-4 text-sm text-ink-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p className="min-w-0">
                  {searchReason === 'missing_twelve_data_key'
                    ? 'Search is unavailable because the Twelve Data API key is missing.'
                    : searchReason === 'not_found'
                      ? 'No matching market instrument was found for that search.'
                      : 'Search data is temporarily unavailable. Please try another symbol or try again later.'}
                </p>
              </div>
            ) : null}
          </section>
        </Reveal>

        <Reveal className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.55fr)]">
          <section className="card card-pad">
            <SectionHeader icon={CandlestickChart} tone="brand" title="Live Markets" />

            <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {assets.map((asset, index) => (
                <div
                  key={asset.symbol}
                  className="surface-inset surface-inset-hover flex min-w-0 flex-col p-4 animate-fade-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow text-[10px] text-slate-500">{asset.category}</p>
                      <h3 className="mt-1.5 break-words font-display text-base font-semibold tracking-tight text-ink-900">{asset.label}</h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{asset.concept}</p>
                    </div>
                    {asset.isProxy ? (
                      <span className="badge badge-neutral shrink-0 text-[10px] uppercase tracking-wide">
                        ETF proxy
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex-1">
                    <p className="kpi-value break-words text-2xl">{formatAssetPrice(asset)}</p>
                    <p className="num mt-1 text-xs text-slate-500">Original: {formatOriginalPrice(asset)}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{asset.importance}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ['1D', asset.change1D],
                      ['1W', asset.change1W],
                      ['1M', asset.change1M],
                    ].map(([label, value]) => (
                      <div key={label} className={`rounded-lg px-2 py-2 text-center ${getChangeTone(value as number | null)}`}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
                        <p className="num mt-0.5 text-[13px] font-semibold">{formatSignedPercent(value as number | null)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 sm:space-y-6">
            <div className="card card-pad">
              <SectionHeader icon={Landmark} tone="sky" title="Market Status" />
              <div className="mt-5 space-y-2.5">
                {statuses.length === 0 ? (
                  <p className="text-sm text-slate-500">No market status data available.</p>
                ) : (
                  statuses.map((item) => (
                    <div key={`${item.region}-${item.marketType}`} className="surface-inset flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">{item.region}</p>
                        <p className="truncate text-xs text-slate-500">{item.primaryExchanges || item.marketType}</p>
                      </div>
                      <span className={`badge shrink-0 uppercase tracking-wide ${
                        item.status.toLowerCase().includes('open')
                          ? 'badge-success'
                          : 'badge-neutral'
                      }`}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status.toLowerCase().includes('open')
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                          aria-hidden="true"
                        />
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card card-pad">
              <SectionHeader icon={BrainCircuit} tone="violet" title="Personal Relevance" />
              <div className="mt-5 space-y-2.5">
                {personalRelevance.map((item) => (
                  <div key={item} className="surface-inset flex gap-3 p-4 text-sm leading-6 text-ink-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" />
                    <p className="min-w-0">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="card card-pad">
            <SectionHeader
              icon={TrendingUp}
              tone="cyan"
              title="Trend Dashboard"
              actions={
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600" aria-hidden="true">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors.brand }} />
                    1D
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors.ice }} />
                    1W
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors.warning }} />
                    1M
                  </span>
                </div>
              }
            />
            <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-1">
              <div className="h-64 min-w-[30rem] sm:h-80 sm:min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} barGap={2} barCategoryGap="22%">
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" {...axisProps} tickMargin={8} />
                    <YAxis {...axisProps} width={44} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      cursor={barCursor}
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                    />
                    <Bar dataKey="oneDay" name="1D" fill={chartColors.brand} radius={[6, 6, 0, 0]} maxBarSize={18} isAnimationActive={!reduceMotion} />
                    <Bar dataKey="oneWeek" name="1W" fill={chartColors.ice} radius={[6, 6, 0, 0]} maxBarSize={18} isAnimationActive={!reduceMotion} />
                    <Bar dataKey="oneMonth" name="1M" fill={chartColors.warning} radius={[6, 6, 0, 0]} maxBarSize={18} isAnimationActive={!reduceMotion} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="surface-inset mt-5 p-4">
              <p className="eyebrow">Narrative</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{data?.insights.trendNarrative}</p>
            </div>
          </section>

          <section className="card card-pad">
            <SectionHeader icon={Globe2} tone="cyan" title="Macro Pulse" />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {indicators.map((indicator) => (
                <div key={indicator.key} className="surface-inset min-w-0 p-4">
                  <p className="eyebrow text-[10px] text-slate-500">{indicator.label}</p>
                  <p className="kpi-value mt-2 break-words text-xl sm:text-2xl">{formatIndicatorValue(indicator)}</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-slate-500">{indicator.importance}</p>
                </div>
              ))}
            </div>

            {pulseData.length > 0 ? (
              <div className="-mx-1 mt-6 overflow-x-auto px-1 pb-1">
                <div className="h-56 min-w-[28rem] sm:min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pulseData}>
                      <defs>
                        <linearGradient id="marketPulseFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={chartColors.ice} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="name" {...axisProps} tickMargin={8} />
                      <YAxis {...axisProps} width={40} />
                      <Tooltip cursor={tooltipCursor} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartColors.brand}
                        fill="url(#marketPulseFill)"
                        strokeWidth={2.5}
                        activeDot={activeDot}
                        isAnimationActive={!reduceMotion}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            <div className={`mt-4 rounded-2xl border p-4 ${
              data?.macro.recessionSignal.status === 'warning'
                ? 'border-rose-200 bg-rose-50'
                : data?.macro.recessionSignal.status === 'caution'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-emerald-200 bg-emerald-50'
            }`}>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    data?.macro.recessionSignal.status === 'warning'
                      ? 'bg-rose-500 ring-4 ring-rose-500/15'
                      : data?.macro.recessionSignal.status === 'caution'
                        ? 'bg-amber-500 ring-4 ring-amber-500/15'
                        : 'bg-emerald-500 ring-4 ring-emerald-500/15'
                  }`}
                  aria-hidden="true"
                />
                <p className="eyebrow">Recession signal</p>
              </div>
              <p className="mt-2 font-display text-lg font-semibold text-ink-900">{data?.macro.recessionSignal.label}</p>
              <p className="mt-1.5 text-sm leading-6 text-ink-700">{data?.macro.recessionSignal.detail}</p>
            </div>
          </section>
        </Reveal>

        <Reveal className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="card card-pad">
            <SectionHeader icon={Activity} tone="brand" title="Top Movers" />
            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
              {moverSections.map(({ title, items }) => {
                const moverStyle = MOVER_STYLES[title] ?? MOVER_STYLES['Most Active']
                const MoverIcon = moverStyle.icon
                return (
                  <div key={title} className="surface-inset min-w-0 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`icon-tile icon-tile-sm ${moverStyle.tile}`}>
                        <MoverIcon className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-semibold text-ink-900">{title}</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {items.length === 0 ? (
                        <p className="text-[13px] leading-6 text-slate-500">Unavailable right now. {alphaUnavailableReason}</p>
                      ) : (
                        items.map((item) => (
                          <div
                            key={`${title}-${item.symbol}`}
                            className="rounded-xl border border-line bg-white px-3 py-2.5 shadow-xs transition-colors hover:border-line-strong"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="min-w-0 truncate font-mono text-sm font-semibold text-ink-900">{item.symbol}</p>
                              <span className={`num shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${getChangeTone(item.changePercentage)}`}>
                                {formatSignedPercent(item.changePercentage)}
                              </span>
                            </div>
                            <p className="num mt-1.5 text-[11px] leading-5 text-slate-500">
                              Original {item.price !== null ? `$${item.price.toFixed(2)}` : 'N/A'} | INR {formatRupees(item.priceInInr)} | Vol {item.volume !== null ? formatCompactNumber(item.volume) : 'Unavailable'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card card-pad">
            <SectionHeader icon={Newspaper} tone="sky" title="News and Sentiment" />
            <div className="mt-5 space-y-3">
              {news.length === 0 ? (
                <div className="surface-inset flex items-start gap-3 p-4 text-sm text-ink-700">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <p className="min-w-0">Market news feed is currently unavailable. {alphaUnavailableReason}</p>
                </div>
              ) : (
                news.map((item) =>
                  item.url ? (
                    <a
                      key={`${item.url}-${item.title}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group surface-inset surface-inset-hover block p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="badge badge-neutral uppercase tracking-wide">
                              {item.source}
                            </span>
                            <span className={`badge uppercase tracking-wide ${getSentimentBadge(item.sentiment)}`}>
                              {item.sentiment}
                            </span>
                          </div>
                          <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-ink-900 transition-colors group-hover:text-primary-700">{item.title}</h3>
                        </div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-400 shadow-xs transition-colors group-hover:border-primary-200 group-hover:text-primary-600">
                          <ArrowUpRight className="h-4 w-4 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
                        </span>
                      </div>
                      <p className="mt-2.5 text-sm leading-6 text-slate-600">{item.summary}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {item.topics.map((topic) => (
                          <span key={topic} className="rounded-full border border-line bg-white px-2 py-0.5 text-[11px] text-slate-500">
                            {topic}
                          </span>
                        ))}
                      </div>
                      <p className="num mt-3 text-xs text-slate-500">{formatPublishedAt(item.publishedAt)}</p>
                    </a>
                  ) : (
                    <div
                      key={`${item.source}-${item.title}`}
                      className="surface-inset p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="badge badge-neutral uppercase tracking-wide">
                              {item.source}
                            </span>
                            <span className={`badge uppercase tracking-wide ${getSentimentBadge(item.sentiment)}`}>
                              {item.sentiment}
                            </span>
                          </div>
                          <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-ink-900">{item.title}</h3>
                        </div>
                      </div>
                      <p className="mt-2.5 text-sm leading-6 text-slate-600">{item.summary}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {item.topics.map((topic) => (
                          <span key={topic} className="rounded-full border border-line bg-white px-2 py-0.5 text-[11px] text-slate-500">
                            {topic}
                          </span>
                        ))}
                      </div>
                      <p className="num mt-3 text-xs text-slate-500">{formatPublishedAt(item.publishedAt)}</p>
                    </div>
                  ),
                )
              )}
            </div>
          </section>
        </Reveal>

        <Reveal className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="card card-pad">
            <SectionHeader icon={BookOpen} tone="brand" title="Learn Finance" />
            <div className="mt-5 space-y-3">
              {learnCards.map((card, index) => (
                <div
                  key={card.title}
                  className="surface-inset relative overflow-hidden p-4 pl-5 animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span
                    className="absolute inset-y-4 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-primary-500 to-ice-400"
                    aria-hidden="true"
                  />
                  <p className="text-[15px] font-semibold text-ink-900">{card.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card card-pad">
            <SectionHeader icon={Wallet} tone="brand" title="Your Market Context" />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="surface-inset p-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                  <p className="eyebrow">Total debt</p>
                </div>
                <p className="kpi-value mt-2.5 text-2xl">
                  ₹{Math.round(data?.insights.userContext.totalDebt || 0).toLocaleString('en-IN')}
                </p>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-500">Higher-rate environments make debt strategy more important.</p>
              </div>
              <div className="surface-inset p-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  <p className="eyebrow">Total savings</p>
                </div>
                <p className="kpi-value mt-2.5 text-2xl">
                  ₹{Math.round(data?.insights.userContext.totalSavings || 0).toLocaleString('en-IN')}
                </p>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-500">Savings strength affects how well you can absorb macro volatility.</p>
              </div>
            </div>
            <div className="surface-inset mt-3 p-4">
              <p className="eyebrow">Top expense categories</p>
              <div className="mt-3 space-y-2">
                {(data?.insights.userContext.topExpenseCategories || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Add expense transactions to unlock more personal market relevance.</p>
                ) : (
                  (data?.insights.userContext.topExpenseCategories || []).map((item) => (
                    <div key={item.category} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-xs">
                      <p className="min-w-0 truncate text-sm text-ink-800">{item.category}</p>
                      <p className="num shrink-0 text-sm font-semibold text-ink-900">
                        ₹{Math.round(item.total).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </DashboardLayout>
  )
}
