import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type AccessibilityState,
} from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import type { ColorToken } from '@/shared/theme/colors';
import { Radius, Spacing } from '@/shared/theme/layout';

import { Icon } from './Icon';
import type { IconName } from './icons';
import { getPressedStyle, getRipple } from './pressable-feedback';
import { Text } from './Text';

export interface ListRowProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: IconName;
  readonly iconColor?: ColorToken;
  /** Right side content, e.g. an `AmountText`. */
  readonly trailing?: ReactNode;
  readonly showChevron?: boolean;
  readonly onPress?: () => void;
  readonly onLongPress?: () => void;
  /** Overrides the label built from title/subtitle (e.g. to include the amount). */
  readonly accessibilityLabel?: string;
  readonly accessibilityHint?: string;
  /** For rows whose `trailing` is a control, e.g. `'switch'` with `{ checked }`. */
  readonly accessibilityRole?: AccessibilityRole;
  readonly accessibilityState?: AccessibilityState;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor = 'primary',
  trailing,
  showChevron = false,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
}: ListRowProps) {
  const colors = useTheme();
  const interactive = onPress !== undefined || onLongPress !== undefined;

  return (
    <Pressable
      disabled={!interactive}
      onPress={onPress}
      onLongPress={onLongPress}
      accessible
      accessibilityRole={accessibilityRole ?? (interactive ? 'button' : undefined)}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      accessibilityHint={accessibilityHint}
      android_ripple={interactive ? getRipple(colors.border) : undefined}
      style={({ pressed }) => [styles.row, interactive && getPressedStyle(pressed)]}>
      {icon && (
        <View style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
      )}
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && <Icon name="chevronRight" size={16} color="textTertiary" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 60,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: Spacing.xxs },
});
