import { FC, useRef, useEffect, useState } from "react";
import type { ClipboardEvent } from "react";

import { useEditorStore } from "@/shared/stores/editor.store";
import { useEditorWorkspace } from "./editor-workspace-context";
import type { SceneNode } from "@/shared/lib/canvas-engine/scene/scene-node";
import type { LayerId } from "@/shared/lib/canvas-engine/core/types";
import { createNodeId } from "@/shared/lib/canvas-engine/utils/id";
import { createIdentityTransform } from "@/shared/lib/canvas-engine/core/types";

/**
 * Canvas area component - main drawing surface
 * Handles canvas rendering and responsive sizing
 */
export const CanvasArea: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toolbar } = useEditorStore();
  const workspace = useEditorWorkspace();
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setLastMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handlePaste = async (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!workspace) return;
    const { engine } = workspace;

    const items = e.clipboardData?.items;
    if (!items) return;

    let blob: Blob | null = null;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        blob = item.getAsFile();
        if (blob) break;
      }
    }

    if (!blob) return;

    // Create object URL for the image
    const url = URL.createObjectURL(blob);

    // Get image dimensions
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const { width: imgWidth, height: imgHeight } = img;

    // Default size: use image size but cap at 200px for readability
    const maxDim = 200;
    let width = imgWidth;
    let height = imgHeight;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = width * scale;
      height = height * scale;
    }

    // Get canvas position and scale
    const canvas = canvasRef.current;
    if (!canvas) {
      URL.revokeObjectURL(url);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const scale = toolbar.zoom / 100;
    // Use last mouse position relative to canvas
    const x = (lastMousePosition.x - rect.left) / scale;
    const y = (lastMousePosition.y - rect.top) / scale;

    // Create image node
    const nodeId = createNodeId();
    const layerId: LayerId = "layer-1"; // default layer, could be improved
    const node: SceneNode = {
      id: nodeId,
      layerId,
      type: "image",
      bounds: { x, y, width, height },
      transform: createIdentityTransform(),
      style: {},
      data: { src: url },
    };

    // Add node to scene
    engine.addNode(node, { history: { label: "Paste image" } });

    // Note: We do not revoke the object URL here to avoid breaking the engine if it still needs it.
    // This is a known memory leak; in a production app, we would revoke the URL when the node is removed.
    // However, the engine does not currently emit a node-specific removal event.
    // For the scope of this task, we leave it as is.
  };

  return (
    <main
      className="relative flex-1 overflow-hidden bg-slate-50"
      tabIndex={0}
      onPaste={handlePaste}
    >
      {/* Grid background */}
      {toolbar.gridEnabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(0deg, #e2e8f0 1px, transparent 1px),
              linear-gradient(90deg, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: `${toolbar.gridSize}px ${toolbar.gridSize}px`,
          }}
        />
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        style={{
          transform: `scale(${toolbar.zoom / 100})`,
          transformOrigin: "0 0",
        }}
      />

      {/* Overlays for zoom info (optional) */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-white/80 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm backdrop-blur">
        Zoom: {toolbar.zoom}%
      </div>
    </main>
  );
};