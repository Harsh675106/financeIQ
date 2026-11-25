"use client";

import { createPortal } from "react-dom";
import { TrendingUp } from "lucide-react";

interface AuthProcessOverlayProps {
  title: string;
  subtitle?: string;
}

export default function AuthProcessOverlay({
  title,
  subtitle = "Securing your session and preparing your workspace.",
}: AuthProcessOverlayProps) {
  const overlay = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-slate-950"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(112,104,244,0.2),transparent_42%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.1),transparent_36%),linear-gradient(180deg,rgba(9,11,23,0.98),rgba(6,7,15,1))]"
        aria-hidden="true"
      />

      <div className="auth-loader-shell relative mx-4 w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/10 px-6 py-9 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_30px_80px_-20px_rgba(0,0,0,0.85)] animate-scale-in sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(138,136,251,0.18),transparent_40%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.1),transparent_34%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="auth-loader-orbit mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
            <div className="auth-loader-core flex h-11 w-11 items-center justify-center rounded-2xl">
              <span className="brand-mark h-10 w-10 rounded-xl">
                <TrendingUp className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.06] shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.3)]">
            <div className="auth-loader-bar h-full w-1/2 rounded-full bg-gradient-to-r from-primary-400 via-violet-400 to-cyan-300 shadow-[0_0_12px_-2px_rgba(138,136,251,0.7)]" />
          </div>
        </div>
      </div>
    </div>
  );

  // Portal to <body> so the full-screen overlay is not trapped inside the
  // auth card (its backdrop-filter/transform would act as the containing block).
  if (typeof document === "undefined") return overlay;
  return createPortal(overlay, document.body);
}
