import { test, expect } from "@playwright/test";

import { guestMeHandler, mockGraphql } from "./graphql-mock";

test.describe("Landing navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockGraphql(page, guestMeHandler);
  });

  test("guest sees landing and can open login/register", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /create posters/i })).toBeVisible();
    await page.getByRole("link", { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: /get started/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
  });
});
