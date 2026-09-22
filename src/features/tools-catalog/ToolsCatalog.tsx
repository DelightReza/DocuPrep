import React, { useState } from 'react';
import {
  Search,
  Maximize2,
  Crop,
  FileArchive,
  ArrowRightLeft,
  Printer,
  Sparkles,
  Sliders,
  UserCheck,
  Compass,
  CreditCard,
  Grid,
  PenTool,
  Fingerprint,
  SplitSquareVertical,
  FileCheck,
  FileUp,
  FileDown,
  Files,
  Scissors,
  RotateCw,
  ArrowRight
} from 'lucide-react';
import { ToolCategory, ToolId } from '../../types';
import { TOOLS_CATALOG, ToolItem } from '../../config/toolsCatalog';

interface ToolsCatalogProps {
  onSelectTool: (toolId: ToolId, defaultPresetId?: string) => void;
  onOpenPdfSuite: (subTool?: string) => void;
}

// Icon mapper helper
const renderToolIcon = (iconName: string, className: string = 'h-5 w-5') => {
  switch (iconName) {
    case 'Maximize2': return <Maximize2 className={className} />;
    case 'Crop': return <Crop className={className} />;
    case 'FileArchive': return <FileArchive className={className} />;
    case 'ArrowRightLeft': return <ArrowRightLeft className={className} />;
    case 'Printer': return <Printer className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Sliders': return <Sliders className={className} />;
    case 'UserCheck': return <UserCheck className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'Grid': return <Grid className={className} />;
    case 'PenTool': return <PenTool className={className} />;
    case 'Fingerprint': return <Fingerprint className={className} />;
    case 'SplitSquareVertical': return <SplitSquareVertical className={className} />;
    case 'FileCheck': return <FileCheck className={className} />;
    case 'FileUp': return <FileUp className={className} />;
    case 'FileDown': return <FileDown className={className} />;
    case 'Files': return <Files className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'RotateCw': return <RotateCw className={className} />;
    default: return <Sparkles className={className} />;
  }
};

export const ToolsCatalog: React.FC<ToolsCatalogProps> = ({
  onSelectTool,
  onOpenPdfSuite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');

  const filteredTools = TOOLS_CATALOG.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToolClick = (tool: ToolItem) => {
    if (tool.category === 'pdf') {
      onOpenPdfSuite(tool.id);
    } else {
      onSelectTool(tool.id, tool.defaultPresetId);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Title & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Comprehensive Suite
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            All Document & Photo Tools
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Choose from over 20+ specialized tools designed for official portal submissions, exam registrations, and passport offices.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools (e.g. signature, passport, compress)..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs font-medium text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'all', label: 'All Tools' },
          { id: 'photo', label: 'Photo & ID' },
          { id: 'application', label: 'Signatures & Biometrics' },
          { id: 'image', label: 'Image Adjustments' },
          { id: 'pdf', label: 'PDF Suite' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 hover:border-indigo-500/50 hover:shadow-lg dark:hover:border-indigo-500/40 transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  {renderToolIcon(tool.iconName)}
                </div>
                {tool.badge && (
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {tool.badge}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {tool.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {tool.tagline}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Launch Tool</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
