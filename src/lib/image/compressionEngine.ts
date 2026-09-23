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
 * Safely pads a JPEG byte buffer using standard JPEG COM (comment 0xFF 0xFE) segments
 * to reach close to target bytes without exceeding it and without altering any pixel data.
 * Standard image viewers and government portal validators strictly ignore COM markers.
 */
async function padJpegBlobToTargetBytes(jpegBlob: Blob, targetBytes: number): Promise<Blob> {
  if (jpegBlob.size >= targetBytes) return jpegBlob;
  const needed = targetBytes - jpegBlob.size;
  if (needed < 4) return jpegBlob;

  try {
    const arrayBuffer = await jpegBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Verify JPEG SOI marker (0xFF, 0xD8)
    if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
      return jpegBlob;
    }

    // Locate EOI marker (0xFF, 0xD9) from the end
    let eoiPos = bytes.length - 2;
    while (eoiPos >= 0) {
      if (bytes[eoiPos] === 0xFF && bytes[eoiPos + 1] === 0xD9) {
        break;
      }
      eoiPos--;
    }
    if (eoiPos < 0) eoiPos = bytes.length;

    // Generate valid JPEG COM (0xFF 0xFE) segments
    // Marker structure: 0xFF 0xFE [Length_Hi] [Length_Lo] [Payload...]
    // The 2-byte Length field includes the 2 bytes of the length field itself.
    const chunks: Uint8Array[] = [];
    let remaining = needed;

    while (remaining >= 4) {
      const totalSegmentLen = Math.min(65535, remaining);
      const lengthField = totalSegmentLen - 2;
      if (lengthField < 2) break;

      const segment = new Uint8Array(totalSegmentLen);
      segment[0] = 0xFF;
      segment[1] = 0xFE; // COM (Comment marker)
      segment[2] = (lengthField >> 8) & 0xFF;
      segment[3] = lengthField & 0xFF;
      // Fill payload with standard whitespace characters
      segment.fill(0x20, 4);

      chunks.push(segment);
      remaining -= totalSegmentLen;
    }

    const totalChunksLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const resultBuffer = new Uint8Array(bytes.length + totalChunksLength);

    // Copy up to EOI
    resultBuffer.set(bytes.subarray(0, eoiPos), 0);

    // Insert COM chunks
    let offset = eoiPos;
    for (const chunk of chunks) {
      resultBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Copy remainder (including EOI)
    resultBuffer.set(bytes.subarray(eoiPos), offset);

    return new Blob([resultBuffer], { type: jpegBlob.type || 'image/jpeg' });
  } catch (err) {
    console.warn('JPEG padding skipped:', err);
    return jpegBlob;
  }
}

/**
 * Intelligent file size compressor:
 * When targetMaxKb is provided, precisely tunes file size to be right around the target
 * (typically 93% – 99% of targetMaxKb) without exceeding the portal limit.
 * If the image is inherently too small (e.g. simple signature or tiny canvas),
 * it uses canvas resolution scaling and safe metadata padding so that the file
 * satisfies portals that require a minimum/narrow size range (e.g. 20-50 KB).
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

  // Aim for 94% - 98% of targetMaxKb (safely under limit, but very close around target)
  const targetMaxBytes = Math.floor(targetMaxKb * 1024);
  const idealTargetBytes = Math.floor(targetMaxBytes * 0.96);
  const minAcceptableBytes = Math.floor(targetMaxBytes * 0.88);

  let low = 0.05;
  let high = 0.98;
  let bestBlob: Blob | null = null;
  let bestQuality = normalizedInitialQuality;
  let bestSizeBytes = 0;

  // 1. Test original canvas at highest quality (0.98)
  const highBlob = await canvasToBlobAsync(canvas, mimeType, high);
  const highBytes = highBlob.size;

  if (highBytes <= targetMaxBytes) {
    bestBlob = highBlob;
    bestQuality = high;
    bestSizeBytes = highBytes;

    // If the image is naturally much smaller than targetMaxKb (e.g. highBytes < minAcceptableBytes),
    // scale up canvas rendering or pad JPEG to bring it closely around the target.
    if (highBytes < minAcceptableBytes) {
      // First try proportional canvas scaling up to 2.5x to preserve crisp sharpness
      let lowScale = 1.0;
      let highScale = Math.min(2.5, Math.max(1.05, Math.sqrt(idealTargetBytes / highBytes) * 1.15));

      for (let step = 0; step < 8; step++) {
        const scale = (lowScale + highScale) / 2;
        const scaledCanvas = scaleCanvas(canvas, scale);
        const scaledBlob = await canvasToBlobAsync(scaledCanvas, mimeType, high);
        const scaledBytes = scaledBlob.size;

        if (scaledBytes <= targetMaxBytes) {
          bestBlob = scaledBlob;
          bestSizeBytes = scaledBytes;
          bestQuality = high;
          lowScale = scale;
          // If we are already comfortably close (>= 90% of target), we can finish
          if (scaledBytes >= idealTargetBytes) {
            break;
          }
        } else {
          highScale = scale;
        }
      }
    }
  } else {
    // Canvas is larger than targetMaxKb at high quality -> Binary search over quality
    for (let step = 0; step < 8; step++) {
      const mid = (low + high) / 2;
      const currentBlob = await canvasToBlobAsync(canvas, mimeType, mid);
      const currentBytes = currentBlob.size;

      if (currentBytes <= targetMaxBytes) {
        bestBlob = currentBlob;
        bestQuality = mid;
        bestSizeBytes = currentBytes;
        // Try higher quality to get even closer to target without exceeding
        low = mid;
      } else {
        // Exceeded limit, reduce quality
        high = mid;
        if (!bestBlob) {
          bestBlob = currentBlob;
          bestQuality = mid;
          bestSizeBytes = currentBytes;
        }
      }
    }
  }

  if (!bestBlob) {
    bestBlob = await canvasToBlobAsync(canvas, mimeType, low);
    bestSizeBytes = bestBlob.size;
  }

  // If the format is JPEG and the output is still significantly smaller than target
  // (e.g. bestSizeBytes < 92% of targetMaxBytes), pad with safe standard COM markers
  // to bring it directly into the 94% - 97% range of the target size!
  if (format === 'jpeg' && bestSizeBytes < minAcceptableBytes && bestSizeBytes <= targetMaxBytes) {
    const desiredBytes = Math.min(targetMaxBytes - 128, idealTargetBytes);
    bestBlob = await padJpegBlobToTargetBytes(bestBlob, desiredBytes);
    bestSizeBytes = bestBlob.size;
  }

  const finalAchieved = bestSizeBytes <= targetMaxBytes;
  const sizeKb = Number((bestSizeBytes / 1024).toFixed(1));

  return {
    blob: bestBlob,
    sizeKb,
    qualityUsed: Math.round(bestQuality * 100),
    targetAchieved: finalAchieved,
    warning: !finalAchieved
      ? `Could not reduce file size under ${targetMaxKb} KB without excessive downsampling. Consider reducing pixel dimensions.`
      : undefined,
  };
}
