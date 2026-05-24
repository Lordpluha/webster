import { useQuery } from "@apollo/client/react";
import { Eye, Link2 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { ShareProjectViewer } from "@/components/share/ShareProjectViewer";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { RESOLVE_SHARE_LINK_QUERY } from "@/graphql/projects.graphql";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useToastStore } from "@/shared/stores/toast.store";
import { copyTextToClipboard } from "@/shared/lib/copy-to-clipboard";
import { formatDateTime } from "@/shared/lib/format-datetime";

type SharedProject = {
  id: string;
  userId: string;
  title?: string;
  content?: unknown;
  updatedAt?: string;
};

export function SharePage() {
  const { token } = useParams<{ token: string }>();
  const authUser = useAuthStore((state) => state.user);
  const pushToast = useToastStore((state) => state.pushToast);

  const { data, loading, error } = useQuery(RESOLVE_SHARE_LINK_QUERY, {
    variables: { token: token ?? "" },
    skip: !token,
    fetchPolicy: "network-only",
  });

  const project = (data as { resolveShareLink?: SharedProject } | undefined)?.resolveShareLink;
  const isOwner = Boolean(authUser && project && authUser.id === project.userId);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const handleCopyLink = async () => {
    const copied = await copyTextToClipboard(window.location.href);
    if (copied) {
      pushToast({ title: "Link copied", tone: "success" });
      return;
    }
    pushToast({
      title: "Copy the link from the address bar",
      message: window.location.href,
      tone: "success",
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-gradient text-white">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-cyan-300" />
          <p className="mt-4 text-sm text-violet-100">Loading shared project…</p>
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

  return (
    <div className="flex h-screen min-h-0 flex-col bg-slate-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900">
              {project.title ?? "Untitled project"}
            </h1>
            {project.updatedAt ? (
              <p className="text-xs text-slate-500">Updated {formatDateTime(project.updatedAt)}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            <Eye size={14} aria-hidden />
            View only
          </span>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Link2 size={16} aria-hidden />
            Copy link
          </button>
          {isOwner ? (
            <Link
              to={`/editor?projectId=${project.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Open in editor
            </Link>
          ) : authUser ? null : (
            <Link
              to={`/login?redirect=${encodeURIComponent(`/share/${token}`)}`}
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <p className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs text-slate-600">
        Pan: drag · Scroll: move · Ctrl + scroll: zoom
      </p>

      <div className="relative min-h-0 flex-1">
        <ShareProjectViewer content={project.content} className="absolute inset-0" />
      </div>
    </div>
  );
}
