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
  compact?: boolean
}

export default function NeuralAIAvatar({
  status,
  persona,
  onPersonaChange,
  confidenceScore = 99.4,
  audioEnabled = true,
  onToggleAudio,
  compact = false,
}: NeuralAIAvatarProps) {
  const personaConfig = {
    wealth: {
      name: 'AURA 2.0 • Wealth Strategist',
      role: 'Macro Capital & Portfolio Allocation',
      icon: TrendingUp,
      accent: 'text-primary-600',
      badgeBg: 'badge-brand',
      glow: 'rgba(16, 185, 129, 0.45)',
    },
    risk: {
      name: 'AURA 2.0 • Risk Guardian',
      role: 'Stress Testing & Capital Protection',
      icon: Shield,
      accent: 'text-sky-700',
      badgeBg: 'badge-info',
      glow: 'rgba(56, 189, 248, 0.45)',
    },
    growth: {
      name: 'AURA 2.0 • Growth Scout',
      role: 'Alpha Velocity & Savings Accelerators',
      icon: Zap,
      accent: 'text-indigo-600',
      badgeBg: 'badge-ai',
      glow: 'rgba(99, 102, 241, 0.35)',
    },
  }

  const currentPersona = personaConfig[persona]

  return (
    <div
      className={
        compact
          ? 'relative flex h-full min-w-[34rem] flex-1 items-center'
          : 'cyber-glass-panel relative overflow-hidden rounded-[1.25rem] p-4 animate-fade-up sm:p-5'
      }
    >
      {/* Decorative layer: holographic scanlines + persona-tinted aurora */}
      {!compact && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(5,150,105,0.35)_51%)] bg-[length:100%_4px] opacity-[0.04]" />
          <div
            className="absolute -left-14 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
            style={{ background: `radial-gradient(circle, ${currentPersona.glow}, transparent 70%)` }}
          />
          <div className="absolute -bottom-24 right-6 h-48 w-48 rounded-full bg-ice-200/40 blur-3xl" />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />
        </div>
      )}

      <div
        className={
          compact
            ? 'relative z-10 flex min-w-0 flex-1 items-center justify-between gap-2'
            : 'relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6'
        }
      >
        {/* Left: 3D Holographic Quantum Core Avatar */}
        <div className={`flex min-w-0 items-center ${compact ? 'gap-2' : 'gap-4 sm:gap-5'}`}>
          <div
            className={`relative flex shrink-0 items-center justify-center ${
              compact ? 'h-9 w-9' : 'h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24'
            }`}
          >
            {/* Outer Orbit Ring 1 */}
            <div
              className={`absolute inset-0 rounded-full border border-primary-300/60 ${
                status === 'thinking'
                  ? 'animate-spin [animation-duration:2.5s]'
                  : status === 'speaking'
                  ? 'animate-spin [animation-duration:5s]'
                  : 'neural-avatar-orbit-1'
              }`}
              style={{ boxShadow: `0 0 22px -10px ${currentPersona.glow}` }}
            >
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-primary-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
            </div>

            {/* Inner Orbit Ring 2 */}
            <div
              className={`absolute inset-2 rounded-full border border-dashed border-ice-300/70 ${
                status === 'thinking'
                  ? 'animate-spin [animation-duration:1.8s] [animation-direction:reverse]'
                  : status === 'speaking'
                  ? 'animate-spin [animation-duration:4s] [animation-direction:reverse]'
                  : 'neural-avatar-orbit-2'
              }`}
            >
              <div className="absolute bottom-0 right-1/2 h-1.5 w-1.5 translate-x-1/2 rounded-full bg-ice-500 shadow-[0_0_0_3px_rgba(56,189,248,0.2)]" />
            </div>

            {/* Glowing Quantum Core Sphere */}
            <div
              className={`neural-avatar-core relative flex items-center justify-center rounded-full border border-primary-200 bg-[radial-gradient(circle_at_32%_26%,#d1fae5_0%,#34d399_24%,#059669_56%,#0284c7_100%)] transition-transform duration-500 ${
                compact ? 'h-7 w-7' : 'h-11 w-11 sm:h-14 sm:w-14'
              }`}
              style={{
                boxShadow: `0 10px 26px -8px ${currentPersona.glow}, inset 0 -5px 12px rgba(4, 120, 87, 0.3)`,
              }}
            >
              <BrainCircuit
                className={`${compact ? 'h-3.5 w-3.5' : 'h-5 w-5 sm:h-7 sm:w-7'} ${
                  status === 'thinking'
                    ? 'text-ice-50 animate-pulse'
                    : status === 'speaking'
                    ? 'text-white motion-safe:scale-110 animate-bounce-subtle'
                    : 'text-primary-50'
                } drop-shadow-[0_1px_2px_rgba(4,120,87,0.45)] transition-[color,transform] duration-300`}
              />

              {/* Ping Ring for Live State */}
              <span className={`absolute -right-0.5 -top-0.5 flex ${compact ? 'h-2.5 w-2.5' : 'h-3 w-3 sm:h-3.5 sm:w-3.5'}`}>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex h-full w-full rounded-full border-2 border-white bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Persona Identity & Telemetry Details */}
          <div className="min-w-0">
            <div className={`flex items-center ${compact ? 'gap-1' : 'flex-wrap gap-2'}`}>
              <span className={`badge min-w-0 max-w-full ${currentPersona.badgeBg} ${compact ? '!px-1.5 !py-0 text-[8px] leading-4' : ''}`}>
                <Radio className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} shrink-0`} />
                <span className="truncate">
                  {status === 'thinking'
                    ? 'NEURAL COMPUTE ACTIVE'
                    : status === 'speaking'
                    ? 'VOICE SPEECH STREAMING'
                    : 'NEURAL CORE SYNCHRONIZED'}
                </span>
              </span>
              <span className={`badge badge-neutral num font-mono ${compact ? '!px-1.5 !py-0 text-[8px] leading-4' : 'hidden sm:inline-flex'}`}>
                <Cpu className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-sky-600`} />
                {confidenceScore}% ACCURACY
              </span>
            </div>

            <h1 className={`font-display font-semibold leading-tight tracking-tight text-ink-900 ${
              compact ? 'truncate text-xs' : 'text-balance mt-2 text-lg sm:text-xl'
            }`}>
              {currentPersona.name}
            </h1>
            <p className={`text-slate-500 ${compact ? 'truncate text-[9px] leading-tight' : 'mt-1 text-xs leading-snug'}`}>
              {currentPersona.role} • Real-time AI Financial Synthesis
            </p>
          </div>
        </div>

        {/* Right: Audio Waveform Equalizer & Interactive Persona Switcher */}
        <div className={`flex items-center ${compact ? 'shrink-0 gap-1' : 'flex-wrap gap-2.5 sm:gap-3'}`}>
          {/* Futuristic Audio Equalizer Waveform & Master Speech Toggle */}
          <div className={`surface-inset flex items-center rounded-xl ${
            compact ? 'h-8 gap-1.5 px-2' : 'h-10 gap-2.5 px-3'
          }`}>
            <button
              onClick={onToggleAudio}
              className={`flex items-center rounded-md text-slate-600 transition-colors hover:text-ink-900 ${
                compact ? 'gap-1' : 'gap-1.5'
              }`}
              title={audioEnabled ? 'Mute AI Auto Voice Response' : 'Enable AI Voice Response'}
              aria-pressed={audioEnabled}
            >
              {audioEnabled ? (
                <>
                  <Volume2 className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-primary-600`} />
                  <span className={`${compact ? 'text-[9px]' : 'hidden text-[11px] sm:inline'} font-semibold text-primary-700`}>Voice ON</span>
                </>
              ) : (
                <>
                  <VolumeX className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-slate-400`} />
                  <span className={`${compact ? 'text-[9px]' : 'hidden text-[11px] sm:inline'} font-semibold text-slate-500`}>Voice Muted</span>
                </>
              )}
            </button>

            <div className={`flex items-end gap-[2px] border-l border-line-strong ${
              compact ? 'h-5 pl-1.5' : 'h-7 gap-[3px] pl-2.5'
            }`} aria-hidden="true">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`${compact ? 'w-0.5' : 'w-1'} rounded-full bg-gradient-to-t from-primary-500 via-teal-400 to-ice-400 transition-[height,opacity] duration-300 ${
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
          <div className={`segmented ${compact ? 'flex shrink-0' : ''}`} role="group" aria-label="AI persona">
            {(['wealth', 'risk', 'growth'] as PersonaMode[]).map((p) => {
              const active = persona === p
              return (
                <button
                  key={p}
                  onClick={() => onPersonaChange(p)}
                  aria-pressed={active}
                  className={`segmented-item capitalize ${compact ? '!px-2 !py-1 text-[9px]' : 'px-3'} ${active ? 'segmented-item-active' : ''}`}
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
