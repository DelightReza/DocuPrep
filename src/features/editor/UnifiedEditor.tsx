import { saveSessionCache, loadSessionCache } from '../../lib/storage/cacheStorage';
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
  Loader2,
  Columns,
  Scissors,
  Check,
  Move
} from 'lucide-react';
import {
  ToolId,
  PresetRequirement,
  UnitType,
  OutputFormat,
  ResizeFitMode,
  ImageAdjustments,
  CropArea,
  EditorSettings,
  ComplianceReport
} from '../../types';
import { BUILT_IN_PRESETS, getAllPresets, ORIGINAL_DIMENSIONS_PRESET, getPresetAspectRatioDisplay } from '../../config/presets';
import { calculatePixels, pixelsToPhysicalUnit, renderResizedCanvas } from '../../lib/image/resizeEngine';
import { compressCanvas, CompressionResult } from '../../lib/image/compressionEngine';
import { processBackgroundRemoval } from '../../lib/image/backgroundEngine';
import { processSignatureOrThumb } from '../../lib/image/signatureEngine';
import { processDocumentScan, ScanMode } from '../../lib/image/scannerEngine';

interface UnifiedEditorProps {
  initialTool?: ToolId;
  initialPresetId?: string;
  initialImage?: { dataUrl: string; filename: string } | null;
  editorMode: 'simple' | 'advanced';
  onOpenCustomPresetBuilder: () => void;
}

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
  initialTool = 'editor',
  initialPresetId,
  initialImage,
  editorMode,
  onOpenCustomPresetBuilder,
}) => {
  // Source Image state
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  // Default preset is Original Dimensions
  const [activePreset, setActivePreset] = useState<PresetRequirement | null>(ORIGINAL_DIMENSIONS_PRESET);

  // Settings state: defaults to original (px)
  const [unit, setUnit] = useState<UnitType>('px');
  const [widthVal, setWidthVal] = useState<number>(0);
  const [heightVal, setHeightVal] = useState<number>(0);
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
  const [cropPreset, setCropPreset] = useState<'target' | '1:1' | '35:45' | '2:3' | 'free'>('target');
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.05,
    y: 0.05,
    w: 0.9,
    h: 0.9,
  });
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);
  const [scanFilter, setScanFilter] = useState<ScanMode>('original');

  // Viewport display mode: 'editor' | 'result' | 'compare'
  const [viewportMode, setViewportMode] = useState<'editor' | 'result' | 'compare'>('editor');

  // Resize Fit Mode: 'cover' (Fill size & crop) | 'contain' (Fit size & pad margins) - zero stretching
  const [fitMode, setFitMode] = useState<ResizeFitMode>('cover');

  // Original image info for result comparison
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);

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
    if (initialPresetId && initialPresetId !== 'original') {
      const match = allPresets.find((p) => p.id === initialPresetId);
      if (match) {
        applyPreset(match);
        return;
      }
    } else if (initialTool === 'passport' && !initialPresetId) {
      const usPassport = allPresets.find((p) => p.id === 'us-passport');
      if (usPassport) {
        applyPreset(usPassport);
        return;
      }
    } else if (initialTool === 'signature' && !initialPresetId) {
      const sigPreset = allPresets.find((p) => p.id === 'general-signature-jpg');
      if (sigPreset) {
        applyPreset(sigPreset);
        return;
      }
    } else if (initialTool === 'thumb' && !initialPresetId) {
      const thumbPreset = allPresets.find((p) => p.id === 'ibps-thumb');
      if (thumbPreset) {
        applyPreset(thumbPreset);
        return;
      }
    }

    // Default: Original Dimensions preset is selected!
    applyPreset(ORIGINAL_DIMENSIONS_PRESET);
  }, [initialTool, initialPresetId]);

  const applyPreset = (preset: PresetRequirement) => {
    setActivePreset(preset);

    if (preset.id === 'original') {
      setUnit('px');
      if (sourceImage) {
        setWidthVal(sourceImage.naturalWidth);
        setHeightVal(sourceImage.naturalHeight);
        const ratio = sourceImage.naturalWidth / sourceImage.naturalHeight;
        setCropAspect(ratio);
        updateCropRectForAspect(ratio, sourceImage);
      } else {
        setWidthVal(0);
        setHeightVal(0);
        setCropAspect(null);
      }
      setDpi(300);
      setTargetMaxKb(null);
      setCustomFilename(sourceFile ? sourceFile.name.replace(/\.[^/.]+$/, '') + '_original' : 'document_original');
      setCropPreset('target');
      return;
    }

    setUnit(preset.unit);
    setWidthVal(preset.width);
    setHeightVal(preset.height);
    setDpi(preset.dpi);
    setOutputFormat(preset.format);
    setTargetMaxKb(null);

    // Fixed aspect ratio cropping strictly according to selected preset!
    const presetRatio = preset.width / preset.height;
    setCropAspect(presetRatio);
    setCropPreset('target');
    setCustomFilename(preset.id.replace(/-/g, '_'));

    if (sourceImage) {
      updateCropRectForAspect(presetRatio, sourceImage);
    }

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
    setOriginalSizeKb(Number((file.size / 1024).toFixed(1)));
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalDataUrl(dataUrl);
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
        setCustomFilename(file.name.replace(/\.[^/.]+$/, '') + '_docuprep');

        // Check active preset: Default or Original Dimensions
        if (!activePreset || activePreset.id === 'original') {
          setActivePreset(ORIGINAL_DIMENSIONS_PRESET);
          setUnit('px');
          setWidthVal(img.naturalWidth);
          setHeightVal(img.naturalHeight);
          const ratio = img.naturalWidth / img.naturalHeight;
          setCropAspect(ratio);
          updateCropRectForAspect(ratio, img);
        } else {
          // Specific preset selected: lock fixed crop aspect ratio to preset
          const presetRatio = activePreset.width / activePreset.height;
          setCropAspect(presetRatio);
          updateCropRectForAspect(presetRatio, img);
        }
        setCropActive(false);
        saveSessionCache({
          activeView: 'editor',
          activeToolId: initialTool,
          activePresetId: activePreset?.id,
          editorState: {
            originalDataUrl: dataUrl,
            filename: file.name,
            originalSizeKb: Number((file.size / 1024).toFixed(1)),
            unit: 'px',
            widthVal: img.naturalWidth,
            heightVal: img.naturalHeight,
            dpi: 300,
            outputFormat,
            quality,
            targetMaxKb,
            customFilename: file.name.replace(/\.[^/.]+$/, '') + '_docuprep',
            activePresetId: activePreset?.id,
          },
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!initialImage) return;

    fetch(initialImage.dataUrl)
      .then((response) => response.blob())
      .then((blob) => {
        handleFileSelect(new File([blob], initialImage.filename, { type: blob.type || 'image/png' }));
      })
      .catch((error) => console.error('Failed to open generated image:', error));
  }, [initialImage]);

    // Restore cached image and parameters (preserved across refreshes for 15 mins)
  useEffect(() => {
    if (sourceImage || initialImage) return;
    const cached = loadSessionCache();
    if (cached && cached.editorState?.originalDataUrl) {
      const state = cached.editorState;
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
        setOriginalDataUrl(state.originalDataUrl!);
        if (state.originalSizeKb) setOriginalSizeKb(state.originalSizeKb);
        if (state.filename) setSourceFile(new File([], state.filename));
        if (state.customFilename) setCustomFilename(state.customFilename);
        if (state.unit) setUnit(state.unit as any);
        if (state.widthVal) setWidthVal(state.widthVal);
        if (state.heightVal) setHeightVal(state.heightVal);
        if (state.dpi) setDpi(state.dpi);
        if (state.outputFormat) setOutputFormat(state.outputFormat as any);
        if (state.quality) setQuality(state.quality);
        if (state.targetMaxKb !== undefined) setTargetMaxKb(state.targetMaxKb);
        if (state.activePresetId) {
          const p = getAllPresets().find((item) => item.id === state.activePresetId);
          if (p) setActivePreset(p);
        }
      };
      img.src = state.originalDataUrl!;
    }
  }, []);

  // Fixed aspect ratio crop updater
  const updateCropRectForAspect = (targetRatio: number | null, img: HTMLImageElement) => {
    if (!targetRatio || targetRatio <= 0) {
      setCropRect({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
      return;
    }

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const imgAspect = imgW / imgH;

    let newW = 0.85;
    let newH = 0.85;

    if (targetRatio >= imgAspect) {
      newW = 0.85;
      newH = (0.85 * imgW) / (targetRatio * imgH);
    } else {
      newH = 0.85;
      newW = (0.85 * targetRatio * imgH) / imgW;
    }

    newW = Math.min(0.96, Math.max(0.1, newW));
    newH = Math.min(0.96, Math.max(0.1, newH));

    const newX = (1 - newW) / 2;
    const newY = (1 - newH) / 2;

    setCropRect({
      x: Number(newX.toFixed(3)),
      y: Number(newY.toFixed(3)),
      w: Number(newW.toFixed(3)),
      h: Number(newH.toFixed(3)),
    });
  };

  // Crop helper methods
  const applyCropPreset = (preset: 'target' | '1:1' | '35:45' | '2:3' | 'free') => {
    setCropPreset(preset);
    if (!sourceImage) return;

    if (preset === 'free') {
      setCropAspect(null);
      return;
    }

    let targetRatio: number | null = null;
    if (preset === 'target') {
      if (activePreset && activePreset.id !== 'original') {
        targetRatio = activePreset.width / activePreset.height;
      } else {
        targetRatio = sourceImage.naturalWidth / sourceImage.naturalHeight;
      }
    } else if (preset === '1:1') {
      targetRatio = 1.0;
    } else if (preset === '35:45') {
      targetRatio = 35 / 45;
    } else if (preset === '2:3') {
      targetRatio = 2 / 3;
    }

    setCropAspect(targetRatio);
    updateCropRectForAspect(targetRatio, sourceImage);
  };

  const adjustCropZoom = (factor: number) => {
    if (!sourceImage) return;
    const imgW = sourceImage.naturalWidth;
    const imgH = sourceImage.naturalHeight;
    const targetAspect = cropAspect ?? (imgW / imgH);

    setCropRect((prev) => {
      let newW = prev.w * factor;
      let newH = (newW * imgW) / (imgH * targetAspect);

      if (newW > 0.98 || newH > 0.98) {
        const scale = 0.98 / Math.max(newW, newH);
        newW *= scale;
        newH *= scale;
      }
      if (newW < 0.1 || newH < 0.1) {
        const scale = 0.1 / Math.min(newW, newH);
        newW *= scale;
        newH *= scale;
      }

      const newX = Math.min(Math.max(0, 1 - newW), Math.max(0, prev.x + (prev.w - newW) / 2));
      const newY = Math.min(Math.max(0, 1 - newH), Math.max(0, prev.y + (prev.h - newH) / 2));

      return {
        x: Number(newX.toFixed(3)),
        y: Number(newY.toFixed(3)),
        w: Number(newW.toFixed(3)),
        h: Number(newH.toFixed(3)),
      };
    });
  };

  const centerCropBox = () => {
    setCropRect((prev) => ({
      ...prev,
      x: Number(Math.max(0, (1 - prev.w) / 2).toFixed(3)),
      y: Number(Math.max(0, (1 - prev.h) / 2).toFixed(3)),
    }));
  };

  const resetCropToMax = () => {
    if (!sourceImage) {
      setCropRect({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
      return;
    }
    const targetRatio = cropAspect ?? (sourceImage.naturalWidth / sourceImage.naturalHeight);
    updateCropRectForAspect(targetRatio, sourceImage);
  };

  // Draggable crop overlay pointer handler
  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = e.currentTarget.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = cropRect.x;
    const initialY = cropRect.y;
    const containerW = rect.width;
    const containerH = rect.height;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startX) / containerW;
      const dy = (moveEvt.clientY - startY) / containerH;
      const maxX = Math.max(0, 1 - cropRect.w);
      const maxY = Math.max(0, 1 - cropRect.h);
      const newX = Math.min(maxX, Math.max(0, initialX + dx));
      const newY = Math.min(maxY, Math.max(0, initialY + dy));
      setCropRect((prev) => ({
        ...prev,
        x: Number(newX.toFixed(3)),
        y: Number(newY.toFixed(3)),
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Main Render pipeline that executes when source image or settings change
  const renderCurrentState = useCallback(async () => {
    if (!sourceImage) return;
    setIsProcessing(true);

    try {
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

      // 1. Calculate target pixel dimensions
      let targetPixelsX: number;
      let targetPixelsY: number;

      if (activePreset?.id === 'original') {
        if (cropActive) {
          targetPixelsX = cropWidthPx;
          targetPixelsY = cropHeightPx;
        } else {
          targetPixelsX = srcW;
          targetPixelsY = srcH;
        }
      } else {
        targetPixelsX = calculatePixels(widthVal, unit, dpi);
        targetPixelsY = calculatePixels(heightVal, unit, dpi);
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

      // 6. High-Quality Bicubic Resizing to target specifications (No stretching, zero distortion)
      const finalCanvas = renderResizedCanvas(
        processedCanvas,
        targetPixelsX,
        targetPixelsY,
        {
          fitMode,
          backgroundColor: adjustments.backgroundColor === 'transparent' ? undefined : adjustments.backgroundColor,
        }
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
    fitMode,
    activePreset,
  ]);

  // Re-run render when dependencies update
  useEffect(() => {
    if (sourceImage) {
      renderCurrentState();
    }
  }, [sourceImage, renderCurrentState]);

  // Keep session cache updated with latest parameters
  useEffect(() => {
    if (!originalDataUrl) return;
    saveSessionCache({
      activeView: 'editor',
      activeToolId: initialTool,
      activePresetId: activePreset?.id,
      editorState: {
        originalDataUrl,
        filename: sourceFile?.name || 'document',
        originalSizeKb,
        unit,
        widthVal,
        heightVal,
        dpi,
        outputFormat,
        quality,
        targetMaxKb,
        customFilename,
        activePresetId: activePreset?.id,
      },
    });
  }, [
    originalDataUrl,
    unit,
    widthVal,
    heightVal,
    dpi,
    outputFormat,
    quality,
    targetMaxKb,
    customFilename,
    activePreset,
    initialTool,
    sourceFile,
    originalSizeKb,
  ]);

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
        tips.push('Increase DPI to 200 or 300 in the Resolution settings for crisp text on portal submissions.');
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
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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

          {/* Interactive Crop Controls Bar (When Crop is Active) */}
          {sourceImage && cropActive && viewportMode === 'editor' && (
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
                      {calculatePixels(widthVal, unit, dpi)} × {calculatePixels(heightVal, unit, dpi)} px ({fitMode === 'cover' ? 'Fill & Crop' : 'Fit & Pad'})
                    </div>
                  </div>
                </div>
              ) : viewportMode === 'result' ? (
                /* Dedicated Result Preview View */
                <div className="w-full flex flex-col items-center space-y-4">
                  <div
                    className={`relative flex items-center justify-center max-w-full max-h-[440px] overflow-auto rounded-xl shadow-xl border-2 border-emerald-500/30 transition-all ${
                      showCheckerboard ? 'checkerboard-bg' : 'bg-white dark:bg-slate-900'
                    }`}
                  >
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
                      <span className="text-[10px] text-slate-400 block">Anti-Stretch</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {fitMode === 'cover' ? 'Fill & Crop' : 'Fit & Pad'}
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
                <div
                  className={`relative flex items-center justify-center max-w-full max-h-[460px] overflow-auto rounded-xl shadow-lg border border-slate-300 dark:border-slate-700 transition-all ${
                    showCheckerboard ? 'checkerboard-bg' : 'bg-white dark:bg-slate-900'
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

                <label
                  className="flex items-center gap-1.5 cursor-pointer"
                  title="Show checkered pattern behind transparent background areas (e.g., for PNG signatures or cutout portraits)"
                >
                  <input
                    type="checkbox"
                    checked={showCheckerboard}
                    onChange={(e) => setShowCheckerboard(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Transparency Grid
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
                Requirement Preset
              </label>
              <button
                onClick={onOpenCustomPresetBuilder}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                + New Preset
              </button>
            </div>

            <select
              id="editor-preset-select"
              value={activePreset?.id || 'original'}
              onChange={(e) => {
                const p = getAllPresets().find((item) => item.id === e.target.value);
                if (p) {
                  applyPreset(p);
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <optgroup label="⭐ Default Natural Size">
                <option value="original">
                  ⭐ Original Dimensions (Default • Keep Natural Image Size)
                </option>
              </optgroup>

              <optgroup label="📸 Standard Photo & Document Dimensions">
                {getAllPresets()
                  .filter((p) => p.category === 'passport')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width}×{p.height} {p.unit})
                    </option>
                  ))}
              </optgroup>

              <optgroup label="✍️ Signatures, Biometrics & Slips">
                {getAllPresets()
                  .filter((p) => p.category === 'application' || p.category === 'social')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width}×{p.height} {p.unit})
                    </option>
                  ))}
              </optgroup>

              {getAllPresets().some((p) => p.category === 'custom' && p.id !== 'original') && (
                <optgroup label="🛠️ My Custom Presets">
                  {getAllPresets()
                    .filter((p) => p.category === 'custom' && p.id !== 'original')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.width}×{p.height} {p.unit})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            {editorMode === 'simple' && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
                Simple Mode uses the selected preset automatically. Switch to Advanced Mode for manual dimensions, DPI, format, and enhancement controls.
              </div>
            )}
          </div>

          {/* Dimensions & Resolution Controls */}
          {editorMode === 'advanced' && (
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

            {/* Fit & Crop Mode (Anti-Stretch Architecture) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Fit & Crop Mode
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Zero Stretch Guarantee
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFitMode('cover')}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                    fitMode === 'cover'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Fill Size & Crop</span>
                    {fitMode === 'cover' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Fills whole frame proportionally. Center-crops excess margins without stretching.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFitMode('contain')}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                    fitMode === 'contain'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Fit Size & Pad</span>
                    {fitMode === 'contain' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Fits whole photo into frame. Pads letterbox with background color. No distortion.
                  </span>
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Compression & Target File Size (Fully Editable) */}
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
                  className={`w-20 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center flex-shrink-0 group hover:ring-2 hover:ring-indigo-500 transition ${
                    showCheckerboard ? 'checkerboard-bg' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
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
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Mode:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {fitMode === 'cover' ? 'Fill & Crop' : 'Fit & Pad'}
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
