import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeOption } from '../types';

export interface AccentValues {
  accent: string;
  hover: string;
  light: string;
  border: string;
}

export const PREDEFINED_ACCENTS: { [name: string]: AccentValues } = {
  cyan: {
    accent: '#06b6d4',
    hover: '#0891b2',
    light: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.3)'
  },
  blue: {
    accent: '#3b82f6',
    hover: '#2563eb',
    light: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)'
  },
  purple: {
    accent: '#8b5cf6',
    hover: '#7c3aed',
    light: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.3)'
  },
  pink: {
    accent: '#ec4899',
    hover: '#db2777',
    light: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.3)'
  },
  red: {
    accent: '#ef4444',
    hover: '#dc2626',
    light: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)'
  },
  orange: {
    accent: '#f97316',
    hover: '#ea580c',
    light: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.3)'
  },
  green: {
    accent: '#22c55e',
    hover: '#16a34a',
    light: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.3)'
  },
  emerald: {
    accent: '#10b981',
    hover: '#059669',
    light: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)'
  }
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const adjustColorBrightness = (hex: string, percent: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const R = Math.max(0, Math.min(255, Math.round(rgb.r * (1 + percent))));
  const G = Math.max(0, Math.min(255, Math.round(rgb.g * (1 + percent))));
  const B = Math.max(0, Math.min(255, Math.round(rgb.b * (1 + percent))));
  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
};

export const getAccentValues = (color: string): AccentValues => {
  const normalized = color.toLowerCase();
  if (PREDEFINED_ACCENTS[normalized]) {
    return PREDEFINED_ACCENTS[normalized];
  }
  if (color.startsWith('#')) {
    const hover = adjustColorBrightness(color, -0.15);
    const rgb = hexToRgb(color);
    return {
      accent: color,
      hover: hover,
      light: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : 'rgba(6, 182, 212, 0.15)',
      border: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` : 'rgba(6, 182, 212, 0.3)'
    };
  }
  return PREDEFINED_ACCENTS.cyan;
};

interface ThemeContextType {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeOption>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Clean up invalid theme values
    if (saved && saved !== 'light' && saved !== 'dark') {
      localStorage.removeItem('theme');
    }
    // Fall back to system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('accent-color') || 'cyan';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const values = getAccentValues(accentColor);
    const root = window.document.documentElement;
    root.style.setProperty('--accent', values.accent);
    root.style.setProperty('--accent-hover', values.hover);
    root.style.setProperty('--accent-light', values.light);
    root.style.setProperty('--accent-border', values.border);
    localStorage.setItem('accent-color', accentColor);
  }, [accentColor]);

  const setTheme = (newTheme: ThemeOption) => {
    setThemeState(newTheme);
  };

  const setAccentColor = (newAccent: string) => {
    setAccentColorState(newAccent);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
