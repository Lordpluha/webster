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

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => startOAuth("Google")}
            className={`${authPrimaryButtonClass()} w-full`}
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => startOAuth("Github")}
            className={`${authPrimaryButtonClass()} w-full bg-slate-900 text-white hover:bg-slate-800`}
          >
            Continue with GitHub
          </button>
          <button
            type="button"
            onClick={() => startOAuth("Facebook")}
            className={`${authPrimaryButtonClass()} w-full bg-blue-600 text-white hover:bg-blue-500`}
          >
            Continue with Facebook
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
