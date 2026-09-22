import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface RenderedPdfPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads a PDF from ArrayBuffer and renders all or selected pages to canvas
 */
export async function renderPdfToCanvases(
  pdfBuffer: ArrayBuffer,
  pageNumbers?: number[],
  dpiScale: number = 2.0 // scale 2.0 gives ~150-200 DPI crisp render
): Promise<RenderedPdfPage[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const targetPages = pageNumbers && pageNumbers.length > 0
    ? pageNumbers.filter((p) => p >= 1 && p <= numPages)
    : Array.from({ length: numPages }, (_, i) => i + 1);

  const results: RenderedPdfPage[] = [];

  for (const pageNum of targetPages) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: dpiScale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Solid white background for PDF page rendering
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas as any,
      };

      await (page.render(renderContext as any)).promise;

      results.push({
        pageNumber: pageNum,
        canvas,
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        width: viewport.width,
        height: viewport.height,
      });
    }
  }

  return results;
}

/**
 * Quick preview renderer for first page thumbnail
 */
export async function renderPdfFirstPageThumbnail(
  pdfBuffer: ArrayBuffer,
  maxWidth: number = 300
): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, viewport.width, viewport.height);
      await (page.render({ canvasContext: ctx, viewport, canvas } as any)).promise;
      return canvas.toDataURL('image/jpeg', 0.85);
    }
    return '';
  } catch (err) {
    console.warn('Could not generate PDF thumbnail:', err);
    return '';
  }
}
