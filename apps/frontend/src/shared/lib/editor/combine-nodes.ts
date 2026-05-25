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

const ELLIPSE_SAMPLES = 32;

export function canCombineSelection(scene: SerializableSceneState, nodeIds: NodeId[]): boolean {
  const eligible = nodeIds.filter((id) => {
    const node = scene.nodes[id];
    return node && !node.data?.locked && COMBINABLE_TYPES.has(node.type);
  });
  return eligible.length >= 2;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function toWorldPoints(node: SceneNode, localPoints: Point[]): Point[] {
  const m = composeNodeLocalToWorldMatrix(node);
  return localPoints.map((p) => applyMat2DToPoint(m, p));
}

function closeContour(points: Point[]): Point[] {
  if (points.length < 2) {
    return points;
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (distance(first, last) < 0.5) {
    return points;
  }
  return [...points, { ...first }];
}

/** One closed outline per shape in world coordinates. */
function getShapeWorldContour(node: SceneNode): Point[] {
  const { bounds } = node;

  switch (node.type) {
    case "triangle": {
      const local = [
        { x: bounds.x + bounds.width / 2, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        { x: bounds.x, y: bounds.y + bounds.height },
      ];
      return closeContour(toWorldPoints(node, local));
    }
    case "ellipse": {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const rx = bounds.width / 2;
      const ry = bounds.height / 2;
      const local: Point[] = [];
      for (let i = 0; i < ELLIPSE_SAMPLES; i += 1) {
        const angle = (i / ELLIPSE_SAMPLES) * Math.PI * 2;
        local.push({
          x: cx + Math.cos(angle) * rx,
          y: cy + Math.sin(angle) * ry,
        });
      }
      return closeContour(toWorldPoints(node, local));
    }
    case "arrow": {
      const pts = node.data?.points;
      if (pts && pts.length >= 3) {
        const world = toWorldPoints(node, pts);
        if (distance(world[0], world[world.length - 1]) < 0.5) {
          return world;
        }
      }
      return closeContour(toWorldPoints(node, getRectCorners(bounds)));
    }
    case "path": {
      const pts = node.data?.contours?.[0] ?? node.data?.points;
      if (!pts || pts.length < 2) {
        return closeContour(toWorldPoints(node, getRectCorners(bounds)));
      }
      const world = toWorldPoints(node, pts);
      // Pencil / open strokes: do not connect last point to first (causes long stray segments).
      if (distance(world[0], world[world.length - 1]) < 0.5 && world.length >= 3) {
        return world;
      }
      return closeContour(toWorldPoints(node, getRectCorners(bounds)));
    }
    case "rect":
    default:
      return closeContour(toWorldPoints(node, getRectCorners(bounds)));
  }
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

function worldContoursToLocal(contours: Point[][], bounds: { x: number; y: number }): Point[][] {
  return contours.map((contour) =>
    contour.map((p) => ({
      x: p.x - bounds.x,
      y: p.y - bounds.y,
    })),
  );
}

/** Merge 2+ shapes into one path: each source shape keeps its own closed outline. */
export function combineSelection(engine: CanvasEngine, nodeIds: NodeId[]): NodeId | null {
  const scene = engine.getSerializableState();
  const eligible = nodeIds.filter((id) => {
    const node = scene.nodes[id];
    return node && !node.data?.locked && COMBINABLE_TYPES.has(node.type);
  });

  if (eligible.length < 2) {
    return null;
  }

  const worldContours: Point[][] = [];
  let fill = "#60a5fa";
  let stroke = "#1e293b";
  let strokeWidth = 2;

  for (const id of eligible) {
    const node = scene.nodes[id];
    if (!node) continue;
    const contour = getShapeWorldContour(node);
    if (contour.length >= 3) {
      worldContours.push(contour);
    }
    if (node.style.fill) fill = node.style.fill;
    if (node.style.stroke) stroke = node.style.stroke;
    if (typeof node.style.strokeWidth === "number") strokeWidth = node.style.strokeWidth;
  }

  if (worldContours.length < 2) {
    return null;
  }

  const bounds = boundsFromPoints(worldContours.flat());
  const localContours = worldContoursToLocal(worldContours, bounds);

  const newId = createNodeId();
  const combined: SceneNode = {
    id: newId,
    layerId: DEFAULT_LAYER_ID,
    type: "path",
    bounds,
    transform: createIdentityTransform(),
    style: { fill, stroke, strokeWidth, opacity: 0.92 },
    data: {
      contours: localContours,
      points: localContours[0],
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
