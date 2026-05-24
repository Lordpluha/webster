import { afterEach, describe, expect, it, vi } from "vitest";

import { copyTextToClipboard } from "./copy-to-clipboard";

describe("copyTextToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses navigator.clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const ok = await copyTextToClipboard("https://example.com/share/abc");
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.com/share/abc");
  });

  it("falls back to execCommand when clipboard API is missing", async () => {
    vi.stubGlobal("navigator", {});
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true });

    const ok = await copyTextToClipboard("http://site/share/x");
    expect(ok).toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });
});
