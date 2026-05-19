import type { ReactNode } from "react";

import { EditorWorkspaceProvider, type EditorWorkspaceContextValue } from "@/components/editor/editor-workspace-context";
import { createCanvasEngine } from "@/shared/lib/canvas-engine";

export function createMockEditorWorkspace(
  overrides: Partial<EditorWorkspaceContextValue> = {},
): EditorWorkspaceContextValue {
  const engine = createCanvasEngine();
  return {
    engine,
    projectId: "proj-1",
    projectTitle: "Test project",
    projectCreatedAt: null,
    autosaveLabel: "Saved",
    saveNow: async () => {},
    applyProjectContent: () => {},
    zoomIn: () => {},
    zoomOut: () => {},
    zoomReset: () => {},
    cameraZoomPercent: 100,
    gridEnabled: true,
    setGridEnabled: () => {},
    exportProject: async () => {},
    ...overrides,
  };
}

export function MockEditorWorkspaceProvider({
  value,
  children,
}: {
  value?: Partial<EditorWorkspaceContextValue>;
  children: ReactNode;
}) {
  return (
    <EditorWorkspaceProvider value={createMockEditorWorkspace(value)}>
      {children}
    </EditorWorkspaceProvider>
  );
}
