import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { UnitType, OutputFormat, PresetRequirement } from '../../../types';
import { calculatePixels, pixelsToPhysicalUnit } from '../../../lib/image/resizeEngine';

interface DimensionControlsCardProps {
  unit: UnitType;
  setUnit: (u: UnitType) => void;
  widthVal: number;
  heightVal: number;
  setWidthVal: (w: number) => void;
  setHeightVal: (h: number) => void;
  handleWidthChange: (w: number) => void;
  handleHeightChange: (h: number) => void;
  dpi: number;
  setDpi: (d: number) => void;
  lockAspectRatio: boolean;
  setLockAspectRatio: (l: boolean) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (f: OutputFormat) => void;
  activePreset: PresetRequirement | null;
}

export const DimensionControlsCard: React.FC<DimensionControlsCardProps> = ({
  unit,
  setUnit,
  widthVal,
  heightVal,
  setWidthVal,
  setHeightVal,
  handleWidthChange,
  handleHeightChange,
  dpi,
  setDpi,
  lockAspectRatio,
  setLockAspectRatio,
  outputFormat,
  setOutputFormat,
  activePreset,
}) => {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Dimensions & Resolution
        </h3>
        {activePreset?.id === 'original' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/50">
            Original Source Size
          </span>
        )}
      </div>

      {/* Unit Selector */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        {(['mm', 'cm', 'inch', 'px'] as const).map((u) => (
          <button
            key={u}
            onClick={() => {
              // Convert existing dimensions to new unit
              const pxW = calculatePixels(widthVal, unit, dpi);
              const pxH = calculatePixels(heightVal, unit, dpi);
              setUnit(u);
              setWidthVal(pixelsToPhysicalUnit(pxW, u, dpi));
              setHeightVal(pixelsToPhysicalUnit(pxH, u, dpi));
            }}
            className={`py-1.5 rounded-lg text-xs font-semibold uppercase ${
              unit === u
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Width, Height, and Aspect Lock */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <span className="text-[11px] font-medium text-slate-500">Width ({unit})</span>
          <input
            type="number"
            step="any"
            value={widthVal}
            onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          onClick={() => setLockAspectRatio(!lockAspectRatio)}
          className={`p-2 rounded-xl border mt-4 ${
            lockAspectRatio
              ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'border-slate-200 text-slate-400 dark:border-slate-700'
          }`}
          title="Lock / Unlock Aspect Ratio"
        >
          {lockAspectRatio ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>

        <div className="flex-1">
          <span className="text-[11px] font-medium text-slate-500">Height ({unit})</span>
          <input
            type="number"
            step="any"
            value={heightVal}
            onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* DPI Selector & Format */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[11px] font-medium text-slate-500">Resolution (DPI)</span>
          <select
            value={dpi}
            onChange={(e) => setDpi(parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="96">96 DPI (Web Display)</option>
            <option value="150">150 DPI (Balanced)</option>
            <option value="200">200 DPI (Exam Portals)</option>
            <option value="300">300 DPI (High Quality / Portal Standard)</option>
            <option value="600">600 DPI (Ultra Fine)</option>
          </select>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-500">Output Format</span>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="jpeg">JPEG (.jpg)</option>
            <option value="png">PNG (.png)</option>
            <option value="webp">WebP (.webp)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
