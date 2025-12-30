export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type SemanticColor = 'success' | 'error' | 'warning' | 'info';

export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse';

export type ColorToken =
  | `primary-${ColorShade}`
  | `secondary-${ColorShade}`
  | `success-${ColorShade}`
  | `error-${ColorShade}`
  | `warning-${ColorShade}`
  | `info-${ColorShade}`
  | `neutral-${ColorShade}`
  | `background-${string}`
  | `surface-${string}`
  | `text-${TextColor}`
  | `border-${string}`
  | `interactive-${string}`
  | 'state-success'
  | 'state-error'
  | 'state-warning'
  | 'state-info'
  | 'focus-ring'
  | 'focus-ring-offset';

export interface ColorPalette {
  primary: Record<ColorShade, string>;
  secondary: Record<ColorShade, string>;
  semantic: {
    success: Record<ColorShade, string>;
    error: Record<ColorShade, string>;
    warning: Record<ColorShade, string>;
    info: Record<ColorShade, string>;
  };
  neutral: Record<ColorShade, string>;
}

export interface ThemeColors {
  palette: ColorPalette;
  getColor: (token: ColorToken) => string;
  isDark: boolean;
}
