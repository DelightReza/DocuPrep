import React, { useState } from 'react';
import { Files, FileText, ArrowUp, ArrowDown, Trash2, Loader2 } from 'lucide-react';
import { mergePdfs } from '../../../lib/pdf/pdfEngine';

interface MergeItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface MergePdfTabProps {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setStatusMessage: (msg: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const MergePdfTab: React.FC<MergePdfTabProps> = ({
  setIsLoading,
  isLoading,
  setStatusMessage,
  setErrorMessage,
}) => {
  const [mergeFiles, setMergeFiles] = useState<MergeItem[]>([]);

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

  return (
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
  );
};
