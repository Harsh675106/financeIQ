"use client";

import { useState } from "react";
import {
  Mail,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import AuthProcessOverlay from "@/components/auth/AuthProcessOverlay";

interface RegisterFormProps {
  onRegister: (email: string, password: string, name: string) => Promise<void>;
}

export default function RegisterForm({ onRegister }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return; // ✅ ADD THIS

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const strongPassword =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;


    if (!strongPassword.test(password)) {
     setError("Password must contain at least one letter and one number (min 6 characters)");

      return;
    }

    setLoading(true);

    try {
      await onRegister(email, password, name);

      setRegistrationSuccess(true);
      setLoading(false); // ✅ ADD THIS LINE

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setLoading(false);

      const status = err?.response?.status;
      const message = err?.response?.data?.message || "";

      if (!err.response) {
        setError("❌ Cannot connect to server. Is backend running?");
        return;
      }

      if (status === 400 && message.includes("already exists")) {
        setError(
          "❌ An account with this email already exists. Try signing in instead.",
        );
      } else if (status === 400 && message.includes("Validation failed")) {
        setError("❌ Invalid input. Please check your email and password.");
      } else if (status === 403) {
        setError("❌ Please verify your email before logging in.");
      } else {
        setError(message || "❌ Registration failed. Please try again.");
      }
    }
  };

  if (registrationSuccess) {
    return (
      <div className="py-4 text-center animate-fade-up" role="status" aria-live="polite">
        <div className="relative mx-auto mb-5 w-fit">
          <span className="icon-tile icon-tile-lg icon-tile-brand h-14 w-14 rounded-2xl">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white ring-[3px] ring-white shadow-[0_6px_14px_-6px_rgba(5,150,105,0.6)]">
            <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
          </span>
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-ink-900">
          Account Created!
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
          We&apos;ve sent a verification email to your inbox. Please verify your
          email to get started.
        </p>
        <button
          onClick={() => setRegistrationSuccess(false)}
          className="btn-ghost btn-sm mt-5 text-primary-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Sign Up
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <AuthProcessOverlay
        title="Creating Your Account"
        subtitle="Setting up your FinanceIQ profile and securing your credentials."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-relaxed text-rose-700 animate-fade-in"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="label">
          Full Name
        </label>
        <div className="group relative">
          <User
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary-600"
            aria-hidden="true"
          />
          <input
            id="name"
            type="text"
            disabled={loading}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            required
            className="input pl-10"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <div className="group relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary-600"
            aria-hidden="true"
          />
          <input
            id="email"
            type="email"
            disabled={loading}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            required
            className="input pl-10"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>

        <div className="group relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary-600"
            aria-hidden="true"
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            disabled={loading}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
            className="input pl-10 pr-12"
            placeholder="••••••••"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-1.5 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-ink-900/[0.04] hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirm Password
        </label>

        <div className="group relative">
          <ShieldCheck
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary-600"
            aria-hidden="true"
          />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            disabled={loading}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            required
            className="input pl-10 pr-12"
            placeholder="••••••••"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-1.5 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-ink-900/[0.04] hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary btn-lg w-full"
        >
          Sign Up
        </button>
      </div>
    </form>
  );
}
