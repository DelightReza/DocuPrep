import { saveSessionCache, loadSessionCache, clearSessionCache } from './lib/storage/cacheStorage';
import React, { useState, useEffect } from 'react';
import { ToolId, PresetRequirement, CustomPreset } from './types';
import { CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { OfflineIndicator } from './components/OfflineIndicator';

import { HomePage } from './features/home/HomePage';
import { ToolsCatalog } from './features/tools-catalog/ToolsCatalog';
import { UnifiedEditor } from './features/editor/UnifiedEditor';
import { PdfWorkspace } from './features/pdf-tools/PdfWorkspace';

import { CustomPresetModal } from './features/custom-preset/CustomPresetModal';
import { SettingsModal } from './features/settings/SettingsModal';
import { AboutModal } from './features/about/AboutModal';
import { ClearCacheModal } from './components/ClearCacheModal';

import { saveCustomPreset } from './config/presets';

type ActiveView = 'home' | 'tools' | 'editor' | 'pdf';

export default function App() {
  // Initialize from 15-minute session cache if available
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const cached = loadSessionCache();
    return cached?.activeView || 'home';
  });
  const [activeToolId, setActiveToolId] = useState<ToolId>(() => {
    const cached = loadSessionCache();
    return (cached?.activeToolId as ToolId) || 'editor';
  });
  const [activePresetId, setActivePresetId] = useState<string | undefined>(() => {
    const cached = loadSessionCache();
    return cached?.activePresetId || undefined;
  });
  const [pdfSubTool, setPdfSubTool] = useState<string>(() => {
    const cached = loadSessionCache();
    return cached?.pdfSubTool || 'img-to-pdf';
  });

  // Modals state

  const [isCustomPresetOpen, setIsCustomPresetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [pendingEditorImage, setPendingEditorImage] = useState<{
    dataUrl: string;
    filename: string;
  } | null>(null);

  // Settings & Theme
  const [editorMode, setEditorMode] = useState<'simple' | 'advanced'>('advanced');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docuprep_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('docuprep_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('docuprep_theme', 'light');
    }
  }, [isDark]);

  // Handlers for Navigation
  const handleSelectTool = (toolId: ToolId, defaultPresetId?: string) => {
    setActiveToolId(toolId);
    setActivePresetId(defaultPresetId);
    setActiveView('editor');
    const cached = loadSessionCache();
    saveSessionCache({
      activeView: 'editor',
      activeToolId: toolId,
      activePresetId: defaultPresetId,
      pdfSubTool,
      editorState: cached?.editorState,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPdfSuite = (subTool: string = 'img-to-pdf') => {
    setPdfSubTool(subTool);
    setActiveView('pdf');
    const cached = loadSessionCache();
    saveSessionCache({
      activeView: 'pdf',
      activeToolId,
      activePresetId,
      pdfSubTool: subTool,
      editorState: cached?.editorState,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleRequestClearWorkspace = () => {
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClearWorkspace = () => {
    localStorage.removeItem('docuprep_custom_presets_v1');
    clearSessionCache();
    setPendingEditorImage(null);
    setActiveView('home');
    setIsClearConfirmOpen(false);
    setIsSettingsOpen(false);
    setToastNotice('Workspace cache and history cleared successfully.');
    setTimeout(() => {
      setToastNotice(null);
    }, 3500);
  };

  // Save new custom preset
  const handleSaveCustomPreset = (preset: CustomPreset) => {
    saveCustomPreset(preset);
    setActivePresetId(preset.id);
    setActiveView('editor');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Top Application Header */}
      <Header
        currentView={activeView}
        onNavigate={(view: any) => {
          const nextView = view as ActiveView;
          setActiveView(nextView);
          const cached = loadSessionCache();
          saveSessionCache({
            activeView: nextView,
            activeToolId,
            activePresetId,
            pdfSubTool,
            editorState: cached?.editorState,
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        editorMode={editorMode}
        onToggleMode={(mode) => setEditorMode(mode)}
        darkMode={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenPresetBuilder={() => setIsCustomPresetOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-20 md:pb-12">
        {activeView === 'home' && (
          <HomePage
            onSelectTool={handleSelectTool}
            onOpenPdfSuite={handleOpenPdfSuite}
            onOpenPresetBuilder={() => setIsCustomPresetOpen(true)}
          />
        )}

        {activeView === 'tools' && (
          <ToolsCatalog
            onSelectTool={handleSelectTool}
            onOpenPdfSuite={handleOpenPdfSuite}
          />
        )}

        {activeView === 'editor' && (
          <UnifiedEditor
            initialTool={activeToolId}
            initialPresetId={activePresetId}
            initialImage={pendingEditorImage}
            editorMode={editorMode}
            onOpenCustomPresetBuilder={() => setIsCustomPresetOpen(true)}
          />
        )}

        {activeView === 'pdf' && (
          <PdfWorkspace
            initialTool={pdfSubTool}
            onOpenImageEditor={() => {
              setActiveView('editor');
            }}
          />
        )}
      </main>

      {/* Desktop & Tablet Footer */}
      <Footer
        onSelectTool={(toolId: any) => handleSelectTool(toolId)}
        onClearWorkspace={handleRequestClearWorkspace}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Bottom Sticky Mobile Navigation */}
      <MobileNav
        currentView={activeView}
        onNavigate={(view: string) => {
          setActiveView(view as ActiveView);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modals & Drawers */}
      <CustomPresetModal
        isOpen={isCustomPresetOpen}
        onClose={() => setIsCustomPresetOpen(false)}
        onSelectPreset={handleSaveCustomPreset}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        darkMode={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        editorMode={editorMode}
        onToggleMode={(mode) => setEditorMode(mode)}
        onClearWorkspace={handleRequestClearWorkspace}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <ClearCacheModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClearWorkspace}
      />

      {/* Floating Success Toast */}
      {toastNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[70] flex items-center gap-2.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md border border-slate-700 dark:border-slate-200 animate-fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}
    </div>
  );
}
