import React, { useState } from 'react';
import { RotateCw, Download } from 'lucide-react';
import { rotatePdfPages } from '../../../lib/pdf/pdfEngine';
import { renderPdfToCanvases, RenderedPdfPage } from '../../../lib/pdf/pdfRender';

interface RotatePdfTabProps {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setStatusMessage: (msg: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const RotatePdfTab: React.FC<RotatePdfTabProps> = ({
  setIsLoading,
  isLoading,
  setStatusMessage,
  setErrorMessage,
}) => {
  const [sourcePdfForRotate, setSourcePdfForRotate] = useState<File | null>(null);
  const [rotatePagesList, setRotatePagesList] = useState<RenderedPdfPage[]>([]);
  const [pageRotations, setPageRotations] = useState<{ [pageIndex: number]: number }>({});

  const handleSelectPdfForRotate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourcePdfForRotate(file);
    setIsLoading(true);
    setStatusMessage('Loading pages for rotation...');
    setErrorMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const pages = await renderPdfToCanvases(buffer, undefined, 1.0);
      setRotatePagesList(pages);
      setPageRotations({});
      setStatusMessage(`Loaded ${pages.length} pages. Click rotate buttons on any page.`);
    } catch (err: any) {
      setErrorMessage('Could not load PDF pages for rotation.');
    } finally {
      setIsLoading(false);
    }
  };

  const rotatePage = (pageIndex: number) => {
    setPageRotations((prev) => ({
      ...prev,
      [pageIndex]: ((prev[pageIndex] || 0) + 90) % 360,
    }));
  };

  const handleSaveRotatedPdf = async () => {
    if (!sourcePdfForRotate) return;
    setIsLoading(true);
    setStatusMessage('Saving rotated PDF...');
    try {
      const buffer = await sourcePdfForRotate.arrayBuffer();
      const rotatedBytes = await rotatePdfPages(buffer, pageRotations);
      const blob = new Blob([rotatedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourcePdfForRotate.name.replace('.pdf', '')}_rotated.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('Rotated PDF downloaded successfully!');
    } catch (err: any) {
      setErrorMessage('Could not save rotated PDF.');
    } finally {
      setIsLoading(false);
    }
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
          onChange={handleSelectPdfForRotate}
          className="hidden"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-3">
          <RotateCw className="h-6 w-6" />
        </div>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {sourcePdfForRotate ? sourcePdfForRotate.name : 'Select PDF to Rotate Pages'}
        </span>
        <span className="text-xs text-slate-500 mt-1">
          Fix orientation of scanned documents and save permanently
        </span>
      </label>

      {rotatePagesList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rotate Pages ({rotatePagesList.length})
            </h3>
            <button
              onClick={handleSaveRotatedPdf}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20"
            >
              <Download className="h-4 w-4" />
              <span>Save & Download Rotated PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rotatePagesList.map((pg, idx) => {
              const rot = pageRotations[idx] || 0;
              return (
                <div
                  key={pg.pageNumber}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                >
                  <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <img
                      src={pg.dataUrl}
                      alt={`Page ${pg.pageNumber}`}
                      style={{ transform: `rotate(${rot}deg)` }}
                      className="w-full h-full object-contain transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                      Page {pg.pageNumber} {rot > 0 ? `(${rot}°)` : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => rotatePage(idx)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Rotate 90° Clockwise</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
