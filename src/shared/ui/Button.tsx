import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import type { ColorToken } from '@/shared/theme/colors';
import { CONTROL_HEIGHT, MIN_TOUCH_SIZE, Radius, Spacing } from '@/shared/theme/layout';

import { Icon } from './Icon';
import type { IconName } from './icons';
import { getPressedStyle, getRipple } from './pressable-feedback';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'tinted' | 'ghost' | 'destructive';

interface VariantColors {
  readonly background: ColorToken | null;
  readonly foreground: ColorToken;
}

const VARIANT_COLORS: Readonly<Record<ButtonVariant, VariantColors>> = {
  primary: { background: 'primary', foreground: 'onPrimary' },
  tinted: { background: 'tint', foreground: 'primary' },
  ghost: { background: null, foreground: 'primary' },
  destructive: { background: 'dangerMuted', foreground: 'danger' },
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly icon?: IconName;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const colors = useTheme();
  const { background, foreground } = VARIANT_COLORS[variant];
  const inactive = disabled === true || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      android_ripple={getRipple(colors.border)}
      style={({ pressed }) => [
        styles.base,
        background ? styles.solid : styles.ghost,
        background && { backgroundColor: colors[background] },
        fullWidth && styles.fullWidth,
        disabled === true && styles.disabled,
        getPressedStyle(pressed),
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors[foreground]} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={20} color={foreground} />}
          <Text variant="bodyStrong" color={foreground} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  solid: { minHeight: CONTROL_HEIGHT, paddingHorizontal: Spacing.xl },
  ghost: { minHeight: MIN_TOUCH_SIZE, paddingHorizontal: Spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
