import React from 'react';
import {
  Upload,
  Camera,
  Eye,
  Sliders,
  Columns,
  Scissors,
  Check,
  Loader2,
  Lock,
  Move,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PresetRequirement, UnitType } from '../../../types';
import { calculatePixels } from '../../../lib/image/resizeEngine';
import { getPresetAspectRatioDisplay } from '../../../config/presets';

interface EditorViewportProps {
  sourceImage: HTMLImageElement | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (file: File) => void;
  viewportMode: 'editor' | 'result' | 'compare';
  setViewportMode: (m: 'editor' | 'result' | 'compare') => void;
  cropActive: boolean;
  setCropActive: (a: boolean) => void;
  cropPreset: 'target' | '1:1' | '35:45' | '2:3' | 'free';
  applyCropPreset: (preset: 'target' | '1:1' | '35:45' | '2:3' | 'free') => void;
  isDragging: boolean;
  setIsDragging: (d: boolean) => void;
  originalSizeKb: number;
  originalDataUrl: string | null;
  currentKb: number;
  previewDataUrl: string | null;
  widthVal: number;
  heightVal: number;
  unit: UnitType;
  dpi: number;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  activePreset: PresetRequirement | null;
  cropRect: { x: number; y: number; w: number; h: number };
  handleCropPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  showFaceGuide: boolean;
  setShowFaceGuide: (s: boolean) => void;
}

