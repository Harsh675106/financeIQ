"use client";

import { useState } from "react";
import { Mail, CheckCircle, Eye, EyeOff } from "lucide-react";
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
      <div className="text-center py-6">
        <Mail className="h-12 w-12 text-primary-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-50 mb-2">
          Account Created!
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          We&apos;ve sent a verification email to your inbox. Please verify your
          email to get started.
        </p>
        <button
          onClick={() => setRegistrationSuccess(false)}
          className="text-xs text-primary-400 hover:text-primary-300 transition"
        >
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
    <form onSubmit={handleSubmit} className="space-y-4 form-shell">
      {error && (
        <div className="p-3 bg-danger-500/10 border border-danger-500/20 text-danger-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Full Name
        </label>
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
          className="input"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Email
        </label>
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
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Password
        </label>

        <div className="relative">
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
            className="input pr-10"
            placeholder="••••••••"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Confirm Password
        </label>

        <div className="relative">
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
            className="input pr-10"
            placeholder="••••••••"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        Sign Up
      </button>
    </form>
  );
}
