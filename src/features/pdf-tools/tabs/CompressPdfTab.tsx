import React, { useRef, useState } from 'react';
import { Minimize2, FileUp, CheckCircle2, Loader2, Sparkles, Download } from 'lucide-react';
import { compressPdf, CompressPdfResult } from '../../../lib/pdf/pdfEngine';
import { renderPdfToCanvases, RenderedPdfPage } from '../../../lib/pdf/pdfRender';

interface CompressPdfTabProps {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setStatusMessage: (msg: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const CompressPdfTab: React.FC<CompressPdfTabProps> = ({
  setIsLoading,
  isLoading,
  setStatusMessage,
  setErrorMessage,
}) => {
  const [sourcePdfForCompress, setSourcePdfForCompress] = useState<File | null>(null);
  const [compressLevel, setCompressLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [compressTargetKb, setCompressTargetKb] = useState<number | null>(null);
  const [compressResult, setCompressResult] = useState<CompressPdfResult | null>(null);
  const [compressPreviewPages, setCompressPreviewPages] = useState<RenderedPdfPage[]>([]);
  const compressInputRef = useRef<HTMLInputElement | null>(null);

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
  );
};
