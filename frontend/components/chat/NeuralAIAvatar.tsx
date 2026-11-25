'use client'

import React from 'react'
import {
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Shield,
  TrendingUp,
  BrainCircuit,
  Radio,
  Cpu,
} from 'lucide-react'

export type PersonaMode = 'wealth' | 'risk' | 'growth'

interface NeuralAIAvatarProps {
  status: 'idle' | 'thinking' | 'speaking'
  persona: PersonaMode
  onPersonaChange: (persona: PersonaMode) => void
  confidenceScore?: number
  audioEnabled?: boolean
  onToggleAudio?: () => void
}

export default function NeuralAIAvatar({
  status,
  persona,
  onPersonaChange,
  confidenceScore = 99.4,
  audioEnabled = true,
  onToggleAudio,
}: NeuralAIAvatarProps) {
  const personaConfig = {
    wealth: {
      name: 'AURA 2.0 • Wealth Strategist',
      role: 'Macro Capital & Portfolio Allocation',
      icon: TrendingUp,
      accent: 'text-primary-300',
      badgeBg: 'badge-brand',
      glow: 'rgba(112, 104, 244, 0.65)',
    },
    risk: {
      name: 'AURA 2.0 • Risk Guardian',
      role: 'Stress Testing & Capital Protection',
      icon: Shield,
      accent: 'text-cyan-300',
      badgeBg: 'badge-info',
      glow: 'rgba(34, 211, 238, 0.55)',
    },
    growth: {
      name: 'AURA 2.0 • Growth Scout',
      role: 'Alpha Velocity & Savings Accelerators',
      icon: Zap,
      accent: 'text-violet-300',
      badgeBg: 'badge-ai',
      glow: 'rgba(167, 139, 250, 0.65)',
    },
  }

  const currentPersona = personaConfig[persona]

  return (
    <div className="cyber-glass-panel relative overflow-hidden rounded-[1.25rem] p-4 animate-fade-up sm:p-5">
      {/* Decorative layer: holographic scanlines + persona-tinted aurora */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(138,136,251,0.35)_51%)] bg-[length:100%_4px] opacity-[0.06]" />
        <div
          className="absolute -left-14 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: `radial-gradient(circle, ${currentPersona.glow}, transparent 70%)` }}
        />
        <div className="absolute -bottom-24 right-6 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/50 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
        {/* Left: 3D Holographic Quantum Core Avatar */}
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div className="relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center sm:h-24 sm:w-24">
            {/* Outer Orbit Ring 1 */}
            <div
              className={`absolute inset-0 rounded-full border border-primary-300/35 ${
                status === 'thinking'
                  ? 'animate-spin [animation-duration:2.5s]'
                  : status === 'speaking'
                  ? 'animate-spin [animation-duration:5s]'
                  : 'neural-avatar-orbit-1'
              }`}
              style={{ boxShadow: `0 0 24px -6px ${currentPersona.glow}` }}
            >
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-primary-200 shadow-[0_0_10px_#8a88fb]" />
            </div>

            {/* Inner Orbit Ring 2 */}
            <div
              className={`absolute inset-2 rounded-full border border-dashed border-cyan-300/30 ${
                status === 'thinking'
                  ? 'animate-spin [animation-duration:1.8s] [animation-direction:reverse]'
                  : status === 'speaking'
                  ? 'animate-spin [animation-duration:4s] [animation-direction:reverse]'
                  : 'neural-avatar-orbit-2'
              }`}
            >
              <div className="absolute bottom-0 right-1/2 h-1.5 w-1.5 translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
            </div>

            {/* Glowing Quantum Core Sphere */}
            <div
              className="neural-avatar-core relative flex h-11 w-11 items-center justify-center rounded-full border border-primary-200/50 bg-[radial-gradient(circle_at_32%_26%,rgba(199,205,255,0.85)_0%,rgba(112,104,244,0.85)_30%,rgba(76,52,170,0.9)_62%,#0b0c1d_100%)] transition-transform duration-500 sm:h-14 sm:w-14"
              style={{
                boxShadow: `0 0 26px ${currentPersona.glow}, inset 0 0 16px rgba(169, 172, 255, 0.45)`,
              }}
            >
              <BrainCircuit
                className={`h-5 w-5 sm:h-7 sm:w-7 ${
                  status === 'thinking'
                    ? 'text-cyan-100 animate-pulse'
                    : status === 'speaking'
                    ? 'text-white motion-safe:scale-110 animate-bounce-subtle'
                    : 'text-primary-50'
                } drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] transition-[color,transform] duration-300`}
              />

              {/* Ping Ring for Live State */}
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex h-full w-full rounded-full border-2 border-[#0b0c1d] bg-emerald-400"></span>
              </span>
            </div>
          </div>

          {/* Persona Identity & Telemetry Details */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge min-w-0 max-w-full ${currentPersona.badgeBg}`}>
                <Radio className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {status === 'thinking'
                    ? 'NEURAL COMPUTE ACTIVE'
                    : status === 'speaking'
                    ? 'VOICE SPEECH STREAMING'
                    : 'NEURAL CORE SYNCHRONIZED'}
                </span>
              </span>
              <span className="badge badge-neutral num hidden font-mono sm:inline-flex">
                <Cpu className="h-3 w-3 text-cyan-300" />
                {confidenceScore}% ACCURACY
              </span>
            </div>

            <h1 className="text-balance mt-2 font-display text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl">
              {currentPersona.name}
            </h1>
            <p className="mt-1 text-xs leading-snug text-slate-400">
              {currentPersona.role} • Real-time AI Financial Synthesis
            </p>
          </div>
        </div>

        {/* Right: Audio Waveform Equalizer & Interactive Persona Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Futuristic Audio Equalizer Waveform & Master Speech Toggle */}
          <div className="surface-inset flex h-10 items-center gap-2.5 rounded-xl px-3">
            <button
              onClick={onToggleAudio}
              className="flex items-center gap-1.5 rounded-md text-slate-300 transition-colors hover:text-white"
              title={audioEnabled ? 'Mute AI Auto Voice Response' : 'Enable AI Voice Response'}
              aria-pressed={audioEnabled}
            >
              {audioEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 text-violet-300" />
                  <span className="hidden text-[11px] font-semibold text-violet-200 sm:inline">Voice ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 text-slate-500" />
                  <span className="hidden text-[11px] font-semibold text-slate-500 sm:inline">Voice Muted</span>
                </>
              )}
            </button>

            <div className="flex h-7 items-end gap-[3px] border-l border-white/10 pl-2.5" aria-hidden="true">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-gradient-to-t from-primary-500 via-violet-400 to-cyan-300 transition-[height,opacity] duration-300 ${
                    status === 'speaking'
                      ? 'cyber-eq-bar h-3.5'
                      : status === 'thinking' && audioEnabled
                      ? 'h-3 opacity-60 animate-pulse'
                      : 'h-1.5 opacity-30'
                  }`}
                  style={{
                    height: status === 'speaking' ? undefined : `${4 + (i % 3) * 3}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Persona Switcher Buttons */}
          <div className="segmented" role="group" aria-label="AI persona">
            {(['wealth', 'risk', 'growth'] as PersonaMode[]).map((p) => {
              const active = persona === p
              return (
                <button
                  key={p}
                  onClick={() => onPersonaChange(p)}
                  aria-pressed={active}
                  className={`segmented-item px-3 capitalize ${active ? 'segmented-item-active' : ''}`}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
