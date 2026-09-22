import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Download, Check, PenTool, Sparkles, Sliders } from 'lucide-react';
import { compressCanvas } from '../../lib/image/compressionEngine';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignature: (canvas: HTMLCanvasElement, filename: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onApplySignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [inkColor, setInkColor] = useState<'#000000' | '#0b3b82' | '#002060'>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg'>('png');
  const [isTransparent, setIsTransparent] = useState(true);
  const [targetMaxKb, setTargetMaxKb] = useState<number>(50);
  const [isSaving, setIsSaving] = useState(false);

  // Undo stroke history
  const strokeHistoryRef = useRef<ImageData[]>([]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Clear background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokeHistoryRef.current = [];
        setHasDrawn(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      if (strokeHistoryRef.current.length >= 15) {
        strokeHistoryRef.current.shift();
      }
      strokeHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && strokeHistoryRef.current.length > 0) {
      const lastState = strokeHistoryRef.current.pop();
      if (lastState) {
        ctx.putImageData(lastState, 0, 0);
        if (strokeHistoryRef.current.length === 0) {
          setHasDrawn(false);
        }
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokeHistoryRef.current = [];
      setHasDrawn(false);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    saveState();
    setIsDrawing(true);
    setHasDrawn(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = strokeWidth;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      ctx?.closePath();
    }
  };

  // Crop ink bounding box with aesthetic padding
  const getTrimmedCanvas = (): HTMLCanvasElement => {
    const canvas = canvasRef.current;
    if (!canvas) return document.createElement('canvas');

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 10) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) return canvas;

    const pad = 16;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(width - cropX, maxX - minX + pad * 2);
    const cropH = Math.min(height - cropY, maxY - minY + pad * 2);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = cropW;
    outCanvas.height = cropH;
    const outCtx = outCanvas.getContext('2d');
    if (outCtx) {
      if (!isTransparent || targetFormat === 'jpeg') {
        outCtx.fillStyle = '#ffffff';
        outCtx.fillRect(0, 0, cropW, cropH);
      }
      outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    }
    return outCanvas;
  };

  const handleDownload = async () => {
    if (!hasDrawn) return;
    setIsSaving(true);
    try {
      const trimmedCanvas = getTrimmedCanvas();
      const format = isTransparent && targetFormat === 'png' ? 'png' : targetFormat;
      const comp = await compressCanvas(trimmedCanvas, format, 92, targetMaxKb);

      const url = URL.createObjectURL(comp.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signature_${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToEditor = () => {
    if (!hasDrawn) return;
    const trimmed = getTrimmedCanvas();
    onApplySignature(trimmed, `signature_${Date.now()}.png`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Draw Digital Signature
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Smooth touch & mouse signing with automatic whitespace trimming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center">
          <div
            className={`relative rounded-xl border-2 border-dashed ${
              isTransparent
                ? 'checkerboard-bg border-slate-300 dark:border-slate-700'
                : 'bg-white border-slate-300 dark:border-slate-700'
            } shadow-inner touch-none overflow-hidden`}
          >
            <canvas
              ref={canvasRef}
              width={700}
              height={260}
              className="w-full max-w-[620px] h-[220px] sm:h-[240px] cursor-crosshair block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <span className="text-sm font-medium">Sign here using mouse or finger</span>
                <span className="text-xs text-slate-400">Smooth line interpolation active</span>
              </div>
            )}
          </div>

          {/* Quick Undo & Clear Bar */}
          <div className="mt-3 flex items-center justify-between w-full max-w-[620px] text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={!hasDrawn}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Undo
              </button>
              <button
                onClick={handleClear}
                disabled={!hasDrawn}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 disabled:opacity-40"
              >
                Clear
              </button>
            </div>
            <span className="text-slate-500">Auto-crops bounding box on export</span>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Ink Color */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Official Ink Color
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInkColor('#000000')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    inkColor === '#000000'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="h-3 w-3 rounded-full bg-black inline-block" />
                  <span>Black</span>
                </button>
                <button
                  onClick={() => setInkColor('#0b3b82')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    inkColor === '#0b3b82'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="h-3 w-3 rounded-full bg-[#0b3b82] inline-block" />
                  <span>Royal Blue</span>
                </button>
              </div>
            </div>

            {/* Stroke Thickness */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Pen Thickness ({strokeWidth}px)
              </label>
              <input
                type="range"
                min="1.5"
                max="6"
                step="0.5"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
              />
            </div>

            {/* Background Style */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Background
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsTransparent(true);
                    setTargetFormat('png');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    isTransparent
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Transparent (PNG)
                </button>
                <button
                  onClick={() => {
                    setIsTransparent(false);
                    setTargetFormat('jpeg');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    !isTransparent
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  White Paper (JPG)
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={!hasDrawn || isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 text-xs font-semibold disabled:opacity-40 shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download Direct</span>
            </button>
            <button
              onClick={handleApplyToEditor}
              disabled={!hasDrawn}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-semibold disabled:opacity-40 shadow-md shadow-indigo-500/20"
            >
              <Check className="h-4 w-4" />
              <span>Open in DocuPrep Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