export const EditorViewport: React.FC<EditorViewportProps> = ({
  sourceImage,
  fileInputRef,
  cameraInputRef,
  handleFileSelect,
  viewportMode,
  setViewportMode,
  cropActive,
  setCropActive,
  cropPreset,
  applyCropPreset,
  isDragging,
  setIsDragging,
  originalSizeKb,
  originalDataUrl,
  currentKb,
  previewDataUrl,
  widthVal,
  heightVal,
  unit,
  dpi,
  zoomLevel,
  setZoomLevel,
  activePreset,
  cropRect,
  handleCropPointerDown,
  showFaceGuide,
  setShowFaceGuide,
}) => {
  return (
    <>
      {/* Hidden File Inputs (Always Mounted in DOM) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      {/* Viewport Mode Switcher & Crop Toggle Header */}
      {sourceImage && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          {/* View Modes */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewportMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewportMode === 'editor'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Editor & Adjust</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewportMode('result');
                setCropActive(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewportMode === 'result'
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Result Preview</span>
              {currentKb > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                  {currentKb} KB
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewportMode('compare');
                setCropActive(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewportMode === 'compare'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Compare</span>
            </button>
          </div>

          {/* Crop & Frame Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !cropActive;
                setCropActive(next);
                if (next) {
                  setViewportMode('editor');
                  applyCropPreset(cropPreset);
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                cropActive
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
              }`}
            >
              <Scissors className="h-3.5 w-3.5" />
              <span>{cropActive ? 'Cropping Active' : 'Crop & Frame'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Canvas & Preview Wrapper */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && (file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name))) {
            handleFileSelect(file);
          }
        }}
        className={`relative flex flex-col items-center justify-center min-h-[420px] sm:min-h-[500px] rounded-2xl border-2 transition-all p-4 overflow-hidden shadow-inner ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
            : 'border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950'
        }`}
      >
        {sourceImage ? (
          viewportMode === 'compare' ? (
            /* Compare View: Side-by-side Before & After */
            <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 p-2">
              {/* Before: Original */}
              <div className="flex-1 flex flex-col items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-sm w-full">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Original Upload</span>
                  <span className="text-[11px] font-mono text-slate-500">{originalSizeKb} KB</span>
                </div>
                <div className="w-full h-52 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={originalDataUrl || sourceImage.src}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-500 font-mono text-center">
                  {sourceImage.naturalWidth} × {sourceImage.naturalHeight} px
                </div>
              </div>

              {/* After: Processed Result */}
              <div className="flex-1 flex flex-col items-center p-3 rounded-xl border-2 border-indigo-500/40 bg-white dark:bg-slate-900 shadow-md max-w-sm w-full">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Final Result (Anti-Stretch)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {currentKb} KB
                  </span>
                </div>
                <div className="w-full h-52 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-900">
                  {previewDataUrl ? (
                    <img
                      src={previewDataUrl}
                      alt="Result Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  )}
                </div>
                <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono text-center font-medium">
                  {calculatePixels(widthVal, unit, dpi)} × {calculatePixels(heightVal, unit, dpi)} px
                </div>
              </div>
            </div>
          ) : viewportMode === 'result' ? (
            /* Dedicated Result Preview View */
            <div className="w-full flex flex-col items-center space-y-4">
              <div className="relative flex items-center justify-center max-w-full max-h-[440px] overflow-auto rounded-xl shadow-xl border-2 border-emerald-500/30 transition-all bg-white dark:bg-slate-900">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Final Result Preview"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-h-[400px] w-auto h-auto object-contain block select-none pointer-events-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-12 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                    <span className="text-xs font-medium">Rendering final document...</span>
                  </div>
                )}
              </div>

              {/* Document Verification & Quality Specs Strip */}
              <div className="w-full max-w-lg p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">Pixels</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {calculatePixels(widthVal, unit, dpi)} × {calculatePixels(heightVal, unit, dpi)}
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">Physical Size</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {widthVal} × {heightVal} {unit}
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">File Size</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {currentKb} KB
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">DPI</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {dpi}
                  </span>
                </div>
              </div>
            </div>
          ) : cropActive ? (
            /* Crop Canvas View with Interactive Mask & Frame */
            <div className="relative flex items-center justify-center max-w-full max-h-[460px] overflow-hidden rounded-xl shadow-lg border border-indigo-400/50 bg-slate-900 select-none">
              <div className="relative inline-block select-none">
                <img
                  src={originalDataUrl || sourceImage.src}
                  alt="Crop Canvas"
                  className="max-h-[420px] max-w-full w-auto h-auto object-contain block select-none pointer-events-none"
                />

                {/* Draggable Crop Overlay Area */}
                <div
                  onPointerDown={handleCropPointerDown}
                  style={{
                    position: 'absolute',
                    left: `${cropRect.x * 100}%`,
                    top: `${cropRect.y * 100}%`,
                    width: `${cropRect.w * 100}%`,
                    height: `${cropRect.h * 100}%`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.60)',
                    cursor: 'move',
                  }}
                  className="border-2 border-white pointer-events-auto touch-none select-none transition-none shadow-2xl"
                  title="Click and drag anywhere on this frame to reposition the crop"
                >
                  {/* Rule of Thirds Grid */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div />
                  </div>

                  {/* Corner Accent Brackets */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />

                  {/* Active Dimensions & Fixed Ratio Badge */}
                  <div className="absolute -top-7 left-0 flex items-center gap-1.5 bg-black/85 text-white font-mono text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                    {activePreset && activePreset.id !== 'original' && (
                      <Lock className="h-2.5 w-2.5 text-indigo-400" />
                    )}
                    <span>
                      Crop: {Math.round(cropRect.w * sourceImage.naturalWidth)} × {Math.round(cropRect.h * sourceImage.naturalHeight)} px
                      {activePreset && activePreset.id !== 'original' ? ` (Fixed ${getPresetAspectRatioDisplay(activePreset)})` : ''}
                    </span>
                  </div>

                  {/* Drag Hint Indicator in Center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 hover:opacity-60 transition">
                    <Move className="h-5 w-5 text-white drop-shadow" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Interactive Live Viewport with Face Guide */
            <div className="relative flex items-center justify-center max-w-full max-h-[460px] overflow-auto rounded-xl shadow-lg border border-slate-300 dark:border-slate-700 transition-all bg-white dark:bg-slate-900">
              {/* Rendered Output Preview Image */}
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Document Preview"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-[420px] w-auto h-auto object-contain block select-none pointer-events-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 px-12 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                  <span className="text-xs font-medium">Processing document preview...</span>
                </div>
              )}

              {/* Biometric Face Guide Overlay (Passport / Visa) */}
              {showFaceGuide && activePreset?.category === 'passport' && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center border-2 border-indigo-500/30">
                  {/* Head Oval */}
                  <div className="w-[60%] h-[70%] rounded-full border-2 border-dashed border-indigo-500/70" />
                  {/* Horizontal Eye-level line */}
                  <div className="absolute top-[42%] left-0 right-0 border-b border-indigo-400/60" />
                  {/* Vertical Center line */}
                  <div className="absolute left-[50%] top-0 bottom-0 border-r border-indigo-400/60" />
                  <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                    Biometric Face Guide (50-70% Crown to Chin)
                  </span>
                </div>
              )}
            </div>
          )
        ) : (
          /* Empty State Upload Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 text-center max-w-md cursor-pointer group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Upload className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Photo, Signature or Document
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Drag and drop JPG, PNG, or WebP here, or click to browse. All processing happens 100% locally in your browser.
            </p>

            <div className="mt-5 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-semibold shadow-md shadow-indigo-500/20"
              >
                <Upload className="h-4 w-4" />
                <span>Choose File</span>
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 text-xs font-semibold hover:bg-slate-50"
              >
                <Camera className="h-4 w-4 text-indigo-500" />
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Viewport Control Bar */}
      {sourceImage && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-[10px]"
            >
              Reset
            </button>
          </div>

          {/* Toggles and Change Image Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
              title="Choose a different image file"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Change Image</span>
            </button>

            {activePreset?.category === 'passport' && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFaceGuide}
                  onChange={(e) => setShowFaceGuide(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Face Guides
                </span>
              </label>
            )}
          </div>
        </div>
      )}
    </>
  );
};
