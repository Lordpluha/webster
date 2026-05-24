import { PDFDocument } from "pdf-lib";

export type ProjectExportFormat = "png" | "jpg" | "pdf" | "webp" | "svg" | "bmp" | "json";

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

function canvasToSvgBlob(canvas: HTMLCanvasElement): Blob {
  const dataUrl = canvas.toDataURL("image/png");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">` +
    `<image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" />` +
    `</svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("BMP export failed");
  }

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const headerSize = 54;
  const fileSize = headerSize + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  let offset = 0;

  // BITMAPFILEHEADER
  view.setUint8(offset++, 0x42); // B
  view.setUint8(offset++, 0x4d); // M
  view.setUint32(offset, fileSize, true); offset += 4;
  view.setUint16(offset, 0, true); offset += 2;
  view.setUint16(offset, 0, true); offset += 2;
  view.setUint32(offset, headerSize, true); offset += 4;

  // BITMAPINFOHEADER
  view.setUint32(offset, 40, true); offset += 4; // DIB header size
  view.setInt32(offset, width, true); offset += 4;
  view.setInt32(offset, height, true); offset += 4; // bottom-up
  view.setUint16(offset, 1, true); offset += 2; // planes
  view.setUint16(offset, 24, true); offset += 2; // bpp
  view.setUint32(offset, 0, true); offset += 4; // compression
  view.setUint32(offset, pixelArraySize, true); offset += 4; // image size
  view.setInt32(offset, 2835, true); offset += 4; // x ppm (72 DPI)
  view.setInt32(offset, 2835, true); offset += 4; // y ppm
  view.setUint32(offset, 0, true); offset += 4; // colors used
  view.setUint32(offset, 0, true); offset += 4; // important colors

  const bytes = new Uint8Array(buffer, headerSize);
  let byteIndex = 0;
  const padding = rowSize - width * 3;

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      bytes[byteIndex++] = data[i + 2]; // B
      bytes[byteIndex++] = data[i + 1]; // G
      bytes[byteIndex++] = data[i]; // R
    }
    for (let p = 0; p < padding; p += 1) {
      bytes[byteIndex++] = 0;
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
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
    case "svg": {
      const blob = canvasToSvgBlob(canvas);
      downloadBlob(`${safeName}.svg`, blob);
      return;
    }
    case "bmp": {
      const blob = canvasToBmpBlob(canvas);
      downloadBlob(`${safeName}.bmp`, blob);
      return;
    }
    default: {
      const exhaustive: never = format;
      throw new Error(`Unsupported export format: ${exhaustive}`);
    }
  }
}
