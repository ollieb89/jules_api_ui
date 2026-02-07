const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const sanitized = hex.replace('#', '').trim();
  if (sanitized.length === 3) {
    const expanded = sanitized
      .split('')
      .map((value) => value + value)
      .join('');
    const num = Number.parseInt(expanded, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  if (sanitized.length === 6) {
    const num = Number.parseInt(sanitized, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  return null;
};

const getRelativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }): number => {
  const channel = (value: number): number => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const getColorWithOpacity = (colorValue: string, opacity: number): string => {
  const rgb = hexToRgb(colorValue);
  if (!rgb) {
    return colorValue;
  }

  const clampedOpacity = Math.min(1, Math.max(0, opacity));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedOpacity})`;
};

export const getContrastColor = (backgroundColor: string): string => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) {
    return '#ffffff';
  }

  const luminance = getRelativeLuminance(rgb);
  return luminance > 0.5 ? '#111827' : '#f9fafb';
};
