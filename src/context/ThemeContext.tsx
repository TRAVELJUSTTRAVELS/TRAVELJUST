import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PaletteId = 'emerald' | 'sapphire' | 'sunset' | 'ruby' | 'amethyst';

export interface ThemePalette {
  id: PaletteId;
  name: string;
  tagline: string;
  description: string;
  primaryHex: string;
  primaryHoverHex: string;
  accentHex: string;
  lightBgHex: string;
  darkBgHex: string;
  badgeBorderHex: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'emerald',
    name: 'Mysore Emerald',
    tagline: 'Signature Heritage',
    description: 'Classic royal forest green & bright transit lime for the premier Karnataka experience.',
    primaryHex: '#006045',
    primaryHoverHex: '#004733',
    accentHex: '#14CD03',
    lightBgHex: '#ecfdf5',
    darkBgHex: '#062e24',
    badgeBorderHex: '#a7f3d0',
  },
  {
    id: 'sapphire',
    name: 'Royal Sapphire',
    tagline: 'Executive & Corporate',
    description: 'Deep presidential navy & vibrant cobalt blue for business and executive transit.',
    primaryHex: '#1d4ed8',
    primaryHoverHex: '#1e40af',
    accentHex: '#0284c7',
    lightBgHex: '#eff6ff',
    darkBgHex: '#172554',
    badgeBorderHex: '#bfdbfe',
  },
  {
    id: 'sunset',
    name: 'Sunset Amber',
    tagline: 'Palace Warmth',
    description: 'Golden Chamundi sunset glow & rich marigold inspired by illuminated heritage palaces.',
    primaryHex: '#d97706',
    primaryHoverHex: '#b45309',
    accentHex: '#f59e0b',
    lightBgHex: '#fffbeb',
    darkBgHex: '#451a03',
    badgeBorderHex: '#fde68a',
  },
  {
    id: 'ruby',
    name: 'Crimson Express',
    tagline: 'Fast & Dynamic',
    description: 'Bold racing crimson & vibrant rose for energetic airport and expressway rides.',
    primaryHex: '#be123c',
    primaryHoverHex: '#9f1239',
    accentHex: '#e11d48',
    lightBgHex: '#fff1f2',
    darkBgHex: '#4c0519',
    badgeBorderHex: '#fecdd3',
  },
  {
    id: 'amethyst',
    name: 'Amethyst Luxe',
    tagline: 'Modern Twilight',
    description: 'Aristocratic deep indigo & glowing violet for premium evening and highway journeys.',
    primaryHex: '#6366f1',
    primaryHoverHex: '#4f46e5',
    accentHex: '#8b5cf6',
    lightBgHex: '#eef2ff',
    darkBgHex: '#1e1b4b',
    badgeBorderHex: '#c7d2fe',
  },
];

interface ThemeContextType {
  mode: ThemeMode;
  theme: 'light' | 'dark'; // resolved effective theme
  isDark: boolean;
  is4KMode: boolean;
  isNative4K: boolean;
  palette: PaletteId;
  currentPalette: ThemePalette;
  palettes: ThemePalette[];
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: PaletteId) => void;
  toggleTheme: () => void;
  toggle4KMode: () => void;
  set4KMode: (enabled: boolean) => void;
  isCustomizerOpen: boolean;
  setIsCustomizerOpen: (open: boolean) => void;
  openCustomizer: () => void;
  closeCustomizer: () => void;
  resetTheme: () => void;
}

