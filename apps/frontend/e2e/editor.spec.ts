import { test, expect } from "@playwright/test";

import { authUser, mockGraphql } from "./graphql-mock";

const emptyScene = {
  version: 1,
  nodes: {},
  layerOrder: ["layer-default"],
  selection: [],
  camera: { x: 0, y: 0, zoom: 1 },
};

test.describe("Editor shell (mocked backend)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.assign(navigator, {
        clipboard: { writeText: async () => {} },
      });
    });
    await mockGraphql(page, {
      GetCurrentUser: () => ({ me: authUser }),
      Project: () => ({
        project: {
          id: "proj-e2e",
          title: "E2E board",
          width: 800,
          height: 600,
          content: emptyScene,
          updatedAt: new Date().toISOString(),
        },
      }),
      Versions: () => ({ versions: [] }),
      AutosaveProject: () => ({
        autosaveProject: { id: "proj-e2e", updatedAt: new Date().toISOString() },
      }),
      CreateVersion: () => ({
        createVersion: { id: "v1", label: "snap", createdAt: new Date().toISOString() },
      }),
      ExportPng: () => ({ exportPng: { url: "https://example.com/export.png" } }),
      CreateShareLink: () => ({
        createShareLink: { url: "https://example.com/share/abc", token: "abc" },
      }),
    });
  });

  test("editor toolbar and footer actions are reachable", async ({ page }) => {
    await page.goto("/editor?projectId=proj-e2e");
    await expect(page.getByRole("banner")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("toolbar", { name: /canvas tools/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /save project now/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /open version history/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export project as png/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export project as jpg/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export project as pdf/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create and copy share link/i })).toBeEnabled();
  });
});
