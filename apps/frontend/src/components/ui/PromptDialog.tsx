import { useEffect, useState, type FC } from "react";

type PromptDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  required?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export const PromptDialog: FC<PromptDialogProps> = ({
  open,
  title,
  description,
  label = "Value",
  defaultValue = "",
  placeholder,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  busy = false,
  required = true,
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (required && !trimmed) {
      return;
    }
    onConfirm(required ? trimmed : value);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-violet-950 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="prompt-dialog-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-violet-200/70">{description}</p> : null}

        <label className="mt-5 block text-sm font-medium text-violet-100">
          {label}
          <input
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus
            disabled={busy}
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-violet-100 hover:bg-white/10 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || (required && !value.trim())}
            className="rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
