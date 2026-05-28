import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

import {
  CREATE_SHARE_LINK_MUTATION,
  PROJECT_SHARE_LINKS_QUERY,
  REVOKE_SHARE_LINK_MUTATION,
  UPDATE_SHARE_LINK_ROLE_MUTATION,
} from "@/graphql/projects.graphql";
import { copyTextToClipboard } from "@/shared/lib/copy-to-clipboard";
import { useToastStore } from "@/shared/stores/toast.store";

type ShareLinkDialogProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
};

type ShareRole = "VIEWER" | "EDITOR";

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.78 7.75L23.2 22h-6.65l-5.2-6.7L5.4 22H2.3l7.26-8.3L.8 2h6.8l4.7 6.05L18.9 2Zm-1.16 18h1.72L5.75 3.93H3.9L17.74 20Z"
      />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 22v-8h2.7l.4-3h-3.1V9.2c0-.9.3-1.5 1.6-1.5h1.7V5.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.7V11H7v3h2.6v8h3.9z"
      />
    </svg>
  );
}

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.95 3.52c.2.17.3.44.25.82l-3.4 16.05c-.07.42-.3.68-.66.8-.35.12-.7.03-.98-.2l-5.2-3.84-2.5 2.43c-.26.26-.48.38-.8.38l.37-5.35L18.9 6.4c.23-.2.27-.38.05-.45-.22-.08-.5-.02-.8.16L6.1 13.6 1.4 12.1c-.4-.13-.65-.32-.66-.63-.01-.31.2-.55.62-.72L20.1 3.15c.76-.3 1.44-.2 1.85.37Z"
      />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.5 3.5A11 11 0 0 0 3.3 17.9L2 22l4.3-1.1A11 11 0 0 0 20.5 3.5Zm-8.8 17.1c-1.7 0-3.3-.46-4.7-1.33l-.34-.2-2.54.65.68-2.46-.22-.35a8.8 8.8 0 1 1 7.44 3.69Zm5.14-6.38c-.28-.14-1.65-.82-1.9-.91-.25-.1-.44-.14-.62.14-.19.28-.71.91-.87 1.1-.16.19-.32.21-.6.07-.28-.14-1.16-.43-2.2-1.37-.82-.73-1.37-1.64-1.53-1.92-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.19-.28.28-.46.1-.19.05-.35-.02-.49-.07-.14-.62-1.5-.85-2.06-.22-.53-.45-.46-.62-.46h-.53c-.19 0-.49.07-.74.35-.25.28-.98.96-.98 2.33 0 1.37 1 2.7 1.14 2.89.14.19 1.98 3.02 4.8 4.23.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.12-.25-.19-.53-.33Z"
      />
    </svg>
  );
}

function IconPinterest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 1.75C6.52 1.75 2.75 5.4 2.75 10.27c0 3.06 1.73 5.8 4.38 6.82.4.15.76.01.87-.44.08-.31.27-1.1.36-1.43.12-.44.07-.6-.25-.97-.87-1.02-1.43-2.34-1.43-3.75 0-4.83 3.61-9.15 9.4-9.15 5.12 0 7.94 3.12 7.94 7.29 0 5.49-2.43 10.12-6.03 10.12-1.99 0-3.47-1.64-3-3.64.56-2.39 1.64-4.97 1.64-6.69 0-1.54-.82-2.83-2.53-2.83-2.01 0-3.62 2.08-3.62 4.86 0 1.77.6 2.97.6 2.97l-2.43 10.3c-.72 3.04-.11 6.78-.06 7.14.03.21.3.27.42.1.17-.22 2.35-2.92 3.09-5.88.21-.83 1.2-5.12 1.2-5.12.6 1.14 2.35 2.14 4.22 2.14 5.55 0 9.31-5.06 9.31-11.83 0-5.12-4.32-9.89-10.91-9.89Z"
      />
    </svg>
  );
}

