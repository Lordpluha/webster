import { useEffect, useId, useState, type FC } from "react";
import { Minus, Plus } from "lucide-react";

import {
  MAX_TEXT_FONT_SIZE,
  MIN_TEXT_FONT_SIZE,
  TEXT_FONT_SIZE_PRESETS,
  clampFontSize,
} from "@/shared/lib/canvas-engine/utils/text-style";

type FontSizeInputProps = {
  label?: string;
  value: number;
  disabled?: boolean;
  onChange: (fontSize: number) => void;
};

export const FontSizeInput: FC<FontSizeInputProps> = ({
  label = "Font size",
  value,
  disabled = false,
  onChange,
}) => {
  const inputId = useId();
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clampFontSize(parsed);
    setDraft(String(next));
    if (next !== value) {
      onChange(next);
    }
  };

  const applyDelta = (delta: number) => {
    onChange(clampFontSize(value + delta));
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-xs font-medium text-slate-700">
        {label}
      </label>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          disabled={disabled || value <= MIN_TEXT_FONT_SIZE}
          onClick={() => applyDelta(-1)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="Decrease font size"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative min-w-0 flex-1">
          <input
            id={inputId}
            type="number"
            min={MIN_TEXT_FONT_SIZE}
            max={MAX_TEXT_FONT_SIZE}
            step={1}
            disabled={disabled}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDraft(String(value));
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25 disabled:bg-slate-100"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            px
          </span>
        </div>

        <button
          type="button"
          disabled={disabled || value >= MAX_TEXT_FONT_SIZE}
          onClick={() => applyDelta(1)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="Increase font size"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TEXT_FONT_SIZE_PRESETS.map((preset) => {
          const active = value === preset;
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset)}
              className={
                active
                  ? "rounded-full bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-violet-400 hover:text-violet-700 disabled:opacity-40"
              }
            >
              {preset}
            </button>
          );
        })}
      </div>
    </div>
  );
};
