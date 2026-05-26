import { test, expect } from "@playwright/test";

import { guestMeHandler, mockGraphql } from "./graphql-mock";

const sharedScene = {
  version: 1,
  nodes: {
    "node-1": {
      id: "node-1",
      layerId: "layer-default",
      type: "rect",
      bounds: { x: 40, y: 40, width: 120, height: 80 },
      transform: { translate: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotate: 0 },
      style: { fill: "#60a5fa", stroke: "#1e293b", strokeWidth: 2 },
    },
  },
  layerOrder: ["layer-default"],
  nodeOrder: ["node-1"],
};

test.describe("Share page (view only)", () => {
  test.beforeEach(async ({ page }) => {
    await mockGraphql(page, {
      ...guestMeHandler,
      ResolveShareLink: () => ({
        resolveShareLink: {
          token: "demo-token",
          role: "VIEWER",
          canEdit: false,
          project: {
            id: "proj-share",
            userId: "other-user",
            title: "Shared board",
            width: 800,
            height: 600,
            content: sharedScene,
            updatedAt: new Date().toISOString(),
          },
        },
      }),
    });
  });

  test("guest sees canvas in view-only mode", async ({ page }) => {
    await page.goto("/share/demo-token");
    await expect(page.getByRole("heading", { name: "Shared board" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("View only")).toBeVisible();
    await expect(page.getByRole("img", { name: /shared project canvas/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open in editor" })).toHaveCount(0);
  });
});
