import { describe, expect, it } from "vitest";

import { createEmptySerializableSceneState } from "@/shared/lib/canvas-engine";
import { sceneStateFromProjectContent } from "./scene-from-project-content";

describe("sceneStateFromProjectContent", () => {
  it("returns empty scene for null/undefined", () => {
    const empty = createEmptySerializableSceneState();
    expect(sceneStateFromProjectContent(null)).toEqual(empty);
    expect(sceneStateFromProjectContent(undefined)).toEqual(empty);
  });

  it("parses JSON string content", () => {
    const scene = createEmptySerializableSceneState();
    const json = JSON.stringify(scene);
    expect(sceneStateFromProjectContent(json)).toEqual(scene);
  });

  it("parses object content", () => {
    const scene = createEmptySerializableSceneState();
    expect(sceneStateFromProjectContent(scene)).toEqual(scene);
  });

  it("falls back to empty scene on invalid payload", () => {
    const empty = createEmptySerializableSceneState();
    expect(sceneStateFromProjectContent("not-json")).toEqual(empty);
    expect(sceneStateFromProjectContent(42)).toEqual(empty);
  });
});
