import React from 'react';
import {
  Upload,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  UserCheck,
  PenTool,
  Fingerprint,
  FileArchive,
  Files,
  Scissors,
  CheckCircle2,
  Sliders,
  Layers,
  Printer,
  ChevronRight
} from 'lucide-react';
import { ToolId } from '../../types';
import { BUILT_IN_PRESETS } from '../../config/presets';

interface HomePageProps {
  onSelectTool: (toolId: ToolId, defaultPresetId?: string) => void;
  onOpenPdfSuite: (subTool?: string) => void;
  onOpenSignaturePad: () => void;
  onOpenPresetBuilder: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTool,
  onOpenPdfSuite,
  onOpenSignaturePad,
  onOpenPresetBuilder,
}) => {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-indigo-50/40 via-white to-white dark:border-slate-800/80 dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Eyebrow / Privacy Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 dark:bg-slate-900/80 dark:border-indigo-900/60 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm backdrop-blur-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>100% Client-Side In-Browser Processing • Zero Server Uploads</span>
          </div>

          {/* Main Title & Tagline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Prepare Any Photo, Signature, Thumb Impression or PDF
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Resize, crop, compress, convert and prepare documents for applications, exams, passports, visas and government submissions — directly in your browser.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onSelectTool('editor')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 text-sm font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              id="hero-start-btn"
            >
              <Upload className="h-4 w-4" />
              <span>Start Preparing Document</span>
            </button>

            <button
              onClick={() => onOpenPdfSuite()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-7 py-3.5 text-sm font-bold shadow-sm transition"
            >
              <Files className="h-4 w-4 text-indigo-500" />
              <span>Explore PDF Suite</span>
            </button>

            <button
              onClick={onOpenSignaturePad}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 py-3.5 text-sm font-bold shadow-sm transition"
            >
              <PenTool className="h-4 w-4 text-blue-500" />
              <span>Draw Signature</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-slate-200/60 dark:border-slate-800/60 text-left">
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">20+ Tools</div>
              <div className="text-xs text-slate-500">Passports, Visas, PDFs & Exams</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">&lt; 20-50 KB</div>
              <div className="text-xs text-slate-500">Smart Target Size Compressor</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">300 DPI</div>
              <div className="text-xs text-slate-500">True Print-Ready Biometrics</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">0 KB Upload</div>
              <div className="text-xs text-slate-500">Processed Locally in Browser</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Official Presets Ribbon */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Popular Official Application Requirements
            </span>
            <button
              onClick={onOpenPresetBuilder}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              + Create Custom Requirement
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {BUILT_IN_PRESETS.slice(0, 7).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectTool('passport', p.id)}
                className="flex flex-col text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition flex-shrink-0 min-w-[200px]"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {p.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {p.width}x{p.height} {p.unit} • {p.dpi} DPI {p.maxKb ? `• <${p.maxKb}KB` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Feature Pillars: 4 Core Modules */}
      <section className="py-16 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Pillar 1: Photo & Biometric ID Tools */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Biometric Precision
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Passport, Visa & ID Photo Preparation
                </h2>
              </div>
              <button
                onClick={() => onSelectTool('passport')}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <span>Launch Passport Studio</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => onSelectTool('passport', 'us-passport')}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  Passport Photo Maker (2x2" & 35x45mm)
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Interactive face guide overlays ensuring 50-70% head size ratios, eye-line alignment, and white background replacement.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Open US / UK / India / Schengen Presets</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <div
                onClick={() => onSelectTool('photo-sheet')}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                  <Printer className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  Printable Photo Sheet (A4 & 4x6")
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Arrange 4, 6, 8, 12, or 16 passport copies on standard photo paper with automatic scissor cutting guides ready for print.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Generate Photo Grid</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <div
                onClick={() => onSelectTool('background')}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  White & Off-White Background
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Turn casual home photos into official document portraits by swapping background to pure white or transparent PNG.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Change Background</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 2: Application Signatures & Biometric Thumbs */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Exam & Portal Ready
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Signature & Thumb Impression Optimizer
                </h2>
              </div>
              <button
                onClick={() => onSelectTool('signature')}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <span>Launch Signature Studio</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => onSelectTool('signature')}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                  <PenTool className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                  Signature Resizer & Auto-Crop
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically trim whitespace around paper signatures, whiten background, and recolor ink to pure black or official royal blue.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <span>Enhance Signature</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <div
                onClick={() => onSelectTool('thumb')}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                  Thumb Impression Tool
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  High-contrast dermal ridge filter to make blue/black ink impressions crisp and readable for banking and competitive exams.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Format Thumb Impression</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <div
                onClick={() => onSelectTool('compress')}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mb-4 group-hover:scale-105 transition-transform">
                  <FileArchive className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                  Target KB Compressor (&lt; 20KB / 50KB)
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Binary search optimization hits your portal's exact file size constraint without turning text or faces into blurry artifacts.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <span>Compress to Exact KB</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 3: Universal PDF Tools Suite */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Unified Document Management
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  PDF Suite for Portals & Submissions
                </h2>
              </div>
              <button
                onClick={() => onOpenPdfSuite()}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <span>Open Full PDF Suite</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => onOpenPdfSuite('img-to-pdf')}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-500/50 transition cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Images to PDF
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Convert multi-page certificates and photos into standard A4 or Letter PDFs.
                </p>
              </div>

              <div
                onClick={() => onOpenPdfSuite('pdf-to-img')}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-500/50 transition cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  PDF to JPG / PNG
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extract high-resolution 300 DPI images from any scanned or multi-page PDF.
                </p>
              </div>

              <div
                onClick={() => onOpenPdfSuite('pdf-merge')}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-500/50 transition cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Merge Multiple PDFs
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Combine marksheets, degree certificates, and identity cards into one file.
                </p>
              </div>

              <div
                onClick={() => onOpenPdfSuite('pdf-split')}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-500/50 transition cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Split & Rotate Pages
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extract page ranges (e.g. 1-3, 5) and fix upside-down scanned documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO & Educational Guidance Section */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Official Document Sizing Guidelines
            </h2>
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong>US Passport & Visa:</strong> Requires a square 2 x 2 inch (51 x 51 mm) photograph printed at 300 DPI (600 x 600 pixels). The head must be centered and measure between 1 inch and 1 3/8 inches (25 to 35 mm) from the bottom of the chin to the top of the head against an unadorned white or off-white background.
              </p>
              <p>
                <strong>UK & Schengen Passport:</strong> Standardized at 35 x 45 mm (approximately 413 x 531 pixels at 300 DPI). The face must occupy between 70% to 80% of the photograph height with natural skin tones and a light grey or cream background.
              </p>
              <p>
                <strong>Indian Recruitment & Exams (UPSC / SSC / IBPS):</strong> UPSC Civil Services portal mandates a 350 x 350 pixel photo and signature under 300 KB. SSC requires photos between 20 KB and 50 KB and signatures strictly between 10 KB and 20 KB. IBPS Banking requires photos between 20-50 KB and left thumb impressions between 20-50 KB in blue or black ink.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
