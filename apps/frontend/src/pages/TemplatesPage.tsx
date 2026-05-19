import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import { LayoutTemplate, Pencil, Trash2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { AppPageSpinner } from "@/components/ui/PageSpinner";
import {
  DELETE_USER_TEMPLATE_MUTATION,
  UPDATE_USER_TEMPLATE_MUTATION,
  USER_TEMPLATES_QUERY,
  CREATE_PROJECT_FROM_TEMPLATE_MUTATION,
} from "@/graphql/templates.graphql";
import { BlockingOverlay } from "@/components/ui/BlockingOverlay";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { useToastStore } from "@/shared/stores/toast.store";
import { useAuthStore } from "@/shared/stores/auth.store";
import { formatDateTime } from "@/shared/lib/format-datetime";

type TemplateItem = {
  id: string;
  title: string;
  updatedAt?: string;
  isPublic?: boolean;
};

export function TemplatesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const pushToast = useToastStore((state) => state.pushToast);
  const [renameTemplate, setRenameTemplate] = useState<TemplateItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TemplateItem | null>(null);
  const [useTemplatePrompt, setUseTemplatePrompt] = useState<TemplateItem | null>(null);

  const { data, loading, error, refetch } = useQuery(USER_TEMPLATES_QUERY, {
    skip: !user,
    fetchPolicy: "cache-and-network",
  });

  const [createFromTemplate, { loading: creatingProject }] = useMutation(
    CREATE_PROJECT_FROM_TEMPLATE_MUTATION,
    {
      onError: (err) => {
        pushToast({
          title: "Could not create project",
          message: err.message,
          tone: "error",
        });
      },
    },
  );
  const [updateUserTemplate, { loading: updatingTemplate }] = useMutation(UPDATE_USER_TEMPLATE_MUTATION, {
    refetchQueries: [{ query: USER_TEMPLATES_QUERY }],
  });
  const [deleteUserTemplate, { loading: deletingTemplate }] = useMutation(DELETE_USER_TEMPLATE_MUTATION, {
    refetchQueries: [{ query: USER_TEMPLATES_QUERY }],
  });

  const templates =
    (data as { userTemplates?: TemplateItem[] } | undefined)?.userTemplates ?? [];

  const busy = creatingProject || updatingTemplate || deletingTemplate;

  const handleRenameTemplate = async (templateId: string, nextTitle: string) => {
    try {
      await updateUserTemplate({
        variables: {
          id: templateId,
          input: { title: nextTitle },
        },
      });
      pushToast({ title: "Template renamed", tone: "success" });
    } catch (e) {
      pushToast({
        title: "Rename failed",
        message: e instanceof Error ? e.message : "Failed to update template.",
        tone: "error",
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!confirmDelete) return;
    setActionError(null);
    try {
      await deleteUserTemplate({ variables: { id: confirmDelete.id } });
      pushToast({ title: "Template deleted", message: confirmDelete.title, tone: "success" });
      setConfirmDelete(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete template.");
    }
  };

  const handleUseTemplate = async (template: TemplateItem, projectTitle: string) => {
    setActionError(null);
    try {
      const result = await createFromTemplate({
        variables: {
          templateId: template.id,
          title: projectTitle || template.title,
        },
      });
      const projectId = (result.data as { createProjectFromTemplate?: { id: string } } | undefined)
        ?.createProjectFromTemplate?.id;
      if (projectId) {
        navigate(`/editor?projectId=${projectId}`);
      } else {
        setActionError("Project was not created from template.");
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to create project from template.");
    }
  };

  return (
    <AppShell title="My templates" subtitle="Templates">
      <p className="mb-6 max-w-2xl text-sm text-violet-100/75">
        Templates are saved from your projects: open the{" "}
        <Link to="/editor" className="font-semibold text-cyan-300 hover:underline">
          editor
        </Link>
        , design a board, then use <strong className="font-semibold text-violet-100">Save as template</strong>{" "}
        in the footer. Start a new project here from any saved template.
      </p>

      {actionError ? (
        <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {actionError}
        </p>
      ) : null}

      {loading ? <AppPageSpinner label="Loading your templates…" /> : null}

      {error ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Failed to load templates: {error.message}
          <button
            type="button"
            className="ml-3 font-semibold text-cyan-300 underline"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </p>
      ) : null}

      {!loading && templates.length === 0 && !error ? (
        <div className="glass-card rounded-2xl px-6 py-10 text-center">
          <LayoutTemplate className="mx-auto h-10 w-10 text-cyan-300/80" />
          <p className="mt-4 text-sm text-violet-100/80">No templates yet.</p>
          <p className="mt-2 text-xs text-violet-200/60">
            Create a project, design it in the editor, then save it as a template from the footer.
          </p>
          <Link
            to="/projects"
            className="mt-6 inline-flex rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go to projects
          </Link>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <article
            key={template.id}
            className="glass-card flex flex-col rounded-2xl p-5 transition hover:bg-white/12"
          >
            <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/25">
              <LayoutTemplate className="h-8 w-8 text-white/90" />
            </div>
            <h2 className="text-lg font-semibold text-white">{template.title}</h2>
            <p className="mt-1 text-xs text-violet-200/70">Updated {formatDateTime(template.updatedAt)}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => setUseTemplatePrompt(template)}
                className="rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {creatingProject ? "Creating…" : "New project"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setRenameTemplate(template)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-2 text-sm text-violet-100 hover:bg-white/10 disabled:opacity-60"
                title="Rename template"
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(template)}
                className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
                title="Delete template"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      <PromptDialog
        open={Boolean(renameTemplate)}
        title="Rename template"
        label="Title"
        defaultValue={renameTemplate?.title ?? ""}
        confirmLabel="Save"
        busy={updatingTemplate}
        onCancel={() => setRenameTemplate(null)}
        onConfirm={(nextTitle) => {
          const template = renameTemplate;
          setRenameTemplate(null);
          if (template) void handleRenameTemplate(template.id, nextTitle);
        }}
      />

      {busy ? <BlockingOverlay label="Working…" /> : null}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete template?"
        description={
          confirmDelete
            ? `"${confirmDelete.title}" will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete"
        confirmTone="danger"
        busy={deletingTemplate}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void handleDeleteTemplate()}
      />

      <PromptDialog
        open={Boolean(useTemplatePrompt)}
        title="New project from template"
        description="Choose a name for the new board."
        label="Project title"
        defaultValue={useTemplatePrompt?.title ?? ""}
        confirmLabel="Create & open"
        busy={creatingProject}
        onCancel={() => setUseTemplatePrompt(null)}
        onConfirm={(projectTitle) => {
          const template = useTemplatePrompt;
          setUseTemplatePrompt(null);
          if (template) void handleUseTemplate(template, projectTitle);
        }}
      />
    </AppShell>
  );
}
