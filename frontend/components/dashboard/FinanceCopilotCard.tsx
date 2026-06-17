'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import {
  BrainCircuit,
  CandlestickChart,
  Coins,
  Landmark,
  PiggyBank,
  Target,
  RotateCcw,
  SendHorizonal,
} from 'lucide-react'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

interface Citation {
  id: string
  type: string
  label: string
  detail: string
  amount?: number
  date?: string
}

interface CopilotResponse {
  answer: string
  citations: Citation[]
  followUps: string[]
  source?: 'groq' | 'local'
  assistantMeta?: {
    style?: string
    usedFinanceData?: boolean
    usedGeneralKnowledge?: boolean
    needsMoreData?: boolean
    missingData?: string[]
  }
}

interface FinanceCopilotCardProps {
  fullPage?: boolean
}

const starters = [
  'Give me a full review of my finances.',
  'How do I improve my financial health score?',
  'How should I pay off my debt?',
  'Build a savings plan using my current numbers.',
  'Which goal is most at risk right now?',
  'How risky is my portfolio and should I rebalance it?',
]

const floatingSuggestions = [
  { label: 'Review my spending this month', align: 'left' as const },
  { label: 'Can I invest more safely?', align: 'right' as const },
  { label: 'Show my strongest savings move', align: 'left' as const },
  { label: 'What should I do with idle cash?', align: 'right' as const },
]

const financeParticles = [
  { Icon: Coins, left: '8%', top: '14%', tone: 'emerald', size: 'h-4 w-4', delay: '0s', duration: '18s' },
  { Icon: CandlestickChart, left: '18%', top: '62%', tone: 'cyan', size: 'h-5 w-5', delay: '3s', duration: '22s' },
  { Icon: PiggyBank, left: '70%', top: '18%', tone: 'teal', size: 'h-5 w-5', delay: '6s', duration: '20s' },
  { Icon: Landmark, left: '82%', top: '52%', tone: 'sky', size: 'h-5 w-5', delay: '2s', duration: '24s' },
  { Icon: Target, left: '52%', top: '10%', tone: 'emerald', size: 'h-4 w-4', delay: '4.5s', duration: '19s' },
]

