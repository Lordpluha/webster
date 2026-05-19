import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "./auth.store";

describe("auth.store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: true,
    });
  });

  it("setUser marks authenticated state", () => {
    useAuthStore.getState().setUser({
      id: "1",
      email: "u@test.com",
      firstName: "U",
      lastName: "Ser",
      isEmailVerified: true,
      isTwoFactorEnabled: false,
    });
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.user?.email).toBe("u@test.com");
  });

  it("clearUser resets session", () => {
    useAuthStore.getState().setUser({
      id: "1",
      email: "u@test.com",
      firstName: "U",
      lastName: "Ser",
      isEmailVerified: true,
      isTwoFactorEnabled: false,
    });
    useAuthStore.getState().clearUser();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
  });
});
