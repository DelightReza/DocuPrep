/**
 * Signature & Thumb Impression Preparation Engine
 * Handles ink detection, bounding box auto-crop, paper whitening, and ink recoloring.
 */

export interface SignatureProcessOptions {
  autoCrop?: boolean;
  inkColor?: 'original' | 'black' | 'blue';
  transparentBg?: boolean;
  contrastBoost?: number; // 0 to 100
  threshold?: number; // 0 to 255 (default ~200)
}

export function processSignatureOrThumb(
  sourceCanvas: HTMLCanvasElement,
  options: SignatureProcessOptions = {}
): HTMLCanvasElement {
  const {
    autoCrop = true,
    inkColor = 'original',
    transparentBg = false,
    contrastBoost = 30,
    threshold = 210,
  } = options;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasInk = false;

  // Royal Blue ink values for official submission
  const royalBlue = { r: 11, g: 59, b: 130 };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];
      const a = data[idx + 3];

      if (a === 0) continue;

      // Luminance (perceived brightness)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Check if this pixel is ink (darker than paper threshold)
      if (lum < threshold) {
        hasInk = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Enhance ink darkness according to contrastBoost
        const inkFactor = Math.max(0, 1 - lum / threshold);
        const boost = 1 + contrastBoost / 100;

        if (inkColor === 'black') {
          const darkVal = Math.max(0, Math.round(lum * (1 - (inkFactor * 0.7 * boost))));
          data[idx] = darkVal;
          data[idx + 1] = darkVal;
          data[idx + 2] = darkVal;
          data[idx + 3] = transparentBg ? Math.min(255, Math.round(255 * inkFactor * boost)) : 255;
        } else if (inkColor === 'blue') {
          data[idx] = Math.round(royalBlue.r * (1 - (inkFactor * 0.3)));
          data[idx + 1] = Math.round(royalBlue.g * (1 - (inkFactor * 0.3)));
          data[idx + 2] = Math.round(royalBlue.b * (1 - (inkFactor * 0.2)));
          data[idx + 3] = transparentBg ? Math.min(255, Math.round(255 * inkFactor * boost)) : 255;
        } else {
          // Original ink, but enhanced
          data[idx] = Math.max(0, Math.round(r * (1 - (inkFactor * 0.3 * boost))));
          data[idx + 1] = Math.max(0, Math.round(g * (1 - (inkFactor * 0.3 * boost))));
          data[idx + 2] = Math.max(0, Math.round(b * (1 - (inkFactor * 0.3 * boost))));
          data[idx + 3] = transparentBg ? Math.min(255, Math.round(255 * inkFactor * boost)) : 255;
        }
      } else {
        // Paper background
        if (transparentBg) {
          data[idx + 3] = 0; // pure transparent
        } else {
          // clean paper white
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Auto-crop bounding box if ink was detected and autoCrop is enabled
  if (autoCrop && hasInk && maxX > minX && maxY > minY) {
    const pad = 12; // 12px aesthetic padding around ink
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(width - cropX, maxX - minX + pad * 2);
    const cropH = Math.min(height - cropY, maxY - minY + pad * 2);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const cCtx = croppedCanvas.getContext('2d');
    if (cCtx) {
      if (!transparentBg) {
        cCtx.fillStyle = '#ffffff';
        cCtx.fillRect(0, 0, cropW, cropH);
      }
      cCtx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return croppedCanvas;
    }
  }

  return tempCanvas;
}
