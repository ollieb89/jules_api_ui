import type { ColorToken, ThemeColors } from '../types/colors';
import { colorPalette } from '../constants/colors';

const isDarkMode = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const readCssVariable = (token: ColorToken): string => {
  if (typeof document === 'undefined') {
    return '';
  }

  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue(`--color-${token}`).trim();
};

export const themeColors: ThemeColors = {
  palette: colorPalette,
  getColor: readCssVariable,
  isDark: isDarkMode(),
};

export const getColorTokenValue = (token: ColorToken): string => readCssVariable(token);
