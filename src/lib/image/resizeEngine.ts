import { UnitType } from '../../types';

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function cmToInches(cm: number): number {
  return cm / 2.54;
}

export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Calculates exact pixel count from physical dimension and DPI:
 * pixels = physical_size_in_inches * DPI
 */
export function calculatePixels(dimension: number, unit: UnitType, dpi: number): number {
  if (unit === 'px') return Math.max(1, Math.round(dimension));
  let inches = dimension;
  if (unit === 'mm') inches = mmToInches(dimension);
  else if (unit === 'cm') inches = cmToInches(dimension);
  return Math.max(1, Math.round(inches * dpi));
}

/**
 * Converts pixels back to chosen physical unit at a given DPI:
 */
export function pixelsToPhysicalUnit(pixels: number, unit: UnitType, dpi: number): number {
  if (unit === 'px') return pixels;
  const inches = pixels / dpi;
  if (unit === 'inch') return Number(inches.toFixed(2));
  if (unit === 'mm') return Number(inchesToMm(inches).toFixed(1));
  if (unit === 'cm') return Number(inchesToCm(inches).toFixed(2));
  return pixels;
}

export type ResizeFitMode = 'cover' | 'contain';

export interface ResizeOptions {
  fitMode?: ResizeFitMode; // 'cover' (fill size & crop without stretch) or 'contain' (fit with margins/pad)
  backgroundColor?: string;
}

/**
 * Draws image onto a target canvas with high-quality resampling and strict aspect ratio preservation.
 * Never stretches or distorts the image.
 * - 'cover' (default): Proportional fill; crops excess bleed to cleanly fill target dimensions.
 * - 'contain': Proportional fit; keeps all pixels visible and pads letterbox margins with background color.
 */
export function renderResizedCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  options?: ResizeOptions | string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const fitMode: ResizeFitMode =
    typeof options === 'object' && options?.fitMode ? options.fitMode : 'cover';
  const backgroundColor =
    typeof options === 'string' ? options : options?.backgroundColor;

  // Fill background
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  const srcWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  if (srcWidth <= 0 || srcHeight <= 0) return canvas;

  if (fitMode === 'contain') {
    // Fit entire image inside target, adding background padding if needed (NO STRETCH)
    const scale = Math.min(targetWidth / srcWidth, targetHeight / srcHeight);
    const renderW = Math.max(1, Math.round(srcWidth * scale));
    const renderH = Math.max(1, Math.round(srcHeight * scale));
    const offsetX = Math.round((targetWidth - renderW) / 2);
    const offsetY = Math.round((targetHeight - renderH) / 2);

    ctx.drawImage(source, 0, 0, srcWidth, srcHeight, offsetX, offsetY, renderW, renderH);
  } else {
    // 'cover': Fill target dimension completely without distortion, cropping outer bleed
    const scale = Math.max(targetWidth / srcWidth, targetHeight / srcHeight);
    const renderW = Math.max(1, Math.round(srcWidth * scale));
    const renderH = Math.max(1, Math.round(srcHeight * scale));
    const offsetX = Math.round((targetWidth - renderW) / 2);
    const offsetY = Math.round((targetHeight - renderH) / 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, targetWidth, targetHeight);
    ctx.clip();
    ctx.drawImage(source, 0, 0, srcWidth, srcHeight, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  }

  return canvas;
}
