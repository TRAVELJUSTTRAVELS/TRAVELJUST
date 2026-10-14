import React, { useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Check,
  RotateCcw,
  Sparkles,
  Palette,
  Car,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useTheme, PaletteId, ThemeMode } from '../context/ThemeContext';

export const ThemeCustomizerModal: React.FC = () => {
  const {
    mode,
    isDark,
    palette,
    currentPalette,
    palettes,
    setMode,
    setPalette,
    isCustomizerOpen,
    closeCustomizer,
    resetTheme,
  } = useTheme();

  // Close on Escape key press
  useEffect(() => {
    if (!isCustomizerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCustomizer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomizerOpen, closeCustomizer]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isCustomizerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCustomizerOpen]);

  if (!isCustomizerOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-customizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeCustomizer}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm transition-colors"
              style={{ backgroundColor: currentPalette.primaryHex }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="theme-customizer-title"
                className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight"
              >
                Theme & Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize modes & brand palettes across TRAVEL JUST
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCustomizer}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close customizer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-7">
          {/* Section 1: Display Mode */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Display Mode
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Current: {mode === 'system' ? 'System (Auto)' : mode === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'light' as ThemeMode,
                  label: 'Light Mode',
                  sub: 'Clean & Crisp',
                  icon: Sun,
                },
                {
                  id: 'dark' as ThemeMode,
                  label: 'Dark Mode',
                  sub: 'Deep Obsidian',
                  icon: Moon,
                },
                {
                  id: 'system' as ThemeMode,
                  label: 'System',
                  sub: 'Follows OS',
                  icon: Monitor,
                },
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 shadow-xs ring-2 ring-slate-900/10 dark:ring-white/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        {item.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Predefined Color Palettes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Predefined Color Palettes
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {currentPalette.name}
              </span>
            </div>

            <div className="space-y-2.5">
              {palettes.map((item) => {
                const isSelected = palette === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPalette(item.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/70 shadow-xs ring-2 ring-slate-900/10 dark:ring-white/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Swatch circle */}
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${item.primaryHex} 50%, ${item.accentHex} 50%)`,
                          }}
                        />
                        {isSelected && (
                          <div className="relative z-10 w-5 h-5 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Title & description */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{
                              backgroundColor: isDark ? item.darkBgHex : item.lightBgHex,
                              color: isDark ? '#ffffff' : item.primaryHex,
                              borderColor: item.badgeBorderHex,
                            }}
                          >
                            {item.tagline}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Color Dots */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-2xs border border-white/50"
                        style={{ backgroundColor: item.primaryHex }}
                        title={`Primary: ${item.primaryHex}`}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-2xs border border-white/50"
                        style={{ backgroundColor: item.accentHex }}
                        title={`Accent: ${item.accentHex}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Live Theme Preview */}
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Live Preview: {currentPalette.name}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isDark ? 'Dark Surface' : 'Light Surface'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: currentPalette.primaryHex }}
                >
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      TRAVEL JUST Luxury Sedan
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: currentPalette.lightBgHex,
                        color: currentPalette.primaryHex,
                      }}
                    >
                      Instant Confirm
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    All-inclusive fare · Zero hidden charges
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: currentPalette.primaryHex }}
              >
                <span>Book Ride</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={resetTheme}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-1.5 px-2 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={closeCustomizer}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            style={{ backgroundColor: currentPalette.primaryHex }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