export default function FinanceCopilotCard({ fullPage = false }: FinanceCopilotCardProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [response, setResponse] = useState<CopilotResponse | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true)
      try {
        const res = await api.get('/analytics/copilot/history')
        setMessages(res.data.messages || [])
      } catch (error) {
        console.error('Failed to load FinanceIQ history', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const askQuestion = async (nextQuestion?: string) => {
    const text = (nextQuestion ?? question).trim()
    if (!text) return

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const res = await api.post('/analytics/copilot', {
        question: text,
        history: nextMessages.slice(-8).map((item) => ({
          role: item.role,
          content: item.content,
        })),
      })

      const assistantMessage = { role: 'assistant' as const, content: res.data.answer }
      setMessages([...nextMessages, assistantMessage])
      setResponse(res.data)
      setQuestion('')
    } catch (error) {
      console.error('FinanceIQ chat request failed', error)
      const errorMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null

      const fallback = {
        answer:
          errorMessage ||
          'Your assistant could not answer right now. Please refresh and check the backend settings.',
        citations: [],
        followUps: [],
        source: 'local' as const,
      }
      setMessages([...nextMessages, { role: 'assistant', content: fallback.answer }])
      setResponse(fallback)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    try {
      await api.delete('/analytics/copilot/history')
      setMessages([])
      setResponse(null)
      setQuestion('')
    } catch (error) {
      console.error('Failed to clear FinanceIQ history', error)
    }
  }

  const outerClassName = fullPage
    ? 'relative overflow-hidden rounded-[1.5rem] border border-slate-800/80 bg-slate-950/80 shadow-2xl backdrop-blur-2xl xl:h-full'
    : 'card card-pad card-hover'

  return (
    <div className={outerClassName}>
      {fullPage ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(16,185,129,0.12),transparent_22%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.12),transparent_24%),linear-gradient(180deg,rgba(8,15,32,0.8),rgba(2,6,23,0.96))]" />
      ) : null}
      {fullPage ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {financeParticles.map((particle, index) => (
            <div
              key={`${particle.left}-${index}`}
              className="chat-finance-particle animate-chat-finance-drift"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            >
              <span className={`chat-finance-particle-symbol finance-particle-${particle.tone}`}>
                <particle.Icon className={particle.size} strokeWidth={1.7} />
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className={fullPage ? 'relative flex h-full min-h-0 flex-col' : ''}>
        <div className="border-b border-slate-800/70 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10 shadow-[0_0_24px_rgba(16,185,129,0.08)]">
                <BrainCircuit className="h-4.5 w-4.5 text-primary-300" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-slate-50">FinanceIQ Assistant</h2>
                <p className="truncate text-xs text-slate-400">
                  Your focused finance workspace
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearHistory}
              disabled={loading || loadingHistory || messages.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="finance-chat-shell flex-1 px-2 pb-2 pt-2 sm:px-3">
          <div className="finance-chat-panel flex min-h-[82vh] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/55 shadow-inner shadow-black/30 xl:h-full xl:min-h-0">
            <div className="finance-chat-scroll flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
              {loadingHistory ? (
                <div className="space-y-4">
                  <div className="h-20 rounded-[1.6rem] bg-slate-800/70 animate-pulse" />
                  <div className="ml-auto h-16 w-3/4 rounded-[1.6rem] bg-slate-800/60 animate-pulse" />
                  <div className="h-24 rounded-[1.6rem] bg-slate-800/70 animate-pulse" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-primary-500/20 bg-primary-500/10 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                    <BrainCircuit className="h-8 w-8 text-primary-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-50">Start a money conversation</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                    Ask about savings, debt, goals, transactions, risk, portfolio, or live finance prices in the context of your money.
                  </p>
                  <div className="mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
                    {starters.slice(0, 4).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => askQuestion(item)}
                        className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 transition hover:border-primary-400 hover:text-primary-200"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${message.id || index}`}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className={`max-w-[94%] sm:max-w-[88%] ${message.role === 'assistant' ? 'mr-auto' : 'ml-auto'}`}>
                        {message.role === 'assistant' ? (
                          <div className="mb-2 flex items-center gap-2 px-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                            <BrainCircuit className="h-3.5 w-3.5 text-primary-300" />
                            Assistant
                          </div>
                        ) : null}

                        <div
                          className={`rounded-[1.6rem] px-4 py-3 text-sm leading-7 sm:px-5 ${
                            message.role === 'user'
                              ? 'bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(56,189,248,0.12))] text-primary-50 ring-1 ring-primary-500/20 shadow-[0_10px_30px_rgba(16,185,129,0.08)]'
                              : 'border border-white/5 bg-slate-800/88 text-slate-200 shadow-[0_12px_36px_rgba(2,6,23,0.24)]'
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading ? (
                    <div className="flex justify-start animate-fade-up">
                      <div className="mr-auto max-w-[82%] rounded-[1.6rem] border border-white/5 bg-slate-800/88 px-4 py-4 shadow-[0_12px_36px_rgba(2,6,23,0.24)]">
                        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          <BrainCircuit className="h-3.5 w-3.5 text-primary-300" />
                          Assistant is thinking
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80 animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300/75 animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-primary-300/80 animate-bounce" />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="border-t border-white/5 bg-[linear-gradient(180deg,rgba(2,6,23,0.14),rgba(2,6,23,0.88))] px-3 py-3 backdrop-blur-xl sm:px-4">
              <div className="rounded-[1.6rem] border border-slate-800/90 bg-slate-900/90 p-3 shadow-[0_-8px_30px_rgba(2,6,23,0.18)]">
                <div className="mb-3 flex flex-wrap gap-2">
                  {floatingSuggestions.map((item, index) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => askQuestion(item.label)}
                      disabled={loading}
                      className={`chat-suggestion-chip animate-chat-suggestion-pop ${
                        item.align === 'right' ? 'sm:ml-auto' : ''
                      }`}
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask about savings, debt, cashflow, goals, transactions, portfolio, risk, or live finance prices..."
                    className="finance-chat-textarea min-h-[56px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
                    disabled={loading}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        askQuestion()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => askQuestion()}
                    disabled={loading || !question.trim()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-[0_10px_26px_rgba(16,185,129,0.26)] transition hover:bg-primary-400 disabled:opacity-50"
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">`Enter` to send, `Shift + Enter` for a new line.</p>
                  {response ? (
                    <span className="rounded-full border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-[11px] text-slate-300">
                      {response.source === 'groq' ? 'Live assistant mode' : 'Finance context mode'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
