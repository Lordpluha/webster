import type { FC } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, History, Plus, RotateCcw, X } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { BlockingOverlay } from "@/components/ui/BlockingOverlay";
import { focusRingOnLightClass } from "@/shared/lib/a11y";
import { formatDateTime } from "@/shared/lib/format-datetime";

import { useProjectVersionHistory } from "./useProjectVersionHistory";

type VersionHistoryPanelProps = {
  open: boolean;
  onClose: () => void;
};

function getVersionTitle(label: string | null | undefined, createdAt: string): string {
  if (label && label.trim()) {
    return label.trim();
  }
  return formatDateTime(createdAt);
}

export const VersionHistoryPanel: FC<VersionHistoryPanelProps> = ({ open, onClose }) => {
  const {
    projectId,
    versions,
    versionsLoading,
    versionsError,
    busy,
    createSnapshot,
    restoreVersion,
  } = useProjectVersionHistory();

  const [snapshotPromptOpen, setSnapshotPromptOpen] = useState(false);
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const nestedDialogOpen = snapshotPromptOpen || Boolean(restoreVersionId);

  useEffect(() => {
    if (open || nestedDialogOpen) {
      setVisible(true);
      return;
    }
    const timer = window.setTimeout(() => setVisible(false), 220);
    return () => window.clearTimeout(timer);
  }, [open, nestedDialogOpen]);

  useEffect(() => {
    if (!open && !nestedDialogOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, nestedDialogOpen]);

  const handleBackdropClose = () => {
    if (nestedDialogOpen) {
      return;
    }
    onClose();
  };

  if (!visible && !open && !nestedDialogOpen) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={
          "fixed inset-0 z-[100] bg-slate-900/40 transition-opacity duration-200 " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
        aria-hidden={!open}
        onClick={handleBackdropClose}
      />

      <aside
        className={
          "fixed inset-y-0 right-0 z-[110] flex w-full max-w-sm flex-col border-l border-violet-200/80 bg-white shadow-2xl transition-transform duration-200 ease-out " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        role="dialog"
        aria-modal="true"
        aria-label="Project version history"
      >
        {busy ? (
          <BlockingOverlay
            label={busy === "version" ? "Saving snapshot..." : "Restoring version..."}
          />
        ) : null}

        <div className="flex items-start justify-between gap-3 border-b border-violet-100 px-4 py-4">
          <div>
            <div className="flex items-center gap-2 text-violet-900">
              <History size={20} aria-hidden />
              <h2 className="text-base font-semibold">Version history</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Saved snapshots of the whole project. This is not undo (Ctrl+Z) — restore replaces the
              current canvas with a snapshot from the server.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-2 text-slate-600 hover:bg-slate-100 ${focusRingOnLightClass}`}
            aria-label="Close version history"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-violet-100 px-4 py-3">
          <button
            type="button"
            disabled={!projectId || Boolean(busy)}
            onClick={() => setSnapshotPromptOpen(true)}
            className={
              "flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 " +
              focusRingOnLightClass
            }
            aria-label="Save new version snapshot"
          >
            <Plus size={16} aria-hidden />
            Save snapshot
          </button>
          {!projectId ? (
            <p className="mt-2 text-xs text-amber-700">Open a saved project to use version history.</p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {versionsLoading ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">Loading versions…</p>
          ) : versionsError ? (
            <p className="px-2 py-6 text-center text-sm text-rose-600">Could not load versions.</p>
          ) : versions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <Clock className="mx-auto mb-2 text-slate-400" size={28} aria-hidden />
              <p className="text-sm font-medium text-slate-700">No snapshots yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Save a snapshot before big changes — you can return to it later.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {versions.map((version, index) => (
                <li key={version.id}>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {getVersionTitle(version.label, version.createdAt)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {formatDateTime(version.createdAt)}
                        {index === 0 ? " · latest" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => setRestoreVersionId(version.id)}
                      className={
                        "mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-50 disabled:opacity-50 " +
                        focusRingOnLightClass
                      }
                      aria-label={`Restore version ${getVersionTitle(version.label, version.createdAt)}`}
                    >
                      <RotateCcw size={14} aria-hidden />
                      Restore
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <PromptDialog
        open={snapshotPromptOpen}
        title="Save snapshot"
        description="Name this version so you can find it later (optional)."
        label="Version label"
        defaultValue=""
        placeholder="e.g. Before client review"
        confirmLabel="Save"
        required={false}
        busy={busy === "version"}
        onCancel={() => setSnapshotPromptOpen(false)}
        onConfirm={(label) => {
          setSnapshotPromptOpen(false);
          void createSnapshot(label);
        }}
      />

      <ConfirmDialog
        open={Boolean(restoreVersionId)}
        title="Restore this version?"
        description="The current canvas will be replaced with the selected snapshot. Unsaved changes on the canvas may be lost unless you saved them as a snapshot first."
        confirmLabel="Restore"
        confirmTone="primary"
        busy={busy === "restore"}
        onCancel={() => setRestoreVersionId(null)}
        onConfirm={() => {
          const versionId = restoreVersionId;
          setRestoreVersionId(null);
          if (versionId) {
            void restoreVersion(versionId).then((ok) => {
              if (ok) onClose();
            });
          }
        }}
      />
    </>,
    document.body,
  );
};
