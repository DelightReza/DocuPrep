import React from 'react';
import { Crop as CropIcon, Lock, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { PresetRequirement, UnitType } from '../../../types';
import { calculatePixels } from '../../../lib/image/resizeEngine';
import { getPresetAspectRatioDisplay } from '../../../config/presets';

interface CropControlBarProps {
  sourceImage: HTMLImageElement;
  activePreset: PresetRequirement | null;
  cropAspect: number | null;
  setCropAspect: (a: number | null) => void;
  setCropPreset: (p: 'target' | '1:1' | '35:45' | '2:3' | 'free') => void;
  updateCropRectForAspect: (ratio: number, img: HTMLImageElement) => void;
  adjustCropZoom: (factor: number) => void;
  centerCropBox: () => void;
  resetCropToMax: () => void;
  setCropActive: (a: boolean) => void;
  widthVal: number;
  heightVal: number;
  unit: UnitType;
  dpi: number;
}

export const CropControlBar: React.FC<CropControlBarProps> = ({
  sourceImage,
  activePreset,
  cropAspect,
  setCropAspect,
  setCropPreset,
  updateCropRectForAspect,
  adjustCropZoom,
  centerCropBox,
  resetCropToMax,
  setCropActive,
  widthVal,
  heightVal,
  unit,
  dpi,
}) => {
  return (
    <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <CropIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Crop & Frame
          </span>
          {/* Fixed Aspect Ratio Badge */}
          {activePreset && activePreset.id !== 'original' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-bold shadow-xs">
              <Lock className="h-3 w-3" />
              Fixed Ratio: {getPresetAspectRatioDisplay(activePreset)}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
              Original Dimensions Ratio ({sourceImage.naturalWidth}×{sourceImage.naturalHeight})
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {activePreset && activePreset.id !== 'original'
            ? `Output: ${calculatePixels(widthVal, unit, dpi)} × ${calculatePixels(heightVal, unit, dpi)} px (${widthVal}×${heightVal} ${unit})`
            : `Original Source: ${sourceImage.naturalWidth} × ${sourceImage.naturalHeight} px`}
        </span>
      </div>

      {/* Crop Ratio Indicator & Explanatory Notice */}
      {activePreset && activePreset.id !== 'original' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60">
              <Lock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{getPresetAspectRatioDisplay(activePreset)}</span>
            </div>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              Locked to <span className="font-semibold text-slate-900 dark:text-white">{activePreset.name}</span> specification. Position & zoom frame to fit your photo.
            </span>
          </div>
          <button
            type="button"
            onClick={resetCropToMax}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Reset to Full
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const ratio = sourceImage.naturalWidth / sourceImage.naturalHeight;
              setCropAspect(ratio);
              setCropPreset('target');
              updateCropRectForAspect(ratio, sourceImage);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              cropAspect !== null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            Original Aspect Ratio ({sourceImage.naturalWidth}:{sourceImage.naturalHeight})
          </button>
          <button
            type="button"
            onClick={() => {
              setCropAspect(null);
              setCropPreset('free');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              cropAspect === null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            Freeform
          </button>
        </div>
      )}

      {/* Fine Controls: Zoom, Position, Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Frame Actions:</span>
          <button
            type="button"
            onClick={() => adjustCropZoom(0.9)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs"
            title="Zoom In on subject (shrink crop frame)"
          >
            <ZoomIn className="h-3 w-3" />
            Zoom In
          </button>
          <button
            type="button"
            onClick={() => adjustCropZoom(1.1)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs"
            title="Zoom Out to include more of photo (expand crop frame)"
          >
            <ZoomOut className="h-3 w-3" />
            Zoom Out
          </button>
          <button
            type="button"
            onClick={centerCropBox}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs"
          >
            Center Frame
          </button>
          <button
            type="button"
            onClick={resetCropToMax}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs"
          >
            Maximize Frame
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCropActive(false)}
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Done Cropping</span>
        </button>
      </div>
    </div>
  );
};
