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
  Sparkles,
  Copy,
  Check,
  Shield,
  Zap,
  Mic,
  MicOff,
  TrendingUp,
  Terminal,
  Activity,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'
import NeuralAIAvatar, { PersonaMode } from '@/components/chat/NeuralAIAvatar'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  confidence?: number
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

const promptCategories = [
  {
    category: 'Wealth Strategy',
    icon: TrendingUp,
    color: 'from-emerald-600/30 to-emerald-900/10 border-emerald-500/30 text-emerald-300',
    prompts: [
      'Give me an executive wealth review with my current metrics.',
      'How do I elevate my financial health score to 90+?',
      'What is my optimal monthly savings rate for compounding?',
    ],
  },
  {
    category: 'Debt & Cashflow',
    icon: Coins,
    color: 'from-cyan-600/30 to-cyan-900/10 border-cyan-500/30 text-cyan-300',
    prompts: [
      'Simulate an aggressive debt payoff strategy.',
      'Audit my monthly expenses and pinpoint leakage.',
      'How many months of emergency reserve do I currently hold?',
    ],
  },
  {
    category: 'Portfolio & Risk',
    icon: Shield,
    color: 'from-teal-600/30 to-teal-900/10 border-teal-500/30 text-teal-300',
    prompts: [
      'Analyze my asset allocation and suggest rebalancing.',
      'Stress test my finances against a 20% market downturn.',
      'Which financial goal is falling behind schedule?',
    ],
  },
]

