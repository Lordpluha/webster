export type OAuthProvider = "Google" | "Facebook" | "Github";

function getRedirectUri(): string {
  return `${window.location.origin}/oauth/callback`;
}

function baseParams(provider: OAuthProvider): URLSearchParams {
  return new URLSearchParams({
    redirect_uri: getRedirectUri(),
    response_type: "code",
    state: provider,
  });
}

export function isOAuthProvider(value: string | null | undefined): value is OAuthProvider {
  return value === "Google" || value === "Facebook" || value === "Github";
}

export function getOAuthAuthorizeUrl(provider: OAuthProvider): string | null {
  const redirectUri = getRedirectUri();

  if (provider === "Google") {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) return null;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      include_granted_scopes: "true",
      prompt: "select_account",
      state: provider,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === "Github") {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined;
    if (!clientId) return null;

    const params = baseParams(provider);
    params.set("client_id", clientId);
    params.set("scope", "user:email");

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  if (provider === "Facebook") {
    const clientId = import.meta.env.VITE_FACEBOOK_CLIENT_ID as string | undefined;
    if (!clientId) return null;

    const params = baseParams(provider);
    params.set("client_id", clientId);
    params.set("scope", "email public_profile");

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  return null;
}

