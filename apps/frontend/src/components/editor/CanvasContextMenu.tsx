import { useEffect, useRef } from "react";

export type ContextMenuActionItem = {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
};

export type ContextMenuItem = ContextMenuActionItem | { id: string; type: "separator" };

function isContextMenuSeparator(
  item: ContextMenuItem,
): item is { id: string; type: "separator" } {
  return "type" in item && item.type === "separator";
}

type CanvasContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export function CanvasContextMenu({ open, x, y, items, onClose }: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const el = menuRef.current;
      if (el && !el.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item) => {
        if (isContextMenuSeparator(item)) {
          return <div key={item.id} className="my-1 border-t border-slate-200" role="separator" />;
        }

        const action = item;
        return (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            disabled={action.disabled}
            onClick={() => {
              if (action.disabled) {
                return;
              }
              action.onClick();
              onClose();
            }}
            className={
              "flex w-full items-center justify-between gap-6 px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 " +
              (action.danger
                ? "text-rose-700 hover:bg-rose-50"
                : "text-slate-800 hover:bg-slate-100")
            }
          >
            <span>{action.label}</span>
            {action.shortcut ? (
              <span className="text-xs text-slate-400">{action.shortcut}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
