import React from 'react';
import { Sliders } from 'lucide-react';
import { PresetRequirement } from '../../../types';

interface EditorTopBarProps {
  activePreset: PresetRequirement | null;
  onOpenCustomPresetBuilder: () => void;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  activePreset,
  onOpenCustomPresetBuilder,
}) => {
  return (
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
  );
};