export function ShareLinkDialog({ open, projectId, onClose }: ShareLinkDialogProps) {
  const pushToast = useToastStore((s) => s.pushToast);
  const [newRole, setNewRole] = useState<ShareRole>("VIEWER");
  const [busy, setBusy] = useState(false);

  const { data, refetch } = useQuery(PROJECT_SHARE_LINKS_QUERY, {
    variables: { projectId },
    skip: !open || !projectId,
  });

  const links =
    (data as { projectShareLinks?: Array<{ token: string; role: ShareRole; createdAt: string }> })
      ?.projectShareLinks ?? [];

  const [createShareLink] = useMutation(CREATE_SHARE_LINK_MUTATION);
  const [updateShareLinkRole] = useMutation(UPDATE_SHARE_LINK_ROLE_MUTATION);
  const [revokeShareLink] = useMutation(REVOKE_SHARE_LINK_MUTATION);

  if (!open) {
    return null;
  }

  const sharePath = (token: string) => `${window.location.origin}/share/${token}`;

  const shareTargets = useMemo(() => {
    return {
      facebook: (url: string) =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      x: (url: string) =>
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check this out")}`,
      telegram: (url: string) =>
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check this out")}`,
      whatsapp: (url: string) => `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`,
      pinterest: (url: string) =>
        `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent("Webster project")}`,
    };
  }, []);

  const openShare = (targetUrl: string) => {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      const res = await createShareLink({
        variables: { projectId, expiresInHours: 72, role: newRole },
      });
      const payload = (res.data as { createShareLink?: { url?: string; token?: string; role?: ShareRole } })
        ?.createShareLink;
      if (!payload?.url) {
        throw new Error("No share URL returned");
      }
      const shareUrl = payload.url.startsWith("http")
        ? payload.url
        : `${window.location.origin}${payload.url}`;
      const copied = await copyTextToClipboard(shareUrl);
      pushToast({
        title: copied ? "Link copied" : "Share link created",
        message: copied
          ? payload.role === "EDITOR"
            ? "Anyone with the link can edit this project."
            : "Anyone with the link can view this project."
          : shareUrl,
        tone: "success",
      });
      await refetch();
    } catch (e) {
      pushToast({
        title: "Share failed",
        message: e instanceof Error ? e.message : "Could not create link",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (token: string, role: ShareRole) => {
    try {
      await updateShareLinkRole({ variables: { token, role } });
      pushToast({
        title: role === "EDITOR" ? "Link is now editor access" : "Link is now view-only",
        tone: "success",
      });
      await refetch();
    } catch (e) {
      pushToast({
        title: "Update failed",
        message: e instanceof Error ? e.message : "Could not update role",
        tone: "error",
      });
    }
  };

  const handleRevoke = async (token: string) => {
    try {
      await revokeShareLink({ variables: { token } });
      pushToast({ title: "Link revoked", tone: "success" });
      await refetch();
    } catch (e) {
      pushToast({
        title: "Revoke failed",
        message: e instanceof Error ? e.message : "Could not revoke link",
        tone: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-labelledby="share-dialog-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h2 id="share-dialog-title" className="text-lg font-semibold text-slate-900">
          Share project
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Create a link for guests. Editor links allow changes without signing in.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setNewRole("VIEWER")}
            className={
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium " +
              (newRole === "VIEWER"
                ? "border-violet-500 bg-violet-50 text-violet-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50")
            }
          >
            <Eye size={16} aria-hidden />
            View only
          </button>
          <button
            type="button"
            onClick={() => setNewRole("EDITOR")}
            className={
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium " +
              (newRole === "EDITOR"
                ? "border-violet-500 bg-violet-50 text-violet-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50")
            }
          >
            <Pencil size={16} aria-hidden />
            Can edit
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void handleCreate()}
          className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create link & copy"}
        </button>

        {links.length > 0 ? (
          <ul className="mt-5 max-h-48 space-y-2 overflow-y-auto border-t border-slate-200 pt-4">
            {links.map((link) => (
              <li
                key={link.token}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-slate-500 truncate max-w-[140px]">
                  …{link.token.slice(-8)}
                </span>
                <select
                  value={link.role}
                  onChange={(e) => void handleRoleChange(link.token, e.target.value as ShareRole)}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                  aria-label="Share link role"
                >
                  <option value="VIEWER">View</option>
                  <option value="EDITOR">Edit</option>
                </select>
                <button
                  type="button"
                  className="text-xs font-medium text-violet-700 hover:underline"
                  onClick={() => void copyTextToClipboard(sharePath(link.token))}
                >
                  Copy
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    aria-label="Share to Facebook"
                    onClick={() => openShare(shareTargets.facebook(sharePath(link.token)))}
                  >
                    <IconFacebook className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    aria-label="Share to X"
                    onClick={() => openShare(shareTargets.x(sharePath(link.token)))}
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    aria-label="Share to Telegram"
                    onClick={() => openShare(shareTargets.telegram(sharePath(link.token)))}
                  >
                    <IconTelegram className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    aria-label="Share to WhatsApp"
                    onClick={() => openShare(shareTargets.whatsapp(sharePath(link.token)))}
                  >
                    <IconWhatsApp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    aria-label="Share to Pinterest"
                    onClick={() => openShare(shareTargets.pinterest(sharePath(link.token)))}
                  >
                    <IconPinterest className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  className="text-rose-600 hover:text-rose-700"
                  aria-label="Revoke link"
                  onClick={() => void handleRevoke(link.token)}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
