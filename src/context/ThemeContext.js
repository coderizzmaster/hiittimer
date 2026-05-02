import React, { createContext, useContext, useMemo } from 'react';
import { getColors } from '../utils/theme';
import { useSettings } from './SettingsContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { settings } = useSettings();
  const isDark = settings.darkMode ?? false;
  const colors = useMemo(() => getColors(isDark), [isDark]);
  const value = useMemo(() => ({ colors, isDark }), [colors, isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
