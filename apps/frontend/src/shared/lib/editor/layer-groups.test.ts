import { describe, expect, it } from "vitest";

import { createCanvasEngine, createIdentityTransform, DEFAULT_LAYER_ID } from "@/shared/lib/canvas-engine";
import {
  canGroupSelection,
  canUngroupSelection,
  getGroupedNodeIds,
  groupSelection,
  ungroupSelection,
} from "./layer-groups";

function makeRect(id: string, groupId?: string) {
  return {
    id,
    layerId: DEFAULT_LAYER_ID,
    type: "rect" as const,
    bounds: { x: 0, y: 0, width: 40, height: 40 },
    transform: createIdentityTransform(),
    style: { fill: "#60a5fa" },
    data: groupId ? { groupId } : undefined,
  };
}

describe("layer-groups", () => {
  it("groups two unlocked nodes", () => {
    const engine = createCanvasEngine();
    engine.addNode(makeRect("a"));
    engine.addNode(makeRect("b"));
    engine.setSelection(["a", "b"]);

    const groupId = groupSelection(engine, ["a", "b"]);
    expect(groupId).toBeTruthy();

    const scene = engine.getSerializableState();
    expect(scene.nodes.a.data?.groupId).toBe(groupId);
    expect(scene.nodes.b.data?.groupId).toBe(groupId);
  });

  it("ungroups all members of touched groups", () => {
    const engine = createCanvasEngine();
    engine.addNode(makeRect("a", "g1"));
    engine.addNode(makeRect("b", "g1"));

    ungroupSelection(engine, ["a"]);

    const scene = engine.getSerializableState();
    expect(scene.nodes.a.data?.groupId).toBeUndefined();
    expect(scene.nodes.b.data?.groupId).toBeUndefined();
  });

  it("expands selection to full group", () => {
    const engine = createCanvasEngine();
    engine.addNode(makeRect("a", "g1"));
    engine.addNode(makeRect("b", "g1"));
    engine.addNode(makeRect("c"));

    const expanded = getGroupedNodeIds(engine.getSerializableState(), ["a"]);
    expect(expanded.sort()).toEqual(["a", "b"].sort());
  });

  it("validates group/ungroup eligibility", () => {
    const engine = createCanvasEngine();
    const scene = engine.getSerializableState();
    engine.addNode(makeRect("a"));
    engine.addNode(makeRect("b"));

    const updated = engine.getSerializableState();
    expect(canGroupSelection(updated, ["a", "b"])).toBe(true);
    expect(canUngroupSelection(scene, ["a"])).toBe(false);

    groupSelection(engine, ["a", "b"]);
    expect(canUngroupSelection(engine.getSerializableState(), ["a"])).toBe(true);
  });
});
