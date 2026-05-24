import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

import {
  CanvasRenderer,
  createCanvasEngine,
  getSceneContentBounds,
  type Point,
} from "@/shared/lib/canvas-engine";
import { sceneStateFromProjectContent } from "@/shared/lib/editor/scene-from-project-content";

const ZOOM_SENSITIVITY = 0.0015;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const FIT_PADDING = 48;

type PanDrag = {
  pointerId: number;
  startClient: Point;
  initialCameraX: number;
  initialCameraY: number;
};

export type ShareProjectViewerProps = {
  content: unknown;
  className?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getCanvasPointFromClient(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const bounds = canvas.getBoundingClientRect();
  return { x: clientX - bounds.left, y: clientY - bounds.top };
}

function fitCameraToContent(renderer: CanvasRenderer, engine: ReturnType<typeof createCanvasEngine>): void {
  const bounds = getSceneContentBounds(engine.getSerializableState());
  if (!bounds || bounds.width < 1 || bounds.height < 1) {
    renderer.setCamera({ x: 0, y: 0, zoom: 1 });
    return;
  }

  const { width, height } = renderer.getViewport();
  if (width < 1 || height < 1) {
    return;
  }

  const scaleX = (width - FIT_PADDING * 2) / bounds.width;
  const scaleY = (height - FIT_PADDING * 2) / bounds.height;
  const zoom = clamp(Math.min(scaleX, scaleY, 1), MIN_ZOOM, MAX_ZOOM);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  renderer.setCamera({
    zoom,
    x: width / 2 - centerX * zoom,
    y: height / 2 - centerY * zoom,
  });
}

export function ShareProjectViewer({ content, className }: ShareProjectViewerProps) {
  const engine = useMemo(() => createCanvasEngine(), []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const panDragRef = useRef<PanDrag | null>(null);
  const contentKeyRef = useRef<string>("");

  const applyContent = useCallback(() => {
    const scene = sceneStateFromProjectContent(content);
    engine.replaceScene(scene, { recordHistory: false });
    engine.setSelection([]);
    engine.setTool("select");

    const renderer = rendererRef.current;
    if (renderer) {
      window.requestAnimationFrame(() => fitCameraToContent(renderer, engine));
    }
  }, [content, engine]);

  useEffect(() => {
    const key = typeof content === "string" ? content : JSON.stringify(content ?? null);
    if (contentKeyRef.current === key) {
      return;
    }
    contentKeyRef.current = key;
    applyContent();
  }, [content, applyContent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new CanvasRenderer({
      canvas,
      engine,
      background: "#f1f5f9",
    });
    rendererRef.current = renderer;
    renderer.mount();
    applyContent();

    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      const r = rendererRef.current;
      if (!r) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        const anchor = getCanvasPointFromClient(canvas, event.clientX, event.clientY);
        const worldAnchor = r.screenToWorld(anchor);
        const currentZoom = r.getCamera().zoom;
        const targetZoom = clamp(
          currentZoom * Math.exp(-event.deltaY * ZOOM_SENSITIVITY),
          MIN_ZOOM,
          MAX_ZOOM,
        );
        const zoomFactor = targetZoom / currentZoom;
        if (Math.abs(zoomFactor - 1) < 0.001) {
          return;
        }
        r.setCamera({
          x: anchor.x - worldAnchor.x * targetZoom,
          y: anchor.y - worldAnchor.y * targetZoom,
          zoom: targetZoom,
        });
        return;
      }

      const panX = event.shiftKey ? -event.deltaY : -event.deltaX;
      const panY = event.shiftKey ? 0 : -event.deltaY;
      const camera = r.getCamera();
      r.setCamera({ x: camera.x + panX, y: camera.y + panY });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [engine, applyContent]);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.button !== 1) {
      return;
    }
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }
    const camera = renderer.getCamera();
    panDragRef.current = {
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      initialCameraX: camera.x,
      initialCameraY: camera.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = panDragRef.current;
    const renderer = rendererRef.current;
    if (!drag || !renderer || drag.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - drag.startClient.x;
    const dy = event.clientY - drag.startClient.y;
    renderer.setCamera({
      x: drag.initialCameraX + dx,
      y: drag.initialCameraY + dy,
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    panDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const zoomBy = (factor: number) => {
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }
    const camera = renderer.getCamera();
    renderer.setCamera({ zoom: clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM) });
  };

  const zoomReset = () => {
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }
    fitCameraToContent(renderer, engine);
  };

  return (
    <div className={className ?? "relative h-full min-h-0 w-full"}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
        aria-label="Shared project canvas (view only)"
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          type="button"
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/95 text-slate-700 shadow hover:bg-white"
          aria-label="Zoom in"
          onClick={() => zoomBy(1.12)}
        >
          <ZoomIn size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/95 text-slate-700 shadow hover:bg-white"
          aria-label="Zoom out"
          onClick={() => zoomBy(1 / 1.12)}
        >
          <ZoomOut size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="pointer-events-auto rounded-lg border border-slate-300 bg-white/95 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white"
          onClick={zoomReset}
        >
          Fit
        </button>
      </div>
    </div>
  );
}
