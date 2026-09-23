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
      <section className="hero-grid relative overflow-hidden border-b section-rule bg-[#f5f3ee] dark:bg-[#101917] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Eyebrow / Privacy Pill */}
          <div className="hero-kicker inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Private by design · nothing leaves your browser</span>
          </div>

          {/* Main Title & Tagline */}
          <h1 className="hero-title mx-auto font-bold text-slate-900 dark:text-white">
            Documents, <em>ready.</em>
          </h1>

          <p className="mt-6 sm:mt-8 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            The calm, exact way to resize photos, sign forms, tune file size, and turn scattered pages into submission-ready documents.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onSelectTool('editor')}
              className="studio-button w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl text-white px-8 py-3.5 text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
              id="hero-start-btn"
            >
              <Upload className="h-4 w-4" />
              <span>Start Preparing Document</span>
            </button>

            <button
              onClick={() => onOpenPdfSuite()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/75 dark:bg-slate-900/75 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 px-7 py-3.5 text-sm font-bold shadow-sm transition"
            >
              <Files className="h-4 w-4 text-indigo-500" />
              <span>Explore PDF Suite</span>
            </button>

            
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t section-rule text-left">
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">20+ Tools</div>
              <div className="text-xs text-slate-500">Passports, Visas, PDFs & Forms</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">Target KB</div>
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
      <section className="section-rule border-b paper-surface py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="text-base">📋</span>
                Popular Official Document & ID Specifications
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                Direct Portal Sizing
              </span>
            </div>
            <button
              onClick={onOpenPresetBuilder}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              + Create Custom Requirement
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {BUILT_IN_PRESETS.slice(0, 10).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectTool('passport', p.id)}
                className="flex flex-col text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition flex-shrink-0 min-w-[210px]"
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.name}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {p.width}x{p.height} {p.unit} • {p.dpi} DPI
                </span>
                {p.countryOrOrg && (
                  <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                    {p.countryOrOrg}
                  </span>
                )}
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
                onClick={() => onSelectTool('passport', 'passport-standard-35x45')}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  Standard Passport & Visa Photo Maker (35×45 mm & 51×51 mm)
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Universal standard 35×45 mm with 70–80% face ratio, pure white background replacement, and 51×51 mm (2×2") square specifications.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Open Passport & Document Presets</span>
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
                  Target KB Compressor
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div
                onClick={() => onOpenPdfSuite('pdf-compress')}
                className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-500 transition cursor-pointer relative group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Compress PDF
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    Smart Compress
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reduce multi-page files to fit portal limits with custom DPI and target size.
                </p>
              </div>

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
                <strong>Standard Passport & ID (35 × 45 mm):</strong> Mandates a 35 × 45 mm portrait with 70% to 80% face coverage centered on a pure white or light neutral background (approx 413 × 531 pixels at 300 DPI, typically under 100–200 KB).
              </p>
              <p>
                <strong>Square Format (2 × 2 inch / 51 × 51 mm):</strong> Standard 51 × 51 mm (600 × 600 pixels at 300 DPI) square photo with 50% to 69% head ratio against a plain white background, typically under 200–240 KB.
              </p>
              <p>
                <strong>Standard Signature Boxes:</strong> Running handwritten signatures on white paper in dark ink. Standard ratios include 3.5 × 1.5 cm (7:3 ratio, 10–30 KB), 4.0 × 2.0 cm (2:1 ratio, 10–20 KB), and 7.0 × 2.0 cm wide strips.
              </p>
              <p>
                <strong>Biometric Thumb & Finger Impressions:</strong> Scanned dermal ridge impressions on pure white paper with enhanced contrast, formatted to 3.5 × 1.5 cm or 3.0 × 3.0 cm square (strictly 10–50 KB).
              </p>
              <p>
                <strong>Card-Size Portraits & Postcard Slips:</strong> Compact 2.5 × 3.5 cm card photos under 50 KB, and 4 × 6 inch postcard photos under 200 KB for physical or multi-photo requirements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
