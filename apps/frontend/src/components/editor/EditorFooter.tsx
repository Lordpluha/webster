import type { FC } from "react";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { Download, FileJson, Image as ImageIcon, Save, Share2 } from "lucide-react";

import { CREATE_SHARE_LINK_MUTATION } from "@/graphql/projects.graphql";
import {
  CREATE_USER_TEMPLATE_MUTATION,
  USER_TEMPLATES_QUERY,
} from "@/graphql/templates.graphql";
import { serializeSceneToJson, type ProjectExportFormat } from "@/shared/lib/canvas-engine";
import { useOptionalEditorWorkspace } from "./editor-workspace-context";
import { useToastStore } from "@/shared/stores/toast.store";
import { BlockingOverlay } from "@/components/ui/BlockingOverlay";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { focusRingOnDarkClass } from "@/shared/lib/a11y";
import { formatDateTime } from "@/shared/lib/format-datetime";
import { copyTextToClipboard } from "@/shared/lib/copy-to-clipboard";

const footerBtnClass = `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-violet-100 transition-colors hover:bg-white/10 disabled:opacity-50 ${focusRingOnDarkClass}`;

const EXPORT_BUTTONS: Array<{ format: ProjectExportFormat; label: string; ariaLabel: string }> = [
  { format: "png", label: "PNG", ariaLabel: "Export project as PNG" },
  { format: "jpg", label: "JPG", ariaLabel: "Export project as JPG" },
  { format: "pdf", label: "PDF", ariaLabel: "Export project as PDF" },
  { format: "webp", label: "WEBP", ariaLabel: "Export project as WEBP" },
  { format: "svg", label: "SVG", ariaLabel: "Export project as SVG" },
  { format: "bmp", label: "BMP", ariaLabel: "Export project as BMP" },
  { format: "json", label: "JSON", ariaLabel: "Download scene as JSON file" },
];

