import type { FC } from "react";
import { useEffect, useReducer, useState } from "react";
import { Grid3x3, History, ZoomIn, ZoomOut } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { NumberInput, SliderInput } from "@/components/ui/controls";
import { focusRingOnLightClass } from "@/shared/lib/a11y";
import { useOptionalEditorWorkspace } from "./editor-workspace-context";
import { useProjectVersionHistory } from "./useProjectVersionHistory";
import { VersionHistoryPanel } from "./VersionHistoryPanel";

const iconBtnClass = `rounded-lg p-2 text-violet-800 transition hover:bg-violet-100 ${focusRingOnLightClass}`;

export const EditorToolbar: FC = () => {
  const workspace = useOptionalEditorWorkspace();
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const { versions, projectId } = useProjectVersionHistory();

  useEffect(() => {
    if (!workspace) return;
    const { engine } = workspace;
    const offScene = engine.events.on("scene:changed", bump);
    const offTool = engine.events.on("tool:changed", bump);
    return () => {
      offScene();
      offTool();
    };
  }, [workspace]);

  if (!workspace) {
    return (
      <header className="border-b border-violet-200/60 bg-white/90 px-4 py-3 text-sm text-violet-600 shadow-sm backdrop-blur-md">
        Editor shell (no canvas workspace)
      </header>
    );
  }

  const { zoomIn, zoomOut, zoomReset, cameraZoomPercent, gridEnabled, setGridEnabled, projectTitle, eraserSize, setEraserSize } =
    workspace;
  const activeTool = workspace.engine.getRuntimeSnapshot().activeTool;

  return (
    <header className="border-b border-violet-200/60 bg-white/90 shadow-sm backdrop-blur-md" role="banner">
      <div className="flex items-center gap-4 overflow-x-auto px-4 py-2.5">
        <div className="hidden shrink-0 sm:block">
          <BrandLogo />
        </div>
        {projectTitle ? (
          <p className="hidden max-w-48 truncate text-sm font-semibold text-violet-900 md:block">
            {projectTitle}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!projectId}
          onClick={() => setVersionsOpen(true)}
          className={
            `relative flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 ${focusRingOnLightClass}`
          }
          aria-label="Open version history"
          title={projectId ? "Project snapshots and restore" : "Save the project first"}
        >
          <History size={18} aria-hidden />
          <span className="hidden sm:inline">Versions</span>
          {versions.length > 0 ? (
            <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {versions.length}
            </span>
          ) : null}
        </button>

        <div className="ml-auto flex items-center gap-2 border-r border-violet-200/80 pr-4">
          <button
            type="button"
            onClick={zoomOut}
            className={iconBtnClass}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut size={18} aria-hidden />
          </button>
          <button
            type="button"
            onClick={zoomReset}
            className={`min-w-14 rounded-lg px-3 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-100 ${focusRingOnLightClass}`}
            aria-label={`Reset zoom, current ${cameraZoomPercent} percent`}
          >
            {cameraZoomPercent}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className={iconBtnClass}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn size={18} aria-hidden />
          </button>
        </div>

        {activeTool === "eraser" ? (
          <div className="flex items-end gap-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2">
            <div className="min-w-48">
              <SliderInput
                label="Eraser"
                min={6}
                max={300}
                step={2}
                value={eraserSize}
                unit="px"
                showValue={false}
                onChange={(event) => setEraserSize(Number(event.target.value))}
              />
            </div>
            <div className="w-14">
              <NumberInput
                min={6}
                max={300}
                step={1}
                value={eraserSize}
                unit="px"
                aria-label="Eraser size"
                onChange={(event) => setEraserSize(Number(event.target.value))}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setGridEnabled(!gridEnabled)}
          aria-pressed={gridEnabled}
          aria-label={gridEnabled ? "Hide grid" : "Show grid"}
          className={
            gridEnabled
              ? `flex items-center gap-2 rounded-lg bg-violet-100 px-3 py-2 text-violet-800 ${focusRingOnLightClass}`
              : `flex items-center gap-2 rounded-lg px-3 py-2 text-violet-800 transition hover:bg-violet-50 ${focusRingOnLightClass}`
          }
          title="Toggle grid"
        >
          <Grid3x3 size={18} aria-hidden />
          <span className="text-sm font-medium">Grid</span>
        </button>

        <Link
          to="/"
          className={`rounded-full border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 ${focusRingOnLightClass}`}
        >
          Home
        </Link>
      </div>

      <VersionHistoryPanel open={versionsOpen} onClose={() => setVersionsOpen(false)} />
    </header>
  );
};
