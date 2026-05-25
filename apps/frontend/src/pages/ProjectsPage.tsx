import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { AppPageSpinner } from "@/components/ui/PageSpinner";
import { TemplateCard } from "@/components/templates/TemplateCard";
import {
  BASE_TEMPLATES_QUERY,
  CREATE_PROJECT_FROM_TEMPLATE_MUTATION,
} from "@/graphql/templates.graphql";
import {
  CREATE_PROJECT_MUTATION,
  DELETE_PROJECT_MUTATION,
  PROJECTS_QUERY,
} from "../graphql/projects.graphql";
import { createEmptySerializableSceneState } from "@/shared/lib/canvas-engine";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BlockingOverlay } from "@/components/ui/BlockingOverlay";
import { useToastStore } from "@/shared/stores/toast.store";
import { useAuthStore } from "@/shared/stores/auth.store";
import { formatDateTime } from "@/shared/lib/format-datetime";

const DEFAULT_PAGINATION = { page: 1, limit: 12 };
const EMPTY_SCENE = createEmptySerializableSceneState();

export function ProjectsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pushToast = useToastStore((state) => state.pushToast);

  const { data, loading, error } = useQuery(PROJECTS_QUERY, {
    variables: { pagination: DEFAULT_PAGINATION },
    skip: !user,
    fetchPolicy: "cache-and-network",
  });
  const { data: baseTemplatesData, loading: baseTemplatesLoading } = useQuery(BASE_TEMPLATES_QUERY, {
    skip: !user || !createModalOpen,
    fetchPolicy: "cache-and-network",
  });

  const baseTemplates =
    (baseTemplatesData as { baseTemplates?: Array<{ id: string; title: string; width?: number; height?: number }> } | undefined)
      ?.baseTemplates ?? [];

  const [createFromTemplate, { loading: creatingFromTemplate }] = useMutation(
    CREATE_PROJECT_FROM_TEMPLATE_MUTATION,
    {
      refetchQueries: [{ query: PROJECTS_QUERY, variables: { pagination: DEFAULT_PAGINATION } }],
      onError: (err) => {
        pushToast({
          title: "Project creation failed",
          message: err.message,
          tone: "error",
        });
      },
    },
  );

  const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT_MUTATION, {
    refetchQueries: [{ query: PROJECTS_QUERY, variables: { pagination: DEFAULT_PAGINATION } }],
    onError: (err) => {
      pushToast({
        title: "Project creation failed",
        message: err.message,
        tone: "error",
      });
    },
  });

  const [deleteProject, { loading: deleting }] = useMutation(DELETE_PROJECT_MUTATION, {
    update: (cache, { data: result }, options) => {
      if (!result?.deleteProject) {
        return;
      }

      const deletedId = options.variables?.id as string | undefined;
      if (!deletedId) {
        return;
      }

      cache.updateQuery(
        { query: PROJECTS_QUERY, variables: { pagination: DEFAULT_PAGINATION } },
        (prev) => {
          if (!prev?.projects) {
            return prev;
          }

          const nextItems = prev.projects.items.filter(
            (project: { id: string }) => project.id !== deletedId,
          );

          return {
            ...prev,
            projects: {
              ...prev.projects,
              items: nextItems,
              total: Math.max(0, (prev.projects.total ?? nextItems.length) - 1),
            },
          };
        },
      );
    },
    onError: (err) => {
      pushToast({
        title: "Delete failed",
        message: err.message,
        tone: "error",
      });
    },
  });

  const projects =
    (
      data as
        | {
            projects?: {
              items?: Array<{
                id: string;
                title: string;
                createdAt?: string;
                updatedAt?: string;
              }>;
            };
          }
        | undefined
    )?.projects?.items ?? [];

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const creatingProject = creating || creatingFromTemplate;

  const openCreateModal = useCallback(() => {
    setTitle(`Untitled ${new Date().toLocaleDateString()}`);
    setSelectedTemplateId(null);
    setFormError(null);
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setSelectedTemplateId(null);
    setFormError(null);
  }, []);

  const handleSubmitCreate = async () => {
    const trimmed = title.trim();
    if (trimmed.length < 1) {
      setFormError("Title is required.");
      return;
    }

    setFormError(null);
    try {
      const result = selectedTemplateId
        ? await createFromTemplate({
            variables: {
              templateId: selectedTemplateId,
              title: trimmed,
            },
          })
        : await createProject({
            variables: {
              input: {
                title: trimmed,
                content: EMPTY_SCENE,
              },
            },
          });

      const projectId = selectedTemplateId
        ? (result.data as { createProjectFromTemplate?: { id: string } } | undefined)
            ?.createProjectFromTemplate?.id
        : (result.data?.createProject?.id as string | undefined);
      if (projectId) {
        closeCreateModal();
        pushToast({ title: "Project created", tone: "success" });
        navigate(`/editor?projectId=${projectId}`);
      } else {
        setFormError("Project was not created. Try again.");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Project was not created. Try again.");
    }
  };

  const handleDeleteProject = async () => {
    if (!confirmDelete) {
      return;
    }

    const { id, title: projectTitle } = confirmDelete;
    setDeletingId(id);
    try {
      await deleteProject({
        variables: { id },
        optimisticResponse: { deleteProject: true },
      });
      pushToast({ title: "Project deleted", message: projectTitle, tone: "success" });
    } catch {
      // handled in onError
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <AppShell
      title="Your projects"
      subtitle="Projects"
      actions={
        <button
          type="button"
          onClick={openCreateModal}
          disabled={creatingProject}
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      }
    >
      {loading ? <AppPageSpinner label="Loading projects…" /> : null}

      {error ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Failed to load projects: {error.message}
        </p>
      ) : null}

      {!loading && projects.length === 0 && !error ? (
        <p className="glass-card mb-4 rounded-2xl px-6 py-8 text-center text-sm text-violet-100/80">
          No projects yet. Create your first board to get started.
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article key={project.id} className="glass-card rounded-2xl p-5 transition hover:bg-white/12">
            <h2 className="text-lg font-semibold text-white">{project.title}</h2>
            <p className="mt-2 text-sm text-violet-200/70">
              Created {formatDateTime(project.createdAt)}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={`/editor?projectId=${project.id}`}
                className="rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Open
              </Link>
              <button
                type="button"
                className="rounded-full border border-rose-500/40 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-400 disabled:opacity-60"
                onClick={() => setConfirmDelete({ id: project.id, title: project.title })}
                disabled={creatingProject || deleting}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      {(creatingProject || deletingId) && (
        <BlockingOverlay label={deletingId ? "Deleting project..." : "Creating project..."} />
      )}

      {createModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCreateModal();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-violet-950 p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="create-project-title" className="text-lg font-semibold text-white">
              New project
            </h2>
            <p className="mt-1 text-sm text-violet-200/70">
              Pick a built-in template or start from an empty canvas, then name your board.
            </p>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-violet-300/80">
              Built-in templates
            </p>
            {baseTemplatesLoading ? (
              <p className="mt-3 text-sm text-violet-200/70">Loading templates…</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {baseTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    busy={creatingProject}
                    selected={selectedTemplateId === template.id}
                    onUse={() => {
                      setSelectedTemplateId(template.id);
                      if (template.title && title.startsWith("Untitled")) {
                        setTitle(template.title);
                      }
                    }}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              className={`mt-3 w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                selectedTemplateId === null
                  ? "border-cyan-400/60 bg-cyan-500/15 text-white"
                  : "border-white/15 text-violet-100 hover:bg-white/10"
              }`}
              onClick={() => setSelectedTemplateId(null)}
            >
              <span className="font-semibold">Empty canvas</span>
              <span className="mt-0.5 block text-xs text-violet-200/65">1200×800, no preset elements</span>
            </button>

            <label className="mt-5 block text-sm font-medium text-violet-100">
              Project title
              <input
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </label>

            {formError ? <p className="mt-3 text-sm text-rose-300">{formError}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-violet-100 hover:bg-white/10"
                onClick={closeCreateModal}
                disabled={creatingProject}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void handleSubmitCreate()}
                disabled={creatingProject}
              >
                {creatingProject ? "Creating…" : "Create & open"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete project?"
        description="This will permanently remove the project and its versions."
        confirmLabel="Delete"
        confirmTone="danger"
        busy={Boolean(deletingId)}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void handleDeleteProject()}
      />
    </AppShell>
  );
}
