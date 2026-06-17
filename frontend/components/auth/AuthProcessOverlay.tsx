"use client";

interface AuthProcessOverlayProps {
  title: string;
  subtitle?: string;
}

export default function AuthProcessOverlay({
  title,
  subtitle = "Securing your session and preparing your workspace.",
}: AuthProcessOverlayProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_36%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.1),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]" />

      <div className="auth-loader-shell relative mx-4 w-full max-w-sm overflow-hidden rounded-[2rem] border border-emerald-500/15 px-8 py-10 text-center shadow-[0_0_60px_rgba(2,6,23,0.75)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.12),transparent_30%)]" />

        <div className="relative">
          <div className="auth-loader-orbit mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-slate-900/70">
            <div className="auth-loader-core flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20">
              <div className="h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.75)]" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
            <div className="auth-loader-bar h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
