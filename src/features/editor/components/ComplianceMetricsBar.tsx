import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { UnitType } from '../../../types';
import { calculatePixels } from '../../../lib/image/resizeEngine';

interface ComplianceMetricsBarProps {
  sourceImage: HTMLImageElement | null;
  targetAchieved: boolean;
  currentKb: number;
  targetMaxKb: number | null;
  widthVal: number;
  heightVal: number;
  unit: UnitType;
  dpi: number;
  setQuality: React.Dispatch<React.SetStateAction<number>>;
}

export const ComplianceMetricsBar: React.FC<ComplianceMetricsBarProps> = ({
  sourceImage,
  targetAchieved,
  currentKb,
  targetMaxKb,
  widthVal,
  heightVal,
  unit,
  dpi,
  setQuality,
}) => {
  if (!sourceImage) return null;

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs ${
        targetAchieved
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
          : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300'
      }`}
    >
      <div className="flex items-center gap-2">
        {targetAchieved ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        )}
        <div>
          <span className="font-bold">File Size: {currentKb} KB</span>
          {targetMaxKb && (
            <span className="ml-1 text-[11px] opacity-90">
              (Limit: &lt; {targetMaxKb} KB)
            </span>
          )}
          <span className="mx-2 opacity-50">•</span>
          <span className="text-[11px]">
            {calculatePixels(widthVal, unit, dpi)} x {calculatePixels(heightVal, unit, dpi)} px ({dpi} DPI)
          </span>
        </div>
      </div>

      {!targetAchieved && (
        <button
          onClick={() => {
            setQuality((q) => Math.max(20, q - 15));
          }}
          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 text-[11px] font-semibold"
        >
          Compress More
        </button>
      )}
    </div>
  );
};
