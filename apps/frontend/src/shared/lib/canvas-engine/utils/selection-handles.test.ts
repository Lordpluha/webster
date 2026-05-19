import { describe, expect, it } from "vitest";

import { createIdentityTransform } from "../core/types";
import { getRotateHandleWorld, getResizeHandlesWorld } from "./selection-handles";

function close(a: number, b: number) {
  return Math.abs(a - b) < 1e-6;
}

describe("selection-handles", () => {
  it("resize handles move when node is rotated", () => {
    const bounds = { x: 0, y: 0, width: 100, height: 50 };
    const unrotated = getResizeHandlesWorld({
      bounds,
      transform: createIdentityTransform(),
    });
    const rotated = getResizeHandlesWorld({
      bounds,
      transform: { ...createIdentityTransform(), rotate: 45 },
    });
    const nwUnrotated = unrotated.find((h) => h.id === "nw")!;
    const nwRotated = rotated.find((h) => h.id === "nw")!;
    expect(close(nwUnrotated.x, nwRotated.x) && close(nwUnrotated.y, nwRotated.y)).toBe(false);
  });

  it("rotate handle sits above top edge when rotated", () => {
    const node = {
      bounds: { x: 10, y: 20, width: 80, height: 40 },
      transform: { ...createIdentityTransform(), rotate: 36 },
    };
    const topCenter = { x: 50, y: 20 };
    const handle = getRotateHandleWorld(node, 28);
    const dist = Math.hypot(handle.x - topCenter.x, handle.y - topCenter.y);
    expect(dist).toBeGreaterThan(20);
  });
});
