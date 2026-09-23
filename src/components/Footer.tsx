import React from 'react';
import { ShieldCheck, Trash2, Heart, ExternalLink, FileCheck } from 'lucide-react';

interface FooterProps {
  onSelectTool: (toolId: any) => void;
  onClearWorkspace: () => void;
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTool,
  onClearWorkspace,
  onOpenAbout,
}) => {
  return (
    <footer className="w-full border-t section-rule bg-[var(--paper)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Privacy Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
                DP
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Docu<span className="text-indigo-600 dark:text-indigo-400">Prep</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              "Prepare. Resize. Sign. Convert. Submit." A unified client-side document preparation platform designed for government exams, passport offices, visa submissions, and online job applications.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Client-Side In-Browser Processing Guarantee</span>
            </div>
            <div>
              <button
                onClick={onClearWorkspace}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100/60 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Cached Files & History</span>
              </button>
            </div>
          </div>

          {/* Quick Photo Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Photo & ID Tools
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onSelectTool('passport')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Passport Photo Maker
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('visa')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Visa Photo Creator
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('scanner')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Document & Marksheet Scanner
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('background')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  White / Off-White Background Changer
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('id-photo')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Driving License & PAN Card Photo
                </button>
              </li>
            </ul>
          </div>

          {/* Application Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Application & Exam
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onSelectTool('signature')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Official Signature Resizer
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('thumb')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Left Thumb Impression Enhancer
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('photo-sign')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Photo + Signature Combo Slip
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('scanner')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Document Scanner & Binarizer
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('compress')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Target File Size Compressor
                </button>
              </li>
            </ul>
          </div>

          {/* PDF Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              PDF Suite
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onSelectTool('img-to-pdf')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Images to PDF Converter
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('pdf-to-img')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  PDF to JPG / PNG High-Res Extractor
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('pdf-merge')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Merge Multiple PDF Documents
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('pdf-split')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Split & Extract Specific PDF Pages
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('pdf-organizer')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Rotate & Reorder PDF Pages
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left leading-relaxed">
              <strong>Disclaimer:</strong> DocuPrep is an independent document utility platform and is not affiliated with, endorsed by, or sponsored by any government agency, examination authority, passport authority, or visa issuing embassy unless explicitly stated. All trademarks belong to their respective holders.
            </p>
            <button
              onClick={onOpenAbout}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 whitespace-nowrap"
            >
              Privacy Policy & Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
