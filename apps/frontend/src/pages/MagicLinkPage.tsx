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
import {
  GET_CURRENT_USER,
  REQUEST_MAGIC_LINK_MUTATION,
  VERIFY_MAGIC_LINK_MUTATION,
} from "../graphql/auth.graphql";

export function MagicLinkPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const token = searchParams.get("token") || "";

  const [requestMagicLink, { loading: requestLoading }] = useMutation(REQUEST_MAGIC_LINK_MUTATION);
  const [verifyMagicLink, { loading: verifyLoading }] = useMutation(VERIFY_MAGIC_LINK_MUTATION);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    async function runVerification() {
      try {
        await verifyMagicLink({
          variables: { token },
          refetchQueries: [{ query: GET_CURRENT_USER }],
          awaitRefetchQueries: true,
        });
        if (!cancelled) {
          setStatus("success");
          navigate("/projects", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Failed to verify magic link");
        }
      }
    }

    runVerification();
    return () => {
      cancelled = true;
    };
  }, [navigate, token, verifyMagicLink]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStatus("idle");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      await requestMagicLink({
        variables: {
          input: {
            email: email.trim(),
          },
        },
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    }
  };

  return (
    <MarketingShell minimalNav>
      <AuthCard
        title="Magic link sign-in"
        subtitle={
          token
            ? "Verifying your sign-in link…"
            : "Get a one-click sign-in link in your inbox"
        }
        footer={
          <Link to="/login" className={authLinkClass()}>
            Back to sign in
          </Link>
        }
      >
        {!token && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={authLabelClass()}>
                Email
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

            {status === "success" && (
              <div className={authAlertSuccessClass()}>
                Magic link sent. Check your email for the sign-in link.
              </div>
            )}

            {error && <div className={authAlertErrorClass()}>{error}</div>}

            <button type="submit" disabled={requestLoading} className={authPrimaryButtonClass(requestLoading)}>
              {requestLoading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        {token && (
          <div className="space-y-4">
            {verifyLoading && (
              <p className="text-center text-sm text-violet-700">Verifying token…</p>
            )}
            {status === "error" && <div className={authAlertErrorClass()}>{error}</div>}
          </div>
        )}
      </AuthCard>
    </MarketingShell>
  );
}
