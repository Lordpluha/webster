/** Backend origin for static assets and upload (dev: Vite :5173 vs API :4000). */
export function getApiOrigin(): string {
  if (typeof window === "undefined") {
    return "http://localhost:4000";
  }
  const graphql = import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000/graphql";
  if (!graphql.startsWith("http")) {
    return window.location.origin;
  }
  try {
    return new URL(graphql).origin;
  } catch {
    return window.location.origin;
  }
}

/** Resolve project asset paths for canvas Image() (same-origin, no CORS). */
export function resolveCanvasImageSrc(src: string): string {
  if (typeof window === "undefined") {
    return src;
  }
  if (/^(https?:|blob:|data:)/i.test(src)) {
    return src;
  }
  if (src.startsWith("/")) {
    const isBackendAsset = src.startsWith("/uploads/") || src.startsWith("/exports/");
    if (isBackendAsset && import.meta.env.DEV) {
      const apiOrigin = getApiOrigin();
      if (window.location.origin !== apiOrigin) {
        return `${apiOrigin}${src}`;
      }
    }
    return `${window.location.origin}${src}`;
  }
  return src;
}

export function canvasImageNeedsCrossOrigin(resolvedSrc: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (resolvedSrc.startsWith("blob:") || resolvedSrc.startsWith("data:")) {
    return false;
  }
  try {
    return new URL(resolvedSrc).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/** Wait until the image is decoded before swapping off a blob preview. */
export function preloadCanvasImage(src: string): Promise<void> {
  const resolved = resolveCanvasImageSrc(src);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    if (canvasImageNeedsCrossOrigin(resolved)) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = resolved;
  });
}
