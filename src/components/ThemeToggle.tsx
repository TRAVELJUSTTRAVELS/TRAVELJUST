import React from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'menu-item' | 'compact' | 'split';
  className?: string;
  showCustomizerButton?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className = '',
  showCustomizerButton = true,
}) => {
  const { isDark, toggleTheme, openCustomizer, currentPalette } = useTheme();
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => {
      setIsAnimating(false);
    }, 450);
  };

  if (variant === 'menu-item') {
    return (
      <div
        className={`flex flex-col gap-2.5 p-3.5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-slate-50 border-slate-200/90 text-slate-800'
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isDark
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            <div>
              <span className="block text-xs font-bold leading-tight">
                {isDark ? 'Dark Theme' : 'Light Theme'}
              </span>
              <span className="block text-[11px] text-slate-400">
                {isDark ? 'Tap to switch to Light mode' : 'Tap to switch to Dark mode'}
              </span>
            </div>
          </div>

          {/* Interactive Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer ${
              isDark ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Color Palette Customizer Trigger in Mobile Menu */}
        <button
          type="button"
          onClick={openCustomizer}
          className="w-full mt-1 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Theme & Color Palettes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border border-white/60 shadow-2xs"
              style={{ backgroundColor: currentPalette.primaryHex }}
            />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {currentPalette.name}
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Desktop header button or split button with customizer
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Quick Theme Toggle Button */}
      <button
        type="button"
        id="theme-toggle-btn"
        onClick={handleToggle}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        className={`relative inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl border transition-all duration-300 ease-out cursor-pointer select-none overflow-hidden active:scale-90 active:rotate-12 hover:scale-[1.03] ${
          isAnimating ? 'scale-95 rotate-45 ring-2 ring-emerald-500/25' : 'scale-100 rotate-0'
        } ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-750 text-amber-400 border-slate-700 hover:border-slate-600 shadow-2xs hover:shadow-xs'
            : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-2xs hover:shadow-xs'
        }`}
      >
        <span className="sr-only">Toggle theme</span>
        <div
          className={`relative w-4 h-4 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isAnimating ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
          }`}
        >
          {/* Sun Icon (shown in Dark mode) */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-400 transform ${
              isDark
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0 pointer-events-none'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-400" />
          </div>

          {/* Moon Icon (shown in Light mode) */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-400 transform ${
              !isDark
                ? 'rotate-0 scale-100 opacity-100'
                : 'rotate-90 scale-0 opacity-0 pointer-events-none'
            }`}
          >
            <Moon className="w-4 h-4 text-slate-900" />
          </div>
        </div>
      </button>

      {/* Palette Customizer Button */}
      {showCustomizerButton && (
        <button
          type="button"
          id="theme-customizer-btn"
          onClick={openCustomizer}
          aria-label="Customize theme and color palette"
          title={`Theme Customizer (${currentPalette.name})`}
          className="hidden"
        >
          <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400 hidden" />
          {/* Subtle indicator dot of current active palette */}
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-slate-900"
            style={{ backgroundColor: currentPalette.primaryHex }}
          />
        </button>
      )}
    </div>
  );
};
