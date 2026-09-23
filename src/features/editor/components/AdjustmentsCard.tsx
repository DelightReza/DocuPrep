import React from 'react';
import { RotateCw, FlipHorizontal, Eye } from 'lucide-react';
import { ImageAdjustments, UnitType } from '../../../types';
import { ScanMode } from '../../../lib/image/scannerEngine';
import { calculatePixels } from '../../../lib/image/resizeEngine';

interface AdjustmentsCardProps {
  adjustments: ImageAdjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<ImageAdjustments>>;
  scanFilter: ScanMode;
  setScanFilter: (m: ScanMode) => void;
  sourceImage: HTMLImageElement | null;
  previewDataUrl: string | null;
  setViewportMode: (m: 'editor' | 'result' | 'compare') => void;
  setCropActive: (a: boolean) => void;
  currentKb: number;
  widthVal: number;
  heightVal: number;
  unit: UnitType;
  dpi: number;
  targetMaxKb: number | null;
  targetAchieved: boolean;
}

export const AdjustmentsCard: React.FC<AdjustmentsCardProps> = ({
  setAdjustments,
  scanFilter,
  setScanFilter,
  sourceImage,
  previewDataUrl,
  setViewportMode,
  setCropActive,
  currentKb,
  widthVal,
  heightVal,
  unit,
  dpi,
  targetMaxKb,
  targetAchieved,
}) => {
  return (
    <>
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Color & Background Enhancement
        </h3>

        {/* Rotation & Flip */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setAdjustments((prev) => ({
                ...prev,
                rotation: (prev.rotation + 90) % 360,
              }))
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCw className="h-3.5 w-3.5 text-indigo-500" />
            <span>Rotate 90°</span>
          </button>

          <button
            onClick={() =>
              setAdjustments((prev) => ({
                ...prev,
                flipH: !prev.flipH,
              }))
            }
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            title="Flip Horizontally"
          >
            <FlipHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Document Scan Mode Filter */}
        <div>
          <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
            Document Scanner Mode
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(['original', 'color-enhanced', 'black-and-white'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setScanFilter(m)}
                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold capitalize truncate ${
                  scanFilter === m
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {m === 'color-enhanced' ? 'Enhanced' : m === 'black-and-white' ? 'B&W Scan' : 'Normal'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Result Preview Mini-Card */}
      {sourceImage && previewDataUrl && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-indigo-500" />
              Live Result Preview
            </span>
            <button
              type="button"
              onClick={() => {
                setViewportMode('result');
                setCropActive(false);
              }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View Large
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div
              onClick={() => {
                setViewportMode('result');
                setCropActive(false);
              }}
              className="w-20 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center flex-shrink-0 group hover:ring-2 hover:ring-indigo-500 transition bg-slate-100 dark:bg-slate-800"
            >
              <img
                src={previewDataUrl}
                alt="Thumbnail Preview"
                className="max-w-full max-h-full object-contain group-hover:scale-105 transition"
              />
            </div>

            <div className="flex-1 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Size:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {currentKb} KB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Resolution:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                  {calculatePixels(widthVal, unit, dpi)} × {calculatePixels(heightVal, unit, dpi)} px
                </span>
              </div>
              {targetMaxKb && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Target Limit:</span>
                  <span className={`text-[11px] font-bold ${targetAchieved ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {targetAchieved ? `Pass (≤${targetMaxKb}KB)` : `Over target (${currentKb}KB)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
