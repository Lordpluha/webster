import { PDFDocument } from "pdf-lib";

export type ProjectExportFormat = "png" | "jpg" | "pdf" | "webp" | "json";

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("PNG export failed"));
    }, "image/png");
  });
}

function canvasToJpgBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("JPG export failed"));
      },
      "image/jpeg",
      quality,
    );
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("WEBP export failed"));
      },
      "image/webp",
      quality,
    );
  });
}

async function canvasToPdfBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const pngBlob = await canvasToPngBlob(canvas);
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(pngBytes);
  const pageWidth = image.width;
  const pageHeight = image.height;
  const page = pdf.addPage([pageWidth, pageHeight]);
  page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  const pdfBytes = await pdf.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

export async function downloadProjectExport(
  canvas: HTMLCanvasElement,
  baseName: string,
  format: Exclude<ProjectExportFormat, "json">,
): Promise<void> {
  const safeName = baseName.replace(/\s+/g, "-").replace(/[^\w.-]+/g, "") || "project";

  switch (format) {
    case "png": {
      const blob = await canvasToPngBlob(canvas);
      downloadBlob(`${safeName}.png`, blob);
      return;
    }
    case "jpg": {
      const blob = await canvasToJpgBlob(canvas, 0.92);
      downloadBlob(`${safeName}.jpg`, blob);
      return;
    }
    case "webp": {
      const blob = await canvasToWebpBlob(canvas, 0.9);
      downloadBlob(`${safeName}.webp`, blob);
      return;
    }
    case "pdf": {
      const blob = await canvasToPdfBlob(canvas);
      downloadBlob(`${safeName}.pdf`, blob);
      return;
    }
    default: {
      const exhaustive: never = format;
      throw new Error(`Unsupported export format: ${exhaustive}`);
    }
  }
}
