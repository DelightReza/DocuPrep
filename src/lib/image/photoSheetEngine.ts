import { mmToInches } from './resizeEngine';

export interface PhotoSheetConfig {
  paperSize: 'A4' | 'Letter' | '4x6';
  photoWidthMm: number;
  photoHeightMm: number;
  copies: number;
  spacingMm: number;
  marginMm: number;
  showCutMarks: boolean;
  dpi?: number;
}

export function generatePhotoSheetCanvas(
  photoCanvas: HTMLCanvasElement,
  config: PhotoSheetConfig
): HTMLCanvasElement {
  const dpi = config.dpi || 300;

  // Paper dimensions in mm
  let paperWidthMm = 210;
  let paperHeightMm = 297;

  if (config.paperSize === 'Letter') {
    paperWidthMm = 215.9;
    paperHeightMm = 279.4;
  } else if (config.paperSize === '4x6') {
    paperWidthMm = 101.6;
    paperHeightMm = 152.4;
  }

  // Convert mm to pixels at chosen DPI
  const sheetWidthPx = Math.round(mmToInches(paperWidthMm) * dpi);
  const sheetHeightPx = Math.round(mmToInches(paperHeightMm) * dpi);
  const photoWidthPx = Math.round(mmToInches(config.photoWidthMm) * dpi);
  const photoHeightPx = Math.round(mmToInches(config.photoHeightMm) * dpi);
  const spacingPx = Math.round(mmToInches(config.spacingMm) * dpi);
  const marginPx = Math.round(mmToInches(config.marginMm) * dpi);

  const canvas = document.createElement('canvas');
  canvas.width = sheetWidthPx;
  canvas.height = sheetHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Crisp white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);

  // Available printable area
  const printableWidth = sheetWidthPx - marginPx * 2;
  const printableHeight = sheetHeightPx - marginPx * 2;

  // Max cols and rows that can fit
  const colPitch = photoWidthPx + spacingPx;
  const rowPitch = photoHeightPx + spacingPx;
  const maxCols = Math.max(1, Math.floor((printableWidth + spacingPx) / colPitch));
  const maxRows = Math.max(1, Math.floor((printableHeight + spacingPx) / rowPitch));

  let count = 0;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      if (count >= config.copies) break;

      const x = marginPx + c * colPitch;
      const y = marginPx + r * rowPitch;

      // Draw photo
      ctx.drawImage(photoCanvas, x, y, photoWidthPx, photoHeightPx);

      // Draw subtle border around photo
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);

      // Draw cut marks (corner crosshairs for scissors)
      if (config.showCutMarks) {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        const markLen = Math.round(dpi * 0.08); // ~2mm

        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(x - markLen, y);
        ctx.lineTo(x, y);
        ctx.moveTo(x, y - markLen);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(x + photoWidthPx, y);
        ctx.lineTo(x + photoWidthPx + markLen, y);
        ctx.moveTo(x + photoWidthPx, y - markLen);
        ctx.lineTo(x + photoWidthPx, y);
        ctx.stroke();

        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(x - markLen, y + photoHeightPx);
        ctx.lineTo(x, y + photoHeightPx);
        ctx.moveTo(x, y + photoHeightPx);
        ctx.lineTo(x, y + photoHeightPx + markLen);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(x + photoWidthPx, y + photoHeightPx);
        ctx.lineTo(x + photoWidthPx + markLen, y + photoHeightPx);
        ctx.moveTo(x + photoWidthPx, y + photoHeightPx);
        ctx.lineTo(x + photoWidthPx, y + photoHeightPx + markLen);
        ctx.stroke();
      }

      count++;
    }
    if (count >= config.copies) break;
  }

  return canvas;
}
