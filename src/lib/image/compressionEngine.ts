import { OutputFormat } from '../../types';

export interface CompressionResult {
  blob: Blob;
  sizeKb: number;
  qualityUsed: number;
  targetAchieved: boolean;
  warning?: string;
}

/**
 * Converts a canvas to a Blob using specified mimeType and quality.
 */
function canvasToBlobAsync(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      mimeType,
      quality
    );
  });
}

function scaleCanvas(canvas: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = Math.max(1, Math.round(canvas.width * scale));
  scaledCanvas.height = Math.max(1, Math.round(canvas.height * scale));
  const context = scaledCanvas.getContext('2d');
  if (!context) return canvas;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  return scaledCanvas;
}

export function formatToMimeType(format: OutputFormat): string {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

/**
 * Intelligent file size compressor:
 * If targetMaxKb is provided, performs binary search over compression quality
 * to get as close to targetMaxKb as possible without dropping below acceptable thresholds.
 */
export async function compressCanvas(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  initialQuality: number = 90,
  targetMaxKb: number | null = null
): Promise<CompressionResult> {
  const mimeType = formatToMimeType(format);
  const normalizedInitialQuality = Math.min(1, Math.max(0.05, initialQuality / 100));

  // If no targetMaxKb or if PNG (PNG is lossless and ignores quality parameter in toBlob)
  if (!targetMaxKb || format === 'png') {
    const initialBlob = await canvasToBlobAsync(canvas, mimeType, normalizedInitialQuality);
    const sizeKb = Number((initialBlob.size / 1024).toFixed(1));
    const targetAchieved = targetMaxKb ? sizeKb <= targetMaxKb : true;

    return {
      blob: initialBlob,
      sizeKb,
      qualityUsed: initialQuality,
      targetAchieved,
      warning:
        !targetAchieved && format === 'png'
          ? 'PNG is lossless and cannot be compressed by quality slider. Switch to JPEG or WebP to meet target size.'
          : undefined,
    };
  }

  // Binary search for optimal quality between minQuality and maxQuality
  let low = 0.05;
  let high = 0.98;
  let bestBlob: Blob | null = null;
  let bestQuality = normalizedInitialQuality;
  let bestSizeKb = 0;
  const preferredTargetKb = targetMaxKb * 0.94;

  // First check at high quality
  const testHighBlob = await canvasToBlobAsync(canvas, mimeType, high);
  const testHighKb = testHighBlob.size / 1024;
  if (testHighKb < preferredTargetKb) {
    bestBlob = testHighBlob;
    bestQuality = high;
    bestSizeKb = testHighKb;

    let lowScale = 1;
    let highScale = Math.min(2, Math.max(1.05, Math.sqrt(preferredTargetKb / testHighKb) * 1.2));
    for (let step = 0; step < 8; step++) {
      const scale = (lowScale + highScale) / 2;
      const scaledCanvas = scaleCanvas(canvas, scale);
      const scaledBlob = await canvasToBlobAsync(scaledCanvas, mimeType, high);
      const scaledKb = scaledBlob.size / 1024;

      if (scaledKb <= targetMaxKb) {
        if (Math.abs(scaledKb - preferredTargetKb) < Math.abs(bestSizeKb - preferredTargetKb)) {
          bestBlob = scaledBlob;
          bestSizeKb = scaledKb;
        }
        lowScale = scale;
      } else {
        highScale = scale;
      }
    }

    return {
      blob: bestBlob,
      sizeKb: Number(bestSizeKb.toFixed(1)),
      qualityUsed: Math.round(high * 100),
      targetAchieved: true,
    };
  }

  const searchTargetKb = Math.min(preferredTargetKb, targetMaxKb);

  // Iterate up to 7 steps of binary search
  for (let step = 0; step < 7; step++) {
    const mid = (low + high) / 2;
    const currentBlob = await canvasToBlobAsync(canvas, mimeType, mid);
    const currentKb = currentBlob.size / 1024;

    if (currentKb <= searchTargetKb) {
      bestBlob = currentBlob;
      bestQuality = mid;
      bestSizeKb = currentKb;
      // Try higher quality to get better visual fidelity while remaining under target
      low = mid;
    } else {
      // Too large, decrease quality
      high = mid;
      if (!bestBlob) {
        bestBlob = currentBlob;
        bestQuality = mid;
        bestSizeKb = currentKb;
      }
    }
  }

  if (!bestBlob) {
    bestBlob = await canvasToBlobAsync(canvas, mimeType, low);
    bestSizeKb = bestBlob.size / 1024;
  }

  const finalAchieved = bestSizeKb <= targetMaxKb;

  return {
    blob: bestBlob,
    sizeKb: Number(bestSizeKb.toFixed(1)),
    qualityUsed: Math.round(bestQuality * 100),
    targetAchieved: finalAchieved,
    warning: !finalAchieved
      ? `Could not reduce file size under ${targetMaxKb} KB without excessive downsampling. Consider reducing pixel dimensions.`
      : undefined,
  };
}
