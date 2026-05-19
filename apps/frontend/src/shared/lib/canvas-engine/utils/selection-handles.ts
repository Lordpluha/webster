import type { Point, Rect, Transform } from "../core/types";
import { applyMat2DToPoint, composeNodeLocalToWorldMatrix, getNodeWorldHitbox } from "./mat2d";

export type ResizeHandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export function getResizeHandlesLocal(bounds: Rect): Array<{ id: ResizeHandleId; x: number; y: number }> {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  return [
    { id: "nw", x, y },
    { id: "n", x: cx, y },
    { id: "ne", x: x + width, y },
    { id: "e", x: x + width, y: cy },
    { id: "se", x: x + width, y: y + height },
    { id: "s", x: cx, y: y + height },
    { id: "sw", x, y: y + height },
    { id: "w", x, y: cy },
  ];
}

export function getResizeHandlesWorld(node: { bounds: Rect; transform: Transform }): Array<{ id: ResizeHandleId; x: number; y: number }> {
  const m = composeNodeLocalToWorldMatrix(node);
  return getResizeHandlesLocal(node.bounds).map((handle) => ({
    id: handle.id,
    ...applyMat2DToPoint(m, handle),
  }));
}

/** Handle above the top edge, offset along the node's local upward direction (world units). */
export function getRotateHandleWorld(node: { bounds: Rect; transform: Transform }, offsetWorld: number): Point {
  const { x, y, width } = node.bounds;
  const cx = x + width / 2;
  const m = composeNodeLocalToWorldMatrix(node);
  const origin = applyMat2DToPoint(m, { x: cx, y });
  const upProbe = applyMat2DToPoint(m, { x: cx, y: y - 1 });
  const dx = upProbe.x - origin.x;
  const dy = upProbe.y - origin.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: origin.x + (dx / len) * offsetWorld,
    y: origin.y + (dy / len) * offsetWorld,
  };
}

export function findResizeHandleAtWorldPoint(
  point: Point,
  node: { bounds: Rect; transform: Transform },
  sizeWorld: number,
): ResizeHandleId | null {
  const radius = sizeWorld / 2;
  for (const handle of getResizeHandlesWorld(node)) {
    if (Math.hypot(point.x - handle.x, point.y - handle.y) <= radius) {
      return handle.id;
    }
  }
  return null;
}

export function getNodeSelectionOutlineWorld(node: { bounds: Rect; transform: Transform }): Point[] {
  return getNodeWorldHitbox(node);
}
