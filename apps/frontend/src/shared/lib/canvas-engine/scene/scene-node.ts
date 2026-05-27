import type { LayerId, NodeId, Point, Rect, Transform } from "../core/types";

export type SceneNodeType = "rect" | "triangle" | "ellipse" | "arrow" | "text" | "image" | "path";

export interface SceneNodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface SceneNodeData {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  src?: string;
  /** Freehand stroke from the pencil tool (open polyline, stroke only). */
  points?: Point[];
  /** Closed outlines (filled shapes); each contour is drawn closed. */
  contours?: Point[][];
  eraseMarks?: Array<{ x: number; y: number; radius: number }>;
  groupId?: string;
  groupLabel?: string;
  label?: string;
  hidden?: boolean;
  locked?: boolean;
}

export interface SceneNode {
  id: NodeId;
  layerId: LayerId;
  type: SceneNodeType;
  bounds: Rect;
  transform: Transform;
  style: SceneNodeStyle;
  data?: SceneNodeData;
}