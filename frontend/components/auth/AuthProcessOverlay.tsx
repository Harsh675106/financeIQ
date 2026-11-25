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
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-canvas"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_15%_0%,rgba(52,211,153,0.18),transparent_70%),radial-gradient(65%_55%_at_90%_10%,rgba(56,189,248,0.16),transparent_70%),radial-gradient(70%_50%_at_50%_110%,rgba(167,243,208,0.24),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="auth-loader-shell relative mx-4 w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-line px-6 py-9 text-center shadow-float animate-scale-in sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(209,250,229,0.7),transparent_45%),radial-gradient(circle_at_bottom,rgba(224,242,254,0.6),transparent_40%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="auth-loader-orbit mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-line bg-gradient-to-b from-primary-50 to-ice-50">
            <div className="auth-loader-core flex h-11 w-11 items-center justify-center rounded-2xl">
              <span className="brand-mark h-10 w-10 rounded-xl">
                <TrendingUp className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold tracking-tight text-ink-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>

          <div className="progress-track mt-6 h-1.5">
            <div className="auth-loader-bar h-full w-1/2 rounded-full bg-gradient-to-r from-primary-500 via-teal-400 to-ice-400" />
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
