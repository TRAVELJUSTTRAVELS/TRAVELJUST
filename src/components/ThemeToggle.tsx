import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'menu-item' | 'compact';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  if (variant === 'menu-item') {
    return (
      <div
        className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-slate-50 border-slate-200/90 text-slate-800'
        } ${className}`}
      >
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
    );
  }

  // Desktop header button or compact button
  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        isDark
          ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700/80 hover:border-slate-600 shadow-2xs focus:ring-2 focus:ring-amber-400/40'
          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 hover:border-slate-300 shadow-2xs focus:ring-2 focus:ring-emerald-500/40'
      } ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
      </div>
    </button>
  );
};
