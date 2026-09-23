import React, { useState } from 'react';
import {
  FileText,
  Files,
  Scissors,
  RotateCw,
  FileDown,
  Minimize2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ImagesToPdfTab } from './tabs/ImagesToPdfTab';
import { PdfToImagesTab } from './tabs/PdfToImagesTab';
import { MergePdfTab } from './tabs/MergePdfTab';
import { SplitPdfTab } from './tabs/SplitPdfTab';
import { RotatePdfTab } from './tabs/RotatePdfTab';
import { CompressPdfTab } from './tabs/CompressPdfTab';

export type PdfSubTool =
  | 'img-to-pdf'
  | 'pdf-to-img'
  | 'pdf-merge'
  | 'pdf-split'
  | 'pdf-rotate'
  | 'pdf-compress';

interface PdfWorkspaceProps {
  initialTool?: string;
  onOpenImageEditor?: (file: File) => void;
}

export const PdfWorkspace: React.FC<PdfWorkspaceProps> = ({
  initialTool = 'img-to-pdf',
  onOpenImageEditor,
}) => {
  const [activeTab, setActiveTab] = useState<PdfSubTool>(
    initialTool === 'pdf-to-img' ||
    initialTool === 'pdf-merge' ||
    initialTool === 'pdf-split' ||
    initialTool === 'pdf-compress' ||
    initialTool === 'compress' ||
    initialTool === 'pdf-organizer'
      ? (initialTool === 'pdf-organizer'
          ? 'pdf-rotate'
          : initialTool === 'compress'
          ? 'pdf-compress'
          : (initialTool as PdfSubTool))
      : 'img-to-pdf'
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTabChange = (tab: PdfSubTool) => {
    setActiveTab(tab);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          <FileText className="h-4 w-4" />
          <span>Complete PDF Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          PDF Preparation & Management Tools
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Convert photos and certificates to PDF, extract high-res images, merge multiple documents, split page ranges, and rotate pages — all processed locally.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => handleTabChange('img-to-pdf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'img-to-pdf'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Images to PDF</span>
        </button>

        <button
          onClick={() => handleTabChange('pdf-to-img')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-to-img'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileDown className="h-4 w-4" />
          <span>PDF to JPG / PNG</span>
        </button>

        <button
          onClick={() => handleTabChange('pdf-merge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-merge'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Files className="h-4 w-4" />
          <span>Merge PDFs</span>
        </button>

        <button
          onClick={() => handleTabChange('pdf-split')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-split'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Scissors className="h-4 w-4" />
          <span>Split & Extract</span>
        </button>

        <button
          onClick={() => handleTabChange('pdf-rotate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-rotate'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <RotateCw className="h-4 w-4" />
          <span>Rotate & Reorder</span>
        </button>

        <button
          onClick={() => handleTabChange('pdf-compress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pdf-compress'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Minimize2 className="h-4 w-4" />
          <span>Compress PDF</span>
        </button>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: IMAGES TO PDF */}
      {activeTab === 'img-to-pdf' && (
        <ImagesToPdfTab
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          setStatusMessage={setStatusMessage}
          setErrorMessage={setErrorMessage}
        />
      )}

      {/* TAB 2: PDF TO IMAGES */}
      {activeTab === 'pdf-to-img' && (
        <PdfToImagesTab
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          setStatusMessage={setStatusMessage}
          setErrorMessage={setErrorMessage}
          onOpenImageEditor={onOpenImageEditor}
        />
      )}

      {/* TAB 3: MERGE PDFS */}
      {activeTab === 'pdf-merge' && (
        <MergePdfTab
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          setStatusMessage={setStatusMessage}
          setErrorMessage={setErrorMessage}
        />
      )}

      {/* TAB 4: SPLIT PDF */}
      {activeTab === 'pdf-split' && (
        <SplitPdfTab
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          setStatusMessage={setStatusMessage}
          setErrorMessage={setErrorMessage}
        />
      )}

      {/* TAB 5: ROTATE PDF */}
      {activeTab === 'pdf-rotate' && (
        <RotatePdfTab
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          setStatusMessage={setStatusMessage}
          setErrorMessage={setErrorMessage}
        />
      )}

      {/* TAB 6: COMPRESS PDF */}
      {activeTab === 'pdf-compress' && (
        <CompressPdfTab
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          setStatusMessage={setStatusMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
    </div>
  );
};
