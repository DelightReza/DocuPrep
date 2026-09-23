import React, { useState, useRef } from 'react';
import {
  FileText,
  Files,
  Scissors,
  RotateCw,
  FileDown,
  FileUp,
  Download,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Minimize2,
  Sparkles
} from 'lucide-react';
import {
  convertImagesToPdf,
  mergePdfs,
  extractPdfPages,
  getPdfPageCount,
  parsePageRangeString,
  rotatePdfPages,
  compressPdf,
  CompressPdfResult,
  CompressPdfOptions,
  ImageToPdfOptions
} from '../../lib/pdf/pdfEngine';
import { renderPdfToCanvases, RenderedPdfPage } from '../../lib/pdf/pdfRender';

type PdfSubTool = 'img-to-pdf' | 'pdf-to-img' | 'pdf-merge' | 'pdf-split' | 'pdf-rotate' | 'pdf-compress';

interface PdfWorkspaceProps {
  initialTool?: string;
  onOpenImageEditor?: (file: File) => void;
}

export const PdfWorkspace: React.FC<PdfWorkspaceProps> = ({
  initialTool = 'img-to-pdf',
  onOpenImageEditor,
}) => {
  const [activeTab, setActiveTab] = useState<PdfSubTool>(
    initialTool === 'pdf-to-img' ||
    initialTool === 'pdf-merge' ||
    initialTool === 'pdf-split' ||
    initialTool === 'pdf-compress' ||
    initialTool === 'compress' ||
    initialTool === 'pdf-organizer'
      ? (initialTool === 'pdf-organizer'
          ? 'pdf-rotate'
          : initialTool === 'compress'
          ? 'pdf-compress'
          : (initialTool as PdfSubTool))
      : 'img-to-pdf'
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Image to PDF state ---
  const [imgFiles, setImgFiles] = useState<Array<{ id: string; file: File; dataUrl: string; width: number; height: number; name: string }>>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal' | 'Original'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [margin, setMargin] = useState<'none' | 'small' | 'medium' | 'large'>('small');

  // --- PDF to Image state ---
  const [sourcePdfForImages, setSourcePdfForImages] = useState<File | null>(null);
  const [extractedPages, setExtractedPages] = useState<RenderedPdfPage[]>([]);

  // --- PDF Merge state ---
  const [mergeFiles, setMergeFiles] = useState<Array<{ id: string; file: File; name: string; size: number }>>([]);

  // --- PDF Split state ---
  const [sourcePdfForSplit, setSourcePdfForSplit] = useState<File | null>(null);
  const [splitRangeStr, setSplitRangeStr] = useState<string>('1-2');
  const [splitTotalPages, setSplitTotalPages] = useState<number>(1);

  // --- PDF Rotate state ---
  const [sourcePdfForRotate, setSourcePdfForRotate] = useState<File | null>(null);
  const [rotatePagesList, setRotatePagesList] = useState<RenderedPdfPage[]>([]);
  const [pageRotations, setPageRotations] = useState<{ [pageIndex: number]: number }>({});

  // --- PDF Compress state ---
  const [sourcePdfForCompress, setSourcePdfForCompress] = useState<File | null>(null);
  const [compressLevel, setCompressLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [compressTargetKb, setCompressTargetKb] = useState<number | null>(null);
  const [compressResult, setCompressResult] = useState<CompressPdfResult | null>(null);
  const [compressPreviewPages, setCompressPreviewPages] = useState<RenderedPdfPage[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const compressInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to load image dimensions
  const loadImageInfo = (file: File): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Could not read image: ${file.name}`));
      reader.onload = (e) => {
        const sourceDataUrl = e.target?.result as string;
        const img = new Image();
        img.onerror = () => reject(new Error(`Could not decode image: ${file.name}`));
        img.onload = () => {
          if (file.type === 'image/png') {
            resolve({ dataUrl: sourceDataUrl, width: img.naturalWidth, height: img.naturalHeight });
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error(`Could not prepare image: ${file.name}`));
            return;
          }

          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/jpeg', 0.95),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.src = sourceDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // --- Handlers for Images to PDF ---
  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setIsLoading(true);
    try {
      const newItems = await Promise.all(
        files.map(async (f) => {
          const info = await loadImageInfo(f);
          return {
            id: `img_${Date.now()}_${Math.random()}`,
            file: f,
            dataUrl: info.dataUrl,
            width: info.width,
            height: info.height,
            name: f.name,
          };
        })
      );
      setImgFiles((prev) => [...prev, ...newItems]);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load one or more images.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConvertImagesToPdf = async () => {
    if (imgFiles.length === 0) return;
    setIsLoading(true);
    setStatusMessage('Generating PDF from images...');
    setErrorMessage(null);
    try {
      const pdfBytes = await convertImagesToPdf(imgFiles, {
        pageSize,
        orientation,
        margin,
      });

      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuPrep_Document_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('PDF created and downloaded successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers for PDF to Image ---
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

  // --- Handlers for Merge PDF ---
  const handleAddMergePdfs = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newItems = files.map((f) => ({
      id: `pdf_${Date.now()}_${Math.random()}`,
      file: f,
      name: f.name,
      size: f.size,
    }));
    setMergeFiles((prev) => [...prev, ...newItems]);
  };

  const handleMergePdfs = async () => {
    if (mergeFiles.length < 2) {
      setErrorMessage('Please select at least 2 PDF documents to merge.');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Merging PDF documents...');
    setErrorMessage(null);
    try {
      const buffers = await Promise.all(mergeFiles.map((item) => item.file.arrayBuffer()));
      const mergedBytes = await mergePdfs(buffers);
      const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuPrep_Merged_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('PDFs merged and downloaded successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to merge PDF documents.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers for Split PDF ---
  const handleSelectPdfForSplit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourcePdfForSplit(file);
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Reading PDF page count...');
    try {
      const buffer = await file.arrayBuffer();
      const totalPages = await getPdfPageCount(buffer);
      setSplitTotalPages(totalPages);
      setSplitRangeStr('1');
      setStatusMessage(`Loaded ${totalPages} page${totalPages === 1 ? '' : 's'} ready for extraction.`);
      if (e.target) e.target.value = '';
    } catch (err: any) {
      setSplitTotalPages(1);
      setErrorMessage(err.message || 'Could not read PDF page count.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSplitPdf = async () => {
    if (!sourcePdfForSplit) return;
    setIsLoading(true);
    setStatusMessage('Extracting pages...');
    setErrorMessage(null);
    try {
      const buffer = await sourcePdfForSplit.arrayBuffer();
      const pages = parsePageRangeString(splitRangeStr, splitTotalPages);
      if (pages.length === 0) {
        throw new Error('Please enter a valid page number or range (e.g. 1-3, 5).');
      }
      const splitBytes = await extractPdfPages(buffer, pages);
      const blob = new Blob([splitBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourcePdfForSplit.name.replace('.pdf', '')}_extracted_pages_${splitRangeStr.replace(/[\s,]+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('Pages extracted successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to split PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers for Rotate PDF ---
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

  // --- Handlers for PDF Compression ---
  const handleCompressPdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSourcePdfForCompress(file);
    setCompressResult(null);
    setCompressPreviewPages([]);
    setStatusMessage(`Loaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB) for compression.`);
  };

  const handleRunCompressPdf = async () => {
    if (!sourcePdfForCompress) return;
    setIsLoading(true);
    setStatusMessage('Compressing PDF pages and optimizing image streams...');
    setErrorMessage(null);
    try {
      const buffer = await sourcePdfForCompress.arrayBuffer();
      const result = await compressPdf(buffer, {
        level: compressLevel,
        targetMaxKb: compressTargetKb || undefined,
      });
      setCompressResult(result);

      // Generate result preview of compressed pages
      try {
        const previews = await renderPdfToCanvases(result.pdfBytes, undefined, 1.0);
        setCompressPreviewPages(previews);
      } catch (prevErr) {
        console.warn('Could not generate preview for compressed pages:', prevErr);
      }

      setStatusMessage(
        `PDF compressed successfully! Reduced from ${result.originalSizeKb} KB to ${result.compressedSizeKb} KB (-${result.reductionPercent}% smaller).`
      );
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to compress PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCompressedPdf = () => {
    if (!compressResult || !sourcePdfForCompress) return;
    const blob = new Blob([compressResult.pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sourcePdfForCompress.name.replace('.pdf', '')}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          <FileText className="h-4 w-4" />
          <span>Complete PDF Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          PDF Preparation & Management Tools
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Convert photos and certificates to PDF, extract high-res images, merge multiple documents, split page ranges, and rotate pages — all processed locally.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('img-to-pdf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'img-to-pdf'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileUp className="h-4 w-4" />
          <span>Images to PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf-to-img')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-to-img'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileDown className="h-4 w-4" />
          <span>PDF to JPG / PNG</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf-merge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-merge'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Files className="h-4 w-4" />
          <span>Merge PDFs</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf-split')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-split'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Scissors className="h-4 w-4" />
          <span>Split & Extract</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf-rotate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-rotate'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <RotateCw className="h-4 w-4" />
          <span>Rotate & Reorder</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf-compress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-compress'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Minimize2 className="h-4 w-4" />
          <span>Compress PDF</span>
        </button>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* --- TAB 1: IMAGES TO PDF --- */}
      {activeTab === 'img-to-pdf' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {/* Upload Area */}
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 cursor-pointer transition text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                onChange={handleAddImages}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-3">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Add Images to PDF
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Select one or multiple JPG, PNG, or WebP files
              </span>
            </label>

            {/* List of images */}
            {imgFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Selected Images ({imgFiles.length} pages)</span>
                  <button
                    onClick={() => setImgFiles([])}
                    className="text-red-500 hover:text-red-600"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2">
                  {imgFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {idx + 1}
                        </span>
                        <img
                          src={item.dataUrl}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.width} x {item.height} px
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => {
                            const newArr = [...imgFiles];
                            [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
                            setImgFiles(newArr);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          disabled={idx === imgFiles.length - 1}
                          onClick={() => {
                            const newArr = [...imgFiles];
                            [newArr[idx + 1], newArr[idx]] = [newArr[idx], newArr[idx + 1]];
                            setImgFiles(newArr);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setImgFiles(imgFiles.filter((_, i) => i !== idx))}
                          className="p-1 rounded text-slate-400 hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Options Sidebar */}
          <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 h-fit">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              PDF Layout Options
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Standard Page Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['A4', 'Letter', 'Legal', 'Original'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setPageSize(sz)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      pageSize === sz
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {sz === 'Original' ? 'Fit Image' : sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Orientation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'portrait', 'landscape'] as const).map((ori) => (
                  <button
                    key={ori}
                    onClick={() => setOrientation(ori)}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold capitalize ${
                      orientation === ori
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {ori}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Margins
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['none', 'small', 'medium', 'large'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMargin(m)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold capitalize ${
                      margin === m
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleConvertImagesToPdf}
              disabled={imgFiles.length === 0 || isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Generate & Download PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 2: PDF TO IMAGES --- */}
      {activeTab === 'pdf-to-img' && (
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
      )}

      {/* --- TAB 3: MERGE PDFS --- */}
      {activeTab === 'pdf-merge' && (
        <div className="mt-6 max-w-2xl mx-auto space-y-5">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 cursor-pointer transition text-center">
            <input
              type="file"
              multiple
              accept="application/pdf"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleAddMergePdfs}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-3">
              <Files className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Add Multiple PDFs to Merge
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Select 2 or more PDF documents to combine into a single file
            </span>
          </label>

          {mergeFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>PDF Documents in Order ({mergeFiles.length})</span>
                <button
                  onClick={() => setMergeFiles([])}
                  className="text-red-500 hover:text-red-600"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2">
                {mergeFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {idx + 1}
                      </span>
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {(item.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => {
                          const arr = [...mergeFiles];
                          [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                          setMergeFiles(arr);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        disabled={idx === mergeFiles.length - 1}
                        onClick={() => {
                          const arr = [...mergeFiles];
                          [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                          setMergeFiles(arr);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))}
                        className="p-1 rounded text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleMergePdfs}
                disabled={mergeFiles.length < 2 || isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Files className="h-4 w-4" />}
                <span>Merge All Selected PDFs</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: SPLIT PDF --- */}
      {activeTab === 'pdf-split' && (
        <div className="mt-6 max-w-xl mx-auto space-y-5">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 cursor-pointer transition text-center">
            <input
              type="file"
              accept="application/pdf"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleSelectPdfForSplit}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-3">
              <Scissors className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {sourcePdfForSplit ? sourcePdfForSplit.name : 'Select PDF to Split & Extract'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Extract specific pages or page ranges into a fresh PDF
            </span>
          </label>

          {sourcePdfForSplit && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Page Range Expression
                </label>
                <input
                  type="text"
                  value={splitRangeStr}
                  onChange={(e) => setSplitRangeStr(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-9"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Example: <strong>1-3, 5</strong> extracts pages 1, 2, 3, and 5 into a new combined PDF.
                </p>
              </div>

              <button
                onClick={handleSplitPdf}
                disabled={isLoading || !splitRangeStr.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>Extract & Download Pages</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 5: ROTATE PDF --- */}
      {activeTab === 'pdf-rotate' && (
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
      )}

      {/* --- TAB 6: COMPRESS PDF --- */}
      {activeTab === 'pdf-compress' && (
        <div className="mt-6 space-y-6">
          <input
            type="file"
            ref={compressInputRef}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            onChange={handleCompressPdfSelect}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          {/* Upload Area */}
          <div
            onClick={() => compressInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition bg-white dark:bg-slate-900 shadow-sm"
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <Minimize2 className="h-7 w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {sourcePdfForCompress ? sourcePdfForCompress.name : 'Choose a PDF file to compress'}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {sourcePdfForCompress
                ? `Original File Size: ${(sourcePdfForCompress.size / 1024).toFixed(1)} KB (${(sourcePdfForCompress.size / (1024 * 1024)).toFixed(2)} MB). Click to choose another file.`
                : 'Reduce PDF file size for government portals, job applications, or email attachments while preserving readability.'}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <FileUp className="h-4 w-4" />
              <span>{sourcePdfForCompress ? 'Change PDF File' : 'Select PDF from Device'}</span>
            </div>
          </div>

          {sourcePdfForCompress && (
            <div className="space-y-6">
              {/* Compression Configuration Card */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Compression Settings
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select target optimization profile or specific maximum file size limit.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Source: {(sourcePdfForCompress.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                {/* Compression Profiles */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Optimization Profile
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'recommended' as const,
                        title: 'Recommended (Balanced)',
                        desc: 'Best balance of clear text reading and 60-80% file size reduction.',
                      },
                      {
                        id: 'extreme' as const,
                        title: 'Extreme Compression',
                        desc: 'Maximum reduction for strict government portals and upload limits.',
                      },
                      {
                        id: 'low' as const,
                        title: 'Light Compression',
                        desc: 'High-res image retention with moderate 30-50% size reduction.',
                      },
                    ].map((prof) => (
                      <div
                        key={prof.id}
                        onClick={() => setCompressLevel(prof.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          compressLevel === prof.id
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {prof.title}
                          </span>
                          {compressLevel === prof.id && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {prof.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Max KB Limit Controls (Fully Editable) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Strict File Size Limit (Optional)
                    </label>
                    {compressTargetKb && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        Target: &lt; {compressTargetKb} KB
                      </span>
                    )}
                  </div>

                  {/* Editable Custom Target KB Input */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="10"
                        max="50000"
                        step="any"
                        placeholder="Enter target size (e.g. 200) or choose below..."
                        value={compressTargetKb ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          if (val === '') {
                            setCompressTargetKb(null);
                          } else {
                            const num = parseFloat(val);
                            setCompressTargetKb(isNaN(num) || num <= 0 ? null : num);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                        KB
                      </span>
                    </div>

                    {compressTargetKb !== null && (
                      <button
                        type="button"
                        onClick={() => setCompressTargetKb(null)}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      >
                        Clear (Auto)
                      </button>
                    )}
                  </div>

                                  </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleRunCompressPdf}
                    disabled={isLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Compressing Document...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Compress PDF Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* COMPRESSION RESULT PREVIEW SECTION */}
              {compressResult && (
                <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-900 dark:to-slate-900 shadow-md space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Compression Complete! Result Preview
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {compressResult.pageCount} page(s) successfully processed with local in-browser engine.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadCompressedPdf}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Compressed PDF ({compressResult.compressedSizeKb} KB)</span>
                    </button>
                  </div>

                  {/* Before / After Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                        Original Size
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-300">
                        {compressResult.originalSizeKb} KB
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center">
                      <span className="text-[11px] font-semibold text-emerald-600 uppercase block mb-1">
                        Compressed Size
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                        {compressResult.compressedSizeKb} KB
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                        Space Saved
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                        -{compressResult.reductionPercent}%
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                        Compliance
                      </span>
                      <span className={`text-sm sm:text-base font-extrabold ${compressResult.targetAchieved ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {compressResult.targetAchieved ? 'Passed ✅' : 'Reduced'}
                      </span>
                    </div>
                  </div>

                  {/* Rendered Compressed Pages Visual Gallery */}
                  {compressPreviewPages.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Visual Page Result Preview ({compressPreviewPages.length} Pages)
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Verify sharpness and text legibility
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {compressPreviewPages.map((pg) => (
                          <div
                            key={pg.pageNumber}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 group"
                          >
                            <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                              <img
                                src={pg.dataUrl}
                                alt={`Page ${pg.pageNumber} Preview`}
                                className="w-full h-full object-contain"
                              />
                              <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                                Page {pg.pageNumber}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                              <span>Page {pg.pageNumber} of {compressPreviewPages.length}</span>
                              <span className="text-emerald-600 font-semibold">Ready</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
