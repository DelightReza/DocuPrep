import React from 'react';
import { OutputFormat } from '../../../types';

interface CompressionCardProps {
  currentKb: number;
  targetMaxKb: number | null;
  targetAchieved: boolean;
  setTargetMaxKb: (kb: number | null) => void;
  outputFormat: OutputFormat;
  quality: number;
  setQuality: (q: number) => void;
}

export const CompressionCard: React.FC<CompressionCardProps> = ({
  currentKb,
  targetMaxKb,
  targetAchieved,
  setTargetMaxKb,
  outputFormat,
  quality,
  setQuality,
}) => {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target File Size Limit
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Set exact maximum file size for government portals or exams
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
            Current: {currentKb} KB
          </span>
          {targetMaxKb && (
            <span
              className={`text-[10px] font-semibold flex items-center gap-1 ${
                targetAchieved
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {targetAchieved ? '✓ Within Limit' : '⚠️ Near Limit'}
            </span>
          )}
        </div>
      </div>

      {/* Custom Editable Target Size Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            step="any"
            placeholder="e.g. 50 (Leave blank for Auto)"
            value={targetMaxKb ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (raw === '') {
                setTargetMaxKb(null);
              } else {
                const num = parseFloat(raw);
                setTargetMaxKb(isNaN(num) || num <= 0 ? null : num);
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
            KB
          </span>
        </div>

        {targetMaxKb !== null ? (
          <button
            type="button"
            onClick={() => setTargetMaxKb(null)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            title="Switch to Auto compression mode"
          >
            Clear (Auto)
          </button>
        ) : (
          <span className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Auto Quality
          </span>
        )}
      </div>

      {/* JPEG Quality Slider (Visible when in Auto quality mode without fixed target KB) */}
      {outputFormat !== 'png' && !targetMaxKb && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>Compression Quality</span>
            <span className="font-semibold">{quality}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
          />
        </div>
      )}
    </div>
  );
};