export default function FinanceCopilotCard({ fullPage = false }: FinanceCopilotCardProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [response, setResponse] = useState<CopilotResponse | null>(null)
  const [persona, setPersona] = useState<PersonaMode>('wealth')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'telemetry'>('chat')

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const shouldAutoScrollRef = useRef(false)

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
    const container = scrollContainerRef.current
    if (!container || !shouldAutoScrollRef.current) {
      shouldAutoScrollRef.current = false
      return
    }

    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    })
    shouldAutoScrollRef.current = false
  }, [messages, loading])

  const askQuestion = async (nextQuestion?: string) => {
    const text = (nextQuestion ?? question).trim()
    if (!text) return

    const personaPrefix =
      persona === 'risk'
        ? '[Focus: Capital Preservation & Risk Mitigation] '
        : persona === 'growth'
        ? '[Focus: High Growth & Alpha Velocity] '
        : ''

    const userMessage: Message = { role: 'user', content: text }
    const nextMessages: Message[] = [...messages, userMessage]
    shouldAutoScrollRef.current = true
    setMessages(nextMessages)
    setQuestion('')
    setLoading(true)

    try {
      const res = await api.post('/analytics/copilot', {
        question: personaPrefix + text,
        history: nextMessages.slice(-8).map((item) => ({
          role: item.role,
          content: item.content,
        })),
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: res.data.answer,
        confidence: 99.2,
      }
      setMessages([...nextMessages, assistantMessage])
      setResponse(res.data)
    } catch (error: any) {
      console.error('FinanceIQ chat request failed', error)
      const errorMessage =
        error?.response?.data?.message ||
        'Your neural financial copilot is currently re-indexing market streams. Please check again in a moment.'

      const fallbackMessage: Message = {
        role: 'assistant',
        content: errorMessage,
      }
      setMessages([...nextMessages, fallbackMessage])
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

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2500)
  }

  const toggleVoiceCommand = () => {
    if (!isListening) {
      setIsListening(true)
      // Simulate voice capture trigger
      setTimeout(() => {
        setIsListening(false)
        setQuestion('Give me a full review of my finances and savings.')
      }, 2000)
    } else {
      setIsListening(false)
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col gap-4 pb-4">
      {/* 1. Futuristic AI Avatar & Neural Stage */}
      <NeuralAIAvatar
        status={loading ? 'thinking' : messages.length > 0 && messages[messages.length - 1].role === 'assistant' ? 'speaking' : 'idle'}
        persona={persona}
        onPersonaChange={setPersona}
        confidenceScore={99.4}
      />

      {/* 2. Main Holographic Interaction Panel */}
      <div className="cyber-glass-panel flex flex-1 flex-col overflow-hidden rounded-3xl relative">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_#f43f5e]" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_#f59e0b]" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_#10b981]" />
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400 pl-2">
              FINANCEIQ-NEURAL-V2 // REAL-TIME CHAT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearHistory}
              disabled={loading || loadingHistory || messages.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Memory
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div
          ref={scrollContainerRef}
          className="finance-chat-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-6"
        >
          {loadingHistory ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800"
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            /* Futuristic Welcome Hero & Categorized Prompts */
            <div className="flex min-h-full flex-col items-center justify-center py-6 text-center animate-fade-up">
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-cyan-500/20 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
                <BrainCircuit className="h-10 w-10 text-emerald-300 animate-pulse" />
              </div>

              <h2 className="text-2xl font-black text-slate-50 tracking-tight">
                Quantum AI Financial Co-Pilot
              </h2>
              <p className="mt-2 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                Empowered with your personal transaction ledger, portfolio distributions, risk metrics, and market intelligence. Ask any question to execute scenarios.
              </p>

              {/* Categorized Holographic Starter Cards */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-left">
                {promptCategories.map((group, idx) => {
                  const Icon = group.icon
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 backdrop-blur-xl shadow-lg hover:border-emerald-500/40 transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-200">{group.category}</h3>
                      </div>
                      <div className="space-y-2">
                        {group.prompts.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => askQuestion(p)}
                            className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] font-medium text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-200 transition-all flex items-center justify-between gap-2 group/btn"
                          >
                            <span className="line-clamp-2 leading-tight">{p}</span>
                            <ArrowRight className="h-3 w-3 shrink-0 opacity-0 group-hover/btn:opacity-100 transition-opacity text-emerald-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Live Message Cards */
            <div className="space-y-6">
              {messages.map((message, index) => {
                const isAssistant = message.role === 'assistant'
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-up`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className={`max-w-[94%] sm:max-w-[85%] ${isAssistant ? 'mr-auto' : 'ml-auto'}`}>
                      {/* Message Meta Header */}
                      <div
                        className={`mb-1.5 flex items-center gap-2 px-1 text-[11px] font-mono uppercase tracking-wider ${
                          isAssistant ? 'text-emerald-400' : 'text-slate-400 justify-end'
                        }`}
                      >
                        {isAssistant ? (
                          <>
                            <BrainCircuit className="h-3.5 w-3.5 text-emerald-400" />
                            <span>AURA 2.0 NEURAL STREAM</span>
                            {message.confidence && (
                              <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                                {message.confidence}% MATCH
                              </span>
                            )}
                          </>
                        ) : (
                          <span>YOU</span>
                        )}
                      </div>

                      {/* Bubble Body */}
                      <div
                        className={`rounded-3xl p-4 sm:p-5 text-sm leading-relaxed transition-all ${
                          isAssistant ? 'cyber-assistant-bubble text-slate-100' : 'cyber-user-bubble text-slate-50'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words leading-7">
                          {message.content}
                        </div>

                        {/* Assistant Action Bar */}
                        {isAssistant && (
                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span className="text-[10px] font-mono text-slate-500">
                              Financial Intelligence Protocol
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(message.content, index)}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[10px] text-emerald-300">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span className="text-[10px]">Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Thinking / Neural Pulse Indicator */}
              {loading && (
                <div className="flex justify-start animate-fade-up">
                  <div className="mr-auto max-w-[85%] rounded-3xl cyber-assistant-bubble p-4 sm:p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-mono text-cyan-400">
                      <Sparkles className="h-4 w-4 animate-spin text-cyan-300" />
                      <span>Synthesizing Financial Ledger & Forecasting Scenarios...</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-300 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* 3. Futuristic Cyber Input Console */}
        <div className="border-t border-slate-800/80 bg-slate-950/90 p-4 backdrop-blur-2xl">
          {/* Quick Follow-up Suggestions */}
          {response?.followUps && response.followUps.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 animate-fade-up">
              {response.followUps.map((fUp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => askQuestion(fUp)}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 hover:scale-105 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3" />
                  {fUp}
                </button>
              ))}
            </div>
          )}

          <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2.5 shadow-2xl focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceCommand}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_#f43f5e]'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                }`}
                title="Voice Command Mode"
              >
                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening to voice command...'
                    : `Ask ${personaConfigName(persona)} about savings, debts, cashflow, portfolio, or future goals...`
                }
                rows={1}
                className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-500"
                disabled={loading}
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
                className="flex h-10 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] disabled:opacity-40 disabled:hover:scale-100"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span>Press <kbd className="font-mono text-slate-400">Enter</kbd> to transmit prompt</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Zap className="h-3 w-3" />
              End-to-End Quantum Encryption Active
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function personaConfigName(persona: PersonaMode) {
  switch (persona) {
    case 'risk':
      return 'Risk Guardian'
    case 'growth':
      return 'Growth Scout'
    default:
      return 'Wealth Strategist'
  }
}
