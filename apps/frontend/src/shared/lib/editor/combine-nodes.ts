import {
  applyMat2DToPoint,
  composeNodeLocalToWorldMatrix,
  createIdentityTransform,
  createNodeId,
  DEFAULT_LAYER_ID,
  getRectCorners,
  type CanvasEngine,
  type NodeId,
  type Point,
  type SceneNode,
  type SerializableSceneState,
} from "@/shared/lib/canvas-engine";

const COMBINABLE_TYPES = new Set<SceneNode["type"]>(["rect", "triangle", "ellipse", "arrow", "path"]);

export function canCombineSelection(scene: SerializableSceneState, nodeIds: NodeId[]): boolean {
  const eligible = nodeIds.filter((id) => {
    const node = scene.nodes[id];
    return node && !node.data?.locked && COMBINABLE_TYPES.has(node.type);
  });
  return eligible.length >= 2;
}

function sampleWorldPoints(node: SceneNode): Point[] {
  const m = composeNodeLocalToWorldMatrix(node);

  if (node.type === "ellipse") {
    const points: Point[] = [];
    const cx = node.bounds.x + node.bounds.width / 2;
    const cy = node.bounds.y + node.bounds.height / 2;
    const rx = node.bounds.width / 2;
    const ry = node.bounds.height / 2;
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2;
      points.push(
        applyMat2DToPoint(m, {
          x: cx + Math.cos(angle) * rx,
          y: cy + Math.sin(angle) * ry,
        }),
      );
    }
    return points;
  }

  if ((node.type === "arrow" || node.type === "path") && node.data?.points?.length) {
    return node.data.points.map((p) => applyMat2DToPoint(m, p));
  }

  return getRectCorners(node.bounds).map((p) => applyMat2DToPoint(m, p));
}

function convexHull(points: Point[]): Point[] {
  if (points.length <= 2) {
    return points;
  }

  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function boundsFromPoints(points: Point[]): { x: number; y: number; width: number; height: number } {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/** Merge 2+ shapes into one path (not a group). Uses convex hull of shape outlines. */
export function combineSelection(engine: CanvasEngine, nodeIds: NodeId[]): NodeId | null {
  const scene = engine.getSerializableState();
  const eligible = nodeIds.filter((id) => {
    const node = scene.nodes[id];
    return node && !node.data?.locked && COMBINABLE_TYPES.has(node.type);
  });

  if (eligible.length < 2) {
    return null;
  }

  const worldPoints: Point[] = [];
  let fill = "#60a5fa";
  let stroke = "#1e293b";
  let strokeWidth = 2;

  for (const id of eligible) {
    const node = scene.nodes[id];
    if (!node) continue;
    worldPoints.push(...sampleWorldPoints(node));
    if (node.style.fill) fill = node.style.fill;
    if (node.style.stroke) stroke = node.style.stroke;
    if (typeof node.style.strokeWidth === "number") strokeWidth = node.style.strokeWidth;
  }

  const hull = convexHull(worldPoints);
  if (hull.length < 3) {
    return null;
  }

  const bounds = boundsFromPoints(hull);
  const localPoints = hull.map((p) => ({
    x: p.x - bounds.x,
    y: p.y - bounds.y,
  }));

  const newId = createNodeId();
  const combined: SceneNode = {
    id: newId,
    layerId: DEFAULT_LAYER_ID,
    type: "path",
    bounds,
    transform: createIdentityTransform(),
    style: { fill, stroke, strokeWidth, opacity: 0.92 },
    data: {
      points: localPoints,
      label: "Combined shape",
    },
  };

  engine.batchUpdate(
    ({ addNode, removeNode }) => {
      for (const id of eligible) {
        removeNode(id);
      }
      addNode(combined);
    },
    { history: { label: "combine" } },
  );

  engine.setSelection([newId]);
  return newId;
}
