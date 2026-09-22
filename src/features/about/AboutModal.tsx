import React from 'react';
import { X, ShieldCheck, FileCheck, CheckCircle2, Lock, HelpCircle } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                About DocuPrep
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prepare. Resize. Sign. Convert. Submit.
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {/* Mission */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              The Universal Document & Photo Preparation Suite
            </h4>
            <p>
              DocuPrep was built to eliminate the frustration of rejected online applications. Whether applying for a competitive government recruitment exam (UPSC, SSC, IBPS, GATE, NEET), renewing an official passport, filing for a Schengen/US visa, or submitting employment forms, DocuPrep provides pixel-perfect sizing, target file size compression, and biometric alignment tools.
            </p>
          </div>

          {/* Privacy Guarantee */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 mb-1">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Strict Privacy Commitment</span>
            </div>
            <p className="text-emerald-800 dark:text-emerald-400/90 text-[11px] leading-relaxed">
              Your sensitive documents, passports, signatures, and certificates belong to you. DocuPrep runs all image resizing, cropping, color corrections, background replacements, and PDF manipulations <strong>100% locally in your browser</strong> using modern WebAssembly and Canvas APIs. No copies of your confidential files are ever retained on remote servers.
            </p>
          </div>

          {/* Key Capabilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Key Capabilities
            </h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                <span>Exact physical conversion between Millimeters (mm), Centimeters (cm), Inches (in), and Pixels (px).</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                <span>Binary search compression engine to reliably stay below strict 20 KB, 50 KB, or 100 KB portal limits.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                <span>Biometric passport face guide overlays ensuring 50-70% head size ratios and eye level alignment.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                <span>Signature auto-crop with ink enhancement in pure black and official royal blue.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                <span>Full-featured PDF Suite: Images-to-PDF, PDF-to-Images, Merge, Split, and Page Rotation.</span>
              </li>
            </ul>
          </div>

          {/* Legal Disclaimer */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            <strong>Legal Notice & Disclaimer:</strong> DocuPrep is an independent document utility and is not affiliated with, endorsed by, or sponsored by any government agency, examination commission, embassy, or passport authority. Presets are provided as convenient templates based on publicly available portal specifications. Always verify with your specific application guidelines before final submission.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
