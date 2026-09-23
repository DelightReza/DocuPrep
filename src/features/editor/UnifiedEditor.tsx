import { saveSessionCache, loadSessionCache } from '../../lib/storage/cacheStorage';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ToolId,
  PresetRequirement,
  UnitType,
  OutputFormat,
  ResizeFitMode,
  ImageAdjustments,
} from '../../types';
import { getAllPresets, ORIGINAL_DIMENSIONS_PRESET } from '../../config/presets';
import { calculatePixels, renderResizedCanvas } from '../../lib/image/resizeEngine';
import { compressCanvas, CompressionResult } from '../../lib/image/compressionEngine';
import { processBackgroundRemoval } from '../../lib/image/backgroundEngine';
import { processSignatureOrThumb } from '../../lib/image/signatureEngine';
import { processDocumentScan, ScanMode } from '../../lib/image/scannerEngine';

import { EditorTopBar } from './components/EditorTopBar';
import { EditorViewport } from './components/EditorViewport';
import { CropControlBar } from './components/CropControlBar';
import { ComplianceMetricsBar } from './components/ComplianceMetricsBar';
import { PresetSelectorCard } from './components/PresetSelectorCard';
import { DimensionControlsCard } from './components/DimensionControlsCard';
import { CompressionCard } from './components/CompressionCard';
import { AdjustmentsCard } from './components/AdjustmentsCard';
import { ExportActionCard } from './components/ExportActionCard';

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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Compression Output Cache
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [currentKb, setCurrentKb] = useState<number>(0);
  const [targetAchieved, setTargetAchieved] = useState<boolean>(true);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
      {/* Top Workflow Bar */}
      <EditorTopBar
        activePreset={activePreset}
        onOpenCustomPresetBuilder={onOpenCustomPresetBuilder}
      />

      {/* Main 2-Column Interface: Left Viewport (7 cols) + Right Controls (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Canvas Viewport */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <EditorViewport
            sourceImage={sourceImage}
            fileInputRef={fileInputRef}
            cameraInputRef={cameraInputRef}
            handleFileSelect={handleFileSelect}
            viewportMode={viewportMode}
            setViewportMode={setViewportMode}
            cropActive={cropActive}
            setCropActive={setCropActive}
            cropPreset={cropPreset}
            applyCropPreset={applyCropPreset}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            originalSizeKb={originalSizeKb}
            originalDataUrl={originalDataUrl}
            currentKb={currentKb}
            previewDataUrl={previewDataUrl}
            widthVal={widthVal}
            heightVal={heightVal}
            unit={unit}
            dpi={dpi}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            activePreset={activePreset}
            cropRect={cropRect}
            handleCropPointerDown={handleCropPointerDown}
            showFaceGuide={showFaceGuide}
            setShowFaceGuide={setShowFaceGuide}
          />

          {sourceImage && cropActive && viewportMode === 'editor' && (
            <CropControlBar
              sourceImage={sourceImage}
              activePreset={activePreset}
              cropAspect={cropAspect}
              setCropAspect={setCropAspect}
              setCropPreset={setCropPreset}
              updateCropRectForAspect={updateCropRectForAspect}
              adjustCropZoom={adjustCropZoom}
              centerCropBox={centerCropBox}
              resetCropToMax={resetCropToMax}
              setCropActive={setCropActive}
              widthVal={widthVal}
              heightVal={heightVal}
              unit={unit}
              dpi={dpi}
            />
          )}

          <ComplianceMetricsBar
            sourceImage={sourceImage}
            targetAchieved={targetAchieved}
            currentKb={currentKb}
            targetMaxKb={targetMaxKb}
            widthVal={widthVal}
            heightVal={heightVal}
            unit={unit}
            dpi={dpi}
            setQuality={setQuality}
          />
        </div>

        {/* Right Column: Editing & Specification Controls */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          <PresetSelectorCard
            activePreset={activePreset}
            onSelectPreset={applyPreset}
            onOpenCustomPresetBuilder={onOpenCustomPresetBuilder}
            editorMode={editorMode}
          />

          {editorMode === 'advanced' && (
            <DimensionControlsCard
              unit={unit}
              setUnit={setUnit}
              widthVal={widthVal}
              heightVal={heightVal}
              setWidthVal={setWidthVal}
              setHeightVal={setHeightVal}
              handleWidthChange={handleWidthChange}
              handleHeightChange={handleHeightChange}
              dpi={dpi}
              setDpi={setDpi}
              lockAspectRatio={lockAspectRatio}
              setLockAspectRatio={setLockAspectRatio}
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
              activePreset={activePreset}
            />
          )}

          <CompressionCard
            currentKb={currentKb}
            targetMaxKb={targetMaxKb}
            targetAchieved={targetAchieved}
            setTargetMaxKb={setTargetMaxKb}
            outputFormat={outputFormat}
            quality={quality}
            setQuality={setQuality}
          />

          <AdjustmentsCard
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            scanFilter={scanFilter}
            setScanFilter={setScanFilter}
            sourceImage={sourceImage}
            previewDataUrl={previewDataUrl}
            setViewportMode={setViewportMode}
            setCropActive={setCropActive}
            currentKb={currentKb}
            widthVal={widthVal}
            heightVal={heightVal}
            unit={unit}
            dpi={dpi}
            targetMaxKb={targetMaxKb}
            targetAchieved={targetAchieved}
          />

          <ExportActionCard
            customFilename={customFilename}
            setCustomFilename={setCustomFilename}
            handleDownload={handleDownload}
            sourceImage={sourceImage}
          />
        </div>
      </div>
    </div>
  );
};
