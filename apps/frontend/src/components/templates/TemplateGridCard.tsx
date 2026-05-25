import { LayoutTemplate, Pencil, Trash2 } from "lucide-react";

export type TemplateGridCardItem = {
  id: string;
  title: string;
};

type TemplateGridCardProps = {
  template: TemplateGridCardItem;
  meta: string;
  busy?: boolean;
  creatingProject?: boolean;
  onNewProject: () => void;
  onRename?: () => void;
  onDelete?: () => void;
};

export function TemplateGridCard({
  template,
  meta,
  busy,
  creatingProject,
  onNewProject,
  onRename,
  onDelete,
}: TemplateGridCardProps) {
  const showManage = Boolean(onRename && onDelete);

  return (
    <article className="glass-card flex flex-col rounded-2xl p-5 transition hover:bg-white/12">
      <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/25">
        <LayoutTemplate className="h-8 w-8 text-white/90" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-white">{template.title}</h2>
      <p className="mt-1 text-xs text-violet-200/70">{meta}</p>
      <div className="mt-auto flex min-h-[5.75rem] flex-col justify-end gap-2 pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={onNewProject}
          className="w-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {creatingProject ? "Creating…" : "New project"}
        </button>
        {showManage ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onRename}
              className="inline-flex items-center justify-center gap-1 rounded-full border border-white/20 px-3 py-2 text-sm text-violet-100 hover:bg-white/10 disabled:opacity-60"
              title="Rename template"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Rename
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-1 rounded-full border border-rose-400/40 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
              title="Delete template"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
