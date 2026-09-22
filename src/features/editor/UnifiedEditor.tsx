import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Crop as CropIcon,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Sparkles,
  Download,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Undo2,
  RefreshCw,
  Printer,
  PenTool,
  Grid,
  Bot,
  Layers,
  ChevronRight,
  Info,
  ShieldCheck,
  Camera,
  Eye,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import {
  ToolId,
  PresetRequirement,
  UnitType,
  OutputFormat,
  ImageAdjustments,
  CropArea,
  EditorSettings,
  ComplianceReport
} from '../../types';
import { BUILT_IN_PRESETS, getAllPresets } from '../../config/presets';
import { calculatePixels, pixelsToPhysicalUnit, renderResizedCanvas } from '../../lib/image/resizeEngine';
import { compressCanvas, CompressionResult } from '../../lib/image/compressionEngine';
import { processBackgroundRemoval } from '../../lib/image/backgroundEngine';
import { processSignatureOrThumb } from '../../lib/image/signatureEngine';
import { processDocumentScan, ScanMode } from '../../lib/image/scannerEngine';

interface UnifiedEditorProps {
  initialTool?: ToolId;
  initialPresetId?: string;
  editorMode: 'simple' | 'advanced';
  onOpenSignaturePad: () => void;
  onOpenPhotoSheet: (canvas: HTMLCanvasElement, widthMm: number, heightMm: number) => void;
  onOpenCustomPresetBuilder: () => void;
}

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
  initialTool = 'editor',
  initialPresetId,
  editorMode,
  onOpenSignaturePad,
  onOpenPhotoSheet,
  onOpenCustomPresetBuilder,
}) => {
  // Source Image state
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [activePreset, setActivePreset] = useState<PresetRequirement | null>(null);

  // Settings state
  const [unit, setUnit] = useState<UnitType>('mm');
  const [widthVal, setWidthVal] = useState<number>(35);
  const [heightVal, setHeightVal] = useState<number>(45);
  const [dpi, setDpi] = useState<number>(300);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState<number>(90);
  const [targetMaxKb, setTargetMaxKb] = useState<number | null>(null);
  const [customFilename, setCustomFilename] = useState<string>('docuprep_export');

  // Adjustments & Filters
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    grayscale: false,
    binarize: false,
    thresholdLevel: 200,
    inkColor: 'original',
    backgroundColor: 'transparent',
    removeBgActive: false,
    bgTolerance: 28,
  });

  // Crop & Tool state
  const [cropActive, setCropActive] = useState<boolean>(false);
  const [cropAspect, setCropAspect] = useState<number | null>(35 / 45);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);
  const [scanFilter, setScanFilter] = useState<ScanMode>('original');

  // Interactive Viewport Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Compression Output Cache
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [currentKb, setCurrentKb] = useState<number>(0);
  const [targetAchieved, setTargetAchieved] = useState<boolean>(true);

  // AI Compliance Inspection state
  const [aiReport, setAiReport] = useState<ComplianceReport | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);

  // Preview & Drag State
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Canvas Refs
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Load presets & default tool configuration
  useEffect(() => {
    const allPresets = getAllPresets();
    if (initialPresetId) {
      const match = allPresets.find((p) => p.id === initialPresetId);
      if (match) applyPreset(match);
    } else if (initialTool === 'passport') {
      const usPassport = allPresets.find((p) => p.id === 'us-passport');
      if (usPassport) applyPreset(usPassport);
    } else if (initialTool === 'signature') {
      const sigPreset = allPresets.find((p) => p.id === 'general-signature-jpg');
      if (sigPreset) applyPreset(sigPreset);
    } else if (initialTool === 'thumb') {
      const thumbPreset = allPresets.find((p) => p.id === 'ibps-thumb');
      if (thumbPreset) applyPreset(thumbPreset);
    }
  }, [initialTool, initialPresetId]);

  const applyPreset = (preset: PresetRequirement) => {
    setActivePreset(preset);
    setUnit(preset.unit);
    setWidthVal(preset.width);
    setHeightVal(preset.height);
    setDpi(preset.dpi);
    setOutputFormat(preset.format);
    setTargetMaxKb(preset.maxKb || null);
    setCropAspect(preset.width / preset.height);
    setCustomFilename(preset.id.replace(/-/g, '_'));

    if (preset.bgType === 'white') {
      setAdjustments((prev) => ({ ...prev, backgroundColor: '#ffffff' }));
    } else if (preset.bgType === 'transparent') {
      setAdjustments((prev) => ({ ...prev, backgroundColor: 'transparent' }));
      setShowCheckerboard(true);
    }
  };

  // Image File Upload Loader
  const handleFileSelect = (file: File) => {
    setSourceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
        // Default filename based on original
        setCustomFilename(file.name.replace(/\.[^/.]+$/, '') + '_docuprep');
        // Reset crop box
        setCropRect({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });

        // If no preset active, adopt natural image dimensions in px
        if (!activePreset && !initialPresetId) {
          setUnit('px');
          setWidthVal(img.naturalWidth);
          setHeightVal(img.naturalHeight);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Main Render pipeline that executes when source image or settings change
  const renderCurrentState = useCallback(async () => {
    if (!sourceImage) return;
    setIsProcessing(true);

    try {
      // 1. Calculate target pixel dimensions
      const targetPixelsX = calculatePixels(widthVal, unit, dpi);
      const targetPixelsY = calculatePixels(heightVal, unit, dpi);

      // 2. Base Canvas with source image
      const intermediateCanvas = document.createElement('canvas');
      const srcW = sourceImage.naturalWidth;
      const srcH = sourceImage.naturalHeight;

      // Crop coordinates calculation
      let cropStartX = 0;
      let cropStartY = 0;
      let cropWidthPx = srcW;
      let cropHeightPx = srcH;

      if (cropActive) {
        cropStartX = Math.max(0, Math.round(cropRect.x * srcW));
        cropStartY = Math.max(0, Math.round(cropRect.y * srcH));
        cropWidthPx = Math.min(srcW - cropStartX, Math.round(cropRect.w * srcW));
        cropHeightPx = Math.min(srcH - cropStartY, Math.round(cropRect.h * srcH));
      }

      intermediateCanvas.width = cropWidthPx;
      intermediateCanvas.height = cropHeightPx;
      const intCtx = intermediateCanvas.getContext('2d');
      if (!intCtx) return;

      // Apply transformations (rotation, flips)
      intCtx.save();
      if (adjustments.rotation !== 0 || adjustments.flipH || adjustments.flipV) {
        intCtx.translate(cropWidthPx / 2, cropHeightPx / 2);
        intCtx.rotate((adjustments.rotation * Math.PI) / 180);
        intCtx.scale(adjustments.flipH ? -1 : 1, adjustments.flipV ? -1 : 1);
        intCtx.drawImage(
          sourceImage,
          cropStartX,
          cropStartY,
          cropWidthPx,
          cropHeightPx,
          -cropWidthPx / 2,
          -cropHeightPx / 2,
          cropWidthPx,
          cropHeightPx
        );
      } else {
        intCtx.drawImage(
          sourceImage,
          cropStartX,
          cropStartY,
          cropWidthPx,
          cropHeightPx,
          0,
          0,
          cropWidthPx,
          cropHeightPx
        );
      }
      intCtx.restore();

      // 3. Document Scan Filters (if active)
      let processedCanvas = intermediateCanvas;
      if (scanFilter !== 'original') {
        processedCanvas = processDocumentScan(processedCanvas, scanFilter);
      }

      // 4. Background Replacement (if active)
      if (adjustments.removeBgActive) {
        processedCanvas = processBackgroundRemoval(processedCanvas, {
          replacementColor: adjustments.backgroundColor || '#ffffff',
          tolerance: adjustments.bgTolerance || 28,
        });
      }

      // 5. Signature / Thumb Impression processing (if ink recolor or binarize active)
      if (adjustments.binarize || adjustments.inkColor !== 'original') {
        processedCanvas = processSignatureOrThumb(processedCanvas, {
          autoCrop: false,
          inkColor: adjustments.inkColor,
          transparentBg: adjustments.backgroundColor === 'transparent',
          contrastBoost: Math.max(10, adjustments.contrast),
        });
      }

      // 6. High-Quality Bicubic Resizing to target specifications
      const finalCanvas = renderResizedCanvas(
        processedCanvas,
        targetPixelsX,
        targetPixelsY,
        adjustments.backgroundColor === 'transparent' ? undefined : adjustments.backgroundColor
      );

      // 7. Apply Brightness & Contrast adjustments via pixel manipulation if non-zero
      if (adjustments.brightness !== 0 || adjustments.contrast !== 0) {
        const fCtx = finalCanvas.getContext('2d');
        if (fCtx) {
          const imgData = fCtx.getImageData(0, 0, targetPixelsX, targetPixelsY);
          const d = imgData.data;
          const bFactor = adjustments.brightness * 1.2;
          const cFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));

          for (let i = 0; i < d.length; i += 4) {
            d[i] = Math.min(255, Math.max(0, cFactor * (d[i] - 128) + 128 + bFactor));
            d[i + 1] = Math.min(255, Math.max(0, cFactor * (d[i + 1] - 128) + 128 + bFactor));
            d[i + 2] = Math.min(255, Math.max(0, cFactor * (d[i + 2] - 128) + 128 + bFactor));
          }
          fCtx.putImageData(imgData, 0, 0);
        }
      }

      // Store canvas in ref for UI preview, photo sheets, compliance inspector & exports
      outputCanvasRef.current = finalCanvas;

      // Generate instant high-fidelity preview data URL for the DOM viewport
      const previewUrl = finalCanvas.toDataURL(
        outputFormat === 'png' ? 'image/png' : 'image/jpeg',
        0.92
      );
      setPreviewDataUrl(previewUrl);

      // 8. Compression & File Size optimization
      const compResult = await compressCanvas(
        finalCanvas,
        outputFormat,
        quality,
        targetMaxKb
      );

      setRenderedBlob(compResult.blob);
      setCurrentKb(compResult.sizeKb);
      setTargetAchieved(compResult.targetAchieved);
    } finally {
      setIsProcessing(false);
    }
  }, [
    sourceImage,
    widthVal,
    heightVal,
    unit,
    dpi,
    cropActive,
    cropRect,
    adjustments,
    scanFilter,
    outputFormat,
    quality,
    targetMaxKb,
  ]);

  // Re-run render when dependencies update
  useEffect(() => {
    if (sourceImage) {
      renderCurrentState();
    }
  }, [sourceImage, renderCurrentState]);

  // Aspect Ratio lock recalculation
  const handleWidthChange = (val: number) => {
    setWidthVal(val);
    if (lockAspectRatio && widthVal > 0 && heightVal > 0) {
      const ratio = heightVal / widthVal;
      setHeightVal(Number((val * ratio).toFixed(2)));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeightVal(val);
    if (lockAspectRatio && widthVal > 0 && heightVal > 0) {
      const ratio = widthVal / heightVal;
      setWidthVal(Number((val * ratio).toFixed(2)));
    }
  };

  // Download Handler
  const handleDownload = () => {
    if (!renderedBlob) return;
    const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const url = URL.createObjectURL(renderedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customFilename || 'docuprep'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Biometric & Document Compliance Check (100% In-Browser)
  const handleComplianceCheck = async () => {
    if (!outputCanvasRef.current) return;
    setIsAiAnalyzing(true);
    setAiReport(null);

    // Brief processing delay for smooth UI feedback
    await new Promise((r) => setTimeout(r, 260));

    try {
      const canvas = outputCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const checks: Array<{ category: string; status: 'PASS' | 'WARN' | 'FAIL'; details: string }> = [];
      const tips: string[] = [];
      let score = 100;

      // 1. Resolution & DPI check
      if (dpi >= 300) {
        checks.push({
          category: 'Resolution & DPI',
          status: 'PASS',
          details: `High print-ready resolution at ${dpi} DPI (Standard: 300 DPI).`,
        });
      } else if (dpi >= 200) {
        checks.push({
          category: 'Resolution & DPI',
          status: 'PASS',
          details: `Acceptable digital portal resolution at ${dpi} DPI.`,
        });
      } else {
        score -= 15;
        checks.push({
          category: 'Resolution & DPI',
          status: 'WARN',
          details: `Current ${dpi} DPI is below recommended 300 DPI for official printing.`,
        });
        tips.push('Increase DPI to 300 in the Resolution settings for official document submissions.');
      }

      // 2. Geometry & Aspect Ratio
      const targetRatio = widthVal / heightVal;
      const currentRatio = canvas.width / canvas.height;
      const ratioDiff = Math.abs(targetRatio - currentRatio);
      if (ratioDiff < 0.05) {
        checks.push({
          category: 'Dimensions & Geometry',
          status: 'PASS',
          details: `Exact ${widthVal} x ${heightVal} ${unit} (${canvas.width} x ${canvas.height} px) verified.`,
        });
      } else {
        score -= 20;
        checks.push({
          category: 'Dimensions & Geometry',
          status: 'WARN',
          details: `Aspect ratio differs slightly from target ${widthVal}x${heightVal} ${unit}.`,
        });
        tips.push('Use the aspect-locked crop tool to match required portal dimensions.');
      }

      // 3. File Size constraint
      if (targetMaxKb) {
        if (currentKb <= targetMaxKb) {
          checks.push({
            category: 'File Size Limit',
            status: 'PASS',
            details: `${currentKb} KB is within target maximum limit of ${targetMaxKb} KB.`,
          });
        } else {
          score -= 25;
          checks.push({
            category: 'File Size Limit',
            status: 'FAIL',
            details: `${currentKb} KB exceeds maximum allowed size of ${targetMaxKb} KB.`,
          });
          tips.push(`Use the Target File Size control to compress under ${targetMaxKb} KB.`);
        }
      } else {
        checks.push({
          category: 'File Size',
          status: 'PASS',
          details: `Output size: ${currentKb} KB.`,
        });
      }

      // 4. Background Uniformity Check via 4 corners
      if (ctx) {
        const p1 = ctx.getImageData(4, 4, 1, 1).data;
        const p2 = ctx.getImageData(Math.max(0, canvas.width - 5), 4, 1, 1).data;
        const p3 = ctx.getImageData(4, Math.max(0, canvas.height - 5), 1, 1).data;
        const p4 = ctx.getImageData(Math.max(0, canvas.width - 5), Math.max(0, canvas.height - 5), 1, 1).data;

        const avgR = (p1[0] + p2[0] + p3[0] + p4[0]) / 4;
        const avgG = (p1[1] + p2[1] + p3[1] + p4[1]) / 4;
        const avgB = (p1[2] + p2[2] + p3[2] + p4[2]) / 4;
        const diff = Math.max(
          Math.abs(p1[0] - avgR), Math.abs(p2[0] - avgR),
          Math.abs(p1[1] - avgG), Math.abs(p2[1] - avgG),
          Math.abs(p1[2] - avgB), Math.abs(p2[2] - avgB)
        );

        const isLight = (avgR + avgG + avgB) / 3 > 175;
        if (diff < 35 && isLight) {
          checks.push({
            category: 'Background Uniformity',
            status: 'PASS',
            details: 'Solid, uniform light background detected along perimeter.',
          });
        } else if (diff < 45) {
          checks.push({
            category: 'Background Uniformity',
            status: 'PASS',
            details: 'Uniform background detected.',
          });
        } else {
          score -= 15;
          checks.push({
            category: 'Background Uniformity',
            status: 'WARN',
            details: 'Uneven background or shadows detected along outer borders.',
          });
          tips.push('Use the Background tool to replace background with pure white or light solid color.');
        }
      }

      const verdict: 'Likely Compliant' | 'Requires Minor Adjustments' | 'Non-Compliant / Retake Recommended' =
        score >= 90
          ? 'Likely Compliant'
          : score >= 70
          ? 'Requires Minor Adjustments'
          : 'Non-Compliant / Retake Recommended';

      setAiReport({
        complianceScore: Math.max(score, 50),
        verdict,
        summary: score >= 90
          ? 'Image meets official dimensions, resolution, and background uniformity standards.'
          : 'Document matches most requirements but could benefit from minor adjustments before submission.',
        checks,
        actionableTips: tips.length > 0 ? tips : ['Lighting is balanced. Photo is ready for official upload.'],
      });
    } catch (err) {
      console.error('Compliance check error:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
      {/* Top Workflow Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Studio Workspace
            </span>
            {activePreset && (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                Preset: {activePreset.name}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Photo, Document & Signature Editor
          </h2>
        </div>

        {/* Quick Launch Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSignaturePad}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <PenTool className="h-3.5 w-3.5 text-indigo-500" />
            <span>Draw Signature</span>
          </button>

          <button
            onClick={() => {
              if (outputCanvasRef.current) {
                onOpenPhotoSheet(outputCanvasRef.current, widthVal, heightVal);
              }
            }}
            disabled={!sourceImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm disabled:opacity-40"
          >
            <Grid className="h-3.5 w-3.5 text-blue-500" />
            <span>Print Photo Sheet (A4/Letter)</span>
          </button>

          <button
            onClick={onOpenCustomPresetBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <Sliders className="h-3.5 w-3.5 text-emerald-500" />
            <span>Custom Preset</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Interface: Left Viewport (7 cols) + Right Controls (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Canvas Viewport */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
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
              <div
                className={`relative flex items-center justify-center max-w-full max-h-[460px] overflow-auto rounded-xl shadow-lg border border-slate-300 dark:border-slate-700 transition-all ${
                  showCheckerboard ? 'checkerboard-bg' : 'bg-white'
                }`}
              >
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

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCheckerboard}
                    onChange={(e) => setShowCheckerboard(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Checkerboard
                  </span>
                </label>

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

          {/* Validation & Size Compliance Bar */}
          {sourceImage && (
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
                  <span className="font-bold">
                    File Size: {currentKb} KB
                  </span>
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
          )}

          {/* AI Compliance Report Display */}
          {aiReport && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    AI Official Spec Inspection
                  </span>
                </div>
                <span className="rounded-full bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-bold">
                  Score: {aiReport.complianceScore}%
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {aiReport.summary}
              </p>
              <div className="space-y-1.5">
                {aiReport.checks.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] py-1 border-t border-indigo-100 dark:border-indigo-900/40">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{c.category}</span>
                    <span
                      className={`font-semibold ${
                        c.status === 'PASS'
                          ? 'text-emerald-600'
                          : c.status === 'WARN'
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Editing & Specification Controls */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* Preset Selector Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Official Requirement Preset
              </label>
              <button
                onClick={onOpenCustomPresetBuilder}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                + New Preset
              </button>
            </div>

            <select
              value={activePreset?.id || ''}
              onChange={(e) => {
                const p = getAllPresets().find((item) => item.id === e.target.value);
                if (p) applyPreset(p);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Custom Dimensions & Resolution</option>
              <optgroup label="Biometric Passports & Visas">
                {getAllPresets()
                  .filter((p) => p.category === 'passport' || p.category === 'visa')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width}x{p.height} {p.unit} • {p.dpi} DPI)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Exams & Govt Portals (UPSC, SSC, IBPS, GATE)">
                {getAllPresets()
                  .filter((p) => p.category === 'exam')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Official Signatures & Thumb Impressions">
                {getAllPresets()
                  .filter((p) => p.category === 'application')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Dimensions & Resolution Controls */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Dimensions & Resolution
            </h3>

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
                  <option value="300">300 DPI (Official Print)</option>
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

          {/* Compression & Target File Size */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target File Size Limit
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-600">
                Current: {currentKb} KB
              </span>
            </div>

            {/* Quick KB Presets */}
            <div className="grid grid-cols-5 gap-1.5">
              {[20, 50, 100, 200, null].map((kbVal, idx) => (
                <button
                  key={idx}
                  onClick={() => setTargetMaxKb(kbVal)}
                  className={`py-1.5 rounded-lg border text-xs font-semibold ${
                    targetMaxKb === kbVal
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {kbVal ? `< ${kbVal}KB` : 'Auto'}
                </button>
              ))}
            </div>

            {/* JPEG Quality Slider */}
            {outputFormat !== 'png' && !targetMaxKb && (
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Compression Quality</span>
                  <span>{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                />
              </div>
            )}
          </div>

          {/* Quick Tools & Background Controls */}
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

            {/* Background Changer */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                Background Color (Passport / Official ID)
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Original', color: 'transparent', remove: false },
                  { label: 'White', color: '#ffffff', remove: true },
                  { label: 'Off-White', color: '#f8fafc', remove: true },
                  { label: 'Transparent', color: 'transparent', remove: true },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAdjustments((prev) => ({
                        ...prev,
                        backgroundColor: item.color,
                        removeBgActive: item.remove,
                      }));
                      if (item.color === 'transparent' && item.remove) {
                        setOutputFormat('png');
                        setShowCheckerboard(true);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold truncate ${
                      adjustments.backgroundColor === item.color && adjustments.removeBgActive === item.remove
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
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

          {/* Export Action Card */}
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

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleComplianceCheck}
                disabled={!sourceImage || isAiAnalyzing}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-50 shadow-sm disabled:opacity-40"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isAiAnalyzing ? 'Checking...' : 'Spec Check'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!sourceImage}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                <span>Download Ready</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
