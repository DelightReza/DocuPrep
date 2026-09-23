import React, { useState } from 'react';
import { Scissors, Download, Loader2 } from 'lucide-react';
import { getPdfPageCount, parsePageRangeString, extractPdfPages } from '../../../lib/pdf/pdfEngine';

interface SplitPdfTabProps {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setStatusMessage: (msg: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const SplitPdfTab: React.FC<SplitPdfTabProps> = ({
  setIsLoading,
  isLoading,
  setStatusMessage,
  setErrorMessage,
}) => {
  const [sourcePdfForSplit, setSourcePdfForSplit] = useState<File | null>(null);
  const [splitRangeStr, setSplitRangeStr] = useState<string>('1-2');
  const [splitTotalPages, setSplitTotalPages] = useState<number>(1);

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

  return (
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
  );
};
