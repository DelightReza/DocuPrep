import React, { useState } from 'react';
import { X, Sliders, ShieldCheck, Trash2, Moon, Sun, Info, Check } from 'lucide-react';
import { UnitType, OutputFormat } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  editorMode: 'simple' | 'advanced';
  onToggleMode: (mode: 'simple' | 'advanced') => void;
  onClearWorkspace: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  editorMode,
  onToggleMode,
  onClearWorkspace,
}) => {
  const [clearedNotice, setClearedNotice] = useState(false);

  if (!isOpen) return null;

  const handleClear = () => {
    onClearWorkspace();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Application Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preferences, display modes, and local cache controls
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Appearance & Mode */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Appearance & Workflow
            </h4>

            {/* Dark Mode Row */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</div>
                <div className="text-[11px] text-slate-500">Optimized for night editing and OLED displays</div>
              </div>
              <button
                onClick={onToggleDarkMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
                <span>{darkMode ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            {/* Editor Mode Row */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Default Editor Experience</div>
                <div className="text-[11px] text-slate-500">
                  {editorMode === 'simple'
                    ? 'Simple Mode: Preset-driven with intuitive explanations'
                    : 'Advanced Mode: Full control over DPI, custom units & canvas matrix'}
                </div>
              </div>
              <div className="flex items-center rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5">
                <button
                  onClick={() => onToggleMode('simple')}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${
                    editorMode === 'simple'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => onToggleMode('advanced')}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${
                    editorMode === 'advanced'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Storage */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Privacy & Local Storage
            </h4>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Server File Uploads</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-400/90">
                All image cropping, resizing, background replacement, PDF merges, and compression operations run entirely inside your browser using HTML5 Canvas and WebAssembly. No copies of your confidential IDs or certificates are stored on our servers.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 transition"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All Cached Files & Custom Presets</span>
              </button>
              {clearedNotice && (
                <p className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Local workspace memory wiped clean.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