export const EditorFooter: FC = () => {
  const navigate = useNavigate();
  const workspace = useOptionalEditorWorkspace();
  const [busy, setBusy] = useState<string | null>(null);
  const [templatePromptOpen, setTemplatePromptOpen] = useState(false);
  const [openTemplatesConfirm, setOpenTemplatesConfirm] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareRolePromptOpen, setShareRolePromptOpen] = useState(false);
  const pushToast = useToastStore((state) => state.pushToast);

  const [createUserTemplate] = useMutation(CREATE_USER_TEMPLATE_MUTATION, {
    refetchQueries: [{ query: USER_TEMPLATES_QUERY }],
  });
  const [createShareLink] = useMutation(CREATE_SHARE_LINK_MUTATION);

  if (!workspace) {
    return (
      <footer className="border-t border-violet-200/60 bg-violet-950/95 px-4 py-3 text-sm text-violet-200 shadow-sm">
        Editor footer
      </footer>
    );
  }

  const {
    engine,
    projectId: pid,
    projectTitle,
    projectCreatedAt,
    autosaveLabel,
    saveNow,
    exportProject,
  } = workspace;

  const handleSave = async () => {
    setBusy("save");
    try {
      await saveNow();
      pushToast({ title: "Project saved", tone: "success" });
    } catch (e) {
      pushToast({
        title: "Save failed",
        message: e instanceof Error ? e.message : "Unable to save project",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async (format: ProjectExportFormat) => {
    setBusy(format);
    try {
      if (format !== "json") {
        await saveNow();
      }
      await exportProject(format);
      const labels: Record<ProjectExportFormat, string> = {
        png: "PNG",
        jpg: "JPG",
        pdf: "PDF",
        webp: "WEBP",
        svg: "SVG",
        bmp: "BMP",
        json: "JSON",
      };
      pushToast({ title: `${labels[format]} export ready`, tone: "success" });
    } catch (e) {
      pushToast({
        title: "Export failed",
        message: e instanceof Error ? e.message : "Export failed",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleShare = () => {
    if (!pid) return;
    setShareMenuOpen((prev) => !prev);
  };

  const handleCopyShareLink = async () => {
    if (!pid) return;
    setBusy("share");
    try {
      const res = await createShareLink({
        variables: { projectId: pid, expiresInHours: 72, role: "VIEWER" },
      });
      const payload = (res.data as { createShareLink?: { url?: string } } | undefined)?.createShareLink;
      if (!payload?.url) {
        throw new Error("No share URL returned");
      }
      const shareUrl = payload.url.startsWith("http") ? payload.url : `${window.location.origin}${payload.url}`;
      const copied = await copyTextToClipboard(shareUrl);
      pushToast({
        title: copied ? "Link copied" : "Share link created",
        message: copied ? "Anyone with the link can view this project." : shareUrl,
        tone: "success",
      });
      setShareMenuOpen(false);
    } catch (e) {
      pushToast({
        title: "Share failed",
        message: e instanceof Error ? e.message : "Could not create link",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleCopyShareLinkWithRole = async (role: "VIEWER" | "EDITOR") => {
    if (!pid) return;
    setBusy("share");
    try {
      const res = await createShareLink({
        variables: { projectId: pid, expiresInHours: 72, role },
      });
      const payload = (res.data as { createShareLink?: { url?: string } } | undefined)?.createShareLink;
      if (!payload?.url) {
        throw new Error("No share URL returned");
      }
      const shareUrl = payload.url.startsWith("http") ? payload.url : `${window.location.origin}${payload.url}`;
      const copied = await copyTextToClipboard(shareUrl);
      pushToast({
        title: copied ? "Link copied" : "Share link created",
        message: copied
          ? role === "EDITOR"
            ? "Anyone with the link can edit this project."
            : "Anyone with the link can view this project."
          : shareUrl,
        tone: "success",
      });
      setShareRolePromptOpen(false);
      setShareMenuOpen(false);
    } catch (e) {
      pushToast({
        title: "Share failed",
        message: e instanceof Error ? e.message : "Could not create link",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const shareTargets = {
    facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    pinterest: (url: string) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent("Webster project")}`,
    x: (url: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check this out")}`,
  } as const;

  const createViewerShareUrl = async (): Promise<string> => {
    if (!pid) throw new Error("Missing project id");
    const res = await createShareLink({
      variables: { projectId: pid, expiresInHours: 72, role: "VIEWER" },
    });
    const payload = (res.data as { createShareLink?: { url?: string } } | undefined)?.createShareLink;
    if (!payload?.url) {
      throw new Error("No share URL returned");
    }
    return payload.url.startsWith("http") ? payload.url : `${window.location.origin}${payload.url}`;
  };

  const handleShareTo = async (target: keyof typeof shareTargets) => {
    setBusy("share");
    try {
      const url = await createViewerShareUrl();
      window.open(shareTargets[target](url), "_blank", "noopener,noreferrer");
      setShareMenuOpen(false);
    } catch (e) {
      pushToast({
        title: "Share failed",
        message: e instanceof Error ? e.message : "Could not share",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleSaveTemplate = async (title: string) => {
    setBusy("template");
    try {
      const scene = engine.getSerializableState();
      await createUserTemplate({
        variables: {
          input: {
            title,
            content: JSON.parse(serializeSceneToJson(scene)) as Record<string, unknown>,
            isPublic: false,
          },
        },
      });
      pushToast({ title: "Template saved", tone: "success" });
      setOpenTemplatesConfirm(true);
    } catch (e) {
      pushToast({
        title: "Template save failed",
        message: e instanceof Error ? e.message : "Template save failed",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const busyExportLabel =
    busy === "png"
      ? "Exporting PNG..."
      : busy === "jpg"
        ? "Exporting JPG..."
        : busy === "pdf"
          ? "Exporting PDF..."
          : busy === "webp"
            ? "Exporting WEBP..."
            : busy === "svg"
              ? "Exporting SVG..."
              : busy === "bmp"
                ? "Exporting BMP..."
            : busy === "json"
              ? "Exporting JSON..."
              : null;

  return (
    <footer
      className="border-t border-violet-300/20 bg-linear-to-r from-violet-950 via-violet-900 to-fuchsia-950 px-4 py-3 text-violet-100 shadow-sm"
      aria-label="Editor actions"
    >
      {busy ? (
        <BlockingOverlay
          label={
            busy === "save"
              ? "Saving project..."
              : busyExportLabel
                ? busyExportLabel
                : busy === "share"
                  ? "Creating share link..."
                  : busy === "template"
                    ? "Saving template..."
                    : "Working..."
          }
        />
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1 text-xs text-violet-200/80">
          <div className="truncate font-medium text-white">{projectTitle ?? "Project"}</div>
          {projectCreatedAt ? (
            <div className="text-[11px] text-violet-300/90">Created {formatDateTime(projectCreatedAt)}</div>
          ) : null}
          <span>{autosaveLabel || (busy ? `${busy}…` : "Ready")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void handleSave()}
            className={footerBtnClass}
            aria-label="Save project now"
          >
            <Save size={16} aria-hidden />
            Save now
          </button>
          {EXPORT_BUTTONS.map(({ format, label, ariaLabel }) => (
            <button
              key={format}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void handleExport(format)}
              className={footerBtnClass}
              aria-label={ariaLabel}
            >
              {format === "json" ? <FileJson size={16} aria-hidden /> : <ImageIcon size={16} aria-hidden />}
              {label}
            </button>
          ))}
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => setTemplatePromptOpen(true)}
            className={footerBtnClass}
            aria-label="Save canvas as user template"
          >
            <Download size={16} aria-hidden />
            Save as template
          </button>
          <button
            type="button"
            disabled={!pid || Boolean(busy)}
            onClick={() => void handleShare()}
            className={footerBtnClass}
            aria-label="Share project"
          >
            <Share2 size={16} aria-hidden />
            Share
          </button>
        </div>
      </div>

      {shareMenuOpen ? (
        <div className="fixed inset-0 z-50" onMouseDown={() => setShareMenuOpen(false)}>
          <div
            className="absolute bottom-16 right-6 w-56 rounded-xl border border-violet-200/20 bg-violet-950/95 p-2 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            role="menu"
          >
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-violet-100 hover:bg-white/10"
              onClick={() => setShareRolePromptOpen(true)}
              role="menuitem"
            >
              Copy link
            </button>
            <button
              type="button"
              disabled={busy === "share"}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-violet-100 hover:bg-white/10 disabled:opacity-50"
              onClick={() => void handleShareTo("facebook")}
              role="menuitem"
            >
              Share to Facebook
            </button>
            <button
              type="button"
              disabled={busy === "share"}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-violet-100 hover:bg-white/10 disabled:opacity-50"
              onClick={() => void handleShareTo("pinterest")}
              role="menuitem"
            >
              Share to Pinterest
            </button>
            <button
              type="button"
              disabled={busy === "share"}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-violet-100 hover:bg-white/10 disabled:opacity-50"
              onClick={() => void handleShareTo("x")}
              role="menuitem"
            >
              Share to X
            </button>
          </div>
        </div>
      ) : null}

      {shareRolePromptOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onMouseDown={() => setShareRolePromptOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Share link access"
          >
            <div className="text-lg font-semibold text-slate-900">Share link access</div>
            <div className="mt-1 text-sm text-slate-600">
              Choose whether guests can only view or also edit.
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                disabled={busy === "share"}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => void handleCopyShareLinkWithRole("VIEWER")}
              >
                Viewer link (view only)
              </button>
              <button
                type="button"
                disabled={busy === "share"}
                className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                onClick={() => void handleCopyShareLinkWithRole("EDITOR")}
              >
                Editor link (can edit)
              </button>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setShareRolePromptOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <PromptDialog
        open={templatePromptOpen}
        title="Save as template"
        description="Reuse this layout when starting new projects."
        label="Template title"
        defaultValue={projectTitle ?? "My template"}
        confirmLabel="Save"
        busy={busy === "template"}
        onCancel={() => setTemplatePromptOpen(false)}
        onConfirm={(title) => {
          setTemplatePromptOpen(false);
          void handleSaveTemplate(title);
        }}
      />

      <ConfirmDialog
        open={openTemplatesConfirm}
        title="Template saved"
        description="Open My templates to create a project from it?"
        confirmLabel="Open templates"
        confirmTone="primary"
        onCancel={() => setOpenTemplatesConfirm(false)}
        onConfirm={() => {
          setOpenTemplatesConfirm(false);
          navigate("/templates");
        }}
      />

    </footer>
  );
};
