import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

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
