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

/**
 * Draws image onto a target canvas with optional smoothing and high-quality resampling
 */
export function renderResizedCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  backgroundColor?: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas;
}
