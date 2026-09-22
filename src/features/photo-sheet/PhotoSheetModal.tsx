import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, FileText, Grid, Check, Sliders } from 'lucide-react';
import { generatePhotoSheetCanvas, PhotoSheetConfig } from '../../lib/image/photoSheetEngine';
import { convertImagesToPdf } from '../../lib/pdf/pdfEngine';

interface PhotoSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCanvas: HTMLCanvasElement | null;
  initialPhotoWidthMm?: number;
  initialPhotoHeightMm?: number;
}

export const PhotoSheetModal: React.FC<PhotoSheetModalProps> = ({
  isOpen,
  onClose,
  sourceCanvas,
  initialPhotoWidthMm = 35,
  initialPhotoHeightMm = 45,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | '4x6'>('A4');
  const [photoWidthMm, setPhotoWidthMm] = useState<number>(initialPhotoWidthMm);
  const [photoHeightMm, setPhotoHeightMm] = useState<number>(initialPhotoHeightMm);
  const [copies, setCopies] = useState<number>(8);
  const [spacingMm, setSpacingMm] = useState<number>(4);
  const [marginMm, setMarginMm] = useState<number>(10);
  const [showCutMarks, setShowCutMarks] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (initialPhotoWidthMm) setPhotoWidthMm(initialPhotoWidthMm);
    if (initialPhotoHeightMm) setPhotoHeightMm(initialPhotoHeightMm);
  }, [initialPhotoWidthMm, initialPhotoHeightMm]);

  // Re-render sheet preview when config changes
  useEffect(() => {
    if (!isOpen || !sourceCanvas || !previewCanvasRef.current) return;

    const fullSheetCanvas = generatePhotoSheetCanvas(sourceCanvas, {
      paperSize,
      photoWidthMm,
      photoHeightMm,
      copies,
      spacingMm,
      marginMm,
      showCutMarks,
      dpi: 150, // 150 DPI for snappy UI preview
    });

    const displayCanvas = previewCanvasRef.current;
    displayCanvas.width = fullSheetCanvas.width;
    displayCanvas.height = fullSheetCanvas.height;
    const ctx = displayCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(fullSheetCanvas, 0, 0);
    }
  }, [isOpen, sourceCanvas, paperSize, photoWidthMm, photoHeightMm, copies, spacingMm, marginMm, showCutMarks]);

  if (!isOpen || !sourceCanvas) return null;

  const handleDownloadJpg = () => {
    setIsExporting(true);
    try {
      const fullSheet = generatePhotoSheetCanvas(sourceCanvas, {
        paperSize,
        photoWidthMm,
        photoHeightMm,
        copies,
        spacingMm,
        marginMm,
        showCutMarks,
        dpi: 300, // Full 300 DPI for high-end print
      });

      fullSheet.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `photo_sheet_${paperSize}_${copies}copies_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.98);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const fullSheet = generatePhotoSheetCanvas(sourceCanvas, {
        paperSize,
        photoWidthMm,
        photoHeightMm,
        copies,
        spacingMm,
        marginMm,
        showCutMarks,
        dpi: 300,
      });

      const dataUrl = fullSheet.toDataURL('image/jpeg', 0.95);
      const pdfBytes = await convertImagesToPdf(
        [{ dataUrl, width: fullSheet.width, height: fullSheet.height }],
        {
          pageSize: paperSize === '4x6' ? 'Original' : paperSize,
          orientation: 'portrait',
          margin: 'none',
        }
      );

      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo_sheet_${paperSize}_printable_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Copy Printable Photo Sheet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arrange photos onto A4, Letter, or 4x6" photo paper with scissor cut marks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content: 2-column layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
          {/* Controls Sidebar (Left) */}
          <div className="md:col-span-5 p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 space-y-5">
            {/* Paper Size */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Paper Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['A4', 'Letter', '4x6'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setPaperSize(size)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      paperSize === size
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {size === '4x6' ? '4x6" Postcard' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Dimensions */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Single Photo Size (mm)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500">Width</span>
                  <input
                    type="number"
                    value={photoWidthMm}
                    onChange={(e) => setPhotoWidthMm(Math.max(10, parseFloat(e.target.value) || 35))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Height</span>
                  <input
                    type="number"
                    value={photoHeightMm}
                    onChange={(e) => setPhotoHeightMm(Math.max(10, parseFloat(e.target.value) || 45))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              {/* Quick dimension presets */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setPhotoWidthMm(35);
                    setPhotoHeightMm(45);
                  }}
                  className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  35x45 mm (Standard)
                </button>
                <button
                  onClick={() => {
                    setPhotoWidthMm(50.8);
                    setPhotoHeightMm(50.8);
                  }}
                  className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  2x2 inch (US Passport)
                </button>
                <button
                  onClick={() => {
                    setPhotoWidthMm(50);
                    setPhotoHeightMm(70);
                  }}
                  className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  50x70 mm (Canada)
                </button>
              </div>
            </div>

            {/* Copies Count */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Number of Copies: <span className="text-indigo-600 font-bold">{copies}</span>
                </label>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[4, 6, 8, 12, 16].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCopies(num)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold ${
                      copies === num
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Cut Marks & Spacing */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCutMarks}
                  onChange={(e) => setShowCutMarks(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Include corner scissor cut marks
                </span>
              </label>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Photo Spacing</span>
                  <span>{spacingMm} mm</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={spacingMm}
                  onChange={(e) => setSpacingMm(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer dark:bg-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Sheet Live Preview (Right) */}
          <div className="md:col-span-7 p-6 bg-slate-100 dark:bg-slate-950/80 flex flex-col items-center justify-center min-h-[360px]">
            <div className="p-3 bg-white shadow-lg rounded-lg border border-slate-200/80 dark:border-slate-800 max-h-[480px] overflow-auto">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[440px] w-auto h-auto object-contain border border-slate-300 dark:border-slate-700 shadow-sm"
              />
            </div>
            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              Preview shows layout scaled for screen. Export renders at 300 DPI high-definition print quality.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadJpg}
            disabled={isExporting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 text-xs font-semibold shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Download 300 DPI JPG</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-semibold shadow-md shadow-indigo-500/20"
          >
            <Printer className="h-4 w-4" />
            <span>Download Print-Ready PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
