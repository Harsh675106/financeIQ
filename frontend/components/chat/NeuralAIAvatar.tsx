'use client'

import React, { useState } from 'react'
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
}

export default function NeuralAIAvatar({
  status,
  persona,
  onPersonaChange,
  confidenceScore = 99.4,
}: NeuralAIAvatarProps) {
  const [audioEnabled, setAudioEnabled] = useState(true)

  const personaConfig = {
    wealth: {
      name: 'AURA 2.0 • Wealth Strategist',
      role: 'Macro Capital & Portfolio Allocation',
      icon: TrendingUp,
      accent: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      glow: 'rgba(16, 185, 129, 0.7)',
    },
    risk: {
      name: 'AURA 2.0 • Risk Guardian',
      role: 'Stress Testing & Capital Protection',
      icon: Shield,
      accent: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      glow: 'rgba(6, 182, 212, 0.7)',
    },
    growth: {
      name: 'AURA 2.0 • Growth Scout',
      role: 'Alpha Velocity & Savings Accelerators',
      icon: Zap,
      accent: 'text-teal-400',
      badgeBg: 'bg-teal-500/15 border-teal-500/30 text-teal-300',
      glow: 'rgba(20, 184, 166, 0.7)',
    },
  }

  const currentPersona = personaConfig[persona]

  return (
    <div className="relative overflow-hidden rounded-3xl cyber-glass-panel p-5 animate-fade-up">
      {/* Background Holographic Scanline */}
      <div className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(52,211,153,0.3)_51%)] bg-[length:100%_4px]" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: 3D Holographic Quantum Core Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            {/* Outer Orbit Ring 1 */}
            <div
              className={`absolute inset-0 rounded-full border border-emerald-400/40 ${
                status === 'thinking' ? 'animate-spin [animation-duration:3s]' : 'neural-avatar-orbit-1'
              }`}
              style={{ boxShadow: `0 0 20px ${currentPersona.glow}` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </div>

            {/* Inner Orbit Ring 2 */}
            <div
              className={`absolute inset-2 rounded-full border border-cyan-400/40 ${
                status === 'thinking' ? 'animate-spin [animation-duration:2s] [animation-direction:reverse]' : 'neural-avatar-orbit-2'
              }`}
            >
              <div className="absolute bottom-0 right-1/2 translate-x-1/2 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </div>

            {/* Glowing Quantum Core Sphere */}
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-slate-950 via-emerald-950 to-teal-900 border-2 border-emerald-400/80 shadow-2xl neural-avatar-core transition-transform duration-500"
              style={{
                boxShadow: `0 0 25px ${currentPersona.glow}, inset 0 0 15px rgba(52, 211, 153, 0.4)`,
              }}
            >
              <BrainCircuit
                className={`h-7 w-7 ${
                  status === 'thinking'
                    ? 'text-cyan-300 animate-pulse'
                    : status === 'speaking'
                    ? 'text-emerald-300 scale-110'
                    : 'text-primary-300'
                } transition-all duration-300`}
              />

              {/* Ping Ring for Live State */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-slate-900"></span>
              </span>
            </div>
          </div>

          {/* Persona Identity & Telemetry Details */}
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${currentPersona.badgeBg}`}>
                <Radio className="h-3 w-3 animate-pulse" />
                {status === 'thinking' ? 'NEURAL COMPUTE ACTIVE' : status === 'speaking' ? 'TRANSMITTING STREAM' : 'NEURAL CORE SYNCHRONIZED'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-slate-900/90 px-2 py-0.5 text-[11px] font-mono text-slate-400 border border-slate-800">
                <Cpu className="h-3 w-3 text-emerald-400" />
                {confidenceScore}% ACCURACY
              </span>
            </div>

            <h1 className="mt-1.5 text-xl font-black tracking-tight text-slate-50 flex items-center gap-2">
              {currentPersona.name}
            </h1>
            <p className="text-xs text-slate-400 leading-tight">
              {currentPersona.role} • Real-time AI Financial Synthesis
            </p>
          </div>
        </div>

        {/* Right: Audio Waveform Equalizer & Interactive Persona Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Futuristic Audio Equalizer Waveform */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800/90 bg-slate-950/80 px-3.5 py-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="text-slate-400 hover:text-slate-100 transition-colors mr-1"
              title={audioEnabled ? 'Mute AI Audio Voice' : 'Enable AI Audio Voice'}
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-500" />
              )}
            </button>

            <div className="flex items-end gap-1 h-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-gradient-to-t from-emerald-500 to-cyan-400 ${
                    status === 'speaking' || (status === 'thinking' && audioEnabled)
                      ? 'cyber-eq-bar'
                      : 'h-1 opacity-40'
                  }`}
                  style={{
                    height: status === 'speaking' ? undefined : `${4 + (i % 3) * 3}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Persona Switcher Buttons */}
          <div className="flex items-center rounded-2xl border border-slate-800/90 bg-slate-950/80 p-1 shadow-inner">
            {(['wealth', 'risk', 'growth'] as PersonaMode[]).map((p) => {
              const active = persona === p
              return (
                <button
                  key={p}
                  onClick={() => onPersonaChange(p)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-primary-600 to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
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
