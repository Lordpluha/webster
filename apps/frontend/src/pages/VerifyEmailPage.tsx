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
import { VERIFY_EMAIL_MUTATION } from "../graphql/auth.graphql";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const [verifyEmail, { loading }] = useMutation(VERIFY_EMAIL_MUTATION);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    async function runVerification() {
      try {
        await verifyEmail({ variables: { token } });
        if (!cancelled) {
          setStatus("success");
          navigate("/login?verified=1", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Failed to verify email");
        }
      }
    }

    runVerification();
    return () => {
      cancelled = true;
    };
  }, [token, verifyEmail, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Please enter the verification token");
      return;
    }

    try {
      await verifyEmail({
        variables: { token },
      });
      setStatus("success");
      navigate("/login?verified=1", { replace: true });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to verify email");
    }
  };

  const autoVerifying = Boolean(token) && status === "idle" && !error;

  return (
    <MarketingShell minimalNav>
      <AuthCard
        title="Verify your email"
        subtitle={
          token
            ? "Confirming your account from the email link…"
            : "Paste the token from your inbox if the link did not open"
        }
        footer={
          <Link to="/login" className={authLinkClass()}>
            Back to sign in
          </Link>
        }
      >
        {autoVerifying ? (
          <p className="text-center text-sm text-violet-700">Verifying your email…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className={authLabelClass()}>
                Verification token
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

            {status === "success" && (
              <div className={authAlertSuccessClass()}>
                Email verified. You can sign in now.
              </div>
            )}

            {error && <div className={authAlertErrorClass()}>{error}</div>}

            <button type="submit" disabled={loading} className={authPrimaryButtonClass(loading)}>
              {loading ? "Verifying…" : "Verify email"}
            </button>
          </form>
        )}
      </AuthCard>
    </MarketingShell>
  );
}
