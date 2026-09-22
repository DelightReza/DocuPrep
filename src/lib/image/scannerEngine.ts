export type ScanMode = 'original' | 'color-enhanced' | 'grayscale' | 'black-and-white' | 'sharpen';

export function processDocumentScan(
  sourceCanvas: HTMLCanvasElement,
  mode: ScanMode
): HTMLCanvasElement {
  if (mode === 'original') return sourceCanvas;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  if (mode === 'grayscale') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
    }
    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  if (mode === 'black-and-white') {
    // Calculate average luminance for dynamic thresholding
    let totalLum = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const avgLum = totalLum / pixelCount;
    const threshold = Math.min(215, Math.max(100, avgLum * 0.92));

    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = lum < threshold ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  if (mode === 'color-enhanced') {
    // S-curve contrast and paper background whitening
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = data[i + c];
        // Whiten background
        if (v > 190) {
          v = Math.min(255, v + (255 - v) * 0.7);
        } else if (v < 80) {
          v = Math.max(0, v * 0.85);
        }
        data[i + c] = Math.round(v);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  if (mode === 'sharpen') {
    // 3x3 Sharpen Convolution Kernel
    // [ 0, -1,  0]
    // [-1,  5, -1]
    // [ 0, -1,  0]
    const copyData = new Uint8ClampedArray(data);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pIdx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kWeight = kernel[(ky + 1) * 3 + (kx + 1)];
              sum += copyData[pIdx] * kWeight;
            }
          }
          const targetIdx = (y * width + x) * 4 + c;
          data[targetIdx] = Math.min(255, Math.max(0, sum));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  return outputCanvas;
}
