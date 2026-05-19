import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PropertiesPanel } from "./PropertiesPanel";
import { MockEditorWorkspaceProvider } from "@/test/editor-workspace-mock";
import { createCanvasEngine, createNodeId } from "@/shared/lib/canvas-engine";
import type { SceneNode } from "@/shared/lib/canvas-engine";

function rectNode(id: string): SceneNode {
  return {
    id,
    type: "rect",
    layerId: "layer-default",
    bounds: { x: 10, y: 20, width: 100, height: 80 },
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 },
    style: { fill: "#94a3b8", stroke: "#0f172a", strokeWidth: 1, opacity: 1 },
    data: {},
  };
}

describe("PropertiesPanel", () => {
  it("renders nothing without selection", () => {
    const { container } = render(
      <MockEditorWorkspaceProvider>
        <PropertiesPanel />
      </MockEditorWorkspaceProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows properties for a single selected node", () => {
    const engine = createCanvasEngine();
    const id = createNodeId();
    engine.addNode(rectNode(id));
    engine.setSelection([id]);

    render(
      <MockEditorWorkspaceProvider value={{ engine }}>
        <PropertiesPanel />
      </MockEditorWorkspaceProvider>,
    );

    expect(screen.getByRole("complementary", { name: /properties/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^x$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^width$/i)).toBeInTheDocument();
  });

  it("shows multi-select message", () => {
    const engine = createCanvasEngine();
    const a = createNodeId();
    const b = createNodeId();
    engine.addNode(rectNode(a));
    engine.addNode(rectNode(b));
    engine.setSelection([a, b]);

    render(
      <MockEditorWorkspaceProvider value={{ engine }}>
        <PropertiesPanel />
      </MockEditorWorkspaceProvider>,
    );

    expect(screen.getByText(/2 objects selected/i)).toBeInTheDocument();
  });
});
