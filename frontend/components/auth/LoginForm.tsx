"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, KeyRound, Lock, Mail, MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import AuthProcessOverlay from "@/components/auth/AuthProcessOverlay";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const googleCallbackStartedRef = useRef(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotCooldown, setForgotCooldown] = useState(0);

  const [showResendVerification, setShowResendVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  const router = useRouter();
  const { googleLogin } = useAuth();
  const isBusy = loading || googleLoading || googlePending;

  const handleGoogleButtonClick = useCallback(() => {
    setError("");
    setGooglePending(true);
  }, []);

  const renderGoogleButton = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const buttonHost = document.getElementById("google-button");

    if (!window.google || !clientId || !buttonHost) {
      return;
    }

    buttonHost.innerHTML = "";
    window.google.accounts.id.renderButton(buttonHost, {
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: Math.min(320, Math.floor(buttonHost.clientWidth || 320)),
      click_listener: handleGoogleButtonClick,
    });
  }, [handleGoogleButtonClick]);

  const handleGoogleSignIn = useCallback(
    async (response: any) => {
      googleCallbackStartedRef.current = true;
      setGooglePending(false);
      setGoogleLoading(true);
      setError("");

      try {
        const result = await api.post("/auth/google", {
          idToken: response.credential,
        });

        googleLogin(result.data.token, result.data.user);
        setIsRedirecting(true);
        router.replace("/dashboard");
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Google sign-in failed";
        setError(errorMsg);
      } finally {
        setGoogleLoading(false);
        googleCallbackStartedRef.current = false;
        window.setTimeout(() => {
          renderGoogleButton();
        }, 0);
      }
    },
    [router, googleLogin, renderGoogleButton],
  );

  useEffect(() => {
    (window as any).handleGoogleSignIn = handleGoogleSignIn;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    let resizeTimeout: number | undefined;
    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(renderGoogleButton, 100);
    };
    window.addEventListener("resize", handleResize);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Sign-In is not configured");
    }

    script.onload = () => {
      try {
        if (window.google && clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
          });
          renderGoogleButton();
        }
      } catch (_err) {
        // no-op
      }
    };

    return () => {
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(resizeTimeout);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [handleGoogleSignIn, renderGoogleButton]);

  useEffect(() => {
    if (!googlePending) {
      return;
    }

    const clearPendingIfNoCallback = () => {
      window.setTimeout(() => {
        if (!googleCallbackStartedRef.current) {
          setGooglePending(false);
        }
      }, 800);
    };

    window.addEventListener("focus", clearPendingIfNoCallback);
    document.addEventListener("visibilitychange", clearPendingIfNoCallback);

    return () => {
      window.removeEventListener("focus", clearPendingIfNoCallback);
      document.removeEventListener("visibilitychange", clearPendingIfNoCallback);
    };
  }, [googlePending]);

  useEffect(() => {
    if (!googlePending && !googleLoading) {
      renderGoogleButton();
    }
  }, [googlePending, googleLoading, renderGoogleButton]);

  useEffect(() => {
    if (forgotCooldown <= 0 && verificationCooldown <= 0) return;

    const interval = setInterval(() => {
      setForgotCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setVerificationCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [forgotCooldown, verificationCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerificationMessage("");
    setShowResendVerification(false);
    setLoading(true);

    try {
      await onLogin(email, password);
      setIsRedirecting(true);
      router.replace("/dashboard");
    } catch (err: any) {
      setLoading(false);
      const status = err.response?.status;
      const message = err.response?.data?.message || "";

      if (status === 403 && message.toLowerCase().includes("verify")) {
        setError(
          "Email not verified. Check your inbox for the verification link or request a new one.",
        );
        setShowResendVerification(true);
        setVerificationEmail(email);
      } else if (status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (status === 400) {
        setError(message);
      } else if (err.code === "ECONNREFUSED") {
        setError("Connection error. Please check your internet and try again.");
      } else {
        setError(message || "Login failed. Please try again.");
      }
    }
  };

  const handleForgotPasswordClick = async () => {
    if (!forgotEmail.trim()) {
      setForgotMessage("Please enter your email address");
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      const response = await api.post("/auth/forgot-password", {
        email: forgotEmail.toLowerCase().trim(),
      });

      setForgotMessage("Success: " + response.data.message);
      setForgotCooldown(30);
      setForgotEmail("");

      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotMessage("");
      }, 3000);
    } catch (err: any) {
      const retryAfter = Number(err.response?.data?.retryAfter || 0);
      if (err.response?.status === 429 && retryAfter > 0) {
        setForgotCooldown(retryAfter);
      }
      setForgotMessage(
        "Error: " + (err.response?.data?.message || "Failed to send reset link"),
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail.trim()) {
      setVerificationMessage("Please enter your email address");
      return;
    }

    setVerificationLoading(true);
    setVerificationMessage("");

    try {
      const response = await api.post("/auth/resend-verification-email", {
        email: verificationEmail.toLowerCase().trim(),
      });
      setVerificationMessage("Success: " + response.data.message);
      setVerificationCooldown(30);
    } catch (err: any) {
      const retryAfter = Number(err.response?.data?.retryAfter || 0);
      if (err.response?.status === 429 && retryAfter > 0) {
        setVerificationCooldown(retryAfter);
      }
      setVerificationMessage(
        "Error: " +
          (err.response?.data?.message || "Failed to resend verification email"),
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  if (isRedirecting || googlePending || googleLoading) {
    return (
      <AuthProcessOverlay
        title={isRedirecting ? "Entering Dashboard" : "Signing In With Google"}
        subtitle={
          isRedirecting
            ? "Loading your personalized FinanceIQ workspace."
            : "Connecting your Google account securely."
        }
      />
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-sm leading-relaxed text-rose-200 animate-fade-in"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}

        <div
          id="google-button"
          onClick={handleGoogleButtonClick}
          className="flex min-h-[44px] w-full min-w-0 items-center justify-center [color-scheme:light]"
        />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.12]" aria-hidden="true" />
          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Or continue with email
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.12]" aria-hidden="true" />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <div className="group relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary-300"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isBusy}
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
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary-300"
              aria-hidden="true"
            />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isBusy}
              className="input pl-10"
              placeholder="********"
            />
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setForgotMessage("");
                setForgotEmail("");
              }}
              disabled={isBusy}
              className="rounded-md text-[13px] font-medium text-primary-300 transition-colors hover:text-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="btn-primary btn-lg w-full"
        >
          {loading ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
          ) : null}
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      {showResendVerification && (
        <div className="mt-5 space-y-3 rounded-2xl border border-primary-400/20 bg-primary-500/[0.08] p-4 animate-fade-up">
          <div className="flex items-start gap-3">
            <span className="icon-tile icon-tile-sm icon-tile-brand">
              <MailCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="min-w-0 pt-1.5 text-xs leading-relaxed text-slate-300">
              Did not receive the verification email? Request a new one.
            </p>
          </div>
          <div className="group relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary-300"
              aria-hidden="true"
            />
            <input
              type="email"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              className="input pl-10"
              placeholder="you@example.com"
              disabled={verificationLoading}
              aria-label="Email address for verification"
            />
          </div>
          {verificationMessage && (
            <div
              role="status"
              className={`break-words rounded-xl border px-3 py-2 text-xs leading-relaxed ${
                verificationMessage.startsWith("Success:")
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/25 bg-rose-500/10 text-rose-200"
              }`}
            >
              {verificationMessage}
            </div>
          )}
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={verificationLoading || verificationCooldown > 0}
            className="btn-soft w-full"
          >
            {verificationLoading
              ? "Sending..."
              : verificationCooldown > 0
                ? `Resend in ${verificationCooldown}s`
                : "Resend Verification Email"}
          </button>
        </div>
      )}

      {showForgotPassword &&
        createPortal(
          <div className="modal-backdrop">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-password-title"
              className="modal-panel max-w-md overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-pop-in sm:p-6"
            >
              <div
                className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent"
                aria-hidden="true"
              />
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" aria-hidden="true" />

              <div className="mb-5 flex items-start gap-3.5">
                <span className="icon-tile icon-tile-brand">
                  <KeyRound className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 id="forgot-password-title" className="text-lg font-semibold text-white">
                    Forgot Password
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    We will send you a link to reset your password.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="forgotEmail" className="label">
                    Email Address
                  </label>
                  <div className="group relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary-300"
                      aria-hidden="true"
                    />
                    <input
                      id="forgotEmail"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input pl-10"
                      disabled={forgotLoading}
                    />
                  </div>
                </div>

                {forgotCooldown > 0 && (
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                    <span>You can request another reset email in {forgotCooldown}s.</span>
                  </p>
                )}

                {forgotMessage && (
                  <div
                    role="status"
                    className={`break-words rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed ${
                      forgotMessage.startsWith("Success:")
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                        : "border-rose-500/25 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    {forgotMessage}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotMessage("");
                      setForgotEmail("");
                    }}
                    disabled={forgotLoading}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    disabled={forgotLoading || forgotCooldown > 0}
                    className="btn-primary flex-1"
                  >
                    {forgotLoading ? (
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                        aria-hidden="true"
                      />
                    ) : null}
                    {forgotLoading
                      ? "Sending..."
                      : forgotCooldown > 0
                        ? `Resend in ${forgotCooldown}s`
                        : "Send Link"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
