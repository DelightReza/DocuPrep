import React, { useRef, useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2, Download, Loader2 } from 'lucide-react';
import { convertImagesToPdf } from '../../../lib/pdf/pdfEngine';

interface ImageItem {
  id: string;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}

interface ImagesToPdfTabProps {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setStatusMessage: (msg: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const ImagesToPdfTab: React.FC<ImagesToPdfTabProps> = ({
  setIsLoading,
  isLoading,
  setStatusMessage,
  setErrorMessage,
}) => {
  const [imgFiles, setImgFiles] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal' | 'Original'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [margin, setMargin] = useState<'none' | 'small' | 'medium' | 'large'>('small');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadImageInfo = (file: File): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Could not read image: ${file.name}`));
      reader.onload = (e) => {
        const sourceDataUrl = e.target?.result as string;
        const img = new Image();
        img.onerror = () => reject(new Error(`Could not decode image: ${file.name}`));
        img.onload = () => {
          if (file.type === 'image/png') {
            resolve({ dataUrl: sourceDataUrl, width: img.naturalWidth, height: img.naturalHeight });
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error(`Could not prepare image: ${file.name}`));
            return;
          }

          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/jpeg', 0.95),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.src = sourceDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setIsLoading(true);
    try {
      const newItems = await Promise.all(
        files.map(async (f) => {
          const info = await loadImageInfo(f);
          return {
            id: `img_${Date.now()}_${Math.random()}`,
            file: f,
            dataUrl: info.dataUrl,
            width: info.width,
            height: info.height,
            name: f.name,
          };
        })
      );
      setImgFiles((prev) => [...prev, ...newItems]);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load one or more images.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConvertImagesToPdf = async () => {
    if (imgFiles.length === 0) return;
    setIsLoading(true);
    setStatusMessage('Generating PDF from images...');
    setErrorMessage(null);
    try {
      const pdfBytes = await convertImagesToPdf(imgFiles, {
        pageSize,
        orientation,
        margin,
      });

      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuPrep_Document_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('PDF created and downloaded successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-4">
        {/* Upload Area */}
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 cursor-pointer transition text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            onChange={handleAddImages}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-3">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Add Images to PDF
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Select one or multiple JPG, PNG, or WebP files
          </span>
        </label>

        {/* List of images */}
        {imgFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Selected Images ({imgFiles.length} pages)</span>
              <button
                onClick={() => setImgFiles([])}
                className="text-red-500 hover:text-red-600"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2">
              {imgFiles.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                      {idx + 1}
                    </span>
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.width} x {item.height} px
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => {
                        const newArr = [...imgFiles];
                        [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
                        setImgFiles(newArr);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      disabled={idx === imgFiles.length - 1}
                      onClick={() => {
                        const newArr = [...imgFiles];
                        [newArr[idx + 1], newArr[idx]] = [newArr[idx], newArr[idx + 1]];
                        setImgFiles(newArr);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setImgFiles(imgFiles.filter((_, i) => i !== idx))}
                      className="p-1 rounded text-slate-400 hover:text-red-500"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Options Sidebar */}
      <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 h-fit">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          PDF Layout Options
        </h3>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Standard Page Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['A4', 'Letter', 'Legal', 'Original'] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => setPageSize(sz)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                  pageSize === sz
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {sz === 'Original' ? 'Fit Image' : sz}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Orientation
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['auto', 'portrait', 'landscape'] as const).map((ori) => (
              <button
                key={ori}
                onClick={() => setOrientation(ori)}
                className={`py-2 px-2 rounded-lg border text-xs font-semibold capitalize ${
                  orientation === ori
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {ori}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Margins
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['none', 'small', 'medium', 'large'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMargin(m)}
                className={`py-1.5 rounded-lg border text-xs font-semibold capitalize ${
                  margin === m
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConvertImagesToPdf}
          disabled={imgFiles.length === 0 || isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>Generate & Download PDF</span>
        </button>
      </div>
    </div>
  );
};
