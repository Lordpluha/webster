import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { EditorToolbar } from "./EditorToolbar";
import { MockEditorWorkspaceProvider } from "@/test/editor-workspace-mock";

function renderToolbar(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("EditorToolbar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders zoom controls with accessible labels", () => {
    renderToolbar(
      <MockEditorWorkspaceProvider>
        <EditorToolbar />
      </MockEditorWorkspaceProvider>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset zoom/i })).toHaveTextContent("100%");
  });

  it("calls zoom handlers", async () => {
    const zoomIn = vi.fn();
    const zoomOut = vi.fn();
    const user = userEvent.setup();

    renderToolbar(
      <MockEditorWorkspaceProvider value={{ zoomIn, zoomOut }}>
        <EditorToolbar />
      </MockEditorWorkspaceProvider>,
    );

    const banner = screen.getByRole("banner");
    await user.click(within(banner).getByRole("button", { name: /zoom in/i }));
    await user.click(within(banner).getByRole("button", { name: /zoom out/i }));
    expect(zoomIn).toHaveBeenCalledOnce();
    expect(zoomOut).toHaveBeenCalledOnce();
  });
});
