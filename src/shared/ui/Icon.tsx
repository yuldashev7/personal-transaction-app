import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/shared/hooks/use-theme';
import type { ColorToken } from '@/shared/theme/colors';

import { ICONS, type IconName } from './icons';

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: ColorToken;
}

/** Decorative by default: the parent control carries the accessibility label. */
export function Icon({ name, size = 24, color = 'text' }: IconProps) {
  const colors = useTheme();

  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={colors[color]}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
