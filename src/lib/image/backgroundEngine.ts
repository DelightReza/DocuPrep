/**
 * Client-Side Background Removal & Replacement
 * Runs 100% locally in the browser with zero external transmission for complete privacy.
 */

interface BgOptions {
  replacementColor?: string; // hex e.g. '#ffffff' or 'transparent'
  tolerance?: number; // 5 to 80 (default 25)
  softness?: number; // 1 to 5
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function processBackgroundRemoval(
  sourceCanvas: HTMLCanvasElement,
  options: BgOptions = {}
): HTMLCanvasElement {
  const { replacementColor = '#ffffff', tolerance = 28, softness = 2 } = options;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  // Draw source image
  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Sample corner pixels to detect the likely background color
  const sampleIndices = [
    0, // top-left
    (width - 1) * 4, // top-right
    ((height - 1) * width) * 4, // bottom-left
    ((height - 1) * width + (width - 1)) * 4, // bottom-right
    Math.floor(width / 2) * 4, // top-middle
  ];

  let sumR = 0,
    sumG = 0,
    sumB = 0;
  let sampleCount = 0;

  for (const idx of sampleIndices) {
    if (idx < data.length) {
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
      sampleCount++;
    }
  }

  const bgR = Math.round(sumR / sampleCount);
  const bgG = Math.round(sumG / sampleCount);
  const bgB = Math.round(sumB / sampleCount);

  const targetRgb = replacementColor === 'transparent' ? null : hexToRgb(replacementColor);
  const tolSq = tolerance * tolerance * 3;
  const softTolSq = (tolerance + softness * 4) * (tolerance + softness * 4) * 3;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    // Euclidean distance in color space
    const dr = r - bgR;
    const dg = g - bgG;
    const db = b - bgB;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq <= tolSq) {
      // Complete background match
      if (!targetRgb) {
        data[i + 3] = 0; // Transparent
      } else {
        data[i] = targetRgb.r;
        data[i + 1] = targetRgb.g;
        data[i + 2] = targetRgb.b;
        data[i + 3] = 255;
      }
    } else if (distSq < softTolSq) {
      // Soft transition border
      const factor = (distSq - tolSq) / (softTolSq - tolSq);
      if (!targetRgb) {
        data[i + 3] = Math.round(a * factor);
      } else {
        data[i] = Math.round(targetRgb.r * (1 - factor) + r * factor);
        data[i + 1] = Math.round(targetRgb.g * (1 - factor) + g * factor);
        data[i + 2] = Math.round(targetRgb.b * (1 - factor) + b * factor);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}
