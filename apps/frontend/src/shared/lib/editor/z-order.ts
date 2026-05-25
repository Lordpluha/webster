import type { CanvasEngine, NodeId, SerializableSceneState } from "@/shared/lib/canvas-engine";

import { getGroupedNodeIds } from "./layer-groups";

function expandSelection(scene: SerializableSceneState, nodeIds: NodeId[]): NodeId[] {
  return getGroupedNodeIds(scene, nodeIds).sort(
    (a, b) => scene.nodeOrder.indexOf(a) - scene.nodeOrder.indexOf(b),
  );
}

function applyNodeOrder(engine: CanvasEngine, nextOrder: NodeId[]): void {
  for (let targetIndex = nextOrder.length - 1; targetIndex >= 0; targetIndex -= 1) {
    const id = nextOrder[targetIndex];
    engine.reorderNode(id, targetIndex);
  }
}

/** Move selection one step toward front (higher z-index). */
export function bringForward(engine: CanvasEngine, nodeIds: NodeId[]): void {
  const scene = engine.getSerializableState();
  const block = expandSelection(scene, nodeIds);
  if (block.length === 0) {
    return;
  }

  const order = [...scene.nodeOrder];
  const indices = block.map((id) => order.indexOf(id)).filter((i) => i >= 0);
  const maxIdx = Math.max(...indices);
  if (maxIdx >= order.length - 1) {
    return;
  }

  const without = order.filter((id) => !block.includes(id));
  const anchor = order[maxIdx + 1];
  const insertAt = without.indexOf(anchor) + 1;
  const nextOrder = [...without.slice(0, insertAt), ...block, ...without.slice(insertAt)];
  applyNodeOrder(engine, nextOrder);
}

/** Move selection one step toward back (lower z-index). */
export function sendBackward(engine: CanvasEngine, nodeIds: NodeId[]): void {
  const scene = engine.getSerializableState();
  const block = expandSelection(scene, nodeIds);
  if (block.length === 0) {
    return;
  }

  const order = [...scene.nodeOrder];
  const indices = block.map((id) => order.indexOf(id)).filter((i) => i >= 0);
  const minIdx = Math.min(...indices);
  if (minIdx <= 0) {
    return;
  }

  const without = order.filter((id) => !block.includes(id));
  const anchor = order[minIdx - 1];
  const insertAt = without.indexOf(anchor);
  const nextOrder = [...without.slice(0, insertAt), ...block, ...without.slice(insertAt)];
  applyNodeOrder(engine, nextOrder);
}

export function bringToFront(engine: CanvasEngine, nodeIds: NodeId[]): void {
  const scene = engine.getSerializableState();
  const block = expandSelection(scene, nodeIds);
  if (block.length === 0) {
    return;
  }
  const without = scene.nodeOrder.filter((id) => !block.includes(id));
  applyNodeOrder(engine, [...without, ...block]);
}

export function sendToBack(engine: CanvasEngine, nodeIds: NodeId[]): void {
  const scene = engine.getSerializableState();
  const block = expandSelection(scene, nodeIds);
  if (block.length === 0) {
    return;
  }
  const without = scene.nodeOrder.filter((id) => !block.includes(id));
  applyNodeOrder(engine, [...block, ...without]);
}
