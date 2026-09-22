import React, { useState } from 'react';
import {
  FileCheck2,
  Sliders,
  Sparkles,
  Download,
  Moon,
  Sun,
  ShieldCheck,
  Smartphone,
  Menu,
  X,
  Layers,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: any) => void;
  editorMode: 'simple' | 'advanced';
  onToggleMode: (mode: 'simple' | 'advanced') => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenPresetBuilder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  editorMode,
  onToggleMode,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onOpenAbout,
  onOpenPresetBuilder,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="site-header sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
            id="brand-logo-btn"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f766e] text-white shadow-md shadow-teal-900/20 group-hover:scale-105 transition-transform">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Docu<span className="text-[#e76f51]">Prep</span>
                </span>
                <span className="hidden sm:inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  v2.5
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Prepare. Resize. Sign. Convert. Submit.
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentView === 'home'
                ? 'bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('tools')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentView === 'tools'
                ? 'bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Tools
          </button>
          <button
            onClick={() => onNavigate('pdf')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentView === 'pdf'
                ? 'bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            PDF Suite
          </button>
          <button
            onClick={onOpenPresetBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-500" />
            <span>Custom Preset</span>
          </button>
          <button
            onClick={onOpenAbout}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            About
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher (Simple vs Advanced) */}
          <div className="hidden sm:flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onToggleMode('simple')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                editorMode === 'simple'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Simple Mode automatically applies requirement settings without technical jargon"
            >
              Simple Mode
            </button>
            <button
              onClick={() => onToggleMode('advanced')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                editorMode === 'advanced'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Advanced Mode provides full control over DPI, custom units, and JPEG quality"
            >
              Advanced Mode
            </button>
          </div>

          {/* Privacy Badge */}
          <div
            title="100% Client-Side Privacy: Your files are processed locally in your browser and never uploaded to any server without your explicit consent."
            className="hidden xl:flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Local Privacy</span>
          </div>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition"
              id="pwa-install-header-btn"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>iOS Install</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition"
            aria-label="Application Settings"
          >
            <Sliders className="h-4 w-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Editor Mode</span>
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              <button
                onClick={() => onToggleMode('simple')}
                className={`rounded px-3 py-1 text-xs font-semibold ${
                  editorMode === 'simple'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => onToggleMode('advanced')}
                className={`rounded px-3 py-1 text-xs font-semibold ${
                  editorMode === 'advanced'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-medium text-slate-700 dark:text-slate-200 text-left"
            >
              <FileCheck2 className="h-4 w-4 text-indigo-500" />
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                onNavigate('tools');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-medium text-slate-700 dark:text-slate-200 text-left"
            >
              <Layers className="h-4 w-4 text-blue-500" />
              <span>All 20+ Tools</span>
            </button>
            <button
              onClick={() => {
                onNavigate('pdf');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-medium text-slate-700 dark:text-slate-200 text-left"
            >
              <FileSpreadsheet className="h-4 w-4 text-red-500" />
              <span>PDF Tools</span>
            </button>
            <button
              onClick={() => {
                onOpenPresetBuilder();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-medium text-slate-700 dark:text-slate-200 text-left"
            >
              <Sliders className="h-4 w-4 text-emerald-500" />
              <span>Custom Preset</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% Local Processing
            </span>
            <button
              onClick={() => {
                onOpenAbout();
                setMobileMenuOpen(false);
              }}
              className="text-indigo-600 dark:text-indigo-400 font-medium"
            >
              About & Legal
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Install DocuPrep on iPhone / iPad</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              1. Tap the <strong>Share</strong> icon (square with arrow) in your Safari toolbar.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. You can now use DocuPrep fullscreen even with no internet!
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
