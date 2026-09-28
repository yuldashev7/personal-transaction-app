import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import type { ColorToken } from '@/shared/theme/colors';
import { MIN_TOUCH_SIZE, Radius } from '@/shared/theme/layout';

import { Icon } from './Icon';
import type { IconName } from './icons';
import { getPressedStyle, getRipple } from './pressable-feedback';

type IconButtonVariant = 'plain' | 'tinted' | 'filled';

const VARIANT_COLORS: Readonly<
  Record<IconButtonVariant, { background: ColorToken | null; foreground: ColorToken }>
> = {
  plain: { background: null, foreground: 'text' },
  tinted: { background: 'primaryMuted', foreground: 'primary' },
  filled: { background: 'primary', foreground: 'onPrimary' },
};

const SIZES = { md: MIN_TOUCH_SIZE, lg: 60 } as const;

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly icon: IconName;
  /** Required: an icon alone is invisible to screen readers. */
  readonly accessibilityLabel: string;
  readonly variant?: IconButtonVariant;
  readonly size?: keyof typeof SIZES;
}

export function IconButton({
  icon,
  variant = 'plain',
  size = 'md',
  disabled,
  ...rest
}: IconButtonProps) {
  const colors = useTheme();
  const { background, foreground } = VARIANT_COLORS[variant];
  const dimension = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled === true }}
      disabled={disabled}
      hitSlop={4}
      android_ripple={getRipple(colors.border, background === null)}
      style={({ pressed }) => [
        styles.base,
        { width: dimension, height: dimension },
        background && { backgroundColor: colors[background] },
        disabled === true && styles.disabled,
        getPressedStyle(pressed),
      ]}
      {...rest}>
      <Icon name={icon} size={size === 'lg' ? 28 : 22} color={foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  disabled: { opacity: 0.45 },
});
