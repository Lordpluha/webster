import { useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { RESOLVE_SHARE_LINK_QUERY } from "@/graphql/projects.graphql";
import { useAuthStore } from "@/shared/stores/auth.store";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function SharePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, loading, error } = useQuery(RESOLVE_SHARE_LINK_QUERY, {
    variables: { token: token ?? "" },
    skip: !token,
  });

  const project = (data as { resolveShareLink?: { id: string; title?: string } } | undefined)?.resolveShareLink;

  useEffect(() => {
    if (!project || !isAuthenticated) {
      return;
    }
    navigate(`/editor?projectId=${project.id}`, { replace: true });
  }, [project, isAuthenticated, navigate]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-gradient text-white">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-cyan-300" />
          <p className="mt-4 text-sm text-violet-100">Loading share link…</p>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-gradient px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
          <h1 className="text-xl font-semibold">Share link unavailable</h1>
          <p className="mt-2 text-sm text-violet-100/80">The link is invalid or expired.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // no-op
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-gradient px-6 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <h1 className="text-lg font-semibold">Shared project</h1>
            <p className="text-sm text-violet-100/80">{project.title ?? "Untitled project"}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-violet-100/80">
          Login to open this project in the editor. The link stays active until it expires.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to={`/login?redirect=${encodeURIComponent(`/share/${token}`)}`}
            className="inline-flex items-center justify-center rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
          >
            Login
          </Link>
          <Link
            to={`/register?redirect=${encodeURIComponent(`/share/${token}`)}`}
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Register
          </Link>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Copy link
          </button>
        </div>
      </div>
    </main>
  );
}
