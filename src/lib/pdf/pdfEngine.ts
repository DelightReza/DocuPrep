import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker is registered
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ImageToPdfOptions {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'Original';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: 'none' | 'small' | 'medium' | 'large';
  quality?: number; // 0.1 to 1.0
}

const PAGE_DIMENSIONS = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
};

const MARGIN_SIZES = {
  none: 0,
  small: 18,
  medium: 36,
  large: 54,
};

/**
 * Converts one or more image Data URLs or Blobs into a clean PDF
 */
export async function convertImagesToPdf(
  images: Array<{ dataUrl: string; width: number; height: number; name?: string }>,
  options: ImageToPdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const imgItem of images) {
    const isPng = imgItem.dataUrl.startsWith('data:image/png');
    let embeddedImg;

    if (isPng) {
      embeddedImg = await pdfDoc.embedPng(imgItem.dataUrl);
    } else {
      // JPEG or WebP canvas converted to JPEG
      embeddedImg = await pdfDoc.embedJpg(imgItem.dataUrl);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let targetPageWidth: number;
    let targetPageHeight: number;

    if (options.pageSize === 'Original') {
      targetPageWidth = imgWidth;
      targetPageHeight = imgHeight;
    } else {
      const baseDim = PAGE_DIMENSIONS[options.pageSize];
      const isLandscape =
        options.orientation === 'landscape' ||
        (options.orientation === 'auto' && imgWidth > imgHeight);

      targetPageWidth = isLandscape ? baseDim.height : baseDim.width;
      targetPageHeight = isLandscape ? baseDim.width : baseDim.height;
    }

    const margin = MARGIN_SIZES[options.margin];
    const availableWidth = targetPageWidth - margin * 2;
    const availableHeight = targetPageHeight - margin * 2;

    // Calculate scale to fit inside available bounds while preserving aspect ratio
    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight, 1);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    // Centered placement
    const posX = margin + (availableWidth - drawWidth) / 2;
    const posY = margin + (availableHeight - drawHeight) / 2;

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);
    page.drawImage(embeddedImg, {
      x: posX,
      y: posY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * Merges multiple PDF ArrayBuffers into a single unified PDF
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Splits a PDF by custom page range string like "1-3, 5, 7-10" or extracts pages
 */
export async function extractPdfPages(
  pdfBuffer: ArrayBuffer,
  pageNumbersOneIndexed: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const zeroIndexed = pageNumbersOneIndexed
    .map((p) => p - 1)
    .filter((idx) => idx >= 0 && idx < totalPages);

  if (zeroIndexed.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, zeroIndexed);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

/**
 * Parses user range string (e.g. "1-3, 5, 8-10") into an array of page numbers
 */
export function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(maxPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          pages.add(i);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        pages.add(pageNum);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Rotates pages in a PDF document by 90-degree increments
 */
export async function rotatePdfPages(
  pdfBuffer: ArrayBuffer,
  pageRotations: { [pageIndex: number]: number } // pageIndex 0-indexed, angle in degrees (90, 180, 270)
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  for (const [idxStr, angle] of Object.entries(pageRotations)) {
    const idx = parseInt(idxStr, 10);
    if (pages[idx]) {
      const currentRotation = pages[idx].getRotation().angle;
      pages[idx].setRotation(degrees((currentRotation + angle) % 360));
    }
  }

  return await doc.save();
}

/**
 * Stamps a signature image or text note onto a specific page of a PDF
 */
export async function stampPdfPage(
  pdfBuffer: ArrayBuffer,
  pageIndex: number,
  stamp: {
    type: 'signature' | 'text';
    dataUrl?: string; // for signature
    text?: string; // for text
    x: number; // page coordinate
    y: number;
    width?: number;
    height?: number;
    fontSize?: number;
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[pageIndex];
  if (!page) throw new Error('Page index out of bounds');

  if (stamp.type === 'signature' && stamp.dataUrl) {
    const isPng = stamp.dataUrl.startsWith('data:image/png');
    const embeddedImg = isPng ? await doc.embedPng(stamp.dataUrl) : await doc.embedJpg(stamp.dataUrl);

    page.drawImage(embeddedImg, {
      x: stamp.x,
      y: stamp.y,
      width: stamp.width || 120,
      height: stamp.height || 50,
    });
  } else if (stamp.type === 'text' && stamp.text) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText(stamp.text, {
      x: stamp.x,
      y: stamp.y,
      size: stamp.fontSize || 12,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  return await doc.save();
}

export interface CompressPdfOptions {
  level: 'extreme' | 'recommended' | 'low' | 'custom';
  targetMaxKb?: number | null;
  customDpi?: number;
  customQuality?: number;
  onProgress?: (current: number, total: number) => void;
}

export interface CompressPdfResult {
  pdfBytes: Uint8Array;
  originalSizeKb: number;
  compressedSizeKb: number;
  reductionPercent: number;
  pageCount: number;
  targetAchieved: boolean;
}

/**
 * Intelligent PDF Compressor:
 * Re-samples and re-compresses embedded page graphics to target DPI and quality levels,
 * preserving layout geometry while dramatically shrinking file size for portal submissions.
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer,
  options: CompressPdfOptions
): Promise<CompressPdfResult> {
  const originalSizeKb = Number((pdfBuffer.byteLength / 1024).toFixed(1));

  // Load document with pdfjsLib to inspect page count and render pages
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  // Determine scaling & quality parameters based on compression level / targetMaxKb
  let dpiScale = 1.4;
  let jpegQuality = 0.70;

  if (options.targetMaxKb && options.targetMaxKb > 0) {
    // When targetMaxKb is specified, calculate per-page budget to tune file size right around the target
    const budgetPerPage = (options.targetMaxKb * 0.95) / Math.max(1, numPages);

    if (budgetPerPage < 35) {
      dpiScale = 0.95;
      jpegQuality = 0.45;
    } else if (budgetPerPage < 70) {
      dpiScale = 1.2;
      jpegQuality = 0.60;
    } else if (budgetPerPage < 150) {
      dpiScale = 1.45;
      jpegQuality = 0.72;
    } else if (budgetPerPage < 300) {
      dpiScale = 1.75;
      jpegQuality = 0.82;
    } else {
      dpiScale = 2.1;
      jpegQuality = 0.88;
    }
  } else if (options.level === 'extreme') {
    dpiScale = 1.1;
    jpegQuality = 0.50;
  } else if (options.level === 'recommended') {
    dpiScale = 1.45;
    jpegQuality = 0.70;
  } else if (options.level === 'low') {
    dpiScale = 1.85;
    jpegQuality = 0.82;
  } else if (options.level === 'custom') {
    if (options.customDpi) dpiScale = options.customDpi / 72;
    if (options.customQuality) jpegQuality = Math.max(0.1, Math.min(1.0, options.customQuality / 100));
  }

  const newPdfDoc = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (options.onProgress) {
      options.onProgress(pageNum, numPages);
    }

    const page = await pdfDoc.getPage(pageNum);
    // Base viewport at scale 1.0 represents original PDF dimensions in points
    const baseViewport = page.getViewport({ scale: 1.0 });
    const targetWidthPts = baseViewport.width;
    const targetHeightPts = baseViewport.height;

    // Render viewport at target scale
    const renderViewport = page.getViewport({ scale: dpiScale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(renderViewport.width));
    canvas.height = Math.max(1, Math.round(renderViewport.height));
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render({
      canvasContext: ctx,
      viewport: renderViewport,
      canvas: canvas as any,
    } as any)).promise;

    // Convert canvas to compressed JPEG
    const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const embeddedImg = await newPdfDoc.embedJpg(jpegDataUrl);

    // Create page matching original document points
    const newPage = newPdfDoc.addPage([targetWidthPts, targetHeightPts]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: targetWidthPts,
      height: targetHeightPts,
    });
  }

  const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
  const compressedSizeKb = Number((compressedBytes.byteLength / 1024).toFixed(1));
  const reductionPercent = Math.max(
    0,
    Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100)
  );
  const targetAchieved = options.targetMaxKb ? compressedSizeKb <= options.targetMaxKb : true;

  return {
    pdfBytes: compressedBytes,
    originalSizeKb,
    compressedSizeKb,
    reductionPercent,
    pageCount: numPages,
    targetAchieved,
  };
}
