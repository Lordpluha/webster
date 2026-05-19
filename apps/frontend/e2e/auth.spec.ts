import { test, expect } from "@playwright/test";

import { authUser, guestMeHandler, mockGraphql } from "./graphql-mock";

test.describe("Auth flows (mocked GraphQL)", () => {
  test("login submits credentials and redirects to projects", async ({ page }) => {
    let loggedIn = false;
    await mockGraphql(page, {
      ...guestMeHandler,
      Login: () => {
        loggedIn = true;
        return { login: { message: "ok" } };
      },
      GetCurrentUser: () => ({ me: loggedIn ? authUser : null }),
      RefreshToken: () => ({ refreshToken: { message: "ok" } }),
    });

    await page.goto("/login");
    await page.getByLabel(/email address/i).fill("e2e@webster.test");
    await page.getByLabel(/^password$/i).fill("password12345");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/projects/, { timeout: 10_000 });
  });

  test("verify email page accepts token", async ({ page }) => {
    await mockGraphql(page, {
      ...guestMeHandler,
      VerifyEmail: () => ({ verifyEmail: { message: "verified" } }),
    });

    await page.goto("/verify-email?token=test-token");
    await expect(page.getByText(/email verified/i)).toBeVisible({ timeout: 10_000 });
  });

  test("magic link request shows success", async ({ page }) => {
    await mockGraphql(page, {
      ...guestMeHandler,
      RequestMagicLink: () => ({ requestMagicLink: { message: "sent" } }),
    });

    await page.goto("/magic-link");
    await page.getByLabel(/email address/i).fill("e2e@webster.test");
    await page.getByRole("button", { name: /send magic link/i }).click();
    await expect(page.getByText(/magic link sent/i)).toBeVisible();
  });

  test("reset password form renders", async ({ page }) => {
    await mockGraphql(page, {
      ...guestMeHandler,
      RequestPasswordReset: () => ({ requestPasswordReset: { message: "sent" } }),
    });

    await page.goto("/reset-password");
    await page.getByLabel(/email/i).fill("e2e@webster.test");
    await page.getByRole("button", { name: /send reset email/i }).click();
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });
});
