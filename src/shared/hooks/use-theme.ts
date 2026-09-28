import { useColorScheme } from 'react-native';

import { Colors, type ColorScheme, type ThemeColors } from '@/shared/theme/colors';

export function useColorSchemeName(): ColorScheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function useTheme(): ThemeColors {
  return Colors[useColorSchemeName()];
}
