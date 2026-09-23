import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { renderPdfToCanvases, RenderedPdfPage } from '../../../lib/pdf/pdfRender';

interface PdfToImagesTabProps {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setStatusMessage: (msg: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
  onOpenImageEditor?: (file: File) => void;
}

export const PdfToImagesTab: React.FC<PdfToImagesTabProps> = ({
  setIsLoading,
  setStatusMessage,
  setErrorMessage,
}) => {
  const [sourcePdfForImages, setSourcePdfForImages] = useState<File | null>(null);
  const [extractedPages, setExtractedPages] = useState<RenderedPdfPage[]>([]);

  const handleSelectPdfForImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourcePdfForImages(file);
    setIsLoading(true);
    setStatusMessage('Rendering PDF pages...');
    setErrorMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const pages = await renderPdfToCanvases(buffer);
      setExtractedPages(pages);
      setStatusMessage(`Rendered ${pages.length} pages ready for download.`);
    } catch (err: any) {
      setErrorMessage('Could not render PDF. Ensure file is not password-protected.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSingleImage = (page: RenderedPdfPage, format: 'jpeg' | 'png') => {
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';
    page.canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourcePdfForImages?.name.replace('.pdf', '') || 'document'}_page_${page.pageNumber}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, mime, 0.95);
  };

  return (
    <div className="mt-6 space-y-6">
      <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 cursor-pointer transition text-center">
        <input
          type="file"
          accept="application/pdf"
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={handleSelectPdfForImages}
          className="hidden"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-3">
          <FileDown className="h-6 w-6" />
        </div>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {sourcePdfForImages ? sourcePdfForImages.name : 'Choose PDF to Extract Images'}
        </span>
        <span className="text-xs text-slate-500 mt-1">
          Extracts high-resolution JPG or PNG for every page in the document
        </span>
      </label>

      {extractedPages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rendered Pages ({extractedPages.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {extractedPages.map((pg) => (
              <div
                key={pg.pageNumber}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
              >
                <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <img
                    src={pg.dataUrl}
                    alt={`Page ${pg.pageNumber}`}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                    Page {pg.pageNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadSingleImage(pg, 'jpeg')}
                    className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => handleDownloadSingleImage(pg, 'png')}
                    className="py-1.5 rounded-lg border border-indigo-600 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  >
                    PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
