import React from 'react';
import { PresetRequirement } from '../../../types';
import { getAllPresets } from '../../../config/presets';

interface PresetSelectorCardProps {
  activePreset: PresetRequirement | null;
  onSelectPreset: (preset: PresetRequirement) => void;
  onOpenCustomPresetBuilder: () => void;
  editorMode: 'simple' | 'advanced';
}

export const PresetSelectorCard: React.FC<PresetSelectorCardProps> = ({
  activePreset,
  onSelectPreset,
  onOpenCustomPresetBuilder,
  editorMode,
}) => {
  const allPresets = getAllPresets();

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="editor-preset-select"
          className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          Requirement Preset
        </label>
        <button
          onClick={onOpenCustomPresetBuilder}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          + New Preset
        </button>
      </div>

      <select
        id="editor-preset-select"
        value={activePreset?.id || 'original'}
        onChange={(e) => {
          const p = allPresets.find((item) => item.id === e.target.value);
          if (p) {
            onSelectPreset(p);
          }
        }}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
      >
        <optgroup label="⭐ Default Natural Size">
          <option value="original">
            ⭐ Original Dimensions (Default • Keep Natural Image Size)
          </option>
        </optgroup>

        <optgroup label="📸 Standard Photo & Document Dimensions">
          {allPresets
            .filter((p) => p.category === 'passport')
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.width}×{p.height} {p.unit})
              </option>
            ))}
        </optgroup>

        <optgroup label="✍️ Signatures, Biometrics & Slips">
          {allPresets
            .filter((p) => p.category === 'application' || p.category === 'social')
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.width}×{p.height} {p.unit})
              </option>
            ))}
        </optgroup>

        {allPresets.some((p) => p.category === 'custom' && p.id !== 'original') && (
          <optgroup label="🛠️ My Custom Presets">
            {allPresets
              .filter((p) => p.category === 'custom' && p.id !== 'original')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.width}×{p.height} {p.unit})
                </option>
              ))}
          </optgroup>
        )}
      </select>
      {editorMode === 'simple' && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
          Simple Mode uses the selected preset automatically. Switch to Advanced Mode for manual dimensions, DPI, format, and enhancement controls.
        </div>
      )}
    </div>
  );
};
