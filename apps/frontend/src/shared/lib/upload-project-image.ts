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

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
