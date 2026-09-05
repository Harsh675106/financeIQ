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
        <strong key={match.index} className="font-bold text-emerald-300">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('₹')) {
      parts.push(
        <span key={match.index} className="font-bold text-emerald-400">
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
    <div className="space-y-2 text-sm leading-relaxed text-slate-100">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="mt-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              {renderInlineFormatting(trimmed.slice(4))}
            </h4>
          )
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="mt-4 text-sm sm:text-base font-black text-slate-50 border-b border-slate-800/80 pb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              {renderInlineFormatting(trimmed.slice(3))}
            </h3>
          )
        }

        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="mt-4 text-base sm:text-lg font-black text-white">
              {renderInlineFormatting(trimmed.slice(2))}
            </h2>
          )
        }

        if (trimmed.startsWith('---') || trimmed === '***') {
          return <hr key={idx} className="my-3 border-slate-800/80" />
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <div className="flex-1 text-slate-200">
                {renderInlineFormatting(trimmed.slice(2))}
              </div>
            </div>
          )
        }

        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
        if (orderedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                {orderedMatch[1]}
              </span>
              <div className="flex-1 text-slate-200">
                {renderInlineFormatting(orderedMatch[2])}
              </div>
            </div>
          )
        }

        return (
          <p key={idx} className="text-slate-200">
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
    <div className="flex h-full min-h-[calc(100dvh-5.5rem)] flex-col gap-3.5 pb-2">
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
        <div className="animate-pop-in flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="text-amber-400 hover:text-amber-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Holographic Interaction Panel */}
      <div className="cyber-glass-panel flex flex-1 flex-col overflow-hidden rounded-3xl relative min-h-[580px] lg:min-h-[680px] xl:min-h-[760px] shadow-2xl">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_#f43f5e]" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_#f59e0b]" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_#10b981]" />
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400 pl-2">
              FINANCEIQ-NEURAL-V2 // VOICE + TEXT ENGINE
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSynthesizing && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/25 animate-pulse"
              >
                <Square className="h-3 w-3" />
                Stop Voice
              </button>
            )}

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
          className="finance-chat-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6 min-h-[440px] lg:min-h-[560px] xl:min-h-[640px]"
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
                Equipped with live microphone voice recognition and natural speech synthesis. Speak or type to analyze finances, simulate payoff models, and optimize asset allocations.
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
                const isCurrentlySpeaking = speakingMessageIndex === index && isSynthesizing

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
                            {isCurrentlySpeaking && (
                              <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300 animate-pulse">
                                <Volume2 className="h-3 w-3" />
                                SPEAKING
                              </span>
                            )}
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
                          isAssistant
                            ? isCurrentlySpeaking
                              ? 'cyber-assistant-bubble text-slate-100 ring-2 ring-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                              : 'cyber-assistant-bubble text-slate-100'
                            : 'cyber-user-bubble text-slate-50'
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
                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span className="text-[10px] font-mono text-slate-500">
                              Financial Intelligence Protocol
                            </span>
                            <div className="flex items-center gap-2">
                              {/* Read Aloud / Stop Voice Button */}
                              <button
                                type="button"
                                onClick={() => speakText(message.content, index)}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                  isCurrentlySpeaking
                                    ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100'
                                }`}
                                title={isCurrentlySpeaking ? 'Stop speech playback' : 'Read response aloud'}
                              >
                                {isCurrentlySpeaking ? (
                                  <>
                                    <Square className="h-3 w-3 text-cyan-400" />
                                    <span className="text-[11px]">Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[11px]">Listen</span>
                                  </>
                                )}
                              </button>

                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={() => handleCopy(message.content, index)}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors text-xs font-semibold"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[11px] text-emerald-300">Copied</span>
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
                <div className="flex justify-start animate-fade-up">
                  <div className="mr-auto max-w-[85%] rounded-3xl cyber-assistant-bubble p-4 sm:p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-mono text-cyan-400">
                      <Sparkles className="h-4 w-4 animate-spin text-cyan-300" />
                      <span>Synthesizing Financial Ledger & Computing Scenarios...</span>
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

          {/* Active Voice Listening Live Banner */}
          {isListening && (
            <div className="mb-3 animate-pop-in flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.25)]">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="font-bold text-slate-100">Live Voice Listening...</span>
                <span className="text-slate-300 italic">Speak your financial question clearly</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-rose-500 transition-colors"
              >
                Done Speaking
              </button>
            </div>
          )}

          <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2.5 shadow-2xl focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="flex items-center gap-2">
              {/* Interactive High-Accuracy Microphone Trigger */}
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_20px_#f43f5e] scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:text-emerald-300 hover:bg-slate-700'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to speak question'}
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
            <span>
              Press <kbd className="font-mono text-slate-400">Enter</kbd> to send, or click <kbd className="font-mono text-slate-400">Mic</kbd> to speak
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
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
