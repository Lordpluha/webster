import { afterEach, describe, expect, it, vi } from "vitest";

import { getApiOrigin, resolveCanvasImageSrc } from "./image-src";

describe("resolveCanvasImageSrc", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses same origin for /uploads when GraphQL URL is relative (production nginx)", () => {
    vi.stubEnv("VITE_GRAPHQL_URL", "/graphql");
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);

    const src = resolveCanvasImageSrc("/uploads/abc.png");
    expect(src).toBe("http://localhost:3000/uploads/abc.png");
    expect(src).not.toContain(":4000");
  });

  it("getApiOrigin does not fall back to localhost when GraphQL URL is relative", () => {
    vi.stubEnv("VITE_GRAPHQL_URL", "/graphql");
    expect(getApiOrigin()).toBe("http://localhost:3000");
  });
});
