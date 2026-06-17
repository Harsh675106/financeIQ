"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
      width: 320,
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
      <form onSubmit={handleSubmit} className="space-y-4 form-shell">
        {error && (
          <div className="p-3 bg-danger-500/10 border border-danger-500/20 text-danger-200 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div
          id="google-button"
          onClick={handleGoogleButtonClick}
          className="flex justify-center rounded-xl border border-slate-700 bg-slate-950/70 p-3 transition hover:border-slate-600"
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-400">
              Or continue with email
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isBusy}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isBusy}
            className="input"
            placeholder="********"
          />

          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setForgotMessage("");
              setForgotEmail("");
            }}
            disabled={isBusy}
            className="text-sm text-primary-500 hover:underline mt-1"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : null}
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      {showResendVerification && (
        <div className="mt-4 p-3 rounded-xl border border-primary-500/30 bg-primary-500/10 space-y-3">
          <p className="text-xs text-slate-300">
            Did not receive the verification email? Request a new one.
          </p>
          <input
            type="email"
            value={verificationEmail}
            onChange={(e) => setVerificationEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            disabled={verificationLoading}
          />
          {verificationMessage && (
            <div className="text-xs text-slate-200">{verificationMessage}</div>
          )}
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={verificationLoading || verificationCooldown > 0}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verificationLoading
              ? "Sending..."
              : verificationCooldown > 0
                ? `Resend in ${verificationCooldown}s`
                : "Resend Verification Email"}
          </button>
        </div>
      )}

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Forgot Password</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="forgotEmail" className="block text-sm font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  id="forgotEmail"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  disabled={forgotLoading}
                />
              </div>

              <p className="text-xs text-slate-400">
                We will send you a link to reset your password.
              </p>
              {forgotCooldown > 0 && (
                <p className="text-xs text-slate-400">
                  You can request another reset email in {forgotCooldown}s.
                </p>
              )}

              {forgotMessage && (
                <div
                  className={`p-2 rounded text-sm ${
                    forgotMessage.startsWith("Success:")
                      ? "bg-emerald-500/10 text-emerald-200"
                      : "bg-danger-500/10 text-danger-200"
                  }`}
                >
                  {forgotMessage}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotMessage("");
                    setForgotEmail("");
                  }}
                  disabled={forgotLoading}
                  className="btn-secondary flex-1 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  disabled={forgotLoading || forgotCooldown > 0}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
        </div>
      )}
    </>
  );
}
