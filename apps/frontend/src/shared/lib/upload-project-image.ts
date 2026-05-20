function getUploadEndpoint(): string {
  const graphql = import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000/graphql";
  if (graphql.startsWith("http")) {
    try {
      const origin = new URL(graphql).origin;
      return `${origin}/upload`;
    } catch {
      return "http://localhost:4000/upload";
    }
  }
  return `${window.location.origin}/upload`;
}

/** Upload image to backend; returns a relative URL (`/uploads/...`) for project JSON. */
export async function uploadProjectImage(file: File, projectId: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);

  const response = await fetch(getUploadEndpoint(), {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Upload failed (${response.status})`);
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Upload response missing url");
  }
  return payload.url;
}

export function isTemporaryImageSrc(src: string | undefined): boolean {
  if (!src) return false;
  return src.startsWith("data:") || src.startsWith("blob:");
}

export function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || 320,
        height: img.naturalHeight || 240,
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export function fitImageBounds(
  naturalWidth: number,
  naturalHeight: number,
  maxSide = 480,
): { width: number; height: number } {
  let w = naturalWidth;
  let h = naturalHeight;
  if (w > maxSide) {
    h = (h / w) * maxSide;
    w = maxSide;
  }
  if (h > maxSide) {
    w = (w / h) * maxSide;
    h = maxSide;
  }
  return { width: w, height: h };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
