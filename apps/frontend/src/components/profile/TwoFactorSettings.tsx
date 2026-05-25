import { useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { Shield, ShieldCheck } from "lucide-react";

import {
  DISABLE_TWO_FACTOR_MUTATION,
  ENABLE_TWO_FACTOR_MUTATION,
  GENERATE_TWO_FACTOR_SECRET_MUTATION,
  GET_CURRENT_USER,
} from "@/graphql/auth.graphql";
import { useAuthStore, type AuthUser } from "@/shared/stores/auth.store";
import { useToastStore } from "@/shared/stores/toast.store";

type SetupPayload = {
  secret: string;
  qrCodeUrl: string;
};

type TwoFactorSettingsProps = {
  isTwoFactorEnabled: boolean;
  isEmailVerified: boolean;
};

export function TwoFactorSettings({ isTwoFactorEnabled, isEmailVerified }: TwoFactorSettingsProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const pushToast = useToastStore((state) => state.pushToast);

  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [setupError, setSetupError] = useState("");
  const [disableError, setDisableError] = useState("");
  const client = useApolloClient();

  const refreshAuthUser = () => {
    const cached = client.readQuery<{ me?: AuthUser }>({
      query: GET_CURRENT_USER,
    });
    if (cached?.me) {
      setUser(cached.me);
    }
  };

  const [generateSecret, { loading: generating }] = useMutation(GENERATE_TWO_FACTOR_SECRET_MUTATION, {
    onCompleted: (data) => {
      const payload = (data as { generateTwoFactorSecret?: SetupPayload })?.generateTwoFactorSecret;
      if (payload?.secret && payload?.qrCodeUrl) {
        setSetup(payload);
        setSetupError("");
      }
    },
    onError: (err) => {
      setSetupError(err.message || "Could not start 2FA setup");
    },
  });

  const [enableTwoFactor, { loading: enabling }] = useMutation(ENABLE_TWO_FACTOR_MUTATION, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refreshAuthUser();
      pushToast({ title: "Two-factor authentication enabled", tone: "success" });
      closeSetup();
    },
    onError: (err) => {
      setSetupError(err.message || "Invalid code");
    },
  });

  const [disableTwoFactor, { loading: disabling }] = useMutation(DISABLE_TWO_FACTOR_MUTATION, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refreshAuthUser();
      pushToast({ title: "Two-factor authentication disabled", tone: "success" });
      closeDisable();
    },
    onError: (err) => {
      setDisableError(err.message || "Could not disable 2FA");
    },
  });

  const closeSetup = () => {
    setSetupOpen(false);
    setSetup(null);
    setTotpCode("");
    setSetupError("");
  };

  const closeDisable = () => {
    setDisableOpen(false);
    setDisablePassword("");
    setDisableError("");
  };

  const openSetup = () => {
    setSetupOpen(true);
    setSetup(null);
    setTotpCode("");
    setSetupError("");
    void generateSecret();
  };

  const handleEnable = (e: React.FormEvent) => {
    e.preventDefault();
    const code = totpCode.replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      setSetupError("Enter the 6-digit code from your authenticator app");
      return;
    }
    void enableTwoFactor({ variables: { code } });
  };

  const handleDisable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError("Enter your account password");
      return;
    }
    void disableTwoFactor({ variables: { password: disablePassword } });
  };

  return (
    <>
      <section className="glass-card mt-6 rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            {isTwoFactorEnabled ? (
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-cyan-300" aria-hidden />
            ) : (
              <Shield className="mt-0.5 h-6 w-6 shrink-0 text-violet-300/70" aria-hidden />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">Two-factor authentication</h2>
              <p className="mt-1 max-w-xl text-sm text-violet-200/80">
                {isTwoFactorEnabled
                  ? "Sign-in requires a code from Google Authenticator, Authy, or a similar app."
                  : "Add a 6-digit code from an authenticator app when you sign in."}
              </p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  isTwoFactorEnabled ? "text-cyan-300" : "text-violet-300/60"
                }`}
              >
                {isTwoFactorEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isTwoFactorEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setDisableOpen(true);
                  setDisableError("");
                }}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-violet-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Turn off 2FA
              </button>
            ) : (
              <button
                type="button"
                onClick={openSetup}
                disabled={!isEmailVerified}
                className="rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Set up 2FA
              </button>
            )}
          </div>
        </div>

        {!isEmailVerified && !isTwoFactorEnabled && (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Verify your email before enabling two-factor authentication.
          </p>
        )}
      </section>

      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-violet-950 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Set up authenticator</h2>
            <p className="mt-2 text-sm text-violet-200/80">
              Scan the QR code with Google Authenticator, Authy, or 1Password, then enter the
              6-digit code to confirm.
            </p>

            {generating && !setup && (
              <p className="mt-6 text-sm text-violet-200">Generating QR code…</p>
            )}

            {setup && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-center rounded-xl bg-white p-4">
                  <img
                    src={setup.qrCodeUrl}
                    alt="QR code for authenticator app"
                    className="h-48 w-48"
                  />
                </div>
                <p className="text-center text-xs text-violet-300/80">
                  Or enter this key manually:{" "}
                  <code className="break-all rounded bg-white/10 px-1 py-0.5 text-violet-100">
                    {setup.secret}
                  </code>
                </p>

                <form onSubmit={handleEnable} className="space-y-3">
                  <label htmlFor="totpCode" className="text-sm text-violet-100">
                    Verification code
                  </label>
                  <input
                    id="totpCode"
                    name="totpCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => {
                      setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setSetupError("");
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center text-lg tracking-widest text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                    placeholder="123456"
                    required
                  />

                  {setupError && (
                    <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                      {setupError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeSetup}
                      className="flex-1 rounded-full border border-white/20 px-4 py-2 text-sm text-violet-100 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={enabling || totpCode.length !== 6}
                      className="flex-1 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {enabling ? "Enabling…" : "Enable 2FA"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!generating && !setup && setupError && (
              <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {setupError}
              </div>
            )}

            {!setup && !generating && (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeSetup}
                  className="flex-1 rounded-full border border-white/20 px-4 py-2 text-sm text-violet-100 hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => void generateSecret()}
                  className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {disableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-violet-950 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Turn off 2FA</h2>
            <p className="mt-2 text-sm text-violet-200/80">
              Enter your account password to disable two-factor authentication.
            </p>

            <form onSubmit={handleDisable} className="mt-6 space-y-4">
              <div>
                <label htmlFor="disable2faPassword" className="text-sm text-violet-100">
                  Password
                </label>
                <input
                  id="disable2faPassword"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={disablePassword}
                  onChange={(e) => {
                    setDisablePassword(e.target.value);
                    setDisableError("");
                  }}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                  required
                />
              </div>

              {disableError && (
                <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {disableError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDisable}
                  className="flex-1 rounded-full border border-white/20 px-4 py-2 text-sm text-violet-100 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disabling}
                  className="flex-1 rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
                >
                  {disabling ? "Disabling…" : "Disable 2FA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
