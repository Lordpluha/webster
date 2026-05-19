import type { SceneNode } from "../core/types";

export const DEFAULT_TEXT_FONT_SIZE = 16;
export const MIN_TEXT_FONT_SIZE = 8;
export const MAX_TEXT_FONT_SIZE = 256;
export const TEXT_FONT_SIZE_PRESETS = [12, 14, 16, 18, 20, 24, 32, 48, 64, 72] as const;

export const TEXT_FONT_FAMILIES = [
  { value: "sans-serif", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
] as const;

export function clampFontSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TEXT_FONT_SIZE;
  }
  return Math.min(MAX_TEXT_FONT_SIZE, Math.max(MIN_TEXT_FONT_SIZE, Math.round(value)));
}

export function getTextFontSize(node: SceneNode): number {
  const stored = node.data?.fontSize;
  if (typeof stored === "number" && Number.isFinite(stored)) {
    return clampFontSize(stored);
  }
  return clampFontSize(Math.floor(node.bounds.height * 0.72));
}

export function getTextFontFamily(node: SceneNode): string {
  const family = node.data?.fontFamily;
  return typeof family === "string" && family.length > 0 ? family : "sans-serif";
}

export function measureTextBounds(
  text: string,
  fontSize: number,
  fontFamily = "sans-serif",
): { width: number; height: number } {
  const safeSize = clampFontSize(fontSize);
  const content = text.length > 0 ? text : " ";

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = `${safeSize}px ${fontFamily}`;
      const metrics = ctx.measureText(content);
      return {
        width: Math.max(48, Math.ceil(metrics.width) + 12),
        height: Math.max(safeSize + 8, Math.ceil(safeSize * 1.3)),
      };
    }
  }

  return {
    width: Math.max(48, Math.ceil(content.length * safeSize * 0.55)),
    height: Math.max(safeSize + 8, Math.ceil(safeSize * 1.3)),
  };
}

export function applyTextStyleToNode(
  node: SceneNode,
  patch: { fontSize?: number; fontFamily?: string; text?: string },
): SceneNode {
  const fontSize = patch.fontSize !== undefined ? clampFontSize(patch.fontSize) : getTextFontSize(node);
  const fontFamily = patch.fontFamily ?? getTextFontFamily(node);
  const text = patch.text ?? (typeof node.data?.text === "string" ? node.data.text : "");

  const bounds = measureTextBounds(text, fontSize, fontFamily);

  return {
    ...node,
    bounds: {
      ...node.bounds,
      width: bounds.width,
      height: bounds.height,
    },
    data: {
      ...(node.data ?? {}),
      text,
      fontSize,
      fontFamily,
    },
  };
}
