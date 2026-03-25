import React, { createContext, useContext, useEffect, useState } from 'react';
import { darkColors, lightColors, type AppColors } from './theme';
import { getThemeMode, setThemeMode } from './storage';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  colors: AppColors;
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  mode: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    getThemeMode().then(setMode);
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    setThemeMode(next);
  };

  const colors: AppColors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
