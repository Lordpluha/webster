import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
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