const THEME_MODE_STORAGE_KEY = 'traveljust_theme_mode';
const THEME_LEGACY_KEY = 'traveljust_theme_preference';
const THEME_PALETTE_STORAGE_KEY = 'traveljust_theme_palette';
const THEME_4K_MODE_STORAGE_KEY = 'traveljust_4k_display_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Mode: 'light', 'dark', or 'system'
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
        if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
          return storedMode;
        }
        const legacy = localStorage.getItem(THEME_LEGACY_KEY);
        if (legacy === 'light' || legacy === 'dark') {
          return legacy;
        }
      } catch {
        // Fallback
      }
    }
    return 'light';
  });

  // Color palette
  const [palette, setPaletteState] = useState<PaletteId>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPalette = localStorage.getItem(THEME_PALETTE_STORAGE_KEY);
        if (
          storedPalette === 'emerald' ||
          storedPalette === 'sapphire' ||
          storedPalette === 'sunset' ||
          storedPalette === 'ruby' ||
          storedPalette === 'amethyst'
        ) {
          return storedPalette;
        }
      } catch {
        // Fallback
      }
    }
    return 'emerald';
  });

  // Track system dark mode preference
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Modal customizer visibility state
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // 4K Ultra-HD Display Mode (auto-calibrated on >=2560px, or user-enabled)
  const [is4KMode, setIs4KMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(THEME_4K_MODE_STORAGE_KEY);
        if (stored !== null) return stored === 'true';
        if (window.innerWidth >= 2560 || (window.screen && window.screen.width >= 2560)) {
          return true;
        }
      } catch {
        // Fallback
      }
    }
    return false;
  });

  const [isNative4K, setIsNative4K] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 2560 || (window.screen && window.screen.width >= 2560);
    }
    return false;
  });

  // Track viewport resolution resize for 4K detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check4K = () => {
      const native = window.innerWidth >= 2560 || (window.screen && window.screen.width >= 2560);
      setIsNative4K(native);
    };
    window.addEventListener('resize', check4K);
    return () => window.removeEventListener('resize', check4K);
  }, []);

  // Determine effective theme
  const resolvedTheme: 'light' | 'dark' =
    mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;

  const isDark = resolvedTheme === 'dark';

  // Find active palette object
  const currentPalette =
    THEME_PALETTES.find((p) => p.id === palette) || THEME_PALETTES[0];

  // Listen to OS dark mode changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply attributes and CSS variables to document root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // 1. Dark class & color-scheme
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // 2. Data attributes for styling hooks
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-theme-mode', mode);
    root.setAttribute('data-palette', palette);

    // 3. Inject CSS Variables dynamically for the active palette
    root.style.setProperty('--theme-primary', isDark ? currentPalette.accentHex : currentPalette.primaryHex);
    root.style.setProperty('--theme-primary-hover', currentPalette.primaryHoverHex);
    root.style.setProperty('--theme-accent', currentPalette.accentHex);
    root.style.setProperty('--theme-primary-light', isDark ? currentPalette.darkBgHex : currentPalette.lightBgHex);
    root.style.setProperty('--theme-primary-border', currentPalette.badgeBorderHex);
    root.style.setProperty('--theme-ring', isDark ? `${currentPalette.accentHex}66` : `${currentPalette.primaryHex}66`);

    // 4. 4K Ultra-HD display class application
    if (is4KMode) {
      root.classList.add('scale-4k-uhd');
      root.setAttribute('data-display-mode', '4k-uhd');
    } else {
      root.classList.remove('scale-4k-uhd');
      root.removeAttribute('data-display-mode');
    }

    // 5. Persist to localStorage
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
      localStorage.setItem(THEME_LEGACY_KEY, resolvedTheme);
      localStorage.setItem(THEME_PALETTE_STORAGE_KEY, palette);
      localStorage.setItem(THEME_4K_MODE_STORAGE_KEY, String(is4KMode));
    } catch {
      // Storage might be disabled
    }
  }, [mode, isDark, palette, currentPalette, resolvedTheme, is4KMode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setPalette = (newPalette: PaletteId) => {
    setPaletteState(newPalette);
  };

  const toggleTheme = () => {
    // Quick toggle switches between light and dark directly
    setModeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return systemIsDark ? 'light' : 'dark';
    });
  };

  const toggle4KMode = () => {
    setIs4KMode((prev) => !prev);
  };

  const set4KMode = (enabled: boolean) => {
    setIs4KMode(enabled);
  };

  const resetTheme = () => {
    setModeState('light');
    setPaletteState('emerald');
  };

  const openCustomizer = () => setIsCustomizerOpen(true);
  const closeCustomizer = () => setIsCustomizerOpen(false);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: resolvedTheme,
        isDark,
        is4KMode,
        isNative4K,
        palette,
        currentPalette,
        palettes: THEME_PALETTES,
        setMode,
        setPalette,
        toggleTheme,
        toggle4KMode,
        set4KMode,
        isCustomizerOpen,
        setIsCustomizerOpen,
        openCustomizer,
        closeCustomizer,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
