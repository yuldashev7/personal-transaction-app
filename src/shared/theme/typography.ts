import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular';
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium';
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold';
import type { TextStyle } from 'react-native';

/**
 * Each weight is a separate family: SDK 57 `useFonts` cannot group static files under one family,
 * so weight is selected by `fontFamily`, never by `fontWeight` (Android would fake-bold it).
 */
export const FontFamily = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
} as const;

export const FONT_SOURCES = {
  [FontFamily.regular]: Roboto_400Regular,
  [FontFamily.medium]: Roboto_500Medium,
  [FontFamily.bold]: Roboto_700Bold,
};

export const Typography = {
  display: { fontFamily: FontFamily.bold, fontSize: 30, lineHeight: 41, letterSpacing: -0.4 },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30 },
  headline: { fontFamily: FontFamily.medium, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: FontFamily.medium, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

/** Caps Dynamic Type / font scale so large headings don't break layouts. */
export const MAX_FONT_SCALE: Readonly<Record<TypographyVariant, number>> = {
  display: 1.3,
  title: 1.4,
  headline: 1.6,
  body: 2,
  bodyStrong: 2,
  label: 1.8,
  caption: 1.8,
};
