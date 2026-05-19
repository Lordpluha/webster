import type { FC, ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "danger",
  busy = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!open) {
    return null;
  }

  const confirmClass =
    confirmTone === "danger"
      ? "bg-rose-500/90 text-white hover:bg-rose-500"
      : "bg-linear-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-95";

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
        aria-labelledby="confirm-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-violet-200/70">{description}</p> : null}
        {children ? <div className="mt-3 text-sm text-violet-100/90">{children}</div> : null}

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
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${confirmClass}`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
