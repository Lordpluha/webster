import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@apollo/client/react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import {
  AuthCard,
  authAlertErrorClass,
  authAlertSuccessClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPrimaryButtonClass,
} from "@/components/ui/AuthCard";
import { REQUEST_PASSWORD_RESET_MUTATION, RESET_PASSWORD_MUTATION } from "../graphql/auth.graphql";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"request" | "reset">(token ? "reset" : "request");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const [requestReset, { loading: requestLoading }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION);
  const [resetPassword, { loading: resetLoading }] = useMutation(RESET_PASSWORD_MUTATION);

  useEffect(() => {
    if (token) {
      setMode("reset");
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStatus("idle");

    try {
      if (mode === "request") {
        if (!email.trim()) {
          setError("Please enter your email");
          return;
        }
        await requestReset({
          variables: {
            input: { email: email.trim() },
          },
        });
        setStatus("success");
      } else {
        if (!token || !password) {
          setError("Please fill in all fields");
          return;
        }

        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          return;
        }

        await resetPassword({
          variables: { input: { token, newPassword: password } },
        });
        setStatus("success");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
      setStatus("error");
    }
  };

  const loading = mode === "request" ? requestLoading : resetLoading;

  return (
    <MarketingShell minimalNav>
      <AuthCard
        title="Reset password"
        subtitle={
          mode === "request"
            ? "We will email you a reset token"
            : "Choose a new password for your account"
        }
        footer={
          <Link to="/login" className={authLinkClass()}>
            Back to sign in
          </Link>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "request" ? (
            <div>
              <label htmlFor="email" className={authLabelClass()}>
                Account email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={authInputClass()}
                placeholder="you@example.com"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="token" className={authLabelClass()}>
                  Reset token
                </label>
                <input
                  id="token"
                  name="token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  className={authInputClass()}
                  placeholder="Paste token from email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className={authLabelClass()}>
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={authInputClass()}
                  placeholder="••••••••"
                  required
                />
                <p className="mt-1 text-xs text-violet-600/70">At least 8 characters</p>
              </div>
            </>
          )}

          {status === "success" && (
            <div className={authAlertSuccessClass()}>
              {mode === "request"
                ? "Reset instructions sent. Check your email for the token."
                : "Password updated. You can sign in now."}
            </div>
          )}

          {error && <div className={authAlertErrorClass()}>{error}</div>}

          <button type="submit" disabled={loading} className={authPrimaryButtonClass(loading)}>
            {mode === "request"
              ? requestLoading
                ? "Sending…"
                : "Send reset email"
              : resetLoading
                ? "Updating…"
                : "Update password"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((prev) => (prev === "request" ? "reset" : "request"))}
          className={`mt-4 w-full text-center text-sm ${authLinkClass()}`}
        >
          {mode === "request" ? "Already have a token?" : "Need a reset token?"}
        </button>
      </AuthCard>
    </MarketingShell>
  );
}
