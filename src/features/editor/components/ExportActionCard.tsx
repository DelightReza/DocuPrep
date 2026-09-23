import React from 'react';
import { Download } from 'lucide-react';

interface ExportActionCardProps {
  customFilename: string;
  setCustomFilename: (f: string) => void;
  handleDownload: () => void;
  sourceImage: HTMLImageElement | null;
}

export const ExportActionCard: React.FC<ExportActionCardProps> = ({
  customFilename,
  setCustomFilename,
  handleDownload,
  sourceImage,
}) => {
  return (
    <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-900 shadow-md space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Custom Filename
        </label>
        <input
          type="text"
          value={customFilename}
          onChange={(e) => setCustomFilename(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <button
          onClick={handleDownload}
          disabled={!sourceImage}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-40 transition"
        >
          <Download className="h-4 w-4" />
          <span>Download Ready Document</span>
        </button>
      </div>
    </div>
  );
};
