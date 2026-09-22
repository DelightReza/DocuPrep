import React, { useState } from 'react';
import { X, Plus, Save, Sliders, Check, Trash2 } from 'lucide-react';
import { PresetRequirement, UnitType, OutputFormat } from '../../types';
import { saveCustomPreset, getCustomPresets, deleteCustomPreset } from '../../config/presets';

interface CustomPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetRequirement) => void;
}

export const CustomPresetModal: React.FC<CustomPresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [presets, setPresets] = useState<PresetRequirement[]>(getCustomPresets());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState<number>(3.5);
  const [height, setHeight] = useState<number>(4.5);
  const [unit, setUnit] = useState<UnitType>('cm');
  const [dpi, setDpi] = useState<number>(200);
  const [format, setFormat] = useState<OutputFormat>('jpeg');
  const [bgType, setBgType] = useState<'white' | 'light' | 'transparent' | 'any'>('white');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPreset: PresetRequirement = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      category: 'custom',
      description: description.trim() || `${width}x${height} ${unit} at ${dpi} DPI`,
      width: Number(width),
      height: Number(height),
      unit,
      dpi: Number(dpi),
      format,
      bgType,
      bgColor: bgType === 'white' ? '#ffffff' : bgType === 'transparent' ? 'transparent' : '#f8fafc',
    };

    saveCustomPreset(newPreset);
    setPresets(getCustomPresets());
    onSelectPreset(newPreset);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomPreset(id);
    setPresets(getCustomPresets());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Custom Requirement Presets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save portal or document photo/signature specifications for instant reuse
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
          {/* Previously Saved Presets List */}
          {presets.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Your Saved Custom Presets
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPreset(p);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 cursor-pointer transition group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.width}x{p.height} {p.unit} • {p.dpi} DPI
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                      title="Delete Preset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Preset Creation Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Create New Custom Preset
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Preset Name (e.g. Identity Photo, Verification Badge, Portal Spec)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Requirement Name"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Width
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Height
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as UnitType)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="cm">cm (Centimeters)</option>
                  <option value="mm">mm (Millimeters)</option>
                  <option value="inch">inch (Inches)</option>
                  <option value="px">px (Pixels)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target DPI
                </label>
                <select
                  value={dpi}
                  onChange={(e) => setDpi(parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="96">96 DPI (Web standard)</option>
                  <option value="150">150 DPI (Balanced)</option>
                  <option value="200">200 DPI (Exam portals)</option>
                  <option value="300">300 DPI (Print standard)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="jpeg">JPEG (.jpg)</option>
                  <option value="png">PNG (.png)</option>
                  <option value="webp">WebP (.webp)</option>
                </select>
              </div>

            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20"
              >
                <Save className="h-4 w-4" />
                <span>Save & Apply Preset</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
