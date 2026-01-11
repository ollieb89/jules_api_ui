import type { ColorToken } from '../types/colors';

export const useColorToken = (token: ColorToken): string => {
  if (typeof document === 'undefined') {
    return '';
  }

  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue(`--color-${token}`).trim();
};
