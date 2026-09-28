import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

import { Colors, type ColorScheme } from './colors';
import { FontFamily } from './typography';

const fonts: Theme['fonts'] = {
  regular: { fontFamily: FontFamily.regular, fontWeight: 'normal' },
  medium: { fontFamily: FontFamily.medium, fontWeight: 'normal' },
  bold: { fontFamily: FontFamily.bold, fontWeight: 'normal' },
  heavy: { fontFamily: FontFamily.bold, fontWeight: 'normal' },
};

function createNavigationTheme(scheme: ColorScheme): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts,
  };
}

export const NavigationThemes: Readonly<Record<ColorScheme, Theme>> = {
  light: createNavigationTheme('light'),
  dark: createNavigationTheme('dark'),
};
