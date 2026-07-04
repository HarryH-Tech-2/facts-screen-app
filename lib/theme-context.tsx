import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DARK, LIGHT, Palette } from './theme';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'theme-v1';

const ThemeContext = createContext<{
  mode: ThemeMode;
  palette: Palette;
  toggleTheme: () => void;
}>({ mode: 'dark', palette: DARK, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setMode(stored);
    });
  }, []);

  function toggleTheme() {
    setMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider
      value={{ mode, palette: mode === 'dark' ? DARK : LIGHT, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
