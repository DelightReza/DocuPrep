import React from 'react';
import { Home, Layers, FileText, Sliders } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSettings: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-2 dark:border-slate-800/80 dark:bg-slate-900/95 shadow-lg">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center justify-center gap-1 w-16 py-1 ${
          currentView === 'home'
            ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <Home className="h-5 w-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => onNavigate('tools')}
        className={`flex flex-col items-center justify-center gap-1 w-16 py-1 ${
          currentView === 'tools'
            ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <Layers className="h-5 w-5" />
        <span className="text-[10px]">Tools</span>
      </button>

      <button
        onClick={() => onNavigate('pdf')}
        className={`flex flex-col items-center justify-center gap-1 w-16 py-1 ${
          currentView === 'pdf'
            ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <FileText className="h-5 w-5" />
        <span className="text-[10px]">PDF</span>
      </button>

      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center gap-1 w-16 py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Sliders className="h-5 w-5" />
        <span className="text-[10px]">Settings</span>
      </button>
    </nav>
  );
};
