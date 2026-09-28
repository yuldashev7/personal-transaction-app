import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { Radius, Spacing } from '@/shared/theme/layout';

import { Icon } from './Icon';
import type { IconName } from './icons';
import { getPressedStyle, getRipple } from './pressable-feedback';
import { Text } from './Text';

export interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly label: string;
  readonly selected: boolean;
  readonly icon?: IconName;
  /** `checkbox` for multi-select (categories), `radio` for single choice (account kind). */
  readonly selectionMode?: 'checkbox' | 'radio';
}

export function Chip({
  label,
  selected,
  icon,
  selectionMode = 'checkbox',
  disabled,
  ...rest
}: ChipProps) {
  const colors = useTheme();
  const foreground = selected ? 'onPrimary' : 'text';

  return (
    <Pressable
      accessibilityRole={selectionMode}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled: disabled === true }}
      disabled={disabled}
      hitSlop={4}
      android_ripple={getRipple(colors.border)}
      style={({ pressed }) => [
        styles.base,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        disabled === true && styles.disabled,
        getPressedStyle(pressed),
      ]}
      {...rest}>
      {icon && <Icon name={icon} size={18} color={foreground} />}
      <Text variant="label" color={foreground} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  disabled: { opacity: 0.45 },
});
