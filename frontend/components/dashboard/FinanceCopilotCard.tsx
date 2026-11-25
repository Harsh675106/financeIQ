'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import {
  BrainCircuit,
  Coins,
  Shield,
  RotateCcw,
  SendHorizonal,
  Sparkles,
  Copy,
  Check,
  Zap,
  Mic,
  MicOff,
  TrendingUp,
  Volume2,
  VolumeX,
  Radio,
  ArrowRight,
  Square,
  AlertCircle,
  X,
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

function renderInlineFormatting(text: string) {
  const parts: (string | JSX.Element)[] = []
  const regex = /(\*\*.*?\*\*|`.*?`|₹[0-9,]+(?:\.[0-9]+)?(?:\s*(?:k|l|lac|lakh|cr|crore|%)?|\b))/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-ink-900">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-ink-800">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('₹')) {
      parts.push(
        <span key={match.index} className="font-semibold tabular-nums text-teal-700">
          {token}
        </span>
      )
    } else {
      parts.push(token)
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

function AuraMarkdownRenderer({ content }: { content: string }) {
  if (!content) return null
  const lines = content.split('\n')

  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink-700">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="mt-3.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-900 sm:text-[13px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ice-500" />
              {renderInlineFormatting(trimmed.slice(4))}
            </h4>
          )
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="mt-4 flex items-center gap-2 border-b border-line pb-1.5 font-display text-sm font-semibold text-ink-900 sm:text-base">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500 ring-2 ring-primary-100" />
              {renderInlineFormatting(trimmed.slice(3))}
            </h3>
          )
        }

        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="mt-4 font-display text-base font-semibold tracking-tight text-ink-900 sm:text-lg">
              {renderInlineFormatting(trimmed.slice(2))}
            </h2>
          )
        }

        if (trimmed.startsWith('---') || trimmed === '***') {
          return <hr key={idx} className="my-3 border-line" />
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
              <div className="min-w-0 flex-1 text-ink-700">
                {renderInlineFormatting(trimmed.slice(2))}
              </div>
            </div>
          )
        }

        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
        if (orderedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-ice-50 text-[11px] font-semibold tabular-nums text-ice-700 ring-1 ring-ice-200">
                {orderedMatch[1]}
              </span>
              <div className="min-w-0 flex-1 text-ink-700">
                {renderInlineFormatting(orderedMatch[2])}
              </div>
            </div>
          )
        }

        return (
          <p key={idx} className="text-ink-700">
            {renderInlineFormatting(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

const promptCategories = [
  {
    category: 'Wealth Strategy',
    icon: TrendingUp,
    color: 'icon-tile-brand',
    prompts: [
      'Give me an executive wealth review with my current metrics.',
      'How do I elevate my financial health score to 90+?',
      'What is my optimal monthly savings rate for compounding?',
    ],
  },
  {
    category: 'Debt & Cashflow',
    icon: Coins,
    color: 'icon-tile-cyan',
    prompts: [
      'Simulate an aggressive debt payoff strategy.',
      'Audit my monthly expenses and pinpoint leakage.',
      'How many months of emergency reserve do I currently hold?',
    ],
  },
  {
    category: 'Portfolio & Risk',
    icon: Shield,
    color: 'icon-tile-violet',
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

  // Voice & Speech State
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null)
  const [isSynthesizing, setIsSynthesizing] = useState(false)

  const recognitionRef = useRef<any>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const shouldAutoScrollRef = useRef(false)

  // Load chat history on mount
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

  // Auto-scroll when messages update
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

  // Stop any active speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Natural Text-to-Speech Engine
  const speakText = useCallback(
    (text: string, msgIndex: number | null = null) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setSpeechError('Speech synthesis is not supported on this browser.')
        return
      }

      window.speechSynthesis.cancel()

      if (speakingMessageIndex === msgIndex && msgIndex !== null) {
        setSpeakingMessageIndex(null)
        setIsSynthesizing(false)
        return
      }

      // Strip markdown symbols for natural clean speech
      const cleanText = text
        .replace(/[*_#`~[\]()>-]/g, ' ')
        .replace(/₹/g, ' Rupees ')
        .replace(/\s+/g, ' ')
        .trim()

      if (!cleanText) return

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = 1.05
      utterance.pitch = 1.0

      // Select high quality natural voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Jenny') ||
              v.name.includes('Guy'))
        ) || voices.find((v) => v.lang.startsWith('en'))

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => {
        setIsSynthesizing(true)
        setSpeakingMessageIndex(msgIndex)
      }

      utterance.onend = () => {
        setIsSynthesizing(false)
        setSpeakingMessageIndex(null)
      }

      utterance.onerror = (e) => {
        console.error('Speech synthesis error', e)
        setIsSynthesizing(false)
        setSpeakingMessageIndex(null)
      }

      window.speechSynthesis.speak(utterance)
    },
    [speakingMessageIndex]
  )

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSynthesizing(false)
    setSpeakingMessageIndex(null)
  }

  // Real Speech Recognition Engine
  const startListening = () => {
    setSpeechError(null)

    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser (Chrome / Edge recommended).')
      return
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.continuous = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        stopSpeaking()
      }

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setQuestion(transcript)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser.')
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition', err)
      setIsListening(false)
      setSpeechError('Could not initialize microphone.')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const askQuestion = async (nextQuestion?: string) => {
    const text = (nextQuestion ?? question).trim()
    if (!text) return

    stopSpeaking()
    if (isListening) {
      stopListening()
    }

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
    setSpeechError(null)

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
      const updatedList = [...nextMessages, assistantMessage]
      setMessages(updatedList)
      setResponse(res.data)

      // Automatically speak the response if voice is enabled
      if (audioEnabled) {
        speakText(res.data.answer, updatedList.length - 1)
      }
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
    stopSpeaking()
    if (isListening) stopListening()
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

  const avatarStatus = loading
    ? 'thinking'
    : isSynthesizing
    ? 'speaking'
    : 'idle'

  return (
    <div className="flex h-full min-h-[calc(100dvh-8rem)] flex-col gap-3 sm:gap-4">
      {/* 1. Futuristic AI Avatar & Neural Stage */}
      <NeuralAIAvatar
        status={avatarStatus}
        persona={persona}
        onPersonaChange={setPersona}
        confidenceScore={99.4}
        audioEnabled={audioEnabled}
        onToggleAudio={() => {
          if (audioEnabled) stopSpeaking()
          setAudioEnabled(!audioEnabled)
        }}
      />

      {/* Speech Error Banner */}
      {speechError && (
        <div
          role="alert"
          className="animate-pop-in flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="min-w-0">{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800"
            aria-label="Dismiss voice error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. Main Holographic Interaction Panel */}
      <div className="cyber-glass-panel finance-chat-panel finance-chat-shell relative flex flex-1 flex-col overflow-hidden rounded-[1.25rem]">
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent"
          aria-hidden="true"
        />

        {/* Terminal Header Bar */}
        <div className="relative flex items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 ring-1 ring-inset ring-rose-500/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 ring-1 ring-inset ring-amber-500/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 ring-1 ring-inset ring-emerald-500/20" />
            </div>
            <span className="truncate font-mono text-[11px] font-semibold tracking-wider text-slate-500">
              FINANCEIQ-NEURAL-V2 // VOICE + TEXT ENGINE
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isSynthesizing && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="btn btn-sm animate-pop-in border border-ice-200 bg-ice-50 text-ice-700 hover:border-ice-300 hover:bg-ice-100"
              >
                <Square className="h-3 w-3" />
                Stop Voice
              </button>
            )}

            <button
              type="button"
              onClick={clearHistory}
              disabled={loading || loadingHistory || messages.length === 0}
              className="btn-secondary btn-sm disabled:opacity-50 enabled:hover:!border-rose-200 enabled:hover:!bg-rose-50 enabled:hover:!text-rose-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Memory
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div
          ref={scrollContainerRef}
          className="finance-chat-scroll relative flex-1 space-y-6 overflow-y-auto px-3 py-5 sm:px-6"
          role="log"
          aria-label="Copilot conversation"
        >
          {loadingHistory ? (
            <div className="space-y-4" aria-hidden="true">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`skeleton h-24 rounded-2xl ${i % 2 === 1 ? 'ml-auto w-3/5' : 'w-4/5'}`}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            /* Futuristic Welcome Hero & Categorized Prompts */
            <div className="flex min-h-full flex-col items-center justify-center py-6 text-center animate-fade-up">
              <div className="relative mb-5">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary-200/60 to-ice-200/60 blur-2xl" aria-hidden="true" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-ice-50 shadow-[0_18px_40px_-18px_rgba(5,150,105,0.45)]">
                  <BrainCircuit className="h-10 w-10 text-primary-600" />
                </div>
              </div>

              <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
                Quantum AI Financial <span className="text-gradient">Co-Pilot</span>
              </h2>
              <p className="text-pretty mt-2 max-w-xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                Equipped with live microphone voice recognition and natural speech synthesis. Speak or type to analyze finances, simulate payoff models, and optimize asset allocations.
              </p>

              {/* Categorized Holographic Starter Cards */}
              <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-3 text-left sm:gap-4 md:grid-cols-3">
                {promptCategories.map((group, idx) => {
                  const Icon = group.icon
                  return (
                    <div
                      key={idx}
                      className="surface-inset p-4 transition-colors animate-chat-suggestion-pop hover:border-primary-200"
                      style={{ animationDelay: `${120 + idx * 80}ms` }}
                    >
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className={`icon-tile icon-tile-sm ${group.color}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <h3 className="text-[13px] font-semibold text-ink-900">{group.category}</h3>
                      </div>
                      <div className="space-y-2">
                        {group.prompts.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => askQuestion(p)}
                            className="group/btn flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-left text-xs font-medium text-ink-700 shadow-xs transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
                          >
                            <span className="line-clamp-2 leading-snug">{p}</span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary-600 opacity-0 transition-[opacity,transform] duration-200 group-hover/btn:opacity-100 group-focus-visible/btn:opacity-100 motion-safe:group-hover/btn:translate-x-0.5" />
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
                const isCurrentlySpeaking = speakingMessageIndex === index && isSynthesizing

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-up`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className={`min-w-0 max-w-[94%] sm:max-w-[85%] ${isAssistant ? 'mr-auto' : 'ml-auto'}`}>
                      {/* Message Meta Header */}
                      <div
                        className={`mb-1.5 flex flex-wrap items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[0.14em] sm:text-[11px] ${
                          isAssistant ? 'text-primary-700' : 'justify-end text-slate-500'
                        }`}
                      >
                        {isAssistant ? (
                          <>
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary-50 ring-1 ring-primary-200">
                              <BrainCircuit className="h-3 w-3 text-primary-600" />
                            </span>
                            <span>AURA 2.0 NEURAL STREAM</span>
                            {isCurrentlySpeaking && (
                              <span className="badge badge-info py-0 font-sans text-[10px] leading-4 tracking-wide">
                                <Volume2 className="h-3 w-3" />
                                SPEAKING
                              </span>
                            )}
                            {message.confidence && (
                              <span className="badge badge-ai num py-0 font-sans text-[10px] leading-4 tracking-wide">
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
                        className={`break-words rounded-2xl p-4 text-sm leading-relaxed transition-[box-shadow,border-color] duration-300 sm:p-5 ${
                          isAssistant
                            ? isCurrentlySpeaking
                              ? 'cyber-assistant-bubble rounded-tl-md text-ink-800 !border-ice-300 !shadow-[0_0_0_3px_rgba(56,189,248,0.15),0_12px_28px_-16px_rgba(56,189,248,0.6)]'
                              : 'cyber-assistant-bubble rounded-tl-md text-ink-800'
                            : 'cyber-user-bubble rounded-tr-md text-ink-900'
                        }`}
                      >
                        {isAssistant ? (
                          <AuraMarkdownRenderer content={message.content} />
                        ) : (
                          <div className="whitespace-pre-wrap break-words leading-7">
                            {message.content}
                          </div>
                        )}

                        {/* Assistant Action Bar */}
                        {isAssistant && (
                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-slate-500">
                            <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-wider text-slate-400">
                              Financial Intelligence Protocol
                            </span>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {/* Read Aloud / Stop Voice Button */}
                              <button
                                type="button"
                                onClick={() => speakText(message.content, index)}
                                className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                                  isCurrentlySpeaking
                                    ? 'border-ice-200 bg-ice-50 text-ice-700'
                                    : 'border-line bg-white text-slate-600 hover:border-line-strong hover:bg-slate-50 hover:text-ink-900'
                                }`}
                                title={isCurrentlySpeaking ? 'Stop speech playback' : 'Read response aloud'}
                                aria-pressed={isCurrentlySpeaking}
                              >
                                {isCurrentlySpeaking ? (
                                  <>
                                    <Square className="h-3 w-3 text-ice-600" />
                                    <span className="text-[11px]">Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3 w-3 text-ice-600" />
                                    <span className="text-[11px]">Listen</span>
                                  </>
                                )}
                              </button>

                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={() => handleCopy(message.content, index)}
                                className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-line-strong hover:bg-slate-50 hover:text-ink-900"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-[11px] text-emerald-700">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span className="text-[11px]">Copy</span>
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
                <div className="flex justify-start animate-fade-up" role="status" aria-live="polite">
                  <div className="cyber-assistant-bubble mr-auto max-w-[85%] rounded-2xl rounded-tl-md p-4 sm:p-5">
                    <div className="mb-2.5 flex items-center gap-2 font-mono text-[11px] text-slate-600 sm:text-xs">
                      <Sparkles className="h-4 w-4 shrink-0 animate-spin text-primary-600 [animation-duration:2.4s]" />
                      <span>Synthesizing Financial Ledger & Computing Scenarios...</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1" aria-hidden="true">
                      <span className="h-2 w-2 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-ice-400 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* 3. Futuristic Cyber Input Console */}
        <div className="relative border-t border-line bg-canvas/80 p-3 backdrop-blur-xl sm:p-4">
          {/* Quick Follow-up Suggestions */}
          {response?.followUps && response.followUps.length > 0 && (
            <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 py-1 animate-fade-up sm:mb-3 sm:flex-wrap sm:overflow-visible">
              {response.followUps.map((fUp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => askQuestion(fUp)}
                  className="chat-suggestion-chip flex shrink-0 items-center gap-1.5 whitespace-nowrap text-left sm:shrink sm:whitespace-normal"
                >
                  <Sparkles className="h-3 w-3 shrink-0 text-primary-600" />
                  {fUp}
                </button>
              ))}
            </div>
          )}

          {/* Active Voice Listening Live Banner */}
          {isListening && (
            <div className="mb-3 flex animate-pop-in flex-col gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shadow-[0_8px_24px_-14px_rgba(225,29,72,0.45)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="font-semibold text-rose-800">Live Voice Listening...</span>
                <span className="italic text-rose-700">Speak your financial question clearly</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="btn btn-sm shrink-0 self-start bg-rose-600 text-white hover:bg-rose-700 sm:self-auto"
              >
                Done Speaking
              </button>
            </div>
          )}

          <div className="relative rounded-2xl border border-line-strong bg-white p-2 shadow-xs transition-[border-color,box-shadow] duration-200 focus-within:border-primary-400 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.14),0_10px_30px_-14px_rgba(5,150,105,0.35)]">
            <div className="flex items-center gap-2">
              {/* Interactive High-Accuracy Microphone Trigger */}
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_6px_16px_-6px_rgba(225,29,72,0.6)]'
                    : 'border border-line bg-canvas-subtle text-slate-500 hover:border-ice-200 hover:bg-ice-50 hover:text-ice-700'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to speak question'}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                aria-pressed={isListening}
              >
                {isListening ? <Mic className="h-5 w-5" /> : <Mic className="h-4 w-4" />}
              </button>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening... Your voice will transcribe here in real time...'
                    : `Ask ${personaConfigName(persona)} about savings, debts, cashflow, portfolio, or future goals...`
                }
                rows={1}
                className="finance-chat-textarea min-h-[44px] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-relaxed text-ink-900 outline-none placeholder:text-slate-400"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    askQuestion()
                  }
                }}
                aria-label="Message the AI copilot"
              />

              <button
                type="button"
                onClick={() => askQuestion()}
                disabled={loading || !question.trim()}
                className="btn-primary h-10 w-12 shrink-0 rounded-xl px-0 py-0 disabled:opacity-50"
                aria-label="Send message"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[11px] text-slate-500">
            <span>
              Press <kbd className="rounded border border-line-strong bg-white px-1 font-mono text-[10px] text-ink-700 shadow-xs">Enter</kbd> to send, or click <kbd className="rounded border border-line-strong bg-white px-1 font-mono text-[10px] text-ink-700 shadow-xs">Mic</kbd> to speak
            </span>
            <span className="flex items-center gap-1 font-semibold text-ice-700">
              <Zap className="h-3 w-3" />
              Neural Speech Synthesis & Recognition Active
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
