import type { ToolName } from "@/shared/lib/canvas-engine";

/** Tool shortcuts: Caps Lock on + Shift + letter. */
export const TOOL_HOTKEY_BY_KEY: Record<string, ToolName> = {
  v: "select",
  t: "text",
  e: "eraser",
  b: "pencil",
  r: "rect",
  g: "triangle",
  o: "ellipse",
  a: "arrow",
  i: "image",
};

export function formatToolHotkey(key: string): string {
  return `Caps+Shift+${key.toUpperCase()}`;
}

export function getToolFromHotkey(event: KeyboardEvent): ToolName | null {
  if (!event.getModifierState("CapsLock") || !event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }
  return TOOL_HOTKEY_BY_KEY[event.key.toLowerCase()] ?? null;
}
