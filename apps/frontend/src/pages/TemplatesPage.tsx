import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import { LayoutTemplate } from "lucide-react";

import { TemplateGridCard } from "@/components/templates/TemplateGridCard";
import { AppShell } from "@/components/layout/AppShell";
import { AppPageSpinner } from "@/components/ui/PageSpinner";
import {
  BASE_TEMPLATES_QUERY,
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

  const { data: baseData, loading: baseLoading } = useQuery(BASE_TEMPLATES_QUERY, {
    skip: !user,
    fetchPolicy: "cache-and-network",
  });

  const { data, loading, error, refetch } = useQuery(USER_TEMPLATES_QUERY, {
    skip: !user,
    fetchPolicy: "cache-and-network",
  });

  const baseTemplates =
    (baseData as { baseTemplates?: TemplateItem[] } | undefined)?.baseTemplates ?? [];

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
        <strong className="font-semibold text-violet-100">Built-in templates</strong> are ready on every
        account. Your own templates come from the editor via{" "}
        <strong className="font-semibold text-violet-100">Save as template</strong> in the footer.
      </p>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-white">Built-in templates</h2>
        <p className="mt-1 text-sm text-violet-200/70">
          Default starters for demos and new projects — also shown when you click New project.
        </p>
        {baseLoading ? (
          <p className="mt-4 text-sm text-violet-200/70">Loading built-in templates…</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {baseTemplates.map((template) => (
              <TemplateGridCard
                key={template.id}
                template={template}
                meta="Built-in · Webster"
                busy={busy}
                creatingProject={creatingProject}
                onNewProject={() => setUseTemplatePrompt(template)}
              />
            ))}
          </div>
        )}
      </section>

      <h2 className="text-base font-semibold text-white">My templates</h2>
      <p className="mt-1 mb-4 text-sm text-violet-200/70">
        Saved from your projects in the{" "}
        <Link to="/editor" className="font-semibold text-cyan-300 hover:underline">
          editor
        </Link>
        .
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
          <TemplateGridCard
            key={template.id}
            template={template}
            meta={`Updated ${formatDateTime(template.updatedAt)}`}
            busy={busy}
            creatingProject={creatingProject}
            onNewProject={() => setUseTemplatePrompt(template)}
            onRename={() => setRenameTemplate(template)}
            onDelete={() => setConfirmDelete(template)}
          />
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
