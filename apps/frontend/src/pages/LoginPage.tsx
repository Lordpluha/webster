import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

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
  hasFieldErrors,
  validateLoginFields,
} from "@/shared/lib/validation/auth-fields";
import { LOGIN_MUTATION, GET_CURRENT_USER } from "../graphql/auth.graphql";
import { getOAuthAuthorizeUrl, type OAuthProvider } from "@/shared/lib/auth/oauth";

interface FieldErrors {
  email?: string;
  password?: string;
  twoFactorCode?: string;
  form?: string;
}

function OAuthGoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.15 0 5.98 1.08 8.21 3.2l6.1-6.1C34.8 2.8 29.78 0 24 0 14.62 0 6.51 5.38 2.56 13.21l7.16 5.56C11.5 13.07 17.28 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.54c0-1.64-.15-3.21-.42-4.74H24v9h12.43c-.54 2.9-2.17 5.35-4.62 7.01l7.08 5.5c4.13-3.81 6.21-9.41 6.21-16.77z"
      />
      <path
        fill="#FBBC05"
        d="M9.72 28.77A14.5 14.5 0 0 1 8.95 24c0-1.66.29-3.26.77-4.77l-7.16-5.56A23.96 23.96 0 0 0 0 24c0 3.87.92 7.53 2.56 10.79l7.16-6.02z"
      />
      <path
        fill="#34A853"
        d="M24 48c5.78 0 10.8-1.9 14.4-5.19l-7.08-5.5c-1.96 1.32-4.49 2.1-7.32 2.1-6.72 0-12.5-3.57-14.28-9.27l-7.16 6.02C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function OAuthGithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.73.5.75 5.67.75 12.12c0 5.15 3.23 9.52 7.71 11.06.57.11.78-.26.78-.56 0-.28-.01-1.02-.02-2-3.14.7-3.8-1.56-3.8-1.56-.52-1.35-1.26-1.71-1.26-1.71-1.03-.73.08-.72.08-.72 1.14.08 1.74 1.2 1.74 1.2 1.01 1.78 2.65 1.26 3.3.96.1-.76.39-1.26.71-1.55-2.51-.29-5.15-1.29-5.15-5.74 0-1.27.44-2.3 1.16-3.11-.12-.29-.5-1.46.11-3.04 0 0 .95-.31 3.11 1.19a10.4 10.4 0 0 1 2.83-.39c.96 0 1.93.13 2.83.39 2.16-1.5 3.11-1.19 3.11-1.19.61 1.58.23 2.75.11 3.04.72.81 1.16 1.84 1.16 3.11 0 4.46-2.64 5.44-5.16 5.73.4.36.76 1.07.76 2.15 0 1.55-.02 2.8-.02 3.18 0 .31.2.67.79.56 4.48-1.55 7.71-5.91 7.71-11.06C23.25 5.67 18.27.5 12 .5z"
      />
    </svg>
  );
}

function OAuthFacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 22v-8h2.7l.4-3h-3.1V9.2c0-.9.3-1.5 1.6-1.5h1.7V5.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.7V11H7v3h2.6v8h3.9z"
      />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const verified = searchParams.get("verified") === "1";
  const registeredEmail = searchParams.get("email") ?? "";

  const [formData, setFormData] = useState({
    email: registeredEmail,
    password: "",
    twoFactorCode: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  useEffect(() => {
    if (registeredEmail) {
      setFormData((prev) => ({ ...prev, email: registeredEmail }));
    }
  }, [registeredEmail]);

  const [loginMutation] = useMutation(LOGIN_MUTATION, {
    onCompleted: () => {
      setLoading(false);
      navigate("/projects", { replace: true });
    },
    onError: (err) => {
      const message = err.message || "Login failed";
      const requiresTwoFactor = /two[- ]?factor|2fa/i.test(message);
      setFieldErrors((prev) => ({
        ...prev,
        form: requiresTwoFactor ? "Two-factor code required to continue." : message,
      }));
      if (requiresTwoFactor) {
        setShowTwoFactor(true);
      }
      setLoading(false);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLoginFields({
      email: formData.email,
      password: formData.password,
      twoFactorCode: formData.twoFactorCode,
      requireTwoFactor: showTwoFactor,
    });
    setFieldErrors(validationErrors);
    if (hasFieldErrors(validationErrors)) {
      return;
    }

    setLoading(true);
    try {
      await loginMutation({
        variables: {
          input: {
            email: formData.email.trim(),
            password: formData.password,
            ...(showTwoFactor && formData.twoFactorCode.trim()
              ? { twoFactorCode: formData.twoFactorCode.trim() }
              : {}),
          },
        },
        refetchQueries: [{ query: GET_CURRENT_USER }],
        awaitRefetchQueries: true,
      });
    } catch {
      // onError handles UI state
    }
  };

  const startOAuth = (provider: OAuthProvider) => {
    const url = getOAuthAuthorizeUrl(provider);
    if (!url) {
      setFieldErrors((prev) => ({
        ...prev,
        form:
          provider === "Google"
            ? "Google OAuth is not configured. Add VITE_GOOGLE_CLIENT_ID."
            : provider === "Github"
              ? "GitHub OAuth is not configured. Add VITE_GITHUB_CLIENT_ID."
              : "Facebook OAuth is not configured. Add VITE_FACEBOOK_CLIENT_ID.",
      }));
      return;
    }
    window.location.assign(url);
  };

  return (
    <MarketingShell minimalNav>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to continue with Webster"
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link to="/register" className={authLinkClass()}>
              Sign up
            </Link>
          </>
        }
      >
        {registered && (
          <div className={`${authAlertSuccessClass()} mb-4`}>
            Account created. Open the verification link we sent
            {registeredEmail ? ` to ${registeredEmail}` : ""}, then sign in here.
          </div>
        )}

        {verified && (
          <div className={`${authAlertSuccessClass()} mb-4`}>
            Email verified. Sign in with your password to continue.
          </div>
        )}

        {fieldErrors.form && (
          <div role="alert" className={authAlertErrorClass()}>
            {fieldErrors.form}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => startOAuth("Google")}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:bg-slate-100"
          >
            <OAuthGoogleIcon className="h-5 w-5" />
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            onClick={() => startOAuth("Github")}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#24292F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:brightness-95"
          >
            <OAuthGithubIcon className="h-5 w-5 text-white" />
            <span>Continue with GitHub</span>
          </button>
          <button
            type="button"
            onClick={() => startOAuth("Facebook")}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:brightness-95"
          >
            <OAuthFacebookIcon className="h-5 w-5 text-white" />
            <span>Continue with Facebook</span>
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">or</div>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className={authLabelClass()}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={authInputClass()}
              placeholder="you@example.com"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={authLabelClass()}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={authInputClass()}
              placeholder="••••••••"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {showTwoFactor && (
            <div>
              <label htmlFor="twoFactorCode" className={authLabelClass()}>
                Two-factor code
              </label>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={formData.twoFactorCode}
                onChange={handleChange}
                className={authInputClass()}
                placeholder="123456"
                aria-invalid={Boolean(fieldErrors.twoFactorCode)}
                aria-describedby={fieldErrors.twoFactorCode ? "2fa-error" : undefined}
              />
              {fieldErrors.twoFactorCode && (
                <p id="2fa-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.twoFactorCode}
                </p>
              )}
            </div>
          )}

          {!showTwoFactor && (
            <button
              type="button"
              onClick={() => setShowTwoFactor(true)}
              className={`text-left text-xs font-semibold ${authLinkClass()}`}
            >
              Use a two-factor code
            </button>
          )}

          <button type="submit" disabled={loading} className={authPrimaryButtonClass(loading)}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
          <Link to="/reset-password" className={authLinkClass()}>
            Forgot password?
          </Link>
          <Link to="/magic-link" className={authLinkClass()}>
            Magic link
          </Link>
        </div>
      </AuthCard>
    </MarketingShell>
  );
}
