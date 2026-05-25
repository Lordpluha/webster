import { LayoutTemplate } from "lucide-react";

export type TemplateCardItem = {
  id: string;
  title: string;
  width?: number;
  height?: number;
};

type TemplateCardProps = {
  template: TemplateCardItem;
  disabled?: boolean;
  busy?: boolean;
  selected?: boolean;
  onUse: () => void;
};

export function TemplateCard({ template, disabled, busy, selected, onUse }: TemplateCardProps) {
  const sizeLabel =
    template.width && template.height ? `${template.width}×${template.height}` : null;

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onUse}
      className={`flex flex-col rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
        selected
          ? "border-cyan-400/60 bg-cyan-500/15 ring-2 ring-cyan-400/40"
          : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/25 via-fuchsia-500/15 to-cyan-500/20">
        <LayoutTemplate className="h-7 w-7 text-white/85" aria-hidden />
      </div>
      <span className="text-sm font-semibold text-white">{template.title}</span>
      {sizeLabel ? <span className="mt-1 text-xs text-violet-200/65">{sizeLabel}</span> : null}
    </button>
  );
}
