/** Built-in starter boards (userId = null). Scene format matches canvas engine v1. */
export type DefaultBaseTemplate = {
  title: string;
  width: number;
  height: number;
  content: Record<string, unknown>;
};

const LAYER = "layer-default";

function scene(
  nodes: Record<string, unknown>,
  nodeOrder: string[],
): Record<string, unknown> {
  return {
    version: 1,
    nodes,
    nodeOrder,
    layerOrder: [LAYER],
  };
}

function rect(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke = "#1e293b",
  strokeWidth = 2,
) {
  return {
    id,
    layerId: LAYER,
    type: "rect",
    bounds: { x, y, width, height },
    transform: { translate: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotate: 0 },
    style: { fill, stroke, strokeWidth, opacity: 1 },
  };
}

function text(
  id: string,
  x: number,
  y: number,
  label: string,
  fontSize: number,
  fill = "#0f172a",
) {
  return {
    id,
    layerId: LAYER,
    type: "text",
    bounds: { x, y, width: 1, height: 1 },
    transform: { translate: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotate: 0 },
    style: { fill },
    data: { text: label, fontSize },
  };
}

function arrow(id: string, x1: number, y1: number, x2: number, y2: number) {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return {
    id,
    layerId: LAYER,
    type: "arrow",
    bounds: { x, y, width: Math.abs(x2 - x1) || 1, height: Math.abs(y2 - y1) || 1 },
    transform: { translate: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotate: 0 },
    style: { stroke: "#334155", strokeWidth: 2, fill: "#334155" },
    data: { points: [{ x: x1, y: y1 }, { x: x2, y: y2 }] },
  };
}

export const DEFAULT_BASE_TEMPLATES: DefaultBaseTemplate[] = [
  {
    title: "Photo frame",
    width: 800,
    height: 1000,
    content: scene(
      {
        "frame-outer": rect("frame-outer", 80, 60, 640, 880, "#f8fafc", "#0f172a", 6),
        "frame-inner": rect("frame-inner", 120, 120, 560, 720, "#e2e8f0", "#94a3b8", 2),
        "frame-caption": text("frame-caption", 280, 860, "Your photo", 28, "#475569"),
      },
      ["frame-outer", "frame-inner", "frame-caption"],
    ),
  },
  {
    title: "Presentation slide",
    width: 1280,
    height: 720,
    content: scene(
      {
        "slide-bg": rect("slide-bg", 0, 0, 1280, 720, "#ffffff"),
        "slide-header": rect("slide-header", 0, 0, 1280, 120, "#4f46e5"),
        "slide-title": text("slide-title", 48, 36, "Slide title", 42, "#ffffff"),
        "slide-subtitle": text("slide-subtitle", 48, 160, "Subtitle or key message", 24, "#334155"),
        "slide-bullet": text("slide-bullet", 48, 220, "• Point one\n• Point two\n• Point three", 20, "#475569"),
      },
      ["slide-bg", "slide-header", "slide-title", "slide-subtitle", "slide-bullet"],
    ),
  },
  {
    title: "Social media post",
    width: 1080,
    height: 1080,
    content: scene(
      {
        "post-bg": rect("post-bg", 0, 0, 1080, 1080, "#fdf4ff"),
        "post-accent": rect("post-accent", 0, 0, 1080, 280, "#c026d3"),
        "post-headline": text("post-headline", 64, 80, "Headline", 56, "#ffffff"),
        "post-body": text("post-body", 64, 360, "Your message goes here.\nAdd hashtags and a call to action.", 28, "#581c87"),
      },
      ["post-bg", "post-accent", "post-headline", "post-body"],
    ),
  },
  {
    title: "Wireframe layout",
    width: 1200,
    height: 800,
    content: scene(
      {
        "wf-nav": rect("wf-nav", 40, 40, 1120, 64, "#e2e8f0", "#64748b", 2),
        "wf-sidebar": rect("wf-sidebar", 40, 120, 240, 640, "#f1f5f9", "#64748b", 2),
        "wf-main": rect("wf-main", 300, 120, 860, 520, "#ffffff", "#64748b", 2),
        "wf-footer": rect("wf-footer", 40, 660, 1120, 100, "#e2e8f0", "#64748b", 2),
        "wf-label": text("wf-label", 520, 340, "Content area", 22, "#64748b"),
        "wf-arrow": arrow("wf-arrow", 280, 200, 320, 200),
      },
      ["wf-nav", "wf-sidebar", "wf-main", "wf-footer", "wf-label", "wf-arrow"],
    ),
  },
  {
    title: "Brainstorm board",
    width: 1400,
    height: 900,
    content: scene(
      {
        "bb-bg": rect("bb-bg", 0, 0, 1400, 900, "#fffbeb"),
        "note-1": rect("note-1", 80, 100, 220, 180, "#fef08a", "#ca8a04", 2),
        "note-2": rect("note-2", 360, 140, 220, 180, "#bbf7d0", "#16a34a", 2),
        "note-3": rect("note-3", 640, 80, 220, 180, "#bfdbfe", "#2563eb", 2),
        "note-4": rect("note-4", 920, 160, 220, 180, "#fbcfe8", "#db2777", 2),
        "bb-title": text("bb-title", 80, 40, "Brainstorm", 36, "#78350f"),
        "note-1-t": text("note-1-t", 100, 170, "Idea A", 18, "#713f12"),
        "note-2-t": text("note-2-t", 380, 210, "Idea B", 18, "#14532d"),
        "note-3-t": text("note-3-t", 660, 150, "Idea C", 18, "#1e3a8a"),
        "note-4-t": text("note-4-t", 940, 230, "Idea D", 18, "#831843"),
      },
      [
        "bb-bg",
        "note-1",
        "note-2",
        "note-3",
        "note-4",
        "bb-title",
        "note-1-t",
        "note-2-t",
        "note-3-t",
        "note-4-t",
      ],
    ),
  },
];
