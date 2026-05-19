import { describe, expect, it } from "vitest";

import {
  hasFieldErrors,
  validateLoginFields,
  validateRegisterFields,
} from "./auth-fields";

describe("validateLoginFields", () => {
  it("requires email and password", () => {
    const errors = validateLoginFields({ email: "", password: "" });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(hasFieldErrors(errors)).toBe(true);
  });

  it("requires 2FA code when enabled", () => {
    const errors = validateLoginFields({
      email: "a@b.com",
      password: "password1",
      requireTwoFactor: true,
      twoFactorCode: "",
    });
    expect(errors.twoFactorCode).toBeTruthy();
  });

  it("passes for valid credentials", () => {
    const errors = validateLoginFields({
      email: "user@example.com",
      password: "password123",
    });
    expect(hasFieldErrors(errors)).toBe(false);
  });
});

describe("validateRegisterFields", () => {
  it("flags password mismatch", () => {
    const errors = validateRegisterFields({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "password123",
      confirmPassword: "different",
    });
    expect(errors.confirmPassword).toBeTruthy();
  });
});
